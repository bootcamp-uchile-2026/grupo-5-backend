import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsInt,
  IsISBN,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { normalizarIsbn } from './create-libro.dto';

export class ImportarIsbnDto {
  @ApiProperty({
    example: '9780140328721',
    description: 'ISBN a consultar en Open Library',
  })
  @Transform(normalizarIsbn)
  @IsISBN()
  isbn: string;

  @ApiProperty({
    example: 9990,
    description: 'Open Library no entrega precio: lo define la librería',
  })
  @IsInt()
  @Min(1)
  precio: number;

  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(0)
  stock: number;

  @ApiPropertyOptional({
    example: 'Infantil',
    description: 'Si se omite se usa el primer tema de Open Library',
  })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  genero?: string;
}
