import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Estructura única de error que devuelve toda la API. */
export class ErrorResponseDto {
  @ApiProperty({ example: 409 })
  statusCode: number;

  @ApiProperty({
    example: 'STOCK_INSUFICIENTE',
    description: 'Código estable del error',
  })
  error: string;

  @ApiProperty({ example: 'No hay stock suficiente para uno o más libros' })
  message: string;

  @ApiPropertyOptional({
    type: [String],
    description:
      'Detalle por campo o por ítem (validaciones, stock, motivo de rechazo)',
  })
  detalles?: string[];

  @ApiProperty({ example: '2026-10-03T14:21:09.120Z' })
  timestamp: string;

  @ApiProperty({ example: '/pedidos' })
  path: string;

  @ApiProperty({
    example: 'b0f6f0a2-5f0e-4a36-9d0c-3f7c2b5a8f11',
    description: 'Mismo valor del header x-request-id',
  })
  requestId: string;
}
