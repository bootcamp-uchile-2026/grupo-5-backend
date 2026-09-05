import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateResenaDto } from './dto/create-resena.dto';
import { UpdateResenaDto } from './dto/update-resena.dto';
import { Resena } from './entities/resena.entity';

/**
 * Servicio de Reseñas de clientes verificados.
 * Hito 1: la verificación de compra se deja como TODO, pendiente de
 * integrarse con el módulo de pedidos/compras.
 */
@Injectable()
export class ResenasService {
  private readonly resenas: Resena[] = [];

  create(dto: CreateResenaDto): Resena {
    const resena: Resena = {
      id: randomUUID(),
      verificada: false, // TODO: validar contra historial de compras real
      fecha: new Date(),
      ...dto,
    };
    this.resenas.push(resena);
    return resena;
  }

  findByLibro(libroId: string): Resena[] {
    return this.resenas.filter((r) => r.libroId === libroId);
  }

  findOne(id: string): Resena {
    const resena = this.resenas.find((r) => r.id === id);
    if (!resena) throw new NotFoundException(`Reseña ${id} no encontrada`);
    return resena;
  }

  update(id: string, dto: UpdateResenaDto): Resena {
    const resena = this.findOne(id);
    Object.assign(resena, dto);
    return resena;
  }

  remove(id: string): void {
    const index = this.resenas.findIndex((r) => r.id === id);
    if (index === -1) throw new NotFoundException(`Reseña ${id} no encontrada`);
    this.resenas.splice(index, 1);
  }
}
