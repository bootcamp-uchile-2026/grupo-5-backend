import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
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
  MAS_VENDIDOS = 'mas_vendidos',
  MEJOR_CALIFICADOS = 'mejor_calificados',
  MAS_COMENTADOS = 'mas_comentados',
  MAYOR_DESCUENTO = 'mayor_descuento',
}

/** Acepta ?x=a,b y también ?x=a&x=b; siempre entrega un arreglo sin vacíos. */
const lista = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null || value === '') return undefined;
  const valores = (Array.isArray(value) ? value : [value]) as unknown[];
  return valores
    .flatMap((v) => (typeof v === 'string' ? v.split(',') : [v]))
    .map((v) => (typeof v === 'string' ? v.trim() : v))
    .filter((v) => v !== '');
};

const booleano = ({ value }: { value: unknown }) =>
  value === 'true' ? true : value === 'false' ? false : value;

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
    description:
      'Género de la API o categoría del menú de UX, exacto y sin distinguir mayúsculas ' +
      '(p. ej. "Policial", "Romance" o "Misterio y thriller")',
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

  @ApiPropertyOptional({
    type: [String],
    example: 'Isabel Allende,Julio Cortázar',
    description:
      'Varios autores a la vez (coincidencia parcial con cualquiera). Separados por coma o repitiendo el parámetro.',
  })
  @IsOptional()
  @Transform(lista)
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(120, { each: true })
  autores?: string[];

  @ApiPropertyOptional({
    example: 'Anagrama',
    description: 'Coincidencia parcial en la editorial',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  editorial?: string;

  @ApiPropertyOptional({
    example: 'Novela negra',
    description: 'Subgénero exacto (sin distinguir mayúsculas)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  subgenero?: string;

  @ApiPropertyOptional({
    example: 'Clásicos',
    description:
      'Categoría o temática del menú de UX (GET /libros/categorias), exacta',
  })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  categoria?: string;

  @ApiPropertyOptional({
    type: [String],
    example: 'Clásico,Chile',
    description: 'Libros que tengan todas estas etiquetas',
  })
  @IsOptional()
  @Transform(lista)
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  etiquetas?: string[];

  @ApiPropertyOptional({
    description: 'true: solo libros en oferta (con precio anterior)',
  })
  @IsOptional()
  @Transform(booleano)
  @IsBoolean()
  enOferta?: boolean;

  @ApiPropertyOptional({ example: 4, minimum: 0, maximum: 5 })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  @Max(5)
  calificacionMin?: number;

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
  @Transform(booleano)
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
