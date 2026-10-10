import { ApiProperty } from '@nestjs/swagger';
import { MetodoEnvio } from '../../envios/dto/envio.dto';
import { EstadoPedido, Pedido } from '../entities/pedido.entity';
import { DireccionDto } from './create-pedido.dto';

export const numeroPedido = (numero: number) =>
  `LCN-${String(numero).padStart(6, '0')}`;

export class PedidoItemResponseDto {
  @ApiProperty({ format: 'uuid' })
  libroId: string;

  @ApiProperty({ example: 'Fundación' })
  titulo: string;

  @ApiProperty({
    example: 12990,
    description: 'Precio al momento de la compra (CLP)',
  })
  precioUnitario: number;

  @ApiProperty({ example: 2 })
  cantidad: number;

  @ApiProperty({ example: 25980 })
  subtotal: number;
}

export class PedidoResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({
    example: 'LCN-000123',
    description: 'Número legible para mostrar al cliente',
  })
  numero: string;

  @ApiProperty({ enum: EstadoPedido })
  estado: EstadoPedido;

  @ApiProperty({ enum: MetodoEnvio })
  metodoEnvio: MetodoEnvio;

  @ApiProperty({ type: [PedidoItemResponseDto] })
  items: PedidoItemResponseDto[];

  @ApiProperty({ example: 25980 })
  subtotal: number;

  @ApiProperty({ example: 2990 })
  costoEnvio: number;

  @ApiProperty({ example: 28970 })
  total: number;

  @ApiProperty({ example: 2, description: 'Días hábiles estimados de entrega' })
  diasEstimados: number;

  @ApiProperty({
    type: DireccionDto,
    nullable: true,
    description: 'null cuando el método es RETIRO',
  })
  direccion: DireccionDto | null;

  @ApiProperty({
    nullable: true,
    type: String,
    example: 'SEG-000123',
    description: 'Se asigna al pagar',
  })
  codigoSeguimiento: string | null;

  @ApiProperty()
  creadoEn: Date;

  @ApiProperty({ nullable: true, type: Date })
  pagadoEn: Date | null;

  @ApiProperty({ nullable: true, type: Date })
  canceladoEn: Date | null;

  static desde(p: Pedido): PedidoResponseDto {
    return {
      id: p.id,
      numero: numeroPedido(p.numero),
      estado: p.estado,
      metodoEnvio: p.metodoEnvio,
      items: (p.items ?? []).map((i) => ({
        libroId: i.libroId,
        titulo: i.titulo,
        precioUnitario: i.precioUnitario,
        cantidad: i.cantidad,
        subtotal: i.subtotal,
      })),
      subtotal: p.subtotal,
      costoEnvio: p.costoEnvio,
      total: p.total,
      diasEstimados: p.diasEstimados,
      direccion: p.dirCalle
        ? ({
            nombreReceptor: p.dirReceptor,
            calle: p.dirCalle,
            comuna: p.dirComuna,
            region: p.dirRegion,
            telefono: p.dirTelefono,
          } as DireccionDto)
        : null,
      codigoSeguimiento: p.codigoSeguimiento,
      creadoEn: p.creadoEn,
      pagadoEn: p.pagadoEn,
      canceladoEn: p.canceladoEn,
    };
  }
}
