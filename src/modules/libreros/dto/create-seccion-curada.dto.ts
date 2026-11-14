import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/** Recomendar un libro del catálogo con una nota personal. */
export class CreateRecomendacionDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  libroId: string;

  @ApiProperty({
    example: 'Este libro me acompañó en un viaje que cambió mi forma de leer.',
  })
  @IsString()
  @MinLength(5)
  @MaxLength(1000)
  notaPersonal: string;

  @ApiPropertyOptional({ example: 1, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  orden?: number;

  @ApiPropertyOptional({
    default: false,
    description: 'true: se muestra en los recomendados del Home',
  })
  @IsOptional()
  @IsBoolean()
  destacada?: boolean;
}

/** Nombre del Hito 1 para el mismo body. */
export class CreateSeccionCuradaDto extends CreateRecomendacionDto {}

export class CreateColeccionDto {
  @ApiProperty({ example: 'Para cuando todo te parece absurdo' })
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  titulo: string;

  @ApiPropertyOptional({ example: '5 libros para una crisis existencial' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string;

  @ApiPropertyOptional({
    example: '2026-08-24',
    description: 'Por defecto, hoy',
  })
  @IsOptional()
  @IsDateString()
  fecha?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Ids de libros del catálogo',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsUUID('all', { each: true })
  libros?: string[];
}
