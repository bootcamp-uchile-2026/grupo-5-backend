import { Injectable, PipeTransform } from '@nestjs/common';
import { Librero } from '../entities/perfil-librero.entity';
import { LibrerosService } from '../libreros.service';

/**
 * Pipe que consulta la base de datos: recibe el uuid o el slug de la ruta y
 * entrega el librero ya cargado (404 LIBRERO_NO_ENCONTRADO si no existe o
 * está inactivo). Uso: @Param('id', LibreroExistePipe) librero: Librero
 */
@Injectable()
export class LibreroExistePipe implements PipeTransform<
  string,
  Promise<Librero>
> {
  constructor(private readonly libreros: LibrerosService) {}

  transform(idOSlug: string): Promise<Librero> {
    return this.libreros.buscar(idOSlug);
  }
}
