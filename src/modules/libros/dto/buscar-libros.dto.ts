import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { EstadoLibro, FormatoLibro } from '../entities/libro.entity';

export enum OrdenLibros {
  NOVEDADES = 'novedades',
  PRECIO_ASC = 'precio_asc',
  PRECIO_DESC = 'precio_desc',
  TITULO = 'titulo',
}

/** Parámetros de búsqueda, filtros, orden y paginación del catálogo. */
export class BuscarLibrosDto {
  @ApiPropertyOptional({
    example: 'asimov',
    description: 'Texto libre: busca en título, autor e ISBN',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  q?: string;

  @ApiPropertyOptional({
    example: 'Ciencia ficción',
    description: 'Género exacto (sin distinguir mayúsculas)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  genero?: string;

  @ApiPropertyOptional({
    example: 'Allende',
    description: 'Coincidencia parcial en el autor',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  autor?: string;

  @ApiPropertyOptional({ enum: FormatoLibro })
  @IsOptional()
  @IsEnum(FormatoLibro)
  formato?: FormatoLibro;

  @ApiPropertyOptional({ enum: EstadoLibro })
  @IsOptional()
  @IsEnum(EstadoLibro)
  estado?: EstadoLibro;

  @ApiPropertyOptional({ example: 5000, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  precioMin?: number;

  @ApiPropertyOptional({ example: 20000, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  precioMax?: number;

  @ApiPropertyOptional({
    description: 'true: solo libros con stock mayor que 0',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean()
  enStock?: boolean;

  @ApiPropertyOptional({ enum: OrdenLibros, default: OrdenLibros.NOVEDADES })
  @IsOptional()
  @IsEnum(OrdenLibros)
  orden?: OrdenLibros = OrdenLibros.NOVEDADES;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 12, minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 12;
}
