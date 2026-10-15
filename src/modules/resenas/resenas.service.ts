import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  PermisoDenegadoException,
  ResenaDuplicadaException,
  ResenaNoEncontradaException,
} from '../../common/exceptions/app.exceptions';
import { UsuarioAutenticado } from '../auth/decorators/current-user.decorator';
import { LibrosService } from '../libros/libros.service';
import { Rol } from '../usuarios/entities/usuario.entity';
import { CrearResenaDto } from './dto/create-resena.dto';
import {
  ListarResenasQueryDto,
  OrdenResenas,
  ResenasPaginadasDto,
  ResenaResponseDto,
  ResumenCalificacionDto,
} from './dto/resena-response.dto';
import { UpdateResenaDto } from './dto/update-resena.dto';
import { Resena, TipoResena } from './entities/resena.entity';

const ORDEN: Record<OrdenResenas, Record<string, 'ASC' | 'DESC'>> = {
  [OrdenResenas.RECIENTES]: { creadoEn: 'DESC' },
  [OrdenResenas.MEJOR_CALIFICADAS]: { calificacion: 'DESC', creadoEn: 'DESC' },
  [OrdenResenas.PEOR_CALIFICADAS]: { calificacion: 'ASC', creadoEn: 'DESC' },
};

/**
 * Reseñas de lectores y de libreros, persistidas en PostgreSQL. Una reseña es
 * "compra verificada" si su autor tiene un pedido PAGADO con ese libro. Cada
 * cambio recalcula la calificación y la cantidad de opiniones del libro.
 */
@Injectable()
export class ResenasService {
  constructor(
    @InjectRepository(Resena) private readonly repo: Repository<Resena>,
    private readonly libros: LibrosService,
    private readonly dataSource: DataSource,
  ) {}

  async listarPorLibro(
    libroId: string,
    query: ListarResenasQueryDto,
  ): Promise<ResenasPaginadasDto> {
    await this.libros.obtener(libroId);
    const { page = 1, limit = 10, orden = OrdenResenas.RECIENTES } = query;
    const where = {
      libroId,
      ...(query.tipo && { tipo: query.tipo }),
      ...(query.soloVerificadas && { verificada: true }),
    };
    const [resenas, total] = await this.repo.findAndCount({
      where,
      relations: { usuario: true },
      order: { ...ORDEN[orden], id: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      items: resenas.map((r) => ResenaResponseDto.desde(r)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      resumen: await this.resumen(libroId),
    };
  }

  async listarDeUsuario(usuarioId: string): Promise<Resena[]> {
    return this.repo.find({
      where: { usuarioId },
      relations: { usuario: true },
      order: { creadoEn: 'DESC' },
    });
  }

  async crear(
    libroId: string,
    autor: UsuarioAutenticado,
    dto: CrearResenaDto,
  ): Promise<Resena> {
    await this.libros.obtener(libroId);
    if (await this.repo.existsBy({ libroId, usuarioId: autor.id }))
      throw new ResenaDuplicadaException();

    const resena = await this.repo.save(
      this.repo.create({
        libroId,
        usuarioId: autor.id,
        tipo:
          autor.rol === Rol.LIBRERO ? TipoResena.LIBRERO : TipoResena.LECTOR,
        calificacion: dto.calificacion,
        titulo: dto.titulo ?? null,
        comentario: dto.comentario,
        verificada: await this.comproElLibro(autor.id, libroId),
      }),
    );
    await this.recalcular(libroId);
    return this.obtener(resena.id);
  }

  async actualizar(
    id: string,
    usuario: UsuarioAutenticado,
    dto: UpdateResenaDto,
  ): Promise<Resena> {
    const resena = await this.obtenerPropia(id, usuario);
    if (dto.calificacion !== undefined) resena.calificacion = dto.calificacion;
    if (dto.titulo !== undefined) resena.titulo = dto.titulo;
    if (dto.comentario !== undefined) resena.comentario = dto.comentario;
    await this.repo.save(resena);
    await this.recalcular(resena.libroId);
    return this.obtener(id);
  }

  async eliminar(id: string, usuario: UsuarioAutenticado): Promise<void> {
    const resena = await this.obtenerPropia(id, usuario);
    await this.repo.delete({ id });
    await this.recalcular(resena.libroId);
  }

  async obtener(id: string): Promise<Resena> {
    const resena = await this.repo.findOne({
      where: { id },
      relations: { usuario: true },
    });
    if (!resena) throw new ResenaNoEncontradaException(id);
    return resena;
  }

  private async obtenerPropia(
    id: string,
    usuario: UsuarioAutenticado,
  ): Promise<Resena> {
    const resena = await this.obtener(id);
    if (usuario.rol !== Rol.ADMIN && resena.usuarioId !== usuario.id)
      throw new PermisoDenegadoException('La reseña pertenece a otro usuario');
    return resena;
  }

  private async resumen(libroId: string): Promise<ResumenCalificacionDto> {
    const filas = await this.repo
      .createQueryBuilder('r')
      .select('r.calificacion', 'estrellas')
      .addSelect('COUNT(*)::int', 'cantidad')
      .where('r.libroId = :libroId', { libroId })
      .groupBy('r.calificacion')
      .getRawMany<{ estrellas: number; cantidad: number }>();
    const distribucion = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
    let cantidad = 0;
    let suma = 0;
    for (const f of filas) {
      distribucion[String(f.estrellas) as keyof typeof distribucion] =
        f.cantidad;
      cantidad += f.cantidad;
      suma += f.estrellas * f.cantidad;
    }
    return {
      promedio: cantidad ? Math.round((suma / cantidad) * 10) / 10 : 0,
      cantidad,
      distribucion,
    };
  }

  private async comproElLibro(
    usuarioId: string,
    libroId: string,
  ): Promise<boolean> {
    const filas = await this.dataSource.query<unknown[]>(
      `SELECT 1 FROM pedidos p JOIN pedido_items i ON i.pedido_id = p.id
        WHERE p.usuario_id = $1 AND i.libro_id = $2 AND p.estado = 'PAGADO' LIMIT 1`,
      [usuarioId, libroId],
    );
    return filas.length > 0;
  }

  /** Mantiene libros.calificacion y libros.opiniones al día. */
  private async recalcular(libroId: string): Promise<void> {
    await this.dataSource.query(
      `UPDATE libros SET
         calificacion = COALESCE((SELECT ROUND(AVG(calificacion), 1) FROM resenas WHERE libro_id = $1), 0),
         opiniones    = (SELECT COUNT(*) FROM resenas WHERE libro_id = $1)
       WHERE id = $1`,
      [libroId],
    );
  }
}
