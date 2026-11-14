import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isUUID } from 'class-validator';
import { DataSource, Repository } from 'typeorm';
import {
  LibreroNoEncontradoException,
  LibreroYaTienePerfilException,
  PermisoDenegadoException,
  RecursoNoEncontradoException,
} from '../../common/exceptions/app.exceptions';
import { UsuarioAutenticado } from '../auth/decorators/current-user.decorator';
import { LibroResumenDto } from '../libros/dto/libro-response.dto';
import { LibrosService } from '../libros/libros.service';
import { Rol } from '../usuarios/entities/usuario.entity';
import { UsuariosService } from '../usuarios/usuarios.service';
import { CreatePerfilLibreroDto } from './dto/create-perfil-librero.dto';
import {
  CreateColeccionDto,
  CreateRecomendacionDto,
} from './dto/create-seccion-curada.dto';
import {
  ColeccionResponseDto,
  LibreroPerfilDto,
  LibreroResumenDto,
  RecomendacionLibreroResponseDto,
  SeguimientoLibreroDto,
} from './dto/librero-response.dto';
import { UpdatePerfilLibreroDto } from './dto/update-perfil-librero.dto';
import {
  Coleccion,
  Librero,
  RecomendacionLibrero,
} from './entities/perfil-librero.entity';

/**
 * Perfiles editoriales de los libreros, sus recomendaciones con nota personal
 * (las "destacadas" van al Home), colecciones y seguidores. Persistido en
 * PostgreSQL desde el Hito 3.
 */
@Injectable()
export class LibrerosService {
  constructor(
    @InjectRepository(Librero) private readonly repo: Repository<Librero>,
    @InjectRepository(RecomendacionLibrero)
    private readonly recomendaciones: Repository<RecomendacionLibrero>,
    @InjectRepository(Coleccion)
    private readonly colecciones: Repository<Coleccion>,
    private readonly libros: LibrosService,
    private readonly usuarios: UsuariosService,
    private readonly dataSource: DataSource,
  ) {}

  async listar(): Promise<LibreroResumenDto[]> {
    const libreros = await this.repo.find({
      where: { activo: true },
      order: { nombre: 'ASC' },
    });
    const seguidores = await this.contarSeguidores(libreros.map((l) => l.id));
    return libreros.map((l) =>
      LibreroResumenDto.desde(l, seguidores.get(l.id) ?? 0),
    );
  }

  /** Busca por uuid o por slug ("gregorio-samsa"). */
  async buscar(idOSlug: string): Promise<Librero> {
    const librero = await this.repo.findOneBy(
      isUUID(idOSlug)
        ? { id: idOSlug, activo: true }
        : { slug: idOSlug.toLowerCase(), activo: true },
    );
    if (!librero) throw new LibreroNoEncontradoException(idOSlug);
    return librero;
  }

  async delUsuario(usuarioId: string): Promise<Librero> {
    const librero = await this.repo.findOneBy({ usuarioId });
    if (!librero) throw new LibreroNoEncontradoException(usuarioId);
    return librero;
  }

  async perfil(
    idOSlug: string,
    usuario?: UsuarioAutenticado,
  ): Promise<LibreroPerfilDto> {
    const librero = await this.buscar(idOSlug);
    const [colecciones, recomendaciones, seguidores, siguiendo] =
      await Promise.all([
        this.colecciones.find({
          where: { libreroId: librero.id },
          order: { publicadaEn: 'DESC' },
        }),
        this.listarRecomendaciones(librero.id, 8),
        this.contarSeguidores([librero.id]),
        usuario ? this.sigue(librero.id, usuario.id) : null,
      ]);
    const indispensables = librero.indispensables ?? [];
    const resumenes = await this.libros.resumenes([
      ...colecciones.flatMap((c) => c.libros),
      ...indispensables.flatMap((i) => (i.libroId ? [i.libroId] : [])),
    ]);
    return {
      ...LibreroResumenDto.desde(librero, seguidores.get(librero.id) ?? 0),
      biografia: librero.biografia,
      estilos: librero.estilos ?? [],
      autoresFavoritos: librero.autoresFavoritos ?? [],
      autores: librero.autoresFavoritos ?? [],
      indispensables: indispensables.map((i) => ({
        titulo: i.titulo,
        autor: i.autor,
        libroId: i.libroId ?? null,
        libro: (i.libroId && resumenes.get(i.libroId)) || null,
      })),
      colecciones: colecciones.map((c) => this.coleccionDto(c, resumenes)),
      ultimasRecomendaciones: recomendaciones,
      siguiendo,
    };
  }

