import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  IsbnDuplicadoException,
  IsbnNoEncontradoException,
  LibroNoEncontradoException,
  ServicioExternoException,
} from '../../common/exceptions/app.exceptions';
import { BuscarLibrosDto, OrdenLibros } from './dto/buscar-libros.dto';
import { CreateLibroDto } from './dto/create-libro.dto';
import { ImportarIsbnDto } from './dto/importar-isbn.dto';
import {
  GeneroDto,
  LibroResponseDto,
  LibrosPaginadosDto,
} from './dto/libro-response.dto';
import { UpdateLibroDto } from './dto/update-libro.dto';
import { EstadoLibro, FormatoLibro, Libro } from './entities/libro.entity';

interface OpenLibraryBook {
  title?: string;
  authors?: { name: string }[];
  publishers?: { name: string }[];
  publish_date?: string;
  subjects?: { name: string }[];
  cover?: { large?: string };
}

const ORDEN: Record<OrdenLibros, [string, 'ASC' | 'DESC']> = {
  [OrdenLibros.NOVEDADES]: ['l.fechaIngreso', 'DESC'],
  [OrdenLibros.PRECIO_ASC]: ['l.precio', 'ASC'],
  [OrdenLibros.PRECIO_DESC]: ['l.precio', 'DESC'],
  [OrdenLibros.TITULO]: ['l.titulo', 'ASC'],
};

/** Escapa los comodines de LIKE para que el texto del usuario se busque literal. */
const patron = (texto: string) =>
  `%${texto.trim().replace(/[\\%_]/g, '\\$&')}%`;

@Injectable()
export class LibrosService {
  constructor(
    @InjectRepository(Libro) private readonly repo: Repository<Libro>,
  ) {}

  async buscar(filtros: BuscarLibrosDto): Promise<LibrosPaginadosDto> {
    const { page = 1, limit = 12, orden = OrdenLibros.NOVEDADES } = filtros;
    const qb = this.repo.createQueryBuilder('l').where('l.activo = true');

    if (filtros.q) {
      qb.andWhere(
        '(l.titulo ILIKE :q OR l.autor ILIKE :q OR l.isbn ILIKE :q)',
        { q: patron(filtros.q) },
      );
    }
    if (filtros.genero)
      qb.andWhere('LOWER(l.genero) = LOWER(:genero)', {
        genero: filtros.genero.trim(),
      });
    if (filtros.autor)
      qb.andWhere('l.autor ILIKE :autor', { autor: patron(filtros.autor) });
    if (filtros.formato)
      qb.andWhere('l.formato = :formato', { formato: filtros.formato });
    if (filtros.estado)
      qb.andWhere('l.estado = :estado', { estado: filtros.estado });
    if (filtros.precioMin !== undefined)
      qb.andWhere('l.precio >= :precioMin', { precioMin: filtros.precioMin });
    if (filtros.precioMax !== undefined)
      qb.andWhere('l.precio <= :precioMax', { precioMax: filtros.precioMax });
    if (filtros.enStock) qb.andWhere('l.stock > 0');

    const [campo, sentido] = ORDEN[orden];
    // El id como segundo criterio hace estable la paginación ante empates.
    qb.orderBy(campo, sentido).addOrderBy('l.id', 'ASC');

    const [libros, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items: libros.map((l) => LibroResponseDto.desde(l)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async generos(): Promise<GeneroDto[]> {
    const filas = await this.repo
      .createQueryBuilder('l')
      .select('l.genero', 'genero')
      .addSelect('COUNT(*)::int', 'cantidad')
      .where('l.activo = true')
      .groupBy('l.genero')
      .orderBy('l.genero', 'ASC')
      .getRawMany<GeneroDto>();
    return filas;
  }

  async obtener(id: string): Promise<Libro> {
    const libro = await this.repo.findOneBy({ id, activo: true });
    if (!libro) throw new LibroNoEncontradoException(id);
    return libro;
  }

  async crear(dto: CreateLibroDto): Promise<Libro> {
    await this.exigirIsbnLibre(dto.isbn);
    return this.repo.save(
      this.repo.create({
        ...dto,
        sinopsis: dto.sinopsis ?? null,
        editorial: dto.editorial ?? null,
        anioPublicacion: dto.anioPublicacion ?? null,
        portadaUrl: dto.portadaUrl ?? null,
        formato: dto.formato ?? FormatoLibro.FISICO,
        estado: dto.estado ?? EstadoLibro.DISPONIBLE,
      }),
    );
  }

  async actualizar(id: string, dto: UpdateLibroDto): Promise<Libro> {
    const libro = await this.obtener(id);
    if (dto.isbn && dto.isbn !== libro.isbn)
      await this.exigirIsbnLibre(dto.isbn);
    Object.assign(libro, dto);
    return this.repo.save(libro);
  }

  async eliminar(id: string): Promise<void> {
    const libro = await this.obtener(id);
    libro.activo = false;
    await this.repo.save(libro);
  }

  /** Crea un libro completando sus datos desde la API pública de Open Library. */
  async importarPorIsbn(dto: ImportarIsbnDto): Promise<Libro> {
    await this.exigirIsbnLibre(dto.isbn);

    let datos: OpenLibraryBook | undefined;
    try {
      const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${dto.isbn}&format=json&jscmd=data`;
      const respuesta = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
      const json = (await respuesta.json()) as Record<string, OpenLibraryBook>;
      datos = json[`ISBN:${dto.isbn}`];
    } catch (error) {
      throw new ServicioExternoException(
        'OPEN_LIBRARY_NO_DISPONIBLE',
        `No fue posible consultar Open Library: ${(error as Error).message}`,
      );
    }
    if (!datos?.title) throw new IsbnNoEncontradoException(dto.isbn);

    const anio = datos.publish_date?.match(/\d{4}/)?.[0];
    return this.crear({
      isbn: dto.isbn,
      titulo: datos.title.slice(0, 200),
      autor: (
        datos.authors?.map((a) => a.name).join(', ') || 'Autor desconocido'
      ).slice(0, 120),
      genero:
        dto.genero ??
        datos.subjects?.[0]?.name?.slice(0, 60) ??
        'Sin clasificar',
      editorial: datos.publishers?.[0]?.name?.slice(0, 120),
      anioPublicacion: anio ? Number(anio) : undefined,
      portadaUrl: datos.cover?.large,
      precio: dto.precio,
      stock: dto.stock,
    });
  }

  private async exigirIsbnLibre(isbn: string): Promise<void> {
    if (await this.repo.existsBy({ isbn }))
      throw new IsbnDuplicadoException(isbn);
  }
}
