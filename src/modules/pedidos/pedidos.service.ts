import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  CarritoVacioException,
  EstadoPedidoInvalidoException,
  PedidoNoEncontradoException,
  PermisoDenegadoException,
  StockInsuficienteException,
} from '../../common/exceptions/app.exceptions';
import { UsuarioAutenticado } from '../auth/decorators/current-user.decorator';
import { CarritoItem } from '../carrito/entities/carrito-item.entity';
import { MetodoEnvio } from '../envios/dto/envio.dto';
import { EnviosService } from '../envios/envios.service';
import { Libro } from '../libros/entities/libro.entity';
import { Rol } from '../usuarios/entities/usuario.entity';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { EstadoPedido, Pedido, PedidoItem } from './entities/pedido.entity';

@Injectable()
export class PedidosService {
  constructor(
    @InjectRepository(Pedido) private readonly repo: Repository<Pedido>,
    private readonly dataSource: DataSource,
    private readonly envios: EnviosService,
  ) {}

  /**
   * Checkout. Todo ocurre en una transacción: se bloquean los libros, se
   * valida y descuenta el stock, se crea el pedido con una foto de los
   * precios y se vacía el carrito. Si algo falla, nada queda a medias.
   */
  async crear(usuarioId: string, dto: CreatePedidoDto): Promise<Pedido> {
    const id = await this.dataSource.transaction(async (tx) => {
      const carrito = await tx.find(CarritoItem, { where: { usuarioId } });
      if (!carrito.length) throw new CarritoVacioException();

      // Se bloquean siempre en el mismo orden para evitar deadlocks entre checkouts simultáneos.
      const libros = await tx
        .createQueryBuilder(Libro, 'l')
        .setLock('pessimistic_write')
        .where('l.id IN (:...ids)', { ids: carrito.map((c) => c.libroId) })
        .orderBy('l.id', 'ASC')
        .getMany();
      const porId = new Map(libros.map((l) => [l.id, l]));

      const sinStock: string[] = [];
      const items: Partial<PedidoItem>[] = [];
      for (const linea of carrito) {
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
      const esDespacho = dto.metodoEnvio === MetodoEnvio.DESPACHO;
      const direccion = esDespacho ? dto.direccion : undefined;
      const envio = this.envios.cotizar({
        metodoEnvio: dto.metodoEnvio,
        region: direccion?.region,
        comuna: direccion?.comuna,
        subtotal,
      });

      const pedido = await tx.save(
        tx.create(Pedido, {
          usuarioId,
          estado: EstadoPedido.PENDIENTE_PAGO,
          metodoEnvio: dto.metodoEnvio,
          subtotal,
          costoEnvio: envio.costo,
          total: subtotal + envio.costo,
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
      await tx.delete(CarritoItem, { usuarioId });
      return pedido.id;
    });
    return this.buscar(id);
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

  /** Solo se puede cancelar antes de pagar; el stock reservado vuelve al catálogo. */
  async cancelar(id: string, usuario: UsuarioAutenticado): Promise<Pedido> {
    const pedido = await this.obtener(id, usuario);
    await this.dataSource.transaction(async (tx) => {
      // El WHERE por estado evita cancelar dos veces (o cancelar algo que se acaba de pagar).
      const { affected } = await tx.update(
        Pedido,
        { id, estado: EstadoPedido.PENDIENTE_PAGO },
        { estado: EstadoPedido.CANCELADO, canceladoEn: new Date() },
      );
      if (!affected)
        throw new EstadoPedidoInvalidoException(
          'cancelar',
          (await this.buscar(id)).estado,
        );
      for (const item of pedido.items) {
        await tx.increment(Libro, { id: item.libroId }, 'stock', item.cantidad);
      }
    });
    return this.buscar(id);
  }

  /** Ids de los libros que el usuario ya compró (pedidos pagados). */
  async librosComprados(usuarioId: string): Promise<string[]> {
    const pedidos = await this.repo.find({
      where: { usuarioId, estado: EstadoPedido.PAGADO },
      relations: { items: true },
    });
    return [...new Set(pedidos.flatMap((p) => p.items.map((i) => i.libroId)))];
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
