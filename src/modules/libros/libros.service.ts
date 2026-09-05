import { Injectable, NotFoundException, BadGatewayException } from '@nestjs/common';
import { CreateLibroDto } from './dto/create-libro.dto';
import { UpdateLibroDto } from './dto/update-libro.dto';
import { Libro } from './entities/libro.entity';
import { randomUUID } from 'crypto';

/**
 * Servicio de Libros.
 * Incluye la integración con la API gratuita de Open Library para obtener
 * metadatos de libros por ISBN (desafío específico del proyecto LeeConNos).
 * Hito 1: almacenamiento en memoria; se migrará a persistencia real luego.
 */
@Injectable()
export class LibrosService {
  private readonly libros: Libro[] = [];

  create(dto: CreateLibroDto): Libro {
    const nuevoLibro: Libro = { id: randomUUID(), ...dto };
    this.libros.push(nuevoLibro);
    return nuevoLibro;
  }

  findAll(filtros?: { genero?: string; autor?: string }): Libro[] {
    let resultado = this.libros;
    if (filtros?.genero) {
      resultado = resultado.filter((l) =>
        l.genero.toLowerCase().includes(filtros.genero!.toLowerCase()),
      );
    }
    if (filtros?.autor) {
      resultado = resultado.filter((l) =>
        l.autor.toLowerCase().includes(filtros.autor!.toLowerCase()),
      );
    }
    return resultado;
  }

  findOne(id: string): Libro {
    const libro = this.libros.find((l) => l.id === id);
    if (!libro) {
      throw new NotFoundException(`Libro ${id} no encontrado`);
    }
    return libro;
  }

  update(id: string, dto: UpdateLibroDto): Libro {
    const libro = this.findOne(id);
    Object.assign(libro, dto);
    return libro;
  }

  remove(id: string): void {
    const index = this.libros.findIndex((l) => l.id === id);
    if (index === -1) {
      throw new NotFoundException(`Libro ${id} no encontrado`);
    }
    this.libros.splice(index, 1);
  }

  /**
   * Importa metadatos de un libro desde la API pública de Open Library
   * (https://openlibrary.org/dev/docs/api/books) usando el ISBN.
   * No requiere API key.
   */
  async importarPorIsbn(isbn: string): Promise<Partial<CreateLibroDto>> {
    const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`;
    try {
      const respuesta = await fetch(url);
      const data = await respuesta.json();
      const libroOL = data[`ISBN:${isbn}`];
      if (!libroOL) {
        throw new NotFoundException(`No se encontraron datos en Open Library para el ISBN ${isbn}`);
      }
      return {
        isbn,
        titulo: libroOL.title,
        autor: libroOL.authors?.map((a: { name: string }) => a.name).join(', ') ?? 'Autor desconocido',
        editorial: libroOL.publishers?.[0]?.name,
        anioPublicacion: libroOL.publish_date ? parseInt(libroOL.publish_date) || undefined : undefined,
        portadaUrl: libroOL.cover?.large ?? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`,
        genero: libroOL.subjects?.[0]?.name ?? 'Sin clasificar',
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadGatewayException('No fue posible conectar con Open Library');
    }
  }
}
