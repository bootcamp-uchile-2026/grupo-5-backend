import { Injectable, PipeTransform } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isUUID } from 'class-validator';
import { Repository } from 'typeorm';
import {
  IdInvalidoException,
  LibroNoEncontradoException,
} from '../../../common/exceptions/app.exceptions';
import { Libro } from '../entities/libro.entity';

/**
 * Pipe de validación que consulta la base de datos: recibe el id de la ruta y
 * entrega al controller el libro ya cargado. Responde 400 ID_INVALIDO si no es
 * un UUID y 404 LIBRO_NO_ENCONTRADO si no existe o fue retirado del catálogo,
 * antes de que el request llegue al service.
 *
 * Uso: @Param('id', LibroExistePipe) libro: Libro
 */
@Injectable()
export class LibroExistePipe implements PipeTransform<string, Promise<Libro>> {
  constructor(
    @InjectRepository(Libro) private readonly repo: Repository<Libro>,
  ) {}

  async transform(id: string): Promise<Libro> {
    if (!isUUID(id)) throw new IdInvalidoException(id);
    const libro = await this.repo.findOneBy({ id, activo: true });
    if (!libro) throw new LibroNoEncontradoException(id);
    return libro;
  }
}
