import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { configurarApp } from '../src/app.setup';

/**
 * Recorre el flujo de compra completo contra una base PostgreSQL real con los
 * datos de prueba que cargan las migraciones (DATABASE_URL en .env). Cada
 * corrida registra usuarios nuevos, así que se puede ejecutar varias veces; el
 * stock que consume se repone al final (POST /admin/reiniciar-stock).
 */

// Variables de entorno de las pruebas: test/setup-env.ts.
const ORIGEN_WEB = 'http://localhost:5173';

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

  let app: NestExpressApplication;
  let http: ReturnType<typeof request>;
  let token: string;
  let pedidoId: string;
  const email = `e2e-${Date.now()}@leeconnos.cl`;
  const auth = () => ({ Authorization: `Bearer ${token}` });
  /** Inicia sesión con un usuario de prueba (contraseña de desarrollo). */
  const login = async (correo: string): Promise<string> =>
    (
      await http
        .post('/auth/login')
        .send({ email: correo, password: 'LeeConNos2026' })
        .expect(200)
    ).body.accessToken as string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    configurarApp(app);
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
        total: 75,
        totalPages: 15,
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

  describe('Hito 3: catálogo enriquecido', () => {
    type LibroApi = {
      id: string;
      titulo: string;
      autor: string;
      genero: string;
      categorias: string[];
      precio: number;
      precioAnterior: number | null;
      descuentoPorcentaje: number;
      ventas: number;
      editorial: string | null;
    };
    const items = async (query: Record<string, string | number>) =>
      (
        await http
          .get('/libros')
          .query({ limit: 50, ...query })
          .expect(200)
      ).body.items as LibroApi[];

    it('la ficha trae calificación, opiniones, ventas, descuento y datos técnicos', async () => {
      const res = await http.get(`/libros/${FUNDACION}`).expect(200);
      expect(res.body).toMatchObject({
        descripcion: res.body.sinopsis,
        encuadernacion: 'Tapa blanda',
        paginas: 304,
        dimensiones: '13 x 19 cm',
        enOferta: false,
        descuentoPorcentaje: 0,
      });
      expect(res.body.calificacion).toBeGreaterThan(0);
      expect(res.body.opiniones).toBeGreaterThanOrEqual(2);
      expect(res.body.etiquetas).toContain('Ciencia ficción');
      expect(res.body.categorias).toContain('Clásicos');

      const oferta = (await items({ q: '1984' }))[0];
      expect(oferta).toMatchObject({ precio: 8990, precioAnterior: 10990 });
      expect(oferta.descuentoPorcentaje).toBe(18);
    });

    it('filtra por editorial, subgénero, varios autores y "en oferta"', async () => {
      expect(
        (await items({ editorial: 'anagrama' })).every((l) =>
          l.editorial?.toLowerCase().includes('anagrama'),
        ),
      ).toBe(true);
      expect(
        (await items({ subgenero: 'novela negra' })).map((l) => l.titulo),
      ).toEqual(['El halcón maltés']);

      const autores = await items({ autores: 'Allende,Cortázar' });
      expect(autores.length).toBe(3);
      expect(autores.every((l) => /Allende|Cortázar/.test(l.autor))).toBe(true);
      // También repitiendo el parámetro.
      const repetido = await http
        .get('/libros?autores=Allende&autores=Cort%C3%A1zar&limit=50')
        .expect(200);
      expect(repetido.body.total).toBe(3);

      const ofertas = await items({ enOferta: 'true' });
      expect(ofertas.length).toBeGreaterThan(5);
      expect(ofertas.every((l) => l.precioAnterior! > l.precio)).toBe(true);
    });

    it('el género acepta las categorías del menú de UX', async () => {
      const romance = await items({ genero: 'Romance' });
      expect(romance.map((l) => l.titulo)).toContain('Orgullo y prejuicio');
      // "Misterio y thriller" se asocia a "Policial" (y viceversa).
      const policial = (await items({ genero: 'Policial' })).map(
        (l) => l.titulo,
      );
      const thriller = (await items({ genero: 'misterio y thriller' })).map(
        (l) => l.titulo,
      );
      expect(policial).toContain('El perfume');
      expect(thriller).toEqual(expect.arrayContaining(policial));

      const menu = await http.get('/libros/categorias').expect(200);
      expect(menu.body[0].grupo).toBe('Ficción');
      expect(menu.body.map((g: { grupo: string }) => g.grupo)).toEqual(
        expect.arrayContaining(['No ficción', 'Arte y Diseño', 'Para pensar']),
      );
      const sinLibros = menu.body.flatMap(
        (g: { categorias: { cantidad: number }[] }) =>
          g.categorias.filter((c) => c.cantidad === 0),
      );
      expect(sinLibros).toHaveLength(0);
    });

    it('ordena por más vendidos y mayor descuento', async () => {
      const vendidos = await items({ orden: 'mas_vendidos', limit: 10 });
      const ventas = vendidos.map((l) => l.ventas);
      expect(ventas).toEqual([...ventas].sort((a, b) => b - a));

      const descuentos = (
        await items({ orden: 'mayor_descuento', limit: 10 })
      ).map((l) => l.descuentoPorcentaje);
      expect(descuentos).toEqual([...descuentos].sort((a, b) => b - a));
      expect(descuentos[0]).toBeGreaterThan(0);
    });

    it('entrega filtros disponibles y "lo que la comunidad también leyó"', async () => {
      const filtros = await http.get('/libros/filtros').expect(200);
      expect(filtros.body.editoriales.length).toBeGreaterThan(5);
      expect(
        filtros.body.subgeneros.map((s: { valor: string }) => s.valor),
      ).toContain('Novela negra');
      expect(filtros.body.precioMax).toBeGreaterThan(
        filtros.body.precioMin as number,
      );

      const relacionados = await http
        .get(`/libros/${FUNDACION}/relacionados`)
        .query({ limite: 4 })
        .expect(200);
      expect(relacionados.body).toHaveLength(4);
      expect(relacionados.body.map((l: { id: string }) => l.id)).not.toContain(
        FUNDACION,
      );
    });

    it('un librero no puede poner un precio anterior menor al actual', async () => {
      const librero = await login('librero@leeconnos.cl');
      const res = await http
        .patch(`/libros/${FUNDACION}`)
        .set({ Authorization: `Bearer ${librero}` })
        .send({ precioAnterior: 1000 })
        .expect(422);
      expect(res.body.error).toBe('PRECIO_ANTERIOR_INVALIDO');
    });
  });

  describe('Hito 3: cuenta', () => {
    const emailNuevo = `hito3-${Date.now()}@leeconnos.cl`;
    let tokenNuevo: string;
    let refreshNuevo: string;

    it('registra con apellido y "Recibir novedades" (suscribe al newsletter)', async () => {
      const res = await http
        .post('/auth/registro')
        .send({
          nombre: 'Josefina',
          apellido: 'Pérez Soto',
          email: emailNuevo,
          password: 'clave-segura-1',
          recibirNovedades: true,
        })
        .expect(201);
      expect(res.body.usuario).toMatchObject({
        nombre: 'Josefina',
        apellido: 'Pérez Soto',
        nombreCompleto: 'Josefina Pérez Soto',
        recibirNovedades: true,
        emailVerificado: false,
      });
      expect(res.body.refreshToken).toBeDefined();
      tokenNuevo = res.body.accessToken;
      refreshNuevo = res.body.refreshToken;

      const admin = await login('admin@leeconnos.cl');
      const suscripciones = await http
        .get('/newsletter/suscripciones')
        .set({ Authorization: `Bearer ${admin}` })
        .expect(200);
      expect(
        suscripciones.body.map((s: { email: string }) => s.email),
      ).toContain(emailNuevo);

      // Verificación de correo con el token del enlace (expuesto solo en desarrollo).
      const verificado = await http
        .post('/auth/verificar-email')
        .send({ token: res.body.tokenVerificacionDesarrollo })
        .expect(200);
      expect(verificado.body.emailVerificado).toBe(true);
      const reuso = await http
        .post('/auth/verificar-email')
        .send({ token: res.body.tokenVerificacionDesarrollo })
        .expect(400);
      expect(reuso.body.error).toBe('TOKEN_CUENTA_INVALIDO');
      const reenvio = await http
        .post('/auth/reenviar-verificacion')
        .set({ Authorization: `Bearer ${tokenNuevo}` })
        .expect(409);
      expect(reenvio.body.error).toBe('EMAIL_YA_VERIFICADO');
    });

    it('newsletter: suscribir es idempotente', async () => {
      const email = `news-${Date.now()}@correo.cl`;
      await http.post('/newsletter/suscripciones').send({ email }).expect(201);
      const otra = await http
        .post('/newsletter/suscripciones')
        .send({ email: email.toUpperCase() })
        .expect(201);
      expect(otra.body).toMatchObject({ email, activa: true });
    });

    it('"Olvidé mi contraseña" sin revelar qué emails existen', async () => {
      const desconocido = await http
        .post('/auth/olvide-password')
        .send({ email: 'nadie@leeconnos.cl' })
        .expect(202);
      expect(desconocido.body.tokenDesarrollo).toBeUndefined();

      const res = await http
        .post('/auth/olvide-password')
        .send({ email: emailNuevo })
        .expect(202);
      expect(res.body.mensaje).toBe(desconocido.body.mensaje);
      await http
        .post('/auth/restablecer-password')
        .send({ token: res.body.tokenDesarrollo, password: 'otra-clave-123' })
        .expect(200);
      await http
        .post('/auth/login')
        .send({ email: emailNuevo, password: 'clave-segura-1' })
        .expect(401);
      await http
        .post('/auth/login')
        .send({ email: emailNuevo, password: 'otra-clave-123' })
        .expect(200);
    });

    it('renueva la sesión con el refreshToken, que no sirve como token de acceso', async () => {
      const res = await http
        .post('/auth/refresh')
        .send({ refreshToken: refreshNuevo })
        .expect(200);
      await http
        .get('/auth/me')
        .set({ Authorization: `Bearer ${res.body.accessToken}` })
        .expect(200);
      await http
        .get('/auth/me')
        .set({ Authorization: `Bearer ${refreshNuevo}` })
        .expect(401);
      await http
        .post('/auth/refresh')
        .send({ refreshToken: tokenNuevo })
        .expect(401);
    });

    it('Google y Facebook responden 503 mientras no estén configurados', async () => {
      const google = await http
        .post('/auth/google')
        .send({ idToken: 'token-de-prueba-123' })
        .expect(503);
      expect(google.body.error).toBe('PROVEEDOR_NO_CONFIGURADO');
      await http
        .post('/auth/facebook')
        .send({ accessToken: 'token-de-prueba-123' })
        .expect(503);
    });
  });

  describe('Hito 3: reseñas, libreros y recomendaciones', () => {
    const KLARA = '00000000-0000-4000-8000-000000000035';
    const DUNE = '00000000-0000-4000-8000-000000000002';

    it('lista reseñas con resumen de estrellas, filtrables por tipo', async () => {
      const res = await http.get(`/libros/${KLARA}/resenas`).expect(200);
      expect(res.body.total).toBe(3);
      expect(res.body.resumen.cantidad).toBe(3);
      expect(res.body.items[0].autor.nombre).toMatch(/^\S+ \S\.$/);
      const libreros = await http
        .get(`/libros/${KLARA}/resenas`)
        .query({ tipo: 'LIBRERO' })
        .expect(200);
      expect(libreros.body.items).toHaveLength(1);
      expect(libreros.body.items[0].tipo).toBe('LIBRERO');
    });

    it('una reseña por usuario, verificada si compró el libro, y actualiza la calificación', async () => {
      const antes = (await http.get(`/libros/${FUNDACION}`)).body.opiniones;
      await http
        .post(`/libros/${FUNDACION}/resenas`)
        .send({ calificacion: 5, comentario: 'Sin token no' })
        .expect(401);
      const res = await http
        .post(`/libros/${FUNDACION}/resenas`)
        .set(auth())
        .send({
          calificacion: 4,
          titulo: 'Muy bueno',
          comentario: 'Lo compré aquí',
        })
        .expect(201);
      // El usuario e2e pagó un pedido con Fundación en las pruebas anteriores.
      expect(res.body).toMatchObject({ verificada: true, tipo: 'LECTOR' });
      expect((await http.get(`/libros/${FUNDACION}`)).body.opiniones).toBe(
        antes + 1,
      );
      const duplicada = await http
        .post(`/libros/${FUNDACION}/resenas`)
        .set(auth())
        .send({ calificacion: 3, comentario: 'Otra vez' })
        .expect(409);
      expect(duplicada.body.error).toBe('RESENA_DUPLICADA');

      // Ruta del Hito 1, ahora con el autor tomado del token.
      const legado = await http
        .post('/resenas')
        .set(auth())
        .send({ libroId: DUNE, calificacion: 5, comentario: 'Épico' })
        .expect(201);
      expect(legado.body.verificada).toBe(false);
      const otro = await login('cliente@leeconnos.cl');
      await http
        .patch(`/resenas/${legado.body.id}`)
        .set({ Authorization: `Bearer ${otro}` })
        .send({ calificacion: 1 })
        .expect(403);
      await http.delete(`/resenas/${legado.body.id}`).set(auth()).expect(204);
      expect(
        (await http.get('/resenas/mias').set(auth())).body.map(
          (r: { libroId: string }) => r.libroId,
        ),
      ).toEqual([FUNDACION]);
    });

    it('perfiles de libreros por slug, con recomendaciones del Home y de la ficha', async () => {
      const lista = await http.get('/libreros').expect(200);
      expect(lista.body.map((l: { slug: string }) => l.slug)).toEqual(
        expect.arrayContaining(['gregorio-samsa', 'clara-del-valle']),
      );
      const perfil = await http.get('/libreros/gregorio-samsa').expect(200);
      expect(perfil.body).toMatchObject({
        nombre: 'Gregorio Samsa',
        siguiendo: null,
      });
      expect(perfil.body.indispensables).toHaveLength(5);
      expect(perfil.body.indispensables[0].libro.titulo).toBe('El proceso');
      expect(perfil.body.colecciones[0].libros.length).toBeGreaterThan(0);
      expect(perfil.body.ultimasRecomendaciones[0].nota).toBeDefined();

      const destacadas = await http
        .get('/recomendaciones/destacadas')
        .expect(200);
      expect(destacadas.body.length).toBeGreaterThan(3);
      expect(
        destacadas.body.every((r: { destacada: boolean }) => r.destacada),
      ).toBe(true);
      expect(destacadas.body[0].librero.slug).toBeDefined();

      const ficha = await http
        .get(`/libros/${KLARA}/recomendaciones-libreros`)
        .expect(200);
      expect(ficha.body[0].librero.nombre).toBe('Gregorio Samsa');
      await http.get('/libreros/no-existe').expect(404);
    });

    it('seguir libreros y editar solo el propio perfil', async () => {
      const seguir = await http
        .post('/libreros/clara-del-valle/seguir')
        .set(auth())
        .expect(200);
      expect(seguir.body.siguiendo).toBe(true);
      expect(
        (await http.get('/libreros/clara-del-valle').set(auth())).body
          .siguiendo,
      ).toBe(true);
      const dejar = await http
        .delete('/libreros/clara-del-valle/seguir')
        .set(auth())
        .expect(200);
      expect(dejar.body.seguidores).toBe(seguir.body.seguidores - 1);

      await http
        .patch('/libreros/gregorio-samsa')
        .set(auth())
        .send({ cita: 'Hackeado' })
        .expect(403);
      const gregorio = await login('gregorio@leeconnos.cl');
      const recomendacion = await http
        .post('/libreros/gregorio-samsa/recomendaciones')
        .set({ Authorization: `Bearer ${gregorio}` })
        .send({ libroId: DUNE, notaPersonal: 'Un desierto que no se olvida.' })
        .expect(201);
      expect(recomendacion.body.libro.titulo).toBe('Dune');
    });

    it('recomendaciones personalizadas con el token', async () => {
      const res = await http
        .get('/recomendaciones/para-mi')
        .set(auth())
        .expect(200);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].libro.portadaUrl).toBeDefined();
    });
  });

  describe('Hito 3: listas de deseos y club de lectura', () => {
    const CLUB = 'eeeeeeee-0000-4000-8000-000000000001';

    it('listas de deseos persistentes y privadas', async () => {
      await http.get('/listas-deseos').expect(401);
      const favoritos = await http
        .post(`/listas-deseos/favoritos/libros/${FUNDACION}`)
        .set(auth())
        .expect(200);
      expect(favoritos.body).toMatchObject({
        esFavoritos: true,
        libros: [FUNDACION],
      });
      expect(favoritos.body.items[0].titulo).toBe('Fundación');

      const lista = await http
        .post('/listas-deseos')
        .set(auth())
        .send({ nombre: 'Regalos', esParaRegalo: true })
        .expect(201);
      await http
        .post(`/listas-deseos/${lista.body.id}/libros`)
        .send({ libroId: FUNDACION })
        .set(auth())
        .expect(201);
      expect((await http.get('/listas-deseos').set(auth())).body).toHaveLength(
        2,
      );

      const otro = await login('cliente@leeconnos.cl');
      await http
        .get(`/listas-deseos/${lista.body.id}`)
        .set({ Authorization: `Bearer ${otro}` })
        .expect(403);
      await http
        .delete(`/listas-deseos/favoritos/libros/${FUNDACION}`)
        .set(auth())
        .expect(200);
    });

    it('club de lectura: leer es público; participar requiere unirse', async () => {
      const clubes = await http.get('/club-lectura').expect(200);
      expect(clubes.body.map((c: { id: string }) => c.id)).toContain(CLUB);
      expect(
        (await http.get(`/club-lectura/${CLUB}/hilos`)).body.length,
      ).toBeGreaterThan(0);

      const hilo = {
        titulo: '¿Y el final?',
        contenido: 'Sin spoilers, por favor.',
      };
      const sinUnirse = await http
        .post(`/club-lectura/${CLUB}/hilos`)
        .set(auth())
        .send(hilo)
        .expect(403);
      expect(sinUnirse.body.error).toBe('NO_ES_PARTICIPANTE');

      await http.post(`/club-lectura/${CLUB}/unirse`).set(auth()).expect(200);
      const creado = await http
        .post(`/club-lectura/${CLUB}/hilos`)
        .set(auth())
        .send(hilo)
        .expect(201);
      await http
        .post(`/club-lectura/hilos/${creado.body.id}/comentarios`)
        .set(auth())
        .send({ contenido: 'Yo voy en la mitad.' })
        .expect(201);
      const progreso = await http
        .put(`/club-lectura/${CLUB}/progreso`)
        .set(auth())
        .send({ paginaActual: 50, porcentaje: 10 })
        .expect(200);
      expect(progreso.body.porcentaje).toBe(10);
    });
  });

  describe('Cierre Hito 3: migraciones', () => {
    const DUNE = '00000000-0000-4000-8000-000000000002';

    it('la base se prepara solo con migraciones de TypeORM', async () => {
      const filas: { name: string }[] = await app
        .get(DataSource)
        .query('SELECT name FROM migraciones_typeorm ORDER BY id');
      expect(filas.map((f) => f.name)).toEqual([
        'EsquemaInicial1788220800000',
        'DatosPruebaIniciales1788220800001',
        'EsquemaHito31792022400000',
        'DatosPruebaHito31792022400001',
        'CierreHito31794355200000',
        'DatosPruebaCierreHito31794355200001',
      ]);
      expect(await app.get(DataSource).showMigrations()).toBe(false);
    });

    it('los datos de prueba traen subgénero, galería y video', async () => {
      const sinSubgenero = await http.get('/libros').query({ limit: 50 });
      expect(
        sinSubgenero.body.items.every(
          (l: { subgenero: string }) => l.subgenero,
        ),
      ).toBe(true);
      const dune = (await http.get(`/libros/${DUNE}`)).body;
      expect(dune.videoUrl).toMatch(/^https:\/\/www\.youtube\.com\//);
      const fundacion = (await http.get(`/libros/${FUNDACION}`)).body;
      expect(fundacion.galeria.length).toBeGreaterThan(0);
    });
  });

  describe('Cierre Hito 3: sesión con cookies HttpOnly', () => {
    const correo = `cookie-${Date.now()}@leeconnos.cl`;
    const cookieDe = (res: request.Response, nombre: string) =>
      ([] as string[])
        .concat(res.headers['set-cookie'] ?? [])
        .find((c) => c.startsWith(`${nombre}=`));

    it('el login deja accessToken y refreshToken en cookies HttpOnly', async () => {
      await http
        .post('/auth/registro')
        .send({
          nombre: 'Cookie',
          apellido: 'E2E',
          email: correo,
          password: 'clave-segura-1',
        })
        .expect(201);
      const res = await http
        .post('/auth/login')
        .send({ email: correo, password: 'clave-segura-1' })
        .expect(200);
      const acceso = cookieDe(res, 'lcn_access');
      const refresh = cookieDe(res, 'lcn_refresh');
      expect(acceso).toMatch(/HttpOnly/);
      expect(acceso).toMatch(/Path=\//);
      expect(refresh).toMatch(/HttpOnly/);
      expect(refresh).toMatch(/Path=\/auth/);
    });

    it('con la cookie basta para usar la API, renovar y cerrar sesión', async () => {
      const agente = request.agent(app.getHttpServer());
      await agente
        .post('/auth/login')
        .send({ email: correo, password: 'clave-segura-1' })
        .expect(200);
      expect((await agente.get('/auth/me').expect(200)).body.email).toBe(
        correo,
      );
      // Modificar datos con cookie exige venir de un origen de CORS_ORIGIN (CSRF).
      const ajeno = await agente
        .post('/carrito/items')
        .set('Origin', 'https://sitio-malicioso.example')
        .send({ libroId: FUNDACION });
      expect(ajeno.status).toBe(403);
      expect(ajeno.body.error).toBe('ORIGEN_NO_PERMITIDO');
      await agente
        .post('/carrito/items')
        .set('Origin', ORIGEN_WEB)
        .send({ libroId: FUNDACION })
        .expect(200);
      await agente.delete('/carrito').set('Origin', ORIGEN_WEB).expect(204);

      // Renovar sin body: el refreshToken viaja en la cookie.
      const renovado = await agente.post('/auth/refresh').expect(200);
      const refreshAnterior = renovado.body.refreshToken as string;

      const salida = await agente.post('/auth/logout').expect(204);
      expect(cookieDe(salida, 'lcn_access')).toMatch(
        /Expires=Thu, 01 Jan 1970/,
      );
      await agente.get('/auth/me').expect(401);

      // Cerrar sesión invalida los refresh emitidos antes (también en Mobile).
      const viejo = await http
        .post('/auth/refresh')
        .send({ refreshToken: refreshAnterior })
        .expect(401);
      expect(viejo.body.error).toBe('TOKEN_INVALIDO');
    });

    it('sin refreshToken en body ni cookie responde 401 TOKEN_REQUERIDO', async () => {
      const res = await http.post('/auth/refresh').expect(401);
      expect(res.body.error).toBe('TOKEN_REQUERIDO');
    });
  });

  describe('Cierre Hito 3: imágenes', () => {
    // Un PNG de 1x1 píxel.
    const PNG = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64',
    );
    let librero: string;
    let portadaOriginal: string;

    beforeAll(async () => {
      librero = await login('librero@leeconnos.cl');
      portadaOriginal = (await http.get(`/libros/${FUNDACION}`)).body
        .portadaUrl;
    });

    it('sube la portada de un libro y la sirve como archivo estático', async () => {
      const res = await http
        .post(`/libros/${FUNDACION}/portada`)
        .set({ Authorization: `Bearer ${librero}` })
        .attach('imagen', PNG, {
          filename: 'portada.png',
          contentType: 'image/png',
        })
        .expect(201);
      expect(res.body).toMatchObject({
        mime: 'image/png',
        uso: 'PORTADA',
        libroId: FUNDACION,
      });
      expect(res.body.url).toMatch(/\/uploads\/[0-9a-f-]{36}\.png$/);

      const ruta = new URL(res.body.url).pathname;
      const archivo = await http.get(ruta).expect(200);
      expect(archivo.headers['content-type']).toBe('image/png');
      expect((await http.get(`/libros/${FUNDACION}`)).body.portadaUrl).toBe(
        res.body.url,
      );

      // Al eliminar la imagen se quita del libro y deja de servirse.
      await http
        .delete(`/imagenes/${res.body.id}`)
        .set({ Authorization: `Bearer ${librero}` })
        .expect(204);
      await http.get(ruta).expect(404);
      expect(
        (await http.get(`/libros/${FUNDACION}`)).body.portadaUrl,
      ).toBeNull();
      await http
        .patch(`/libros/${FUNDACION}`)
        .set({ Authorization: `Bearer ${librero}` })
        .send({ portadaUrl: portadaOriginal })
        .expect(200);
    });

    it('agrega imágenes a la galería', async () => {
      const res = await http
        .post(`/libros/${HOBBIT_SIN_STOCK}/galeria`)
        .set({ Authorization: `Bearer ${librero}` })
        .attach('imagen', PNG, {
          filename: 'galeria.png',
          contentType: 'image/png',
        })
        .expect(201);
      const libro = (await http.get(`/libros/${HOBBIT_SIN_STOCK}`)).body;
      expect(libro.galeria).toContain(res.body.url);
      const imagenes = await http
        .get(`/libros/${HOBBIT_SIN_STOCK}/imagenes`)
        .expect(200);
      expect(imagenes.body.map((i: { id: string }) => i.id)).toContain(
        res.body.id,
      );
      await http
        .delete(`/imagenes/${res.body.id}`)
        .set({ Authorization: `Bearer ${librero}` })
        .expect(204);
      expect(
        (await http.get(`/libros/${HOBBIT_SIN_STOCK}`)).body.galeria,
      ).not.toContain(res.body.url);
    });

    it('valida el archivo, el rol y que el libro exista', async () => {
      const comoLibrero = { Authorization: `Bearer ${librero}` };
      const sinArchivo = await http
        .post(`/libros/${FUNDACION}/portada`)
        .set(comoLibrero)
        .expect(400);
      expect(sinArchivo.body.error).toBe('IMAGEN_REQUERIDA');

      // Dice ser PNG, pero su contenido no lo es.
      const falso = await http
        .post('/imagenes')
        .set(comoLibrero)
        .attach('imagen', Buffer.from('no soy una imagen'), {
          filename: 'falso.png',
          contentType: 'image/png',
        })
        .expect(415);
      expect(falso.body.error).toBe('TIPO_ARCHIVO_NO_PERMITIDO');

      await http
        .post(`/libros/${FUNDACION}/portada`)
        .set(auth())
        .attach('imagen', PNG, { filename: 'p.png', contentType: 'image/png' })
        .expect(403);

      // LibroExistePipe: consulta la base antes de llegar al service.
      const noExiste = await http
        .post('/libros/00000000-0000-4000-8000-999999999999/portada')
        .set(comoLibrero)
        .attach('imagen', PNG, { filename: 'p.png', contentType: 'image/png' })
        .expect(404);
      expect(noExiste.body.error).toBe('LIBRO_NO_ENCONTRADO');
      await http.get('/libros/no-es-uuid/imagenes').expect(400);
    });
  });

  describe('Cierre Hito 3: direcciones guardadas y despacho', () => {
    const casa = {
      ...direccion,
      alias: 'Casa',
      rut: '12.345.678-5',
      ciudad: 'Santiago',
      codigoPostal: '7750000',
    };
    let casaId: string;
    let oficinaId: string;

    it('guarda direcciones; la primera queda como predeterminada', async () => {
      const primera = await http
        .post('/direcciones')
        .set(auth())
        .send(casa)
        .expect(201);
      expect(primera.body).toMatchObject({
        predeterminada: true,
        rut: '12345678-5',
      });
      casaId = primera.body.id;

      const segunda = await http
        .post('/direcciones')
        .set(auth())
        .send({ ...direccion, alias: 'Oficina', predeterminada: true })
        .expect(201);
      oficinaId = segunda.body.id;

      const lista = (await http.get('/direcciones').set(auth()).expect(200))
        .body;
      expect(lista.map((d: { alias: string }) => d.alias)).toEqual([
        'Oficina',
        'Casa',
      ]);
      expect(lista[1].predeterminada).toBe(false);
    });

    it('valida el RUT y el código postal', async () => {
      const res = await http
        .post('/direcciones')
        .set(auth())
        .send({ ...casa, rut: '12.345.678-9', codigoPostal: '123' })
        .expect(400);
      expect(res.body.detalles).toHaveLength(2);
    });

    it('el checkout usa una dirección guardada y puede guardar la nueva', async () => {
      await http
        .post('/carrito/items')
        .set(auth())
        .send({ libroId: FUNDACION })
        .expect(200);
      const ambas = await http
        .post('/pedidos')
        .set(auth())
        .send({ metodoEnvio: 'DESPACHO', direccion, direccionId: casaId })
        .expect(400);
      expect(ambas.body.error).toBe('DIRECCION_AMBIGUA');

      const pedido = await http
        .post('/pedidos')
        .set(auth())
        .send({ metodoEnvio: 'DESPACHO', direccionId: casaId })
        .expect(201);
      expect(pedido.body.direccion).toMatchObject({
        calle: casa.calle,
        rut: '12345678-5',
        ciudad: 'Santiago',
        codigoPostal: '7750000',
      });
      await http
        .post(`/pedidos/${pedido.body.id}/cancelar`)
        .set(auth())
        .expect(200);

      await http
        .post('/carrito/items')
        .set(auth())
        .send({ libroId: FUNDACION })
        .expect(200);
      const nueva = { ...direccion, calle: 'Los Leones 1200' };
      const conGuardado = await http
        .post('/pedidos')
        .set(auth())
        .send({
          metodoEnvio: 'DESPACHO',
          direccion: nueva,
          guardarDireccion: true,
        })
        .expect(201);
      await http
        .post(`/pedidos/${conGuardado.body.id}/cancelar`)
        .set(auth())
        .expect(200);
      const lista = (await http.get('/direcciones').set(auth())).body;
      expect(lista.map((d: { calle: string }) => d.calle)).toContain(
        'Los Leones 1200',
      );
    });

    it('las direcciones son privadas y al borrar la predeterminada pasa a otra', async () => {
      const otro = await login('cliente@leeconnos.cl');
      await http
        .patch(`/direcciones/${casaId}`)
        .set({ Authorization: `Bearer ${otro}` })
        .send({ alias: 'Mía' })
        .expect(404);
      await http.delete(`/direcciones/${oficinaId}`).set(auth()).expect(204);
      const lista = (await http.get('/direcciones').set(auth())).body;
      expect(lista[0]).toMatchObject({ id: casaId, predeterminada: true });
    });
  });

  describe('Cierre Hito 3: preguntas al librero', () => {
    it('cualquiera pregunta; solo el librero dueño las ve y responde', async () => {
      const enviada = await http
        .post('/libreros/lucia-librera/preguntas')
        .send({
          nombre: 'Lector E2E',
          email: 'lector@correo.cl',
          pregunta: 'Me gustó Rayuela, ¿qué leo después?',
        })
        .expect(201);
      expect(enviada.body.mensaje).toMatch(/lector@correo.cl/);

      await http
        .get('/libreros/lucia-librera/preguntas')
        .set(auth())
        .expect(403);
      const lucia = {
        Authorization: `Bearer ${await login('librero@leeconnos.cl')}`,
      };
      const lista = (
        await http
          .get('/libreros/lucia-librera/preguntas')
          .set(lucia)
          .expect(200)
      ).body;
      expect(lista.map((p: { id: string }) => p.id)).toContain(enviada.body.id);

      const respuesta = await http
        .post(`/libreros/lucia-librera/preguntas/${enviada.body.id}/respuesta`)
        .set(lucia)
        .send({ respuesta: 'Prueba con Los detectives salvajes.' })
        .expect(200);
      expect(respuesta.body.respondidaEn).not.toBeNull();

      const noExiste = await http
        .post('/libreros/no-existe/preguntas')
        .send({
          nombre: 'X Y',
          email: 'x@correo.cl',
          pregunta: 'Una pregunta cualquiera',
        })
        .expect(404);
      expect(noExiste.body.error).toBe('LIBRERO_NO_ENCONTRADO');
    });
  });

  describe('Cierre Hito 3: filtros pedidos por Frontend', () => {
    it('acepta varias editoriales y varios subgéneros', async () => {
      const res = await http
        .get('/libros')
        .query({ subgeneros: 'Distopía,Ciberpunk', limit: 50 })
        .expect(200);
      expect(res.body.total).toBeGreaterThanOrEqual(5);
      expect(
        res.body.items.every((l: { subgenero: string }) =>
          ['Distopía', 'Ciberpunk'].includes(l.subgenero),
        ),
      ).toBe(true);
      const editoriales = await http
        .get('/libros')
        .query({ editoriales: ['Anagrama', 'Ace'], limit: 50 })
        .expect(200);
      expect(editoriales.body.total).toBeGreaterThanOrEqual(3);
    });

    it('GET /libros/filtros respeta q y genero', async () => {
      const terror = (
        await http
          .get('/libros/filtros')
          .query({ genero: 'Terror' })
          .expect(200)
      ).body;
      const subgeneros = terror.subgeneros.map(
        (s: { valor: string }) => s.valor,
      );
      expect(subgeneros).toContain('Terror gótico');
      expect(subgeneros).not.toContain('Space opera');
      const asimov = (
        await http.get('/libros/filtros').query({ q: 'asimov' }).expect(200)
      ).body;
      expect(asimov.autores).toEqual([{ valor: 'Isaac Asimov', cantidad: 1 }]);
    });
  });

  describe('Hito 3: cupones, compra como invitado y stock', () => {
    const DUNE = '00000000-0000-4000-8000-000000000002';
    const tarjetaInvitado = { ...tarjeta, numeroTarjeta: '4111111111111111' };

    it('valida códigos de descuento', async () => {
      const ok = await http
        .post('/cupones/validar')
        .send({ codigo: 'bienvenida10', subtotal: 20000 })
        .expect(200);
      expect(ok.body).toMatchObject({
        codigo: 'BIENVENIDA10',
        descuento: 2000,
        subtotalConDescuento: 18000,
      });
      const casos: [string, number, number, string][] = [
        ['VERANO2025', 50000, 422, 'CUPON_VENCIDO'],
        ['DESCUENTO5000', 10000, 422, 'CUPON_MONTO_MINIMO'],
        ['NOEXISTE', 10000, 404, 'CUPON_NO_ENCONTRADO'],
      ];
      for (const [codigo, subtotal, estado, error] of casos) {
        const res = await http
          .post('/cupones/validar')
          .send({ codigo, subtotal })
          .expect(estado);
        expect(res.body.error).toBe(error);
      }
    });

    it('aplica el cupón en el checkout, de un solo uso, y lo libera al cancelar', async () => {
      const comprar = async (codigoDescuento: string) => {
        await http
          .post('/carrito/items')
          .set(auth())
          .send({ libroId: DUNE, cantidad: 1 })
          .expect(200);
        return http
          .post('/pedidos')
          .set(auth())
          .send({ metodoEnvio: 'RETIRO', codigoDescuento });
      };
      const pedido = await comprar('BIENVENIDA10');
      expect(pedido.status).toBe(201);
      expect(pedido.body).toMatchObject({
        subtotal: 15990,
        descuento: 1599,
        codigoDescuento: 'BIENVENIDA10',
        total: 15990 - 1599 + pedido.body.costoEnvio,
      });

      const segunda = await comprar('BIENVENIDA10');
      expect(segunda.status).toBe(422);
      expect(segunda.body.error).toBe('CUPON_YA_USADO');
      // El pedido que falló no tocó el carrito: se vacía para la siguiente prueba.
      await http.delete('/carrito').set(auth());

      await http
        .post(`/pedidos/${pedido.body.id}/cancelar`)
        .set(auth())
        .expect(200);
      await http
        .post('/cupones/validar')
        .set(auth())
        .send({ codigo: 'BIENVENIDA10', subtotal: 10000 })
        .expect(200);
    });

    it('compra como invitado: crear, pagar y seguir con el token del pedido', async () => {
      const ventasAntes = (await http.get(`/libros/${DUNE}`)).body.ventas;
      const res = await http
        .post('/pedidos/invitado')
        .send({
          email: `invitado-${Date.now()}@correo.cl`,
          nombre: 'Invitada E2E',
          metodoEnvio: 'RETIRO',
          items: [{ libroId: DUNE, cantidad: 1 }],
        })
        .expect(201);
      expect(res.body.pedido).toMatchObject({
        estado: 'PENDIENTE_PAGO',
        esInvitado: true,
        invitado: { nombre: 'Invitada E2E' },
      });
      const { pedido, tokenPedido } = res.body as {
        pedido: { id: string };
        tokenPedido: string;
      };

      const sinToken = await http
        .get(`/pedidos/invitado/${pedido.id}`)
        .expect(401);
      expect(sinToken.body.error).toBe('TOKEN_PEDIDO_INVALIDO');
      // Un token de acceso de usuario no reemplaza al del pedido.
      await http
        .get(`/pedidos/invitado/${pedido.id}`)
        .set('X-Pedido-Token', token)
        .expect(401);
      await http
        .get(`/pedidos/invitado/${pedido.id}`)
        .set('X-Pedido-Token', tokenPedido)
        .expect(200);

      const pago = await http
        .post('/pagos/invitado')
        .set('X-Pedido-Token', tokenPedido)
        .send({ ...tarjetaInvitado, pedidoId: pedido.id })
        .expect(201);
      expect(pago.body.estadoPedido).toBe('PAGADO');
      await http
        .get(`/pedidos/invitado/${pedido.id}/seguimiento`)
        .set('X-Pedido-Token', tokenPedido)
        .expect(200);
      expect((await http.get(`/libros/${DUNE}`)).body.ventas).toBe(
        ventasAntes + 1,
      );
    });

    it('un ADMIN repone el stock de prueba antes de la revisión', async () => {
      await http.post('/admin/reiniciar-stock').set(auth()).expect(403);
      const admin = await login('admin@leeconnos.cl');
      const res = await http
        .post('/admin/reiniciar-stock')
        .set({ Authorization: `Bearer ${admin}` })
        .expect(200);
      expect(res.body.librosRepuestos).toBe(75);
      expect((await http.get(`/libros/${FUNDACION}`)).body.stock).toBe(8);
      expect((await http.get(`/libros/${HOBBIT_SIN_STOCK}`)).body.stock).toBe(
        0,
      );
    });
  });
});
