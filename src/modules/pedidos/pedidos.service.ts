import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import {
  CarritoVacioException,
  EstadoPedidoInvalidoException,
  PedidoNoEncontradoException,
  PermisoDenegadoException,
  StockInsuficienteException,
  TokenPedidoInvalidoException,
} from '../../common/exceptions/app.exceptions';
import { UsuarioAutenticado } from '../auth/decorators/current-user.decorator';
import { CarritoItem } from '../carrito/entities/carrito-item.entity';
import { CuponesService } from '../cupones/cupones.service';
import { MetodoEnvio } from '../envios/dto/envio.dto';
import { EnviosService } from '../envios/envios.service';
import { Libro } from '../libros/entities/libro.entity';
import { MailService } from '../mail/mail.service';
import { Rol } from '../usuarios/entities/usuario.entity';
import {
  CreatePedidoDto,
  CrearPedidoInvitadoDto,
} from './dto/create-pedido.dto';
import { numeroPedido } from './dto/pedido-response.dto';
import { EstadoPedido, Pedido, PedidoItem } from './entities/pedido.entity';

const TIPO_TOKEN_PEDIDO = 'pedido-invitado';
const VIGENCIA_TOKEN_PEDIDO = '30d';

interface Linea {
  libroId: string;
  cantidad: number;
}

/** Dueño del pedido: un usuario con cuenta o un invitado. */
type Dueno =
  | { usuarioId: string; email: string }
  | { invitadoEmail: string; invitadoNombre: string };

interface TokenPedidoPayload {
  sub: string;
  email: string;
  typ: string;
}

@Injectable()
export class PedidosService {
  constructor(
    @InjectRepository(Pedido) private readonly repo: Repository<Pedido>,
    private readonly dataSource: DataSource,
    private readonly envios: EnviosService,
    private readonly cupones: CuponesService,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
  ) {}

  /** Checkout de un usuario con cuenta: convierte su carrito en un pedido. */
  async crear(
    usuario: UsuarioAutenticado | string,
    dto: CreatePedidoDto,
  ): Promise<Pedido> {
    const { id: usuarioId, email } =
      typeof usuario === 'string' ? { id: usuario, email: '' } : usuario;
    const id = await this.dataSource.transaction(async (tx) => {
      const carrito = await tx.find(CarritoItem, { where: { usuarioId } });
      if (!carrito.length) throw new CarritoVacioException();
      const pedidoId = await this.registrar(
        tx,
        { usuarioId, email },
        carrito,
        dto,
      );
      await tx.delete(CarritoItem, { usuarioId });
      return pedidoId;
    });
    return this.buscar(id);
  }

  /**
   * Compra como invitado: los libros vienen en el body. Devuelve el pedido y un
   * token firmado que reemplaza a la sesión para pagarlo y consultarlo.
   */
  async crearInvitado(
    dto: CrearPedidoInvitadoDto,
  ): Promise<{ pedido: Pedido; tokenPedido: string }> {
    // Si el mismo libro viene repetido, se suman las cantidades.
    const lineas = new Map<string, number>();
    for (const item of dto.items)
      lineas.set(item.libroId, (lineas.get(item.libroId) ?? 0) + item.cantidad);

    const id = await this.dataSource.transaction((tx) =>
      this.registrar(
        tx,
        { invitadoEmail: dto.email, invitadoNombre: dto.nombre.trim() },
        [...lineas].map(([libroId, cantidad]) => ({ libroId, cantidad })),
        dto,
      ),
    );
    const pedido = await this.buscar(id);
    const tokenPedido = await this.jwt.signAsync(
      { sub: pedido.id, email: dto.email, typ: TIPO_TOKEN_PEDIDO },
      { expiresIn: VIGENCIA_TOKEN_PEDIDO },
    );
    await this.mail.enviar({
      para: dto.email,
      asunto: `Recibimos tu pedido ${numeroPedido(pedido.numero)}`,
      texto: `Hola ${dto.nombre}, tu pedido quedó pendiente de pago por $${pedido.total.toLocaleString('es-CL')}.`,
      enlace: this.mail.enlaceFront(
        `/pedido-invitado?id=${pedido.id}&token=${tokenPedido}`,
      ),
    });
    return { pedido, tokenPedido };
  }

  listar(usuarioId: string): Promise<Pedido[]> {
    return this.repo.find({
      where: { usuarioId },
      relations: { items: true },
      order: { creadoEn: 'DESC' },
    });
  }

  /** Devuelve el pedido solo si pertenece al usuario (o si es ADMIN). */
  async obtener(id: string, usuario: UsuarioAutenticado): Promise<Pedido> {
    const pedido = await this.buscar(id);
    if (usuario.rol !== Rol.ADMIN && pedido.usuarioId !== usuario.id) {
      throw new PermisoDenegadoException('El pedido pertenece a otro usuario');
    }
    return pedido;
  }

  /** Pedido de invitado: exige el token entregado al crearlo. */
  async obtenerInvitado(id: string, token?: string): Promise<Pedido> {
    let payload: TokenPedidoPayload;
    try {
      payload = await this.jwt.verifyAsync<TokenPedidoPayload>(token ?? '');
    } catch {
      throw new TokenPedidoInvalidoException();
    }
    if (payload.typ !== TIPO_TOKEN_PEDIDO || payload.sub !== id)
      throw new TokenPedidoInvalidoException();
    return this.buscar(id);
  }

  /** Solo se puede cancelar antes de pagar; el stock reservado vuelve al catálogo. */
  async cancelar(id: string, usuario: UsuarioAutenticado): Promise<Pedido> {
    return this.cancelarPedido(await this.obtener(id, usuario));
  }

