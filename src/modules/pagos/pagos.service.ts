import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'node:crypto';
import { DataSource, Repository } from 'typeorm';
import {
  EstadoPedidoInvalidoException,
  PagoRechazadoException,
  ServicioExternoException,
} from '../../common/exceptions/app.exceptions';
import { UsuarioAutenticado } from '../auth/decorators/current-user.decorator';
import { EstadoPedido, Pedido } from '../pedidos/entities/pedido.entity';
import { PedidosService } from '../pedidos/pedidos.service';
import { CrearPagoDto, PagoAprobadoDto, PagoResponseDto } from './dto/pago.dto';
import { EstadoPago, Pago } from './entities/pago.entity';

const RECHAZOS: Record<string, [motivo: string, descripcion: string]> = {
  '0002': [
    'FONDOS_INSUFICIENTES',
    'Pago rechazado: la tarjeta no tiene fondos suficientes',
  ],
  '0005': [
    'TARJETA_BLOQUEADA',
    'Pago rechazado: la tarjeta está bloqueada por el emisor',
  ],
};
const TERMINACION_PASARELA_CAIDA = '0009';

/**
 * Pasarela de pago DUMMY: no se conecta a ningún proveedor ni mueve dinero.
 * La respuesta depende solo de los datos de la tarjeta ficticia:
 *
 *  - termina en 0002           -> 402 PAGO_RECHAZADO (FONDOS_INSUFICIENTES)
 *  - termina en 0005           -> 402 PAGO_RECHAZADO (TARJETA_BLOQUEADA)
 *  - vencimiento ya pasado     -> 402 PAGO_RECHAZADO (TARJETA_VENCIDA)
 *  - termina en 0009           -> 502 PASARELA_NO_DISPONIBLE (no queda registro del intento)
 *  - cualquier otra            -> 201 APROBADO, el pedido pasa a PAGADO
 *
 * Los intentos (aprobados y rechazados) sí se guardan en PostgreSQL, porque
 * de ellos depende el estado real del pedido.
 */
@Injectable()
export class PagosService {
  constructor(
    @InjectRepository(Pago) private readonly repo: Repository<Pago>,
    private readonly dataSource: DataSource,
    private readonly pedidos: PedidosService,
  ) {}

  async pagar(
    dto: CrearPagoDto,
    usuario: UsuarioAutenticado,
  ): Promise<PagoAprobadoDto> {
    const pedido = await this.pedidos.obtener(dto.pedidoId, usuario);
    if (pedido.estado !== EstadoPedido.PENDIENTE_PAGO) {
      throw new EstadoPedidoInvalidoException('pagar', pedido.estado);
    }

    const ultimos4 = dto.numeroTarjeta.slice(-4);
    if (ultimos4 === TERMINACION_PASARELA_CAIDA) {
      throw new ServicioExternoException(
        'PASARELA_NO_DISPONIBLE',
        'La pasarela de pago no respondió. Intenta nuevamente en unos minutos.',
      );
    }

    const rechazo = this.evaluarRechazo(dto, ultimos4);
    const intento = {
      pedidoId: pedido.id,
      monto: pedido.total,
      metodo: dto.metodo,
      ultimos4,
    };

    if (rechazo) {
      await this.repo.save(
        this.repo.create({
          ...intento,
          estado: EstadoPago.RECHAZADO,
          motivoRechazo: rechazo[0],
          codigoAutorizacion: null,
        }),
      );
      throw new PagoRechazadoException(rechazo[0], rechazo[1]);
    }

    const codigoSeguimiento = `SEG-${String(pedido.numero).padStart(6, '0')}`;
    const pago = await this.dataSource.transaction(async (tx) => {
      // El WHERE por estado garantiza que un pedido no se cobre dos veces.
      const { affected } = await tx.update(
        Pedido,
        { id: pedido.id, estado: EstadoPedido.PENDIENTE_PAGO },
        {
          estado: EstadoPedido.PAGADO,
          pagadoEn: new Date(),
          codigoSeguimiento,
        },
      );
      if (!affected)
        throw new EstadoPedidoInvalidoException('pagar', 'PAGADO o CANCELADO');
      return tx.save(
        tx.create(Pago, {
          ...intento,
          estado: EstadoPago.APROBADO,
          codigoAutorizacion: `AUT-${randomBytes(3).toString('hex').toUpperCase()}`,
          motivoRechazo: null,
        }),
      );
    });

    return {
      ...PagoResponseDto.desde(pago),
      estadoPedido: EstadoPedido.PAGADO,
      codigoSeguimiento,
    };
  }

  async listarPorPedido(
    pedidoId: string,
    usuario: UsuarioAutenticado,
  ): Promise<Pago[]> {
    await this.pedidos.obtener(pedidoId, usuario);
    return this.repo.find({ where: { pedidoId }, order: { creadoEn: 'ASC' } });
  }

  private evaluarRechazo(
    dto: CrearPagoDto,
    ultimos4: string,
  ): [string, string] | undefined {
    if (RECHAZOS[ultimos4]) return RECHAZOS[ultimos4];

    const [mes, anio] = dto.vencimiento.split('/').map(Number);
    // La tarjeta es válida hasta el último día del mes indicado.
    const finDeVigencia = new Date(2000 + anio, mes, 1);
    if (finDeVigencia <= new Date())
      return ['TARJETA_VENCIDA', 'Pago rechazado: la tarjeta está vencida'];
    return undefined;
  }
}
