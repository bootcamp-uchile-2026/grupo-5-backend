import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  ClubNoEncontradoException,
  HiloNoEncontradoException,
  NoEsParticipanteException,
  PermisoDenegadoException,
} from '../../common/exceptions/app.exceptions';
import { UsuarioAutenticado } from '../auth/decorators/current-user.decorator';
import { LibrosService } from '../libros/libros.service';
import { Rol } from '../usuarios/entities/usuario.entity';
import { ActualizarProgresoDto } from './dto/actualizar-progreso.dto';
import {
  ClubResponseDto,
  ComentarioResponseDto,
  HiloResponseDto,
  ProgresoResponseDto,
} from './dto/club-response.dto';
import { CreateClubLecturaDto } from './dto/create-club-lectura.dto';
import { CreateComentarioDto } from './dto/create-comentario.dto';
import { CreateHiloDiscusionDto } from './dto/create-hilo-discusion.dto';
import {
  ClubLectura,
  ClubParticipante,
  ComentarioHilo,
  HiloDiscusion,
} from './entities/club-lectura.entity';

/**
 * Club de lectura (esfuerzo diferencial del proyecto): clubes sobre un libro
 * del catálogo, hilos de discusión, comentarios y progreso compartido.
 * Persistido en PostgreSQL desde el Hito 3. Leer es público; participar
 * requiere sesión y haberse unido al club.
 */
@Injectable()
export class ClubLecturaService {
  constructor(
    @InjectRepository(ClubLectura)
    private readonly clubes: Repository<ClubLectura>,
    @InjectRepository(ClubParticipante)
    private readonly participantes: Repository<ClubParticipante>,
    @InjectRepository(HiloDiscusion)
    private readonly hilos: Repository<HiloDiscusion>,
    @InjectRepository(ComentarioHilo)
    private readonly comentarios: Repository<ComentarioHilo>,
    private readonly libros: LibrosService,
  ) {}

  async crearClub(
    creador: UsuarioAutenticado,
    dto: CreateClubLecturaDto,
  ): Promise<ClubResponseDto> {
    await this.libros.obtener(dto.libroId);
    const club = await this.clubes.save(
      this.clubes.create({
        libroId: dto.libroId,
        creadorId: creador.id,
        titulo: dto.titulo,
        descripcion: dto.descripcion ?? null,
        fechaInicio: dto.fechaInicio,
        fechaFin: dto.fechaFin ?? null,
      }),
    );
    await this.participantes.insert({ clubId: club.id, usuarioId: creador.id });
    return this.obtenerClub(club.id);
  }

  async listarClubes(): Promise<ClubResponseDto[]> {
    const clubes = await this.clubes.find({
      relations: { libro: true },
      order: { fechaInicio: 'DESC' },
    });
    const filas = clubes.length
      ? await this.participantes.find({
          where: { clubId: In(clubes.map((c) => c.id)) },
        })
      : [];
    return clubes.map((c) =>
      ClubResponseDto.desde(
        c,
        filas.filter((p) => p.clubId === c.id).map((p) => p.usuarioId),
      ),
    );
  }

  async obtenerClub(id: string): Promise<ClubResponseDto> {
    const club = await this.club(id);
    const filas = await this.participantes.find({
      where: { clubId: id },
      order: { unidoEn: 'ASC' },
    });
    return ClubResponseDto.desde(
      club,
      filas.map((p) => p.usuarioId),
    );
  }

  async unirse(
    clubId: string,
    usuarioId: string,
    actual: UsuarioAutenticado,
  ): Promise<ClubResponseDto> {
    this.exigirMismoUsuario(usuarioId, actual);
    await this.club(clubId);
    await this.participantes
      .createQueryBuilder()
      .insert()
      .values({ clubId, usuarioId })
      .orIgnore()
      .execute();
    return this.obtenerClub(clubId);
  }

  async salir(clubId: string, usuarioId: string): Promise<ClubResponseDto> {
    await this.club(clubId);
    await this.participantes.delete({ clubId, usuarioId });
    return this.obtenerClub(clubId);
  }

