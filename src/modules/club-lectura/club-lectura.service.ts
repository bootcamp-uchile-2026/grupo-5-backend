import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateClubLecturaDto } from './dto/create-club-lectura.dto';
import { CreateHiloDiscusionDto } from './dto/create-hilo-discusion.dto';
import { CreateComentarioDto } from './dto/create-comentario.dto';
import { ActualizarProgresoDto } from './dto/actualizar-progreso.dto';
import {
  ClubLectura,
  HiloDiscusion,
  ComentarioHilo,
  ProgresoLectura,
} from './entities/club-lectura.entity';

/**
 * Servicio del Club de Lectura (esfuerzo diferencial del proyecto).
 * Gestiona clubes, hilos de discusión, comentarios y progreso de lectura
 * compartido entre los participantes.
 */
@Injectable()
export class ClubLecturaService {
  private readonly clubes: ClubLectura[] = [];
  private readonly hilos: HiloDiscusion[] = [];
  private readonly comentarios: ComentarioHilo[] = [];
  private readonly progresos: ProgresoLectura[] = [];

  crearClub(dto: CreateClubLecturaDto): ClubLectura {
    const club: ClubLectura = {
      id: randomUUID(),
      libroId: dto.libroId,
      titulo: dto.titulo,
      descripcion: dto.descripcion,
      fechaInicio: new Date(dto.fechaInicio),
      fechaFin: dto.fechaFin ? new Date(dto.fechaFin) : undefined,
      participantes: [],
    };
    this.clubes.push(club);
    return club;
  }

  listarClubes(): ClubLectura[] {
    return this.clubes;
  }

  obtenerClub(id: string): ClubLectura {
    const club = this.clubes.find((c) => c.id === id);
    if (!club) throw new NotFoundException(`Club de lectura ${id} no encontrado`);
    return club;
  }

  unirseAClub(clubId: string, usuarioId: string): ClubLectura {
    const club = this.obtenerClub(clubId);
    if (!club.participantes.includes(usuarioId)) {
      club.participantes.push(usuarioId);
    }
    return club;
  }

  crearHilo(clubId: string, dto: CreateHiloDiscusionDto): HiloDiscusion {
    this.obtenerClub(clubId);
    const hilo: HiloDiscusion = {
      id: randomUUID(),
      clubLecturaId: clubId,
      fechaCreacion: new Date(),
      ...dto,
    };
    this.hilos.push(hilo);
    return hilo;
  }

  listarHilos(clubId: string): HiloDiscusion[] {
    return this.hilos.filter((h) => h.clubLecturaId === clubId);
  }

  comentarHilo(hiloId: string, dto: CreateComentarioDto): ComentarioHilo {
    const hiloExiste = this.hilos.some((h) => h.id === hiloId);
    if (!hiloExiste) throw new NotFoundException(`Hilo ${hiloId} no encontrado`);
    const comentario: ComentarioHilo = {
      id: randomUUID(),
      hiloId,
      fechaCreacion: new Date(),
      ...dto,
    };
    this.comentarios.push(comentario);
    return comentario;
  }

  listarComentarios(hiloId: string): ComentarioHilo[] {
    return this.comentarios.filter((c) => c.hiloId === hiloId);
  }

  actualizarProgreso(
    clubId: string,
    usuarioId: string,
    dto: ActualizarProgresoDto,
  ): ProgresoLectura {
    this.obtenerClub(clubId);
    let progreso = this.progresos.find(
      (p) => p.clubLecturaId === clubId && p.usuarioId === usuarioId,
    );
    if (!progreso) {
      progreso = { id: randomUUID(), clubLecturaId: clubId, usuarioId, ...dto };
      this.progresos.push(progreso);
    } else {
      Object.assign(progreso, dto);
    }
    return progreso;
  }

  obtenerProgresoCompartido(clubId: string): ProgresoLectura[] {
    return this.progresos.filter((p) => p.clubLecturaId === clubId);
  }
}
