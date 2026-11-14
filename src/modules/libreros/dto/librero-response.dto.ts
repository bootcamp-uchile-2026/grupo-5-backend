import { ApiProperty } from '@nestjs/swagger';
import { LibroResumenDto } from '../../libros/dto/libro-response.dto';
import { Librero } from '../entities/perfil-librero.entity';

export class LibreroResumenDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({
    example: 'gregorio-samsa',
    description: 'Para la URL del perfil',
  })
  slug: string;

  @ApiProperty({ example: 'Gregorio Samsa' })
  nombre: string;

  @ApiProperty({ example: 'Gregorio S.' })
  nombreCorto: string;

  @ApiProperty({ type: [String] })
  etiquetas: string[];

  @ApiProperty({ nullable: true, type: String })
  cita: string | null;

  @ApiProperty({ nullable: true, type: String })
  fotoUrl: string | null;

  @ApiProperty({ example: 3 })
  seguidores: number;

  static desde(l: Librero, seguidores = 0): LibreroResumenDto {
    return {
      id: l.id,
      slug: l.slug,
      nombre: l.nombre,
      nombreCorto: l.nombreCorto,
      etiquetas: l.etiquetas ?? [],
      cita: l.cita,
      fotoUrl: l.fotoUrl,
      seguidores,
    };
  }
}

export class IndispensableResponseDto {
  @ApiProperty({ example: 'El proceso' })
  titulo: string;

  @ApiProperty({ example: 'Franz Kafka' })
  autor: string;

  @ApiProperty({ nullable: true, type: String, format: 'uuid' })
  libroId: string | null;

  @ApiProperty({
    nullable: true,
    type: LibroResumenDto,
    description: 'Datos del libro si está en el catálogo',
  })
  libro: LibroResumenDto | null;
}

export class ColeccionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  titulo: string;

  @ApiProperty({ nullable: true, type: String })
  descripcion: string | null;

  @ApiProperty({ example: '2026-08-24' })
  fecha: string;

  @ApiProperty({ type: [LibroResumenDto] })
  libros: LibroResumenDto[];
}

export class RecomendacionLibreroResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ type: LibroResumenDto })
  libro: LibroResumenDto;

  @ApiProperty({ description: 'Nota personal del librero' })
  nota: string;

  @ApiProperty({ description: 'Igual a nota (nombre del Hito 1)' })
  notaPersonal: string;

  @ApiProperty()
  destacada: boolean;

  @ApiProperty()
  orden: number;

  @ApiProperty()
  fecha: Date;

  @ApiProperty({ type: LibreroResumenDto })
  librero: LibreroResumenDto;
}

export class LibreroPerfilDto extends LibreroResumenDto {
  @ApiProperty()
  biografia: string;

  @ApiProperty({ type: [String] })
  estilos: string[];

  @ApiProperty({ type: [String] })
  autoresFavoritos: string[];

  @ApiProperty({ type: [String], description: 'Igual a autoresFavoritos' })
  autores: string[];

  @ApiProperty({ type: [IndispensableResponseDto], description: 'Top 5' })
  indispensables: IndispensableResponseDto[];

  @ApiProperty({
    type: [ColeccionResponseDto],
    description: 'De la más reciente a la más antigua',
  })
  colecciones: ColeccionResponseDto[];

  @ApiProperty({ type: [RecomendacionLibreroResponseDto] })
  ultimasRecomendaciones: RecomendacionLibreroResponseDto[];

  @ApiProperty({
    nullable: true,
    type: Boolean,
    description: 'Si el usuario del token lo sigue; null sin token',
  })
  siguiendo: boolean | null;
}

export class SeguimientoLibreroDto {
  @ApiProperty()
  siguiendo: boolean;

  @ApiProperty({ example: 4 })
  seguidores: number;
}
