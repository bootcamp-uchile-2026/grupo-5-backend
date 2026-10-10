import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';

/**
 * Recorre el flujo de compra completo contra una base PostgreSQL real con los
 * datos de db/02-seed.sql (DATABASE_URL en .env). Cada corrida registra un
 * usuario nuevo, así que se puede ejecutar varias veces; el stock que consume
 * se repone con `npm run db:reset`.
 */
describe('LeeConNos API (e2e)', () => {
  const FUNDACION = '00000000-0000-4000-8000-000000000001';
  const HOBBIT_SIN_STOCK = '00000000-0000-4000-8000-000000000011';
  const direccion = {
    nombreReceptor: 'Usuario E2E',
    calle: 'Av. Irarrázaval 2401',
    comuna: 'Ñuñoa',
    region: 'RM',
    telefono: '+56912345678',
  };
  const tarjeta = {
    metodo: 'TARJETA_CREDITO',
    titular: 'USUARIO E2E',
    vencimiento: '12/40',
    cvv: '123',
  };

  let app: INestApplication;
  let http: ReturnType<typeof request>;
  let token: string;
  let pedidoId: string;
  const email = `e2e-${Date.now()}@leeconnos.cl`;
  const auth = () => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
    http = request(app.getHttpServer());
  });

  afterAll(async () => {
    await app.close();
  });

  describe('trazabilidad', () => {
    it('genera un x-request-id y lo repite en el cuerpo de los errores', async () => {
      const res = await http.get('/libros/no-es-uuid').expect(400);
      expect(res.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
      expect(res.body).toMatchObject({
        error: 'ID_INVALIDO',
        requestId: res.headers['x-request-id'],
      });
    });

    it('respeta el x-request-id que envía el cliente', async () => {
      const res = await http
        .get('/health')
        .set('x-request-id', 'web-123')
        .expect(200);
      expect(res.headers['x-request-id']).toBe('web-123');
      expect(res.body.db).toBe('ok');
    });
  });

  describe('auth', () => {
    it('rechaza un registro inválido detallando cada campo', async () => {
      const res = await http
        .post('/auth/registro')
        .send({ nombre: 'X', email: 'no-es-email', password: '123', extra: 1 });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('VALIDATION_ERROR');
      expect(res.body.detalles.length).toBeGreaterThanOrEqual(4);
    });

    it('registra un cliente y entrega un JWT, sin exponer la contraseña', async () => {
      const res = await http
        .post('/auth/registro')
        .send({ nombre: 'Usuario E2E', email, password: 'clave-segura-1' });
      expect(res.status).toBe(201);
      expect(res.body.usuario).toMatchObject({ email, rol: 'CLIENTE' });
      expect(JSON.stringify(res.body)).not.toContain('assword');
      token = res.body.accessToken;
    });

    it('no permite registrar dos veces el mismo email ni auto-asignarse ADMIN', async () => {
      const repetido = await http
        .post('/auth/registro')
        .send({ nombre: 'Otro', email, password: 'clave-segura-1' });
      expect(repetido.status).toBe(409);
      expect(repetido.body.error).toBe('EMAIL_YA_REGISTRADO');

      const admin = await http.post('/auth/registro').send({
        nombre: 'Otro',
        email: `x-${email}`,
        password: 'clave-segura-1',
        rol: 'ADMIN',
      });
      expect(admin.status).toBe(403);
    });

    it('login: 200 con credenciales correctas, 401 con incorrectas', async () => {
      await http
        .post('/auth/login')
        .send({ email, password: 'clave-segura-1' })
        .expect(200);
      const res = await http
        .post('/auth/login')
        .send({ email, password: 'incorrecta' })
        .expect(401);
      expect(res.body.error).toBe('CREDENCIALES_INVALIDAS');
    });

    it('protege las rutas privadas y aplica roles', async () => {
      expect((await http.get('/carrito')).body.error).toBe('TOKEN_REQUERIDO');
      expect(
        (await http.get('/carrito').set('Authorization', 'Bearer abc')).body
          .error,
      ).toBe('TOKEN_INVALIDO');
      await http.get('/auth/me').set(auth()).expect(200);
      // Un CLIENTE no puede listar usuarios ni crear libros.
      await http.get('/usuarios').set(auth()).expect(403);
      await http.post('/libros').set(auth()).send({}).expect(403);
    });
  });

  describe('catálogo', () => {
    it('lista paginado', async () => {
      const res = await http.get('/libros?limit=5&page=2').expect(200);
      expect(res.body).toMatchObject({
        page: 2,
        limit: 5,
        total: 24,
        totalPages: 5,
      });
      expect(res.body.items).toHaveLength(5);
    });

    it('busca por texto y filtra por género, precio, formato y stock', async () => {
      const texto = await http
        .get('/libros')
        .query({ q: 'asimov' })
        .expect(200);
      expect(texto.body.items.map((l: { titulo: string }) => l.titulo)).toEqual(
        ['Fundación'],
      );

      const filtrado = await http
        .get('/libros')
        .query({
          genero: 'fantasía',
          precioMax: 13000,
          enStock: true,
          orden: 'precio_asc',
        })
        .expect(200);
      expect(
        filtrado.body.items.map((l: { titulo: string }) => l.titulo),
      ).toEqual(['Harry Potter y la piedra filosofal']);

      const ebooks = await http
        .get('/libros')
        .query({ formato: 'EBOOK' })
        .expect(200);
      expect(ebooks.body.total).toBe(1);
    });

    it('valida los parámetros de búsqueda', async () => {
      const res = await http
        .get('/libros')
        .query({ limit: 500, orden: 'azar' })
        .expect(400);
      expect(res.body.detalles).toHaveLength(2);
    });

    it('entrega los géneros y el detalle de un libro', async () => {
      const generos = await http.get('/libros/generos').expect(200);
      expect(generos.body).toContainEqual({ genero: 'Poesía', cantidad: 2 });
      await http.get(`/libros/${FUNDACION}`).expect(200);
      const res = await http
        .get('/libros/00000000-0000-4000-8000-999999999999')
        .expect(404);
      expect(res.body.error).toBe('LIBRO_NO_ENCONTRADO');
    });
  });

  describe('envío (dummy)', () => {
    const cotizar = (body: object) => http.post('/envios/cotizar').send(body);

    it('aplica las reglas por zona, monto y cobertura', async () => {
      const rm = await cotizar({
        metodoEnvio: 'DESPACHO',
        region: 'RM',
        comuna: 'Ñuñoa',
        subtotal: 10000,
      });
      expect(rm.body).toMatchObject({
        costo: 2990,
        diasEstimados: 2,
        gratis: false,
      });

      const extrema = await cotizar({
        metodoEnvio: 'DESPACHO',
        region: 'XII',
        comuna: 'Punta Arenas',
        subtotal: 10000,
      });
      expect(extrema.body.costo).toBe(7990);

      const gratis = await cotizar({
        metodoEnvio: 'DESPACHO',
        region: 'VIII',
        comuna: 'Concepción',
        subtotal: 40000,
      });
      expect(gratis.body).toMatchObject({ costo: 0, gratis: true });

      const retiro = await cotizar({ metodoEnvio: 'RETIRO', subtotal: 10000 });
      expect(retiro.body.costo).toBe(0);

      const sinCobertura = await cotizar({
        metodoEnvio: 'DESPACHO',
        region: 'V',
        comuna: 'Isla de Pascua',
        subtotal: 1,
      });
      expect(sinCobertura.status).toBe(422);
      expect(sinCobertura.body.error).toBe('ENVIO_SIN_COBERTURA');
    });
  });

  describe('carrito, pedido, pago y seguimiento', () => {
    let stockInicial: number;

    it('no deja crear un pedido con el carrito vacío', async () => {
      const res = await http
        .post('/pedidos')
        .set(auth())
        .send({ metodoEnvio: 'RETIRO' })
        .expect(409);
      expect(res.body.error).toBe('CARRITO_VACIO');
    });

    it('agrega, modifica y valida stock en el carrito', async () => {
      stockInicial = (await http.get(`/libros/${FUNDACION}`)).body.stock;

      const agregado = await http
        .post('/carrito/items')
        .set(auth())
        .send({ libroId: FUNDACION, cantidad: 2 })
        .expect(200);
      expect(agregado.body).toMatchObject({ totalItems: 2, subtotal: 25980 });

      const sinStock = await http
        .post('/carrito/items')
        .set(auth())
        .send({ libroId: HOBBIT_SIN_STOCK })
        .expect(409);
      expect(sinStock.body.error).toBe('STOCK_INSUFICIENTE');

      const modificado = await http
        .patch(`/carrito/items/${FUNDACION}`)
        .set(auth())
        .send({ cantidad: 1 })
        .expect(200);
      expect(modificado.body).toMatchObject({ totalItems: 1, subtotal: 12990 });

      await http
        .patch(`/carrito/items/${HOBBIT_SIN_STOCK}`)
        .set(auth())
        .send({ cantidad: 1 })
        .expect(404);
    });

    it('exige dirección cuando el método es DESPACHO', async () => {
      const res = await http
        .post('/pedidos')
        .set(auth())
        .send({ metodoEnvio: 'DESPACHO' })
        .expect(400);
      expect(res.body.error).toBe('VALIDATION_ERROR');
    });

    it('checkout: crea el pedido, descuenta stock y vacía el carrito', async () => {
      const res = await http
        .post('/pedidos')
        .set(auth())
        .send({ metodoEnvio: 'DESPACHO', direccion })
        .expect(201);
      expect(res.body).toMatchObject({
        estado: 'PENDIENTE_PAGO',
        subtotal: 12990,
        costoEnvio: 2990,
        total: 15980,
        codigoSeguimiento: null,
      });
      expect(res.body.numero).toMatch(/^LCN-\d{6}$/);
      pedidoId = res.body.id;

      expect((await http.get(`/libros/${FUNDACION}`)).body.stock).toBe(
        stockInicial - 1,
      );
      expect((await http.get('/carrito').set(auth())).body.items).toHaveLength(
        0,
      );
      expect((await http.get('/pedidos').set(auth())).body).toHaveLength(1);
    });

    it('no hay seguimiento mientras el pedido no esté pagado', async () => {
      const res = await http
        .get(`/pedidos/${pedidoId}/seguimiento`)
        .set(auth())
        .expect(409);
      expect(res.body.error).toBe('SEGUIMIENTO_NO_DISPONIBLE');
    });

    it('pago: rechaza por regla, cae la pasarela y luego aprueba', async () => {
      const pagar = (numeroTarjeta: string, extra = {}) =>
        http
          .post('/pagos')
          .set(auth())
          .send({ pedidoId, numeroTarjeta, ...tarjeta, ...extra });

      const sinFondos = await pagar('4111111111110002');
      expect(sinFondos.status).toBe(402);
      expect(sinFondos.body).toMatchObject({
        error: 'PAGO_RECHAZADO',
        detalles: ['FONDOS_INSUFICIENTES'],
      });

      const vencida = await pagar('4111111111111111', { vencimiento: '01/20' });
      expect(vencida.body.detalles).toEqual(['TARJETA_VENCIDA']);

      expect((await pagar('4111111111110009')).status).toBe(502);
      expect((await pagar('4111')).status).toBe(400);

      const aprobado = await pagar('4111111111111111');
      expect(aprobado.status).toBe(201);
      expect(aprobado.body).toMatchObject({
        estado: 'APROBADO',
        monto: 15980,
        ultimos4: '1111',
        estadoPedido: 'PAGADO',
      });
      expect(JSON.stringify(aprobado.body)).not.toContain('4111111111111111');

      const repetido = await pagar('4111111111111111');
      expect(repetido.status).toBe(409);
      expect(repetido.body.error).toBe('ESTADO_PEDIDO_INVALIDO');

      const intentos = await http
        .get(`/pagos/pedido/${pedidoId}`)
        .set(auth())
        .expect(200);
      expect(intentos.body.map((p: { estado: string }) => p.estado)).toEqual([
        'RECHAZADO',
        'RECHAZADO',
        'APROBADO',
      ]);
    });

    it('seguimiento: línea de tiempo desde la hora de pago', async () => {
      const res = await http
        .get(`/pedidos/${pedidoId}/seguimiento`)
        .set(auth())
        .expect(200);
      expect(res.body.estadoActual).toBe('CONFIRMADO');
      expect(res.body.eventos.map((e: { estado: string }) => e.estado)).toEqual(
        [
          'CONFIRMADO',
          'EN_PREPARACION',
          'DESPACHADO',
          'EN_REPARTO',
          'ENTREGADO',
        ],
      );
    });

    it('un pedido pagado no se puede cancelar; uno pendiente sí, y devuelve el stock', async () => {
      await http.post(`/pedidos/${pedidoId}/cancelar`).set(auth()).expect(409);

      await http
        .post('/carrito/items')
        .set(auth())
        .send({ libroId: FUNDACION })
        .expect(200);
      const otro = await http
        .post('/pedidos')
        .set(auth())
        .send({ metodoEnvio: 'RETIRO' })
        .expect(201);
      expect(otro.body).toMatchObject({ costoEnvio: 0, direccion: null });
      expect((await http.get(`/libros/${FUNDACION}`)).body.stock).toBe(
        stockInicial - 2,
      );

      const cancelado = await http
        .post(`/pedidos/${otro.body.id}/cancelar`)
        .set(auth())
        .expect(200);
      expect(cancelado.body.estado).toBe('CANCELADO');
      expect((await http.get(`/libros/${FUNDACION}`)).body.stock).toBe(
        stockInicial - 1,
      );
    });

    it('nadie puede ver pedidos de otro usuario', async () => {
      const login = await http
        .post('/auth/login')
        .send({ email: 'cliente@leeconnos.cl', password: 'LeeConNos2026' });
      const res = await http
        .get(`/pedidos/${pedidoId}`)
        .set('Authorization', `Bearer ${login.body.accessToken}`);
      expect(res.status).toBe(403);
    });

    it('las recomendaciones usan el historial real de compras', async () => {
      const yo = (await http.get('/auth/me').set(auth())).body;
      const res = await http
        .get(`/recomendaciones/usuario/${yo.id}`)
        .expect(200);
      // Compró "Fundación": se le recomienda el resto de ciencia ficción, no el mismo libro.
      expect(res.body.length).toBeGreaterThan(0);
      expect(
        res.body.every(
          (r: { score: number; genero: string }) =>
            r.score === 0.4 && r.genero === 'Ciencia ficción',
        ),
      ).toBe(true);
      expect(
        (
          await http
            .get(`/recomendaciones/usuario/${yo.id}`)
            .query({ limite: 2 })
        ).body,
      ).toHaveLength(2);
      expect(res.body.map((r: { libroId: string }) => r.libroId)).not.toContain(
        FUNDACION,
      );
    });
  });

  describe('módulos en memoria (contrato del Hito 1)', () => {
    it('reseñas y listas de deseos siguen respondiendo sin token', async () => {
      const usuarioId = '33333333-3333-4333-8333-333333333333';
      await http
        .post('/resenas')
        .send({
          usuarioId,
          libroId: FUNDACION,
          calificacion: 5,
          comentario: 'Un clásico',
        })
        .expect(201);
      expect(
        (await http.get(`/resenas/libro/${FUNDACION}`)).body.length,
      ).toBeGreaterThan(0);
      await http
        .post('/resenas')
        .send({
          usuarioId,
          libroId: FUNDACION,
          calificacion: 9,
          comentario: 'x',
        })
        .expect(400);

      const lista = await http
        .post('/listas-deseos')
        .send({ usuarioId, nombre: 'Regalos', esParaRegalo: true })
        .expect(201);
      await http
        .post(`/listas-deseos/${lista.body.id}/libros`)
        .send({ libroId: FUNDACION })
        .expect(201);
      await http.get(`/listas-deseos/${lista.body.id}`).expect(200);
      await http.get('/libreros').expect(200);
      await http.get('/club-lectura').expect(200);
    });
  });
});
