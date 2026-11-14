import { Injectable, PipeTransform } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { IdInvalidoException } from '../exceptions/app.exceptions';

/**
 * Valida que un parámetro de ruta sea un UUID antes de llegar al service,
 * evitando consultas a la base de datos con ids mal formados.
 */
@Injectable()
export class UuidPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!isUUID(value)) throw new IdInvalidoException(value);
    return value;
  }
}
