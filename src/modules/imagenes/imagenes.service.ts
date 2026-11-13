import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import type { Request } from 'express';
import { randomUUID } from 'node:crypto';
import { unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DataSource, Repository } from 'typeorm';
import {
  ImagenNoEncontradaException,
  ImagenRequeridaException,
  TipoImagenNoPermitidoException,
} from '../../common/exceptions/app.exceptions';
import { Libro } from '../libros/entities/libro.entity';
import {
  FORMATOS,
  RUTA_PUBLICA_IMAGENES,
  directorioImagenes,
} from './almacenamiento';
import { Imagen, UsoImagen } from './entities/imagen.entity';

interface OpcionesGuardar {
  uso: UsoImagen;
  libroId?: string | null;
  usuarioId: string;
  req: Request;
}

/**
 * Gestión de imágenes: valida el archivo, lo guarda en disco (UPLOADS_DIR),
 * registra sus metadatos en la tabla imagenes y lo deja disponible en el
 * servidor de archivos estáticos (/uploads/<archivo>).
 */
@Injectable()
export class ImagenesService {
  private readonly logger = new Logger(ImagenesService.name);
  private readonly directorio: string;

  constructor(
    @InjectRepository(Imagen) private readonly repo: Repository<Imagen>,
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
  ) {
    this.directorio = directorioImagenes(config);
  }

  async guardar(
    archivo: Express.Multer.File | undefined,
    opciones: OpcionesGuardar,
  ): Promise<Imagen> {
    if (!archivo?.buffer?.length) throw new ImagenRequeridaException();
    const formato = FORMATOS[archivo.mimetype];
    // El tipo declarado por el cliente no basta: se revisan los primeros bytes.
    if (!formato || !formato.esValido(archivo.buffer)) {
      throw new TipoImagenNoPermitidoException(archivo.mimetype);
    }

    const nombre = `${randomUUID()}.${formato.extension}`;
    await writeFile(join(this.directorio, nombre), archivo.buffer);
    try {
      return await this.repo.save(
        this.repo.create({
          archivo: nombre,
          nombreOriginal: archivo.originalname.slice(0, 255),
          mime: archivo.mimetype,
          tamano: archivo.size,
          url: `${this.urlBase(opciones.req)}${RUTA_PUBLICA_IMAGENES}/${nombre}`,
          uso: opciones.uso,
          libroId: opciones.libroId ?? null,
          subidoPor: opciones.usuarioId,
        }),
      );
    } catch (error) {
      await this.borrarArchivo(nombre);
      throw error;
    }
  }

  async obtener(id: string): Promise<Imagen> {
    const imagen = await this.repo.findOneBy({ id });
    if (!imagen) throw new ImagenNoEncontradaException(id);
    return imagen;
  }

  listarPorLibro(libroId: string): Promise<Imagen[]> {
    return this.repo.find({ where: { libroId }, order: { creadoEn: 'ASC' } });
  }

  /** Sube la portada de un libro y la deja como su portadaUrl. */
  async subirPortada(
    libro: Libro,
    archivo: Express.Multer.File | undefined,
    usuarioId: string,
    req: Request,
  ): Promise<Imagen> {
    const imagen = await this.guardar(archivo, {
      uso: UsoImagen.PORTADA,
      libroId: libro.id,
      usuarioId,
      req,
    });
    await this.dataSource
      .getRepository(Libro)
      .update(libro.id, { portadaUrl: imagen.url });
    return imagen;
  }

  /** Agrega una imagen a la galería de la ficha del libro. */
  async agregarAGaleria(
    libro: Libro,
    archivo: Express.Multer.File | undefined,
    usuarioId: string,
    req: Request,
  ): Promise<Imagen> {
    const imagen = await this.guardar(archivo, {
      uso: UsoImagen.GALERIA,
      libroId: libro.id,
      usuarioId,
      req,
    });
    await this.dataSource.query(
      'UPDATE libros SET galeria = array_append(galeria, $1) WHERE id = $2',
      [imagen.url, libro.id],
    );
    return imagen;
  }

  /**
   * Elimina la imagen: el archivo, su registro y, si un libro la usaba como
   * portada o en su galería, también esa referencia.
   */
  async eliminar(id: string): Promise<void> {
    const imagen = await this.obtener(id);
    await this.dataSource.transaction(async (tx) => {
      await tx.query(
        'UPDATE libros SET galeria = array_remove(galeria, $1) WHERE $1 = ANY (galeria)',
        [imagen.url],
      );
      await tx.query(
        'UPDATE libros SET portada_url = NULL WHERE portada_url = $1',
        [imagen.url],
      );
      await tx.delete(Imagen, { id });
    });
    await this.borrarArchivo(imagen.archivo);
  }

  /**
   * PUBLIC_URL si está configurada (recomendado en el servidor); si no, el
   * protocolo y host con que llegó la petición (respeta el proxy HTTPS).
   */
  private urlBase(req: Request): string {
    const publica = this.config.get<string>('PUBLIC_URL');
    if (publica) return publica.replace(/\/$/, '');
    return `${req.protocol}://${req.get('host')}`;
  }

  private async borrarArchivo(nombre: string): Promise<void> {
    await unlink(join(this.directorio, nombre)).catch((error: Error) =>
      this.logger.warn(`No se pudo borrar ${nombre}: ${error.message}`),
    );
  }
}
