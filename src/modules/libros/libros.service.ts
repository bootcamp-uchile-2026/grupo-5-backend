import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  IsbnDuplicadoException,
  IsbnNoEncontradoException,
  LibroNoEncontradoException,
  PrecioAnteriorInvalidoException,
  ServicioExternoException,
} from '../../common/exceptions/app.exceptions';
import { BuscarLibrosDto, OrdenLibros } from './dto/buscar-libros.dto';
import { CreateLibroDto } from './dto/create-libro.dto';
import { ImportarIsbnDto } from './dto/importar-isbn.dto';
import {
  FiltrosDisponiblesDto,
  GeneroDto,
  GrupoCategoriasDto,
  LibroResponseDto,
  LibroResumenDto,
  LibrosPaginadosDto,
  ValorConteoDto,
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

const ORDEN: Record<OrdenLibros, [string, 'ASC' | 'DESC'][]> = {
  [OrdenLibros.NOVEDADES]: [['l.fechaIngreso', 'DESC']],
  [OrdenLibros.PRECIO_ASC]: [['l.precio', 'ASC']],
  [OrdenLibros.PRECIO_DESC]: [['l.precio', 'DESC']],
  [OrdenLibros.TITULO]: [['l.titulo', 'ASC']],
  [OrdenLibros.MAS_VENDIDOS]: [['l.ventas', 'DESC']],
  [OrdenLibros.MEJOR_CALIFICADOS]: [
    ['l.calificacion', 'DESC'],
    ['l.opiniones', 'DESC'],
  ],
  [OrdenLibros.MAS_COMENTADOS]: [['l.opiniones', 'DESC']],
  [OrdenLibros.MAYOR_DESCUENTO]: [['descuento', 'DESC']],
};

/** Orden de los grupos del menú de UX (Figma: Componentes Global). */
const GRUPOS_MENU = [
  'Ficción',
  'No ficción',
  'Arte y Diseño',
  'Bienestar',
  'Negocios',
  'Para cada momento',
  'Para pensar',
  'Para descubrir',
  'Para compartir',
];

/** Condición "el libro pertenece a esta categoría", sin distinguir mayúsculas. */
const enCategoria = (param: string) =>
  `EXISTS (SELECT 1 FROM unnest(l.categorias) AS cat WHERE LOWER(cat) = LOWER(:${param}))`;

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
    // El género acepta tanto los de la API ("Policial") como las categorías del
    // menú de UX ("Romance", "Misterio y thriller"): el Front no necesita mapearlos.
    if (filtros.genero)
      qb.andWhere(
        `(LOWER(l.genero) = LOWER(:genero) OR ${enCategoria('genero')})`,
        { genero: filtros.genero.trim() },
      );
    if (filtros.categoria)
      qb.andWhere(enCategoria('categoria'), {
        categoria: filtros.categoria.trim(),
      });
    if (filtros.subgenero)
      qb.andWhere('LOWER(l.subgenero) = LOWER(:subgenero)', {
        subgenero: filtros.subgenero.trim(),
      });
    if (filtros.editorial)
      qb.andWhere('l.editorial ILIKE :editorial', {
        editorial: patron(filtros.editorial),
      });
    if (filtros.autor)
      qb.andWhere('l.autor ILIKE :autor', { autor: patron(filtros.autor) });
    if (filtros.autores?.length) {
      const params = Object.fromEntries(
        filtros.autores.map((a, i) => [`autor${i}`, patron(a)]),
      );
      qb.andWhere(
        `(${Object.keys(params)
          .map((k) => `l.autor ILIKE :${k}`)
          .join(' OR ')})`,
        params,
      );
    }
    filtros.etiquetas?.forEach((etiqueta, i) =>
      qb.andWhere(
        `EXISTS (SELECT 1 FROM unnest(l.etiquetas) AS et WHERE LOWER(et) = LOWER(:etiqueta${i}))`,
        { [`etiqueta${i}`]: etiqueta },
      ),
    );
    if (filtros.enOferta === true) qb.andWhere('l.precioAnterior IS NOT NULL');
    if (filtros.enOferta === false) qb.andWhere('l.precioAnterior IS NULL');
    if (filtros.calificacionMin !== undefined)
      qb.andWhere('l.calificacion >= :calificacionMin', {
        calificacionMin: filtros.calificacionMin,
      });
    if (filtros.formato)
      qb.andWhere('l.formato = :formato', { formato: filtros.formato });
    if (filtros.estado)
      qb.andWhere('l.estado = :estado', { estado: filtros.estado });
    if (filtros.precioMin !== undefined)
      qb.andWhere('l.precio >= :precioMin', { precioMin: filtros.precioMin });
    if (filtros.precioMax !== undefined)
      qb.andWhere('l.precio <= :precioMax', { precioMax: filtros.precioMax });
    if (filtros.enStock) qb.andWhere('l.stock > 0');

    if (orden === OrdenLibros.MAYOR_DESCUENTO) {
      qb.addSelect(
        'CASE WHEN l.precio_anterior IS NULL THEN 0 ELSE 1 - l.precio::numeric / l.precio_anterior END',
        'descuento',
      );
    }
    ORDEN[orden].forEach(([campo, sentido], i) =>
      i === 0 ? qb.orderBy(campo, sentido) : qb.addOrderBy(campo, sentido),
    );
    // El id como último criterio hace estable la paginación ante empates.
    qb.addOrderBy('l.id', 'ASC');

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

  /** Menú de UX con la cantidad de libros de cada género y temática. */
  async categorias(): Promise<GrupoCategoriasDto[]> {
    const filas = await this.repo.query<
      {
        nombre: string;
        tipo: 'GENERO' | 'TEMATICA';
        grupo: string;
        cantidad: number;
      }[]
    >(
      `SELECT c.nombre, c.tipo, c.grupo, COUNT(l.id)::int AS cantidad
         FROM categorias c
         LEFT JOIN libros l ON l.activo AND c.nombre = ANY (l.categorias)
        GROUP BY c.nombre, c.tipo, c.grupo, c.orden
        ORDER BY c.orden, c.nombre`,
    );
    const grupos = new Map<string, GrupoCategoriasDto>();
    for (const f of filas) {
      const grupo = grupos.get(f.grupo) ?? {
        grupo: f.grupo,
        tipo: f.tipo,
        categorias: [],
      };
      grupo.categorias.push({ nombre: f.nombre, cantidad: f.cantidad });
      grupos.set(f.grupo, grupo);
    }
    const posicion = (g: string) =>
      GRUPOS_MENU.includes(g) ? GRUPOS_MENU.indexOf(g) : GRUPOS_MENU.length;
    return [...grupos.values()].sort(
      (a, b) =>
        posicion(a.grupo) - posicion(b.grupo) || a.grupo.localeCompare(b.grupo),
    );
  }

  /** Valores existentes para el panel de filtros (editorial, subgénero, autor...). */
  async filtros(): Promise<FiltrosDisponiblesDto> {
    // Las columnas vienen de una lista fija del código, nunca del usuario.
    const conteo = (columna: 'editorial' | 'subgenero' | 'autor') =>
      this.repo.query<ValorConteoDto[]>(
        `SELECT ${columna} AS valor, COUNT(*)::int AS cantidad
           FROM libros WHERE activo AND ${columna} IS NOT NULL
          GROUP BY 1 ORDER BY 2 DESC, 1 ASC`,
      );
    const [editoriales, subgeneros, autores, etiquetas, rango] =
      await Promise.all([
        conteo('editorial'),
        conteo('subgenero'),
        conteo('autor'),
        this.repo.query<ValorConteoDto[]>(
          `SELECT et AS valor, COUNT(*)::int AS cantidad
             FROM libros l, unnest(l.etiquetas) AS et WHERE l.activo
            GROUP BY 1 ORDER BY 2 DESC, 1 ASC`,
        ),
        this.repo.query<{ min: number; max: number; oferta: number }[]>(
          `SELECT COALESCE(MIN(precio), 0)::int AS min, COALESCE(MAX(precio), 0)::int AS max,
                  COUNT(*) FILTER (WHERE precio_anterior IS NOT NULL)::int AS oferta
             FROM libros WHERE activo`,
        ),
      ]);
    return {
      editoriales,
      subgeneros,
      autores,
      etiquetas,
      precioMin: rango[0].min,
      precioMax: rango[0].max,
      enOferta: rango[0].oferta,
    };
  }

  /**
   * "Lo que la comunidad también leyó": primero los libros comprados junto a
   * este en pedidos pagados; se completa con los más vendidos de sus mismas
   * categorías o género.
   */
  async relacionados(id: string, limite = 8): Promise<LibroResumenDto[]> {
    const libro = await this.obtener(id);
    const comprados = await this.repo.query<{ libro_id: string }[]>(
      `SELECT otro.libro_id
         FROM pedido_items este
         JOIN pedidos p ON p.id = este.pedido_id AND p.estado = 'PAGADO'
         JOIN pedido_items otro ON otro.pedido_id = este.pedido_id AND otro.libro_id <> este.libro_id
         JOIN libros l ON l.id = otro.libro_id AND l.activo
        WHERE este.libro_id = $1
        GROUP BY otro.libro_id
        ORDER BY SUM(otro.cantidad) DESC
        LIMIT $2`,
      [id, limite],
    );
    const ids = comprados.map((c) => c.libro_id);
    if (ids.length < limite) {
      const qb = this.repo
        .createQueryBuilder('l')
        .select('l.id', 'id')
        .where('l.activo = true AND l.id <> :id', { id })
        .andWhere(
          '(l.categorias && CAST(:categorias AS text[]) OR l.genero = :genero)',
          { categorias: libro.categorias ?? [], genero: libro.genero },
        );
      if (ids.length) qb.andWhere('l.id NOT IN (:...ids)', { ids });
      const similares = await qb
        .orderBy('l.ventas', 'DESC')
        .addOrderBy('l.id', 'ASC')
        .limit(limite - ids.length)
        .getRawMany<{ id: string }>();
      ids.push(...similares.map((s) => s.id));
    }
    const porId = await this.resumenes(ids);
    return ids.flatMap((i) => {
      const resumen = porId.get(i);
      return resumen ? [resumen] : [];
    });
  }

  /** Resumen de varios libros a la vez, para embeber en otras respuestas. */
  async resumenes(ids: string[]): Promise<Map<string, LibroResumenDto>> {
    if (!ids.length) return new Map();
    const libros = await this.repo.findBy({ id: In([...new Set(ids)]) });
    return new Map(libros.map((l) => [l.id, LibroResumenDto.desde(l)]));
  }

  async obtener(id: string): Promise<Libro> {
    const libro = await this.repo.findOneBy({ id, activo: true });
    if (!libro) throw new LibroNoEncontradoException(id);
    return libro;
  }

  async crear(dto: CreateLibroDto): Promise<Libro> {
    await this.exigirIsbnLibre(dto.isbn);
    this.exigirPrecioAnteriorValido(dto.precio, dto.precioAnterior);
    return this.repo.save(
      this.repo.create({
        ...dto,
        sinopsis: dto.sinopsis ?? null,
        editorial: dto.editorial ?? null,
        anioPublicacion: dto.anioPublicacion ?? null,
        portadaUrl: dto.portadaUrl ?? null,
        precioAnterior: dto.precioAnterior ?? null,
        subgenero: dto.subgenero ?? null,
        encuadernacion: dto.encuadernacion ?? null,
        paginas: dto.paginas ?? null,
        dimensiones: dto.dimensiones ?? null,
        etiquetas: dto.etiquetas ?? [],
        categorias: dto.categorias ?? [],
        videoUrl: dto.videoUrl ?? null,
        galeria: dto.galeria ?? [],
        formato: dto.formato ?? FormatoLibro.FISICO,
        estado: dto.estado ?? EstadoLibro.DISPONIBLE,
      }),
    );
  }

  async actualizar(id: string, dto: UpdateLibroDto): Promise<Libro> {
    const libro = await this.obtener(id);
    if (dto.isbn && dto.isbn !== libro.isbn)
      await this.exigirIsbnLibre(dto.isbn);
    this.exigirPrecioAnteriorValido(
      dto.precio ?? libro.precio,
      dto.precioAnterior === undefined
        ? libro.precioAnterior
        : dto.precioAnterior,
    );
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

  private exigirPrecioAnteriorValido(
    precio: number,
    precioAnterior: number | null | undefined,
  ): void {
    if (precioAnterior != null && precioAnterior <= precio)
      throw new PrecioAnteriorInvalidoException(precio, precioAnterior);
  }

  private async exigirIsbnLibre(isbn: string): Promise<void> {
    if (await this.repo.existsBy({ isbn }))
      throw new IsbnDuplicadoException(isbn);
  }
}
