import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SeguimientoNoDisponibleException } from '../../common/exceptions/app.exceptions';
import { UsuarioAutenticado } from '../auth/decorators/current-user.decorator';
import { MetodoEnvio } from '../envios/dto/envio.dto';
import { numeroPedido } from '../pedidos/dto/pedido-response.dto';
import { EstadoPedido, Pedido } from '../pedidos/entities/pedido.entity';
import { PedidosService } from '../pedidos/pedidos.service';
import {
  EstadoSeguimiento,
  SeguimientoResponseDto,
} from './dto/seguimiento.dto';

type Hito = [EstadoSeguimiento, string];

const HITOS_DESPACHO: Hito[] = [
  [EstadoSeguimiento.CONFIRMADO, 'Recibimos tu pago y confirmamos el pedido'],
  [EstadoSeguimiento.EN_PREPARACION, 'Estamos preparando tus libros'],
  [EstadoSeguimiento.DESPACHADO, 'Tu pedido salió de nuestra bodega'],
  [EstadoSeguimiento.EN_REPARTO, 'El pedido va camino a tu dirección'],
  [EstadoSeguimiento.ENTREGADO, 'Pedido entregado'],
];
const HITO_FALLIDO: Hito = [
  EstadoSeguimiento.ENTREGA_FALLIDA,
  'No pudimos entregar: la dirección no tiene numeración. Contáctanos para reagendar.',
];
const HITOS_RETIRO: Hito[] = [
  [EstadoSeguimiento.CONFIRMADO, 'Recibimos tu pago y confirmamos el pedido'],
  [EstadoSeguimiento.EN_PREPARACION, 'Estamos preparando tus libros'],
  [
    EstadoSeguimiento.LISTO_PARA_RETIRO,
    'Tu pedido está listo para retiro en la librería',
  ],
];

/**
 * Seguimiento DUMMY: no hay courier real. La línea de tiempo se calcula a
 * partir de la hora de pago, por lo que es reproducible:
 *
 *  - Cada hito se completa SEGUIMIENTO_PASO_SEGUNDOS (60 s por defecto)
 *    después del anterior; el primero (CONFIRMADO) ocurre al pagar.
 *  - DESPACHO: CONFIRMADO > EN_PREPARACION > DESPACHADO > EN_REPARTO > ENTREGADO.
 *  - RETIRO:   CONFIRMADO > EN_PREPARACION > LISTO_PARA_RETIRO.
 *  - Caso de error: si la calle contiene "S/N" o "SIN NUMERO", el último hito
 *    es ENTREGA_FALLIDA en vez de ENTREGADO.
 *  - Pedido PENDIENTE_PAGO -> 409 SEGUIMIENTO_NO_DISPONIBLE.
 *  - Pedido CANCELADO      -> un único evento CANCELADO.
 */
@Injectable()
export class SeguimientoService {
  constructor(
    private readonly pedidos: PedidosService,
    private readonly config: ConfigService,
  ) {}

  async consultar(
    pedidoId: string,
    usuario: UsuarioAutenticado,
  ): Promise<SeguimientoResponseDto> {
    return this.construir(await this.pedidos.obtener(pedidoId, usuario));
  }

  async consultarInvitado(
    pedidoId: string,
    token?: string,
  ): Promise<SeguimientoResponseDto> {
    return this.construir(await this.pedidos.obtenerInvitado(pedidoId, token));
  }

  private construir(pedido: Pedido): SeguimientoResponseDto {
    const base = {
      pedidoId: pedido.id,
      numero: numeroPedido(pedido.numero),
      codigoSeguimiento: pedido.codigoSeguimiento,
      metodoEnvio: pedido.metodoEnvio,
    };

    if (pedido.estado === EstadoPedido.PENDIENTE_PAGO)
      throw new SeguimientoNoDisponibleException(pedido.estado);
    if (pedido.estado === EstadoPedido.CANCELADO) {
      return {
        ...base,
        estadoActual: EstadoSeguimiento.CANCELADO,
        eventos: [
          {
            estado: EstadoSeguimiento.CANCELADO,
            descripcion: 'El pedido fue cancelado',
            fecha: pedido.canceladoEn as Date,
            completado: true,
          },
        ],
      };
    }

    const pasoMs =
      Number(this.config.get('SEGUIMIENTO_PASO_SEGUNDOS', 60)) * 1000;
    const inicio = (pedido.pagadoEn as Date).getTime();
    const ahora = Date.now();
    const eventos = this.hitos(pedido).map(([estado, descripcion], i) => {
      const fecha = new Date(inicio + i * pasoMs);
      return {
        estado,
        descripcion,
        fecha,
        completado: fecha.getTime() <= ahora,
      };
    });
    const estadoActual =
      eventos.filter((e) => e.completado).at(-1)?.estado ??
      EstadoSeguimiento.CONFIRMADO;
    return { ...base, estadoActual, eventos };
  }

  private hitos(pedido: Pedido): Hito[] {
    if (pedido.metodoEnvio === MetodoEnvio.RETIRO) return HITOS_RETIRO;
    const sinNumeracion = /\bS\/N\b|SIN N[UÚ]MERO/i.test(pedido.dirCalle ?? '');
    return sinNumeracion
      ? [...HITOS_DESPACHO.slice(0, -1), HITO_FALLIDO]
      : HITOS_DESPACHO;
  }
}
