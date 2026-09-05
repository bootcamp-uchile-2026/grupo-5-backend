import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateListaDeseosDto } from './dto/create-lista-deseos.dto';
import { UpdateListaDeseosDto } from './dto/update-lista-deseos.dto';
import { ListaDeseos } from './entities/lista-deseos.entity';

@Injectable()
export class ListasDeseosService {
  private readonly listas: ListaDeseos[] = [];

  create(dto: CreateListaDeseosDto): ListaDeseos {
    const lista: ListaDeseos = {
      id: randomUUID(),
      usuarioId: dto.usuarioId,
      nombre: dto.nombre,
      esParaRegalo: dto.esParaRegalo ?? false,
      libros: [],
      fechaCreacion: new Date(),
    };
    this.listas.push(lista);
    return lista;
  }

  findByUsuario(usuarioId: string): ListaDeseos[] {
    return this.listas.filter((l) => l.usuarioId === usuarioId);
  }

  findOne(id: string): ListaDeseos {
    const lista = this.listas.find((l) => l.id === id);
    if (!lista) throw new NotFoundException(`Lista de deseos ${id} no encontrada`);
    return lista;
  }

  update(id: string, dto: UpdateListaDeseosDto): ListaDeseos {
    const lista = this.findOne(id);
    Object.assign(lista, dto);
    return lista;
  }

  agregarLibro(id: string, libroId: string): ListaDeseos {
    const lista = this.findOne(id);
    if (!lista.libros.includes(libroId)) {
      lista.libros.push(libroId);
    }
    return lista;
  }

  quitarLibro(id: string, libroId: string): ListaDeseos {
    const lista = this.findOne(id);
    lista.libros = lista.libros.filter((l) => l !== libroId);
    return lista;
  }

  remove(id: string): void {
    const index = this.listas.findIndex((l) => l.id === id);
    if (index === -1) throw new NotFoundException(`Lista de deseos ${id} no encontrada`);
    this.listas.splice(index, 1);
  }
}
