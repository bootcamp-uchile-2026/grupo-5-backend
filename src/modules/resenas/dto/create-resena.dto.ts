import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/** Body de POST /libros/:id/resenas. El autor sale del token. */
export class CrearResenaDto {
  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  calificacion: number;

  @ApiPropertyOptional({ example: 'Un clásico que no envejece' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  titulo?: string;

  @ApiProperty({
    example: 'Una recomendación perfecta, tal como me la describió el librero.',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  comentario: string;
}

/**
 * Body de POST /resenas (ruta del Hito 1). El libro va en el body; usuarioId se
 * acepta por compatibilidad pero se ignora: el autor siempre es el del token.
 */
export class CreateResenaDto extends CrearResenaDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  libroId: string;

  @ApiPropertyOptional({
    deprecated: true,
    description: 'Ignorado: el autor es el usuario del token',
  })
  @IsOptional()
  @IsString()
  usuarioId?: string;
}
