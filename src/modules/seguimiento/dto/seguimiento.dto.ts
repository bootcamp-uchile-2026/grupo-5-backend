import { ApiProperty } from '@nestjs/swagger';
import { MetodoEnvio } from '../../envios/dto/envio.dto';

export enum EstadoSeguimiento {
  CONFIRMADO = 'CONFIRMADO',
  EN_PREPARACION = 'EN_PREPARACION',
  DESPACHADO = 'DESPACHADO',
  EN_REPARTO = 'EN_REPARTO',
  ENTREGADO = 'ENTREGADO',
  ENTREGA_FALLIDA = 'ENTREGA_FALLIDA',
  LISTO_PARA_RETIRO = 'LISTO_PARA_RETIRO',
  CANCELADO = 'CANCELADO',
}

export class EventoSeguimientoDto {
  @ApiProperty({ enum: EstadoSeguimiento })
  estado: EstadoSeguimiento;

  @ApiProperty({ example: 'Tu pedido salió de nuestra bodega' })
  descripcion: string;

  @ApiProperty({
    description: 'Momento en que ocurre (o se estima que ocurrirá) el hito',
  })
  fecha: Date;

  @ApiProperty({ description: 'false para los hitos que todavía no ocurren' })
  completado: boolean;
}

export class SeguimientoResponseDto {
  @ApiProperty({ format: 'uuid' })
  pedidoId: string;

  @ApiProperty({ example: 'LCN-000123' })
  numero: string;

  @ApiProperty({ example: 'SEG-000123', nullable: true, type: String })
  codigoSeguimiento: string | null;

  @ApiProperty({ enum: MetodoEnvio })
  metodoEnvio: MetodoEnvio;

  @ApiProperty({
    enum: EstadoSeguimiento,
    description: 'Último hito completado',
  })
  estadoActual: EstadoSeguimiento;

  @ApiProperty({
    type: [EventoSeguimientoDto],
    description: 'Línea de tiempo completa, en orden',
  })
  eventos: EventoSeguimientoDto[];
}