  async crear(dto: CreatePerfilLibreroDto): Promise<Librero> {
    const usuario = await this.usuarios.obtener(dto.usuarioId);
    if (usuario.rol !== Rol.LIBRERO)
      throw new PermisoDenegadoException(
        'Solo un usuario con rol LIBRERO puede tener perfil de librero',
      );
    if (
      (await this.repo.existsBy({ usuarioId: dto.usuarioId })) ||
      (await this.repo.existsBy({ slug: dto.slug }))
    )
      throw new LibreroYaTienePerfilException();
    return this.repo.save(
      this.repo.create({
        ...dto,
        cita: dto.cita ?? null,
        fotoUrl: dto.fotoUrl ?? null,
        etiquetas: dto.etiquetas ?? [],
        estilos: dto.estilos ?? [],
        autoresFavoritos: dto.autoresFavoritos ?? [],
        indispensables: (dto.indispensables ?? []).map((i) => ({
          titulo: i.titulo,
          autor: i.autor,
          libroId: i.libroId ?? null,
        })),
      }),
    );
  }

  async actualizar(
    idOSlug: string,
    usuario: UsuarioAutenticado,
    dto: UpdatePerfilLibreroDto,
  ): Promise<Librero> {
    const librero = await this.buscarPropio(idOSlug, usuario);
    if (dto.slug && dto.slug !== librero.slug) {
      if (await this.repo.existsBy({ slug: dto.slug }))
        throw new LibreroYaTienePerfilException();
    }
    const { indispensables, ...resto } = dto;
    Object.assign(librero, resto);
    if (indispensables)
      librero.indispensables = indispensables.map((i) => ({
        titulo: i.titulo,
        autor: i.autor,
        libroId: i.libroId ?? null,
      }));
    return this.repo.save(librero);
  }

  async seguir(
    idOSlug: string,
    usuarioId: string,
    seguir: boolean,
  ): Promise<SeguimientoLibreroDto> {
    const librero = await this.buscar(idOSlug);
    await this.dataSource.query(
      seguir
        ? `INSERT INTO librero_seguidores (librero_id, usuario_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`
        : `DELETE FROM librero_seguidores WHERE librero_id = $1 AND usuario_id = $2`,
      [librero.id, usuarioId],
    );
    const seguidores = await this.contarSeguidores([librero.id]);
    return { siguiendo: seguir, seguidores: seguidores.get(librero.id) ?? 0 };
  }

  async listarRecomendaciones(
    libreroId: string,
    limite?: number,
  ): Promise<RecomendacionLibreroResponseDto[]> {
    const filas = await this.recomendaciones.find({
      where: { libreroId, libro: { activo: true } },
      relations: { libro: true, librero: true },
      order: { creadoEn: 'DESC', orden: 'ASC' },
      take: limite,
    });
    return filas.map((r) => this.recomendacionDto(r));
  }

  /** Recomendaciones destacadas de todos los libreros, para el Home. */
  async destacadas(limite = 12): Promise<RecomendacionLibreroResponseDto[]> {
    const filas = await this.recomendaciones.find({
      where: {
        destacada: true,
        libro: { activo: true },
        librero: { activo: true },
      },
      relations: { libro: true, librero: true },
      order: { orden: 'ASC', creadoEn: 'DESC' },
      take: limite,
    });
    return filas.map((r) => this.recomendacionDto(r));
  }

  /** "Quién lo recomienda": notas de libreros sobre un libro (ficha). */
  async deLibro(libroId: string): Promise<RecomendacionLibreroResponseDto[]> {
    await this.libros.obtener(libroId);
    const filas = await this.recomendaciones.find({
      where: { libroId, librero: { activo: true } },
      relations: { libro: true, librero: true },
      order: { destacada: 'DESC', creadoEn: 'DESC' },
    });
    return filas.map((r) => this.recomendacionDto(r));
  }

