import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export const CANTIDAD_MAXIMA_POR_LIBRO = 10;

export class AgregarItemDto {
  @ApiProperty({ format: 'uuid', description: 'Libro a agregar' })
  @IsUUID()
  libroId: string;

  @ApiPropertyOptional({
    default: 1,
    minimum: 1,
    maximum: CANTIDAD_MAXIMA_POR_LIBRO,
    description:
      'Unidades a sumar. Si el libro ya está en el carrito, se suman a las existentes.',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(CANTIDAD_MAXIMA_POR_LIBRO)
  cantidad?: number = 1;
}

export class ActualizarItemDto {
  @ApiProperty({
    minimum: 1,
    maximum: CANTIDAD_MAXIMA_POR_LIBRO,
    description: 'Nueva cantidad total del libro',
  })
  @IsInt()
  @Min(1)
  @Max(CANTIDAD_MAXIMA_POR_LIBRO)
  cantidad: number;
}

export class CarritoItemResponseDto {
  @ApiProperty({ format: 'uuid' })
  libroId: string;

  @ApiProperty({ example: 'Fundación' })
  titulo: string;

  @ApiProperty({ example: 'Isaac Asimov' })
  autor: string;

  @ApiProperty({ nullable: true, type: String })
  portadaUrl: string | null;

  @ApiProperty({
    example: 12990,
    description: 'Precio vigente del libro (CLP)',
  })
  precioUnitario: number;

  @ApiProperty({ example: 2 })
  cantidad: number;

  @ApiProperty({ example: 25980 })
  subtotal: number;

  @ApiProperty({ example: 5 })
  stockDisponible: number;

  @ApiProperty({
    description:
      'false si la cantidad supera el stock actual o el libro fue retirado',
  })
  disponible: boolean;
}

export class CarritoResponseDto {
  @ApiProperty({ type: [CarritoItemResponseDto] })
  items: CarritoItemResponseDto[];

  @ApiProperty({ example: 3, description: 'Suma de unidades' })
  totalItems: number;

  @ApiProperty({
    example: 38970,
    description: 'Suma de subtotales (CLP), sin envío',
  })
  subtotal: number;
}