  async crearHilo(
    clubId: string,
    autor: UsuarioAutenticado,
    dto: CreateHiloDiscusionDto,
  ): Promise<HiloResponseDto> {
    await this.exigirParticipante(clubId, autor);
    const hilo = await this.hilos.save(
      this.hilos.create({
        clubLecturaId: clubId,
        usuarioId: autor.id,
        titulo: dto.titulo,
        contenido: dto.contenido,
      }),
    );
    return HiloResponseDto.desde(
      await this.hilos.findOneOrFail({
        where: { id: hilo.id },
        relations: { usuario: true },
      }),
    );
  }

  async listarHilos(clubId: string): Promise<HiloResponseDto[]> {
    await this.club(clubId);
    const hilos = await this.hilos.find({
      where: { clubLecturaId: clubId },
      relations: { usuario: true },
      order: { fechaCreacion: 'DESC' },
    });
    return hilos.map((h) => HiloResponseDto.desde(h));
  }

  async comentar(
    hiloId: string,
    autor: UsuarioAutenticado,
    dto: CreateComentarioDto,
  ): Promise<ComentarioResponseDto> {
    const hilo = await this.hilo(hiloId);
    await this.exigirParticipante(hilo.clubLecturaId, autor);
    const comentario = await this.comentarios.save(
      this.comentarios.create({
        hiloId,
        usuarioId: autor.id,
        contenido: dto.contenido,
      }),
    );
    return ComentarioResponseDto.desde(
      await this.comentarios.findOneOrFail({
        where: { id: comentario.id },
        relations: { usuario: true },
      }),
    );
  }

  async listarComentarios(hiloId: string): Promise<ComentarioResponseDto[]> {
    await this.hilo(hiloId);
    const comentarios = await this.comentarios.find({
      where: { hiloId },
      relations: { usuario: true },
      order: { fechaCreacion: 'ASC' },
    });
    return comentarios.map((c) => ComentarioResponseDto.desde(c));
  }

  async actualizarProgreso(
    clubId: string,
    usuarioId: string,
    actual: UsuarioAutenticado,
    dto: ActualizarProgresoDto,
  ): Promise<ProgresoResponseDto> {
    this.exigirMismoUsuario(usuarioId, actual);
    await this.exigirParticipante(clubId, { ...actual, id: usuarioId });
    await this.participantes.update(
      { clubId, usuarioId },
      { paginaActual: dto.paginaActual, porcentaje: dto.porcentaje },
    );
    return ProgresoResponseDto.desde(
      await this.participantes.findOneOrFail({
        where: { clubId, usuarioId },
        relations: { usuario: true },
      }),
    );
  }

  async progresoCompartido(clubId: string): Promise<ProgresoResponseDto[]> {
    await this.club(clubId);
    const filas = await this.participantes.find({
      where: { clubId },
      relations: { usuario: true },
      order: { porcentaje: 'DESC' },
    });
    return filas.map((p) => ProgresoResponseDto.desde(p));
  }

  private async club(id: string): Promise<ClubLectura> {
    const club = await this.clubes.findOne({
      where: { id },
      relations: { libro: true },
    });
    if (!club) throw new ClubNoEncontradoException(id);
    return club;
  }

  private async hilo(id: string): Promise<HiloDiscusion> {
    const hilo = await this.hilos.findOneBy({ id });
    if (!hilo) throw new HiloNoEncontradoException(id);
    return hilo;
  }

  private async exigirParticipante(
    clubId: string,
    usuario: UsuarioAutenticado,
  ): Promise<void> {
    await this.club(clubId);
    if (
      usuario.rol !== Rol.ADMIN &&
      !(await this.participantes.existsBy({ clubId, usuarioId: usuario.id }))
    )
      throw new NoEsParticipanteException();
  }

  private exigirMismoUsuario(usuarioId: string, actual: UsuarioAutenticado) {
    if (actual.rol !== Rol.ADMIN && actual.id !== usuarioId)
      throw new PermisoDenegadoException(
        'Solo puedes actuar en nombre de tu propia cuenta',
      );
  }
}
