import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import {
  DireccionNoEncontradaException,
  LimiteDireccionesException,
} from '../../common/exceptions/app.exceptions';
import { DireccionDto } from '../pedidos/dto/create-pedido.dto';
import { ActualizarDireccionDto, CrearDireccionDto } from './dto/direccion.dto';
import { Direccion } from './entities/direccion.entity';

export const MAXIMO_DIRECCIONES = 10;

/** Libreta de direcciones del usuario: "Usar mi dirección guardada" en el checkout. */
@Injectable()
export class DireccionesService {
  constructor(
    @InjectRepository(Direccion) private readonly repo: Repository<Direccion>,
    private readonly dataSource: DataSource,
  ) {}

  listar(usuarioId: string): Promise<Direccion[]> {
    return this.repo.find({
      where: { usuarioId },
      order: { predeterminada: 'DESC', creadoEn: 'ASC' },
    });
  }

  async obtener(
    usuarioId: string,
    id: string,
    tx: EntityManager = this.dataSource.manager,
  ): Promise<Direccion> {
    const direccion = await tx.findOneBy(Direccion, { id, usuarioId });
    if (!direccion) throw new DireccionNoEncontradaException(id);
    return direccion;
  }

  /** Puede correr dentro de otra transacción (al guardar la dirección en el checkout). */
  async crear(
    usuarioId: string,
    dto: CrearDireccionDto,
    tx?: EntityManager,
  ): Promise<Direccion> {
    const trabajo = async (m: EntityManager) => {
      const cantidad = await m.countBy(Direccion, { usuarioId });
      if (cantidad >= MAXIMO_DIRECCIONES)
        throw new LimiteDireccionesException(MAXIMO_DIRECCIONES);
      const predeterminada = cantidad === 0 || dto.predeterminada === true;
      if (predeterminada) await this.quitarPredeterminada(m, usuarioId);
      return m.save(
        m.create(Direccion, {
          ...this.campos(dto),
          usuarioId,
          predeterminada,
        }),
      );
    };
    return tx ? trabajo(tx) : this.dataSource.transaction(trabajo);
  }

  async actualizar(
    usuarioId: string,
    id: string,
    dto: ActualizarDireccionDto,
  ): Promise<Direccion> {
    return this.dataSource.transaction(async (m) => {
      const direccion = await this.obtener(usuarioId, id, m);
      if (dto.predeterminada === true && !direccion.predeterminada) {
        await this.quitarPredeterminada(m, usuarioId);
        direccion.predeterminada = true;
      }
      Object.assign(direccion, this.campos(dto));
      return m.save(direccion);
    });
  }

  marcarPredeterminada(usuarioId: string, id: string): Promise<Direccion> {
    return this.actualizar(usuarioId, id, { predeterminada: true });
  }

  /** Si se borra la predeterminada, pasa a serlo la más antigua que quede. */
  async eliminar(usuarioId: string, id: string): Promise<void> {
    await this.dataSource.transaction(async (m) => {
      const direccion = await this.obtener(usuarioId, id, m);
      await m.delete(Direccion, { id });
      if (!direccion.predeterminada) return;
      const siguiente = await m.findOne(Direccion, {
        where: { usuarioId },
        order: { creadoEn: 'ASC' },
      });
      if (siguiente)
        await m.update(Direccion, siguiente.id, { predeterminada: true });
    });
  }

  /** Convierte una dirección guardada en la dirección del checkout. */
  static comoDireccionDePedido(d: Direccion): DireccionDto {
    return {
      nombreReceptor: d.nombreReceptor,
      calle: d.calle,
      comuna: d.comuna,
      region: d.region as DireccionDto['region'],
      telefono: d.telefono,
      rut: d.rut ?? undefined,
      ciudad: d.ciudad ?? undefined,
      codigoPostal: d.codigoPostal ?? undefined,
    };
  }

  private quitarPredeterminada(m: EntityManager, usuarioId: string) {
    return m.update(
      Direccion,
      { usuarioId, predeterminada: true },
      { predeterminada: false },
    );
  }

  /** Solo los campos editables (sin predeterminada, que se maneja aparte). */
  private campos(dto: ActualizarDireccionDto): Partial<Direccion> {
    const campos: Partial<Direccion> = {};
    for (const [clave, valor] of Object.entries(dto)) {
      if (clave !== 'predeterminada' && valor !== undefined)
        (campos as Record<string, unknown>)[clave] = valor;
    }
    return campos;
  }
}
