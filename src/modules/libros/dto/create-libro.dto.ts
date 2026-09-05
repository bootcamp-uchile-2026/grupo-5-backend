import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateLibroDto {
  @ApiProperty({ example: '9788433979107' })
  @IsString()
  isbn: string;

  @ApiProperty({ example: 'Cien años de soledad' })
  @IsString()
  titulo: string;

  @ApiProperty({ example: 'Gabriel García Márquez' })
  @IsString()
  autor: string;

  @ApiProperty({ example: 'Realismo mágico' })
  @IsString()
  genero: string;

  @ApiPropertyOptional({ example: 'Editorial Sudamericana' })
  @IsOptional()
  @IsString()
  editorial?: string;

  @ApiPropertyOptional({ example: 1967 })
  @IsOptional()
  @IsInt()
  anioPublicacion?: number;

  @ApiPropertyOptional({ example: 'La historia de la familia Buendía...' })
  @IsOptional()
  @IsString()
  sinopsis?: string;

  @ApiPropertyOptional({ example: 'https://covers.openlibrary.org/b/isbn/9788433979107-L.jpg' })
  @IsOptional()
  @IsString()
  portadaUrl?: string;

  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(0)
  stock: number;

  @ApiProperty({ example: 15990 })
  @IsNumber()
  @Min(0)
  precio: number;
}