  async cancelarInvitado(id: string, token?: string): Promise<Pedido> {
    return this.cancelarPedido(await this.obtenerInvitado(id, token));
  }

  /** Ids de los libros que el usuario ya compró (pedidos pagados). */
  async librosComprados(usuarioId: string): Promise<string[]> {
    const pedidos = await this.repo.find({
      where: { usuarioId, estado: EstadoPedido.PAGADO },
      relations: { items: true },
    });
    return [...new Set(pedidos.flatMap((p) => p.items.map((i) => i.libroId)))];
  }

  /**
   * Todo ocurre en la transacción del llamador: se bloquean los libros, se
   * valida y descuenta el stock, se aplica el cupón y se crea el pedido con
   * una foto de los precios. Si algo falla, nada queda a medias.
   */
  private async registrar(
    tx: EntityManager,
    dueno: Dueno,
    lineas: Linea[],
    dto: CreatePedidoDto,
  ): Promise<string> {
    if (!lineas.length) throw new CarritoVacioException();
    // Se bloquean siempre en el mismo orden para evitar deadlocks entre checkouts simultáneos.
    const libros = await tx
      .createQueryBuilder(Libro, 'l')
      .setLock('pessimistic_write')
      .where('l.id IN (:...ids)', { ids: lineas.map((c) => c.libroId) })
      .orderBy('l.id', 'ASC')
      .getMany();
    const porId = new Map(libros.map((l) => [l.id, l]));

    const sinStock: string[] = [];
    const items: Partial<PedidoItem>[] = [];
    for (const linea of lineas) {
      const libro = porId.get(linea.libroId);
      if (!libro?.activo) {
        sinStock.push(
          `El libro "${libro?.titulo ?? linea.libroId}" ya no está disponible`,
        );
      } else if (libro.stock < linea.cantidad) {
        sinStock.push(
          `"${libro.titulo}": solicitado ${linea.cantidad}, disponible ${libro.stock}`,
        );
      } else {
        items.push({
          libroId: libro.id,
          titulo: libro.titulo,
          precioUnitario: libro.precio,
          cantidad: linea.cantidad,
          subtotal: libro.precio * linea.cantidad,
        });
      }
    }
    if (sinStock.length) throw new StockInsuficienteException(sinStock);

    const subtotal = items.reduce((suma, i) => suma + (i.subtotal ?? 0), 0);
    const cupon = dto.codigoDescuento
      ? await this.cupones.aplicar(tx, dto.codigoDescuento, subtotal, {
          usuarioId: 'usuarioId' in dueno ? dueno.usuarioId : null,
          email: 'usuarioId' in dueno ? dueno.email : dueno.invitadoEmail,
        })
      : null;
    const descuento = cupon?.descuento ?? 0;

    const esDespacho = dto.metodoEnvio === MetodoEnvio.DESPACHO;
    const direccion = esDespacho ? dto.direccion : undefined;
    // El despacho gratis se calcula sobre lo que realmente se paga por los libros.
    const envio = this.envios.cotizar({
      metodoEnvio: dto.metodoEnvio,
      region: direccion?.region,
      comuna: direccion?.comuna,
      subtotal: subtotal - descuento,
    });

    const pedido = await tx.save(
      tx.create(Pedido, {
        usuarioId: 'usuarioId' in dueno ? dueno.usuarioId : null,
        invitadoEmail: 'invitadoEmail' in dueno ? dueno.invitadoEmail : null,
        invitadoNombre: 'invitadoNombre' in dueno ? dueno.invitadoNombre : null,
        estado: EstadoPedido.PENDIENTE_PAGO,
        metodoEnvio: dto.metodoEnvio,
        subtotal,
        descuento,
        codigoDescuento: cupon?.codigo ?? null,
        costoEnvio: envio.costo,
        total: subtotal - descuento + envio.costo,
        diasEstimados: envio.diasEstimados,
        dirReceptor: direccion?.nombreReceptor ?? null,
        dirCalle: direccion?.calle ?? null,
        dirComuna: direccion?.comuna ?? null,
        dirRegion: direccion?.region ?? null,
        dirTelefono: direccion?.telefono ?? null,
        items: items as PedidoItem[],
      }),
    );

    for (const item of items) {
      await tx.decrement(
        Libro,
        { id: item.libroId },
        'stock',
        item.cantidad as number,
      );
    }
    return pedido.id;
  }

  private async cancelarPedido(pedido: Pedido): Promise<Pedido> {
    await this.dataSource.transaction(async (tx) => {
      // El WHERE por estado evita cancelar dos veces (o cancelar algo que se acaba de pagar).
      const { affected } = await tx.update(
        Pedido,
        { id: pedido.id, estado: EstadoPedido.PENDIENTE_PAGO },
        { estado: EstadoPedido.CANCELADO, canceladoEn: new Date() },
      );
      if (!affected)
        throw new EstadoPedidoInvalidoException(
          'cancelar',
          (await this.buscar(pedido.id)).estado,
        );
      for (const item of pedido.items) {
        await tx.increment(Libro, { id: item.libroId }, 'stock', item.cantidad);
      }
      if (pedido.codigoDescuento)
        await this.cupones.liberar(tx, pedido.codigoDescuento);
    });
    return this.buscar(pedido.id);
  }

  private async buscar(id: string): Promise<Pedido> {
    const pedido = await this.repo.findOne({
      where: { id },
      relations: { items: true },
    });
    if (!pedido) throw new PedidoNoEncontradoException(id);
    return pedido;
  }
}
