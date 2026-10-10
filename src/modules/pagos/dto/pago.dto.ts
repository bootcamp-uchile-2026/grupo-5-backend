import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { EstadoPedido } from '../../pedidos/entities/pedido.entity';
import { EstadoPago, MetodoPago, Pago } from '../entities/pago.entity';

export class CrearPagoDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Pedido en estado PENDIENTE_PAGO',
  })
  @IsUUID()
  pedidoId: string;

  @ApiProperty({ enum: MetodoPago })
  @IsEnum(MetodoPago)
  metodo: MetodoPago;

  @ApiProperty({
    example: '4111111111111111',
    description:
      'Tarjeta FICTICIA de 16 dígitos. Termina en 0002: fondos insuficientes · 0005: tarjeta bloqueada · ' +
      '0009: pasarela caída · cualquier otra: aprobada.',
  })
  @Matches(/^\d{16}$/, {
    message: 'numeroTarjeta debe tener exactamente 16 dígitos',
  })
  numeroTarjeta: string;

  @ApiProperty({ example: 'CAMILA ROJAS' })
  @IsString()
  @MinLength(3)
  @MaxLength(60)
  titular: string;

  @ApiProperty({
    example: '12/30',
    description: 'MM/AA. Una fecha pasada se rechaza por tarjeta vencida.',
  })
  @Matches(/^(0[1-9]|1[0-2])\/\d{2}$/, {
    message: 'vencimiento debe tener el formato MM/AA',
  })
  vencimiento: string;

  @ApiProperty({ example: '123' })
  @Matches(/^\d{3,4}$/, { message: 'cvv debe tener 3 o 4 dígitos' })
  cvv: string;
}

export class PagoResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  pedidoId: string;

  @ApiProperty({ enum: EstadoPago })
  estado: EstadoPago;

  @ApiProperty({ example: 28970 })
  monto: number;

  @ApiProperty({ enum: MetodoPago })
  metodo: MetodoPago;

  @ApiProperty({
    example: '1111',
    description: 'Últimos 4 dígitos de la tarjeta',
  })
  ultimos4: string;

  @ApiProperty({ nullable: true, type: String, example: 'AUT-7F3K9Q' })
  codigoAutorizacion: string | null;

  @ApiProperty({
    nullable: true,
    type: String,
    example: 'FONDOS_INSUFICIENTES',
  })
  motivoRechazo: string | null;

  @ApiProperty()
  creadoEn: Date;

  static desde(p: Pago): PagoResponseDto {
    return {
      id: p.id,
      pedidoId: p.pedidoId,
      estado: p.estado,
      monto: p.monto,
      metodo: p.metodo,
      ultimos4: p.ultimos4,
      codigoAutorizacion: p.codigoAutorizacion,
      motivoRechazo: p.motivoRechazo,
      creadoEn: p.creadoEn,
    };
  }
}

export class PagoAprobadoDto extends PagoResponseDto {
  @ApiProperty({ enum: EstadoPedido, example: EstadoPedido.PAGADO })
  estadoPedido: EstadoPedido;

  @ApiProperty({
    example: 'SEG-000123',
    description: 'Código para consultar el seguimiento',
  })
  codigoSeguimiento: string;
}
