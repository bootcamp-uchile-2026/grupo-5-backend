import { ApiProperty } from '@nestjs/swagger';
import { LibroResumenDto } from '../../libros/dto/libro-response.dto';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import {
  ClubLectura,
  ClubParticipante,
  ComentarioHilo,
  HiloDiscusion,
} from '../entities/club-lectura.entity';

/** Nombre público: nombre e inicial del apellido ("Camila R."). */
export const nombrePublico = (u?: Usuario | null) =>
  u ? `${u.nombre}${u.apellido ? ` ${u.apellido.charAt(0)}.` : ''}` : 'Lector';

export class ClubResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  libroId: string;

  @ApiProperty({ type: LibroResumenDto })
  libro: LibroResumenDto;

  @ApiProperty()
  titulo: string;

  @ApiProperty({ nullable: true, type: String })
  descripcion: string | null;

  @ApiProperty({ example: '2026-10-01' })
  fechaInicio: string;

  @ApiProperty({ nullable: true, type: String })
  fechaFin: string | null;

  @ApiProperty({ type: [String], description: 'Ids de los participantes' })
  participantes: string[];

  @ApiProperty({ example: 4 })
  cantidadParticipantes: number;

  static desde(c: ClubLectura, participantes: string[]): ClubResponseDto {
    return {
      id: c.id,
      libroId: c.libroId,
      libro: LibroResumenDto.desde(c.libro),
      titulo: c.titulo,
      descripcion: c.descripcion,
      fechaInicio: c.fechaInicio,
      fechaFin: c.fechaFin,
      participantes,
      cantidadParticipantes: participantes.length,
    };
  }
}

export class HiloResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  clubLecturaId: string;

  @ApiProperty({ format: 'uuid' })
  usuarioId: string;

  @ApiProperty({ example: 'Clara V.' })
  autor: string;

  @ApiProperty()
  titulo: string;

  @ApiProperty()
  contenido: string;

  @ApiProperty()
  fechaCreacion: Date;

  static desde(h: HiloDiscusion): HiloResponseDto {
    return {
      id: h.id,
      clubLecturaId: h.clubLecturaId,
      usuarioId: h.usuarioId,
      autor: nombrePublico(h.usuario),
      titulo: h.titulo,
      contenido: h.contenido,
      fechaCreacion: h.fechaCreacion,
    };
  }
}

export class ComentarioResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  hiloId: string;

  @ApiProperty({ format: 'uuid' })
  usuarioId: string;

  @ApiProperty({ example: 'Valentina M.' })
  autor: string;

  @ApiProperty()
  contenido: string;

  @ApiProperty()
  fechaCreacion: Date;

  static desde(c: ComentarioHilo): ComentarioResponseDto {
    return {
      id: c.id,
      hiloId: c.hiloId,
      usuarioId: c.usuarioId,
      autor: nombrePublico(c.usuario),
      contenido: c.contenido,
      fechaCreacion: c.fechaCreacion,
    };
  }
}

export class ProgresoResponseDto {
  @ApiProperty({ format: 'uuid' })
  clubLecturaId: string;

  @ApiProperty({ format: 'uuid' })
  usuarioId: string;

  @ApiProperty({ example: 'Camila R.' })
  nombre: string;

  @ApiProperty({ example: 120 })
  paginaActual: number;

  @ApiProperty({ example: 35 })
  porcentaje: number;

  @ApiProperty()
  actualizadoEn: Date;

  static desde(p: ClubParticipante): ProgresoResponseDto {
    return {
      clubLecturaId: p.clubId,
      usuarioId: p.usuarioId,
      nombre: nombrePublico(p.usuario),
      paginaActual: p.paginaActual,
      porcentaje: p.porcentaje,
      actualizadoEn: p.actualizadoEn,
    };
  }
}
