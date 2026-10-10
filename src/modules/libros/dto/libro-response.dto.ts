import { ApiProperty } from '@nestjs/swagger';
import { EstadoLibro, FormatoLibro, Libro } from '../entities/libro.entity';

export class LibroResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: '9780553293357' })
  isbn: string;

  @ApiProperty({ example: 'Fundación' })
  titulo: string;

  @ApiProperty({ example: 'Isaac Asimov' })
  autor: string;

  @ApiProperty({ example: 'Ciencia ficción' })
  genero: string;

  @ApiProperty({ nullable: true, type: String })
  sinopsis: string | null;

  @ApiProperty({ nullable: true, type: String })
  editorial: string | null;

  @ApiProperty({ nullable: true, type: Number, example: 1951 })
  anioPublicacion: number | null;

  @ApiProperty({ enum: FormatoLibro })
  formato: FormatoLibro;

  @ApiProperty({ enum: EstadoLibro })
  estado: EstadoLibro;

  @ApiProperty({ example: 12990, description: 'CLP' })
  precio: number;

  @ApiProperty({ example: 5 })
  stock: number;

  @ApiProperty({ description: 'Atajo para la UI: stock mayor que 0' })
  enStock: boolean;

  @ApiProperty({ nullable: true, type: String })
  portadaUrl: string | null;

  @ApiProperty({
    description: 'Fecha de ingreso al catálogo (orden "novedades")',
  })
  fechaIngreso: Date;

  static desde(l: Libro): LibroResponseDto {
    return {
      id: l.id,
      isbn: l.isbn,
      titulo: l.titulo,
      autor: l.autor,
      genero: l.genero,
      sinopsis: l.sinopsis,
      editorial: l.editorial,
      anioPublicacion: l.anioPublicacion,
      formato: l.formato,
      estado: l.estado,
      precio: l.precio,
      stock: l.stock,
      enStock: l.stock > 0,
      portadaUrl: l.portadaUrl,
      fechaIngreso: l.fechaIngreso,
    };
  }
}

export class LibrosPaginadosDto {
  @ApiProperty({ type: [LibroResponseDto] })
  items: LibroResponseDto[];

  @ApiProperty({
    example: 24,
    description: 'Total de libros que cumplen los filtros',
  })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 12 })
  limit: number;

  @ApiProperty({ example: 2 })
  totalPages: number;
}

export class GeneroDto {
  @ApiProperty({ example: 'Ciencia ficción' })
  genero: string;

  @ApiProperty({
    example: 4,
    description: 'Cantidad de libros activos del género',
  })
  cantidad: number;
}
