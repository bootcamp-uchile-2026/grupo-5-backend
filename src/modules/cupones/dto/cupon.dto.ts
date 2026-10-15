import {
  ApiProperty,
  ApiPropertyOptional,
  PartialType,
  OmitType,
} from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { Cupon, TipoCupon } from '../entities/cupon.entity';

/** Los códigos se comparan en mayúsculas y sin espacios. */
export const normalizarCodigo = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toUpperCase() : value;

export class ValidarCuponDto {
  @ApiProperty({ example: 'BIENVENIDA10' })
  @Transform(normalizarCodigo)
  @Matches(/^[A-Z0-9_-]{3,30}$/, { message: 'codigo inválido' })
  codigo: string;

  @ApiPropertyOptional({
    example: 25980,
    description:
      'Subtotal de la compra (CLP). Si se omite y hay token, se usa el del carrito del usuario.',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  subtotal?: number;

  @ApiPropertyOptional({
    example: 'invitado@correo.cl',
    description:
      'Compra como invitado: email para revisar los cupones de un solo uso',
  })
  @IsOptional()
  @IsString()
  @MaxLength(254)
  email?: string;
}

export class CuponAplicadoDto {
  @ApiProperty({ example: 'BIENVENIDA10' })
  codigo: string;

  @ApiProperty({ nullable: true, type: String })
  descripcion: string | null;

  @ApiProperty({ enum: TipoCupon })
  tipo: TipoCupon;

  @ApiProperty({ example: 10 })
  valor: number;

  @ApiProperty({ example: 25980 })
  subtotal: number;

  @ApiProperty({ example: 2598, description: 'Descuento en CLP' })
  descuento: number;

  @ApiProperty({
    example: 23382,
    description: 'Subtotal menos descuento (sin envío)',
  })
  subtotalConDescuento: number;
}

export class CrearCuponDto {
  @ApiProperty({ example: 'NAVIDAD15' })
  @Transform(normalizarCodigo)
  @Matches(/^[A-Z0-9_-]{3,30}$/, {
    message: 'codigo: 3 a 30 letras, números, guion o guion bajo',
  })
  codigo: string;

  @ApiPropertyOptional({ example: '15% en toda la tienda' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  descripcion?: string;

  @ApiProperty({ enum: TipoCupon })
  @IsEnum(TipoCupon)
  tipo: TipoCupon;

  @ApiProperty({
    example: 15,
    description: 'Porcentaje (1-100) o monto en CLP',
  })
  @IsInt()
  @Min(1)
  valor: number;

  @ApiPropertyOptional({ example: 20000, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  montoMinimo?: number;

  @ApiPropertyOptional({ example: 100, description: 'Sin enviar = ilimitado' })
  @IsOptional()
  @IsInt()
  @Min(0)
  usosMaximos?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  unUsoPorUsuario?: boolean;

  @ApiPropertyOptional({ example: '2026-12-01T00:00:00-03:00' })
  @IsOptional()
  @IsDateString()
  vigenteDesde?: string;

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59-03:00' })
  @IsOptional()
  @IsDateString()
  vigenteHasta?: string;
}

export class ActualizarCuponDto extends PartialType(
  OmitType(CrearCuponDto, ['codigo', 'tipo'] as const),
) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class CuponResponseDto {
  @ApiProperty() codigo: string;
  @ApiProperty({ nullable: true, type: String }) descripcion: string | null;
  @ApiProperty({ enum: TipoCupon }) tipo: TipoCupon;
  @ApiProperty() valor: number;
  @ApiProperty() montoMinimo: number;
  @ApiProperty({ nullable: true, type: Number }) usosMaximos: number | null;
  @ApiProperty() usos: number;
  @ApiProperty() unUsoPorUsuario: boolean;
  @ApiProperty() vigenteDesde: Date;
  @ApiProperty({ nullable: true, type: Date }) vigenteHasta: Date | null;
  @ApiProperty() activo: boolean;

  static desde(c: Cupon): CuponResponseDto {
    return { ...c };
  }
}
