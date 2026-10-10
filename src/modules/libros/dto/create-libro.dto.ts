import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsISBN,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { EstadoLibro, FormatoLibro } from '../entities/libro.entity';

/** Deja el ISBN solo con dígitos (y X final), sin guiones ni espacios. */
export const normalizarIsbn = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.replace(/[-\s]/g, '').toUpperCase() : value;

export class CreateLibroDto {
  @ApiProperty({
    example: '9780553293357',
    description: 'ISBN-10 o ISBN-13 válido; debe ser único',
  })
  @Transform(normalizarIsbn)
  @IsISBN()
  isbn: string;

  @ApiProperty({ example: 'Fundación' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  titulo: string;

  @ApiProperty({ example: 'Isaac Asimov' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  autor: string;

  @ApiProperty({ example: 'Ciencia ficción' })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  genero: string;

  @ApiPropertyOptional({
    example: 'El primer libro de la saga de la Fundación.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  sinopsis?: string;

  @ApiPropertyOptional({ example: 'Debolsillo' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  editorial?: string;

  @ApiPropertyOptional({ example: 1951 })
  @IsOptional()
  @IsInt()
  @Min(1400)
  @Max(2100)
  anioPublicacion?: number;

  @ApiPropertyOptional({ enum: FormatoLibro, default: FormatoLibro.FISICO })
  @IsOptional()
  @IsEnum(FormatoLibro)
  formato?: FormatoLibro;

  @ApiPropertyOptional({ enum: EstadoLibro, default: EstadoLibro.DISPONIBLE })
  @IsOptional()
  @IsEnum(EstadoLibro)
  estado?: EstadoLibro;

  @ApiProperty({
    example: 12990,
    description: 'Precio en CLP, entero mayor que 0',
  })
  @IsInt()
  @Min(1)
  precio: number;

  @ApiProperty({ example: 5, minimum: 0 })
  @IsInt()
  @Min(0)
  stock: number;

  @ApiPropertyOptional({
    example: 'https://covers.openlibrary.org/b/isbn/9780553293357-L.jpg',
  })
  @IsOptional()
  @IsUrl()
  portadaUrl?: string;
}