  async recomendar(
    idOSlug: string,
    usuario: UsuarioAutenticado,
    dto: CreateRecomendacionDto,
  ): Promise<RecomendacionLibreroResponseDto> {
    const librero = await this.buscarPropio(idOSlug, usuario);
    await this.libros.obtener(dto.libroId);
    // Recomendar dos veces el mismo libro actualiza la nota.
    await this.recomendaciones.upsert(
      {
        libreroId: librero.id,
        libroId: dto.libroId,
        nota: dto.notaPersonal,
        orden: dto.orden ?? 0,
        destacada: dto.destacada ?? false,
      },
      ['libreroId', 'libroId'],
    );
    const fila = await this.recomendaciones.findOneOrFail({
      where: { libreroId: librero.id, libroId: dto.libroId },
      relations: { libro: true, librero: true },
    });
    return this.recomendacionDto(fila);
  }

  async quitarRecomendacion(
    idOSlug: string,
    usuario: UsuarioAutenticado,
    libroId: string,
  ): Promise<void> {
    const librero = await this.buscarPropio(idOSlug, usuario);
    const { affected } = await this.recomendaciones.delete({
      libreroId: librero.id,
      libroId,
    });
    if (!affected)
      throw new RecursoNoEncontradoException(
        'una recomendación del libro',
        libroId,
      );
  }

  async crearColeccion(
    idOSlug: string,
    usuario: UsuarioAutenticado,
    dto: CreateColeccionDto,
  ): Promise<ColeccionResponseDto> {
    const librero = await this.buscarPropio(idOSlug, usuario);
    const ids = dto.libros ?? [];
    const resumenes = await this.libros.resumenes(ids);
    const faltante = ids.find((i) => !resumenes.has(i));
    if (faltante) await this.libros.obtener(faltante);
    const coleccion = await this.colecciones.save(
      this.colecciones.create({
        libreroId: librero.id,
        titulo: dto.titulo,
        descripcion: dto.descripcion ?? null,
        publicadaEn: dto.fecha ?? new Date().toISOString().slice(0, 10),
        libros: ids,
      }),
    );
    return this.coleccionDto(coleccion, resumenes);
  }

  /** El dueño del perfil o un ADMIN. */
  private async buscarPropio(
    idOSlug: string,
    usuario: UsuarioAutenticado,
  ): Promise<Librero> {
    const librero = await this.buscar(idOSlug);
    if (usuario.rol !== Rol.ADMIN && librero.usuarioId !== usuario.id)
      throw new PermisoDenegadoException(
        'Solo el dueño del perfil o un ADMIN pueden modificarlo',
      );
    return librero;
  }

  private async sigue(libreroId: string, usuarioId: string): Promise<boolean> {
    const filas = await this.dataSource.query<unknown[]>(
      `SELECT 1 FROM librero_seguidores WHERE librero_id = $1 AND usuario_id = $2`,
      [libreroId, usuarioId],
    );
    return filas.length > 0;
  }

  private async contarSeguidores(ids: string[]): Promise<Map<string, number>> {
    if (!ids.length) return new Map();
    const filas = await this.dataSource.query<
      { librero_id: string; cantidad: number }[]
    >(
      `SELECT librero_id, COUNT(*)::int AS cantidad FROM librero_seguidores
        WHERE librero_id = ANY ($1::uuid[]) GROUP BY librero_id`,
      [ids],
    );
    return new Map(filas.map((f) => [f.librero_id, f.cantidad]));
  }

  private recomendacionDto(
    r: RecomendacionLibrero,
  ): RecomendacionLibreroResponseDto {
    return {
      id: r.id,
      libro: LibroResumenDto.desde(r.libro),
      nota: r.nota,
      notaPersonal: r.nota,
      destacada: r.destacada,
      orden: r.orden,
      fecha: r.creadoEn,
      librero: LibreroResumenDto.desde(r.librero),
    };
  }

  private coleccionDto(
    c: Coleccion,
    resumenes: Map<string, LibroResumenDto>,
  ): ColeccionResponseDto {
    return {
      id: c.id,
      titulo: c.titulo,
      descripcion: c.descripcion,
      fecha: c.publicadaEn,
      libros: c.libros.flatMap((id) => {
        const libro = resumenes.get(id);
        return libro ? [libro] : [];
      }),
    };
  }
}
