import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ItemNoEstaEnCarritoException,
  StockInsuficienteException,
} from '../../common/exceptions/app.exceptions';
import { Libro } from '../libros/entities/libro.entity';
import { LibrosService } from '../libros/libros.service';
import {
  ActualizarItemDto,
  AgregarItemDto,
  CANTIDAD_MAXIMA_POR_LIBRO,
  CarritoResponseDto,
} from './dto/carrito.dto';
import { CarritoItem } from './entities/carrito-item.entity';

@Injectable()
export class CarritoService {
  constructor(
    @InjectRepository(CarritoItem)
    private readonly repo: Repository<CarritoItem>,
    private readonly libros: LibrosService,
  ) {}

  async obtener(usuarioId: string): Promise<CarritoResponseDto> {
    const filas = await this.repo.find({
      where: { usuarioId },
      relations: { libro: true },
      order: { agregadoEn: 'ASC' },
    });
    const items = filas.map((f) => ({
      libroId: f.libroId,
      titulo: f.libro.titulo,
      autor: f.libro.autor,
      portadaUrl: f.libro.portadaUrl,
      precioUnitario: f.libro.precio,
      cantidad: f.cantidad,
      subtotal: f.libro.precio * f.cantidad,
      stockDisponible: f.libro.stock,
      disponible: f.libro.activo && f.libro.stock >= f.cantidad,
    }));
    return {
      items,
      totalItems: items.reduce((suma, i) => suma + i.cantidad, 0),
      subtotal: items.reduce((suma, i) => suma + i.subtotal, 0),
    };
  }

  async agregar(
    usuarioId: string,
    dto: AgregarItemDto,
  ): Promise<CarritoResponseDto> {
    const libro = await this.libros.obtener(dto.libroId);
    const existente = await this.repo.findOneBy({
      usuarioId,
      libroId: libro.id,
    });
    const cantidad = (existente?.cantidad ?? 0) + (dto.cantidad ?? 1);
    this.exigirStock(libro, cantidad);
    await this.repo.save({ usuarioId, libroId: libro.id, cantidad });
    return this.obtener(usuarioId);
  }

  async actualizar(
    usuarioId: string,
    libroId: string,
    dto: ActualizarItemDto,
  ): Promise<CarritoResponseDto> {
    const item = await this.repo.findOneBy({ usuarioId, libroId });
    if (!item) throw new ItemNoEstaEnCarritoException(libroId);
    this.exigirStock(await this.libros.obtener(libroId), dto.cantidad);
    await this.repo.update({ usuarioId, libroId }, { cantidad: dto.cantidad });
    return this.obtener(usuarioId);
  }

  async quitar(
    usuarioId: string,
    libroId: string,
  ): Promise<CarritoResponseDto> {
    const { affected } = await this.repo.delete({ usuarioId, libroId });
    if (!affected) throw new ItemNoEstaEnCarritoException(libroId);
    return this.obtener(usuarioId);
  }

  async vaciar(usuarioId: string): Promise<void> {
    await this.repo.delete({ usuarioId });
  }

  private exigirStock(libro: Libro, cantidad: number): void {
    if (cantidad > CANTIDAD_MAXIMA_POR_LIBRO) {
      throw new StockInsuficienteException([
        `"${libro.titulo}": máximo ${CANTIDAD_MAXIMA_POR_LIBRO} unidades por pedido`,
      ]);
    }
    if (cantidad > libro.stock) {
      throw new StockInsuficienteException([
        `"${libro.titulo}": solicitado ${cantidad}, disponible ${libro.stock}`,
      ]);
    }
  }
}
