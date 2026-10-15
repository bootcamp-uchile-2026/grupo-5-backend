import { ApiProperty } from '@nestjs/swagger';
import { EstadoLibro, FormatoLibro, Libro } from '../entities/libro.entity';

/** Datos mínimos de un libro para tarjetas (carruseles, listas, reseñas). */
export class LibroResumenDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Fundación' })
  titulo: string;

  @ApiProperty({ example: 'Isaac Asimov' })
  autor: string;

  @ApiProperty({ example: 'Ciencia ficción' })
  genero: string;

  @ApiProperty({ example: 12990 })
  precio: number;

  @ApiProperty({ nullable: true, type: Number, example: 14990 })
  precioAnterior: number | null;

  @ApiProperty({ nullable: true, type: String })
  portadaUrl: string | null;

  @ApiProperty({ example: 4.5 })
  calificacion: number;

  @ApiProperty({ example: 18 })
  opiniones: number;

  @ApiProperty()
  enStock: boolean;

  static desde(l: Libro): LibroResumenDto {
    return {
      id: l.id,
      titulo: l.titulo,
      autor: l.autor,
      genero: l.genero,
      precio: l.precio,
      precioAnterior: l.precioAnterior ?? null,
      portadaUrl: l.portadaUrl,
      calificacion: Number(l.calificacion ?? 0),
      opiniones: l.opiniones ?? 0,
      enStock: l.activo !== false && l.stock > 0,
    };
  }
}

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

  @ApiProperty({ nullable: true, type: String, example: 'Novela negra' })
  subgenero: string | null;

  @ApiProperty({
    type: [String],
    example: ['Ciencia ficción', 'Clásicos'],
    description: 'Géneros y temáticas del menú de UX a los que pertenece',
  })
  categorias: string[];

  @ApiProperty({ nullable: true, type: String })
  sinopsis: string | null;

  @ApiProperty({
    nullable: true,
    type: String,
    description: 'Igual a sinopsis (nombre que usan Web y Mobile)',
  })
  descripcion: string | null;

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

  @ApiProperty({
    nullable: true,
    type: Number,
    example: 14990,
    description: 'Precio antes del descuento (CLP)',
  })
  precioAnterior: number | null;

  @ApiProperty({
    example: 13,
    description: 'Porcentaje de descuento redondeado; 0 si no está en oferta',
  })
  descuentoPorcentaje: number;

  @ApiProperty({ description: 'true si tiene precio anterior' })
  enOferta: boolean;

  @ApiProperty({ example: 5 })
  stock: number;

  @ApiProperty({ description: 'Atajo para la UI: stock mayor que 0' })
  enStock: boolean;

  @ApiProperty({ nullable: true, type: String })
  portadaUrl: string | null;

  @ApiProperty({ example: 4.5, description: 'Promedio de reseñas (0 a 5)' })
  calificacion: number;

  @ApiProperty({ example: 18, description: 'Cantidad de reseñas' })
  opiniones: number;

  @ApiProperty({ example: 39, description: 'Unidades vendidas' })
  ventas: number;

  @ApiProperty({ nullable: true, type: String, example: 'Tapa blanda' })
  encuadernacion: string | null;

  @ApiProperty({ nullable: true, type: Number, example: 304 })
  paginas: number | null;

  @ApiProperty({ nullable: true, type: String, example: '13 x 19 cm' })
  dimensiones: string | null;

  @ApiProperty({ type: [String], example: ['Ficción', 'Clásico'] })
  etiquetas: string[];

  @ApiProperty({ nullable: true, type: String })
  videoUrl: string | null;

  @ApiProperty({ type: [String], description: 'Imágenes adicionales' })
  galeria: string[];

  @ApiProperty({
    description: 'Fecha de ingreso al catálogo (orden "novedades")',
  })
  fechaIngreso: Date;

  static desde(l: Libro): LibroResponseDto {
    const precioAnterior = l.precioAnterior ?? null;
    return {
      id: l.id,
      isbn: l.isbn,
      titulo: l.titulo,
      autor: l.autor,
      genero: l.genero,
      subgenero: l.subgenero ?? null,
      categorias: l.categorias ?? [],
      sinopsis: l.sinopsis,
      descripcion: l.sinopsis,
      editorial: l.editorial,
      anioPublicacion: l.anioPublicacion,
      formato: l.formato,
      estado: l.estado,
      precio: l.precio,
      precioAnterior,
      descuentoPorcentaje: precioAnterior
        ? Math.round((1 - l.precio / precioAnterior) * 100)
        : 0,
      enOferta: precioAnterior !== null,
      stock: l.stock,
      enStock: l.stock > 0,
      portadaUrl: l.portadaUrl,
      calificacion: Number(l.calificacion ?? 0),
      opiniones: l.opiniones ?? 0,
      ventas: l.ventas ?? 0,
      encuadernacion: l.encuadernacion ?? null,
      paginas: l.paginas ?? null,
      dimensiones: l.dimensiones ?? null,
      etiquetas: l.etiquetas ?? [],
      videoUrl: l.videoUrl ?? null,
      galeria: l.galeria ?? [],
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

export class CategoriaDto {
  @ApiProperty({ example: 'Misterio y thriller' })
  nombre: string;

  @ApiProperty({
    example: 4,
    description:
      'Libros activos de la categoría; 0 = "Aún no hay libros en este género"',
  })
  cantidad: number;
}

export class GrupoCategoriasDto {
  @ApiProperty({ example: 'Ficción' })
  grupo: string;

  @ApiProperty({ enum: ['GENERO', 'TEMATICA'] })
  tipo: 'GENERO' | 'TEMATICA';

  @ApiProperty({ type: [CategoriaDto] })
  categorias: CategoriaDto[];
}

export class ValorConteoDto {
  @ApiProperty({ example: 'Anagrama' })
  valor: string;

  @ApiProperty({ example: 3 })
  cantidad: number;
}

/** Opciones para armar el panel de filtros con lo que realmente hay en el catálogo. */
export class FiltrosDisponiblesDto {
  @ApiProperty({ type: [ValorConteoDto] })
  editoriales: ValorConteoDto[];

  @ApiProperty({ type: [ValorConteoDto] })
  subgeneros: ValorConteoDto[];

  @ApiProperty({ type: [ValorConteoDto] })
  autores: ValorConteoDto[];

  @ApiProperty({ type: [ValorConteoDto] })
  etiquetas: ValorConteoDto[];

  @ApiProperty({ example: 5990 })
  precioMin: number;

  @ApiProperty({ example: 39990 })
  precioMax: number;

  @ApiProperty({ example: 14, description: 'Libros en oferta' })
  enOferta: number;
}
