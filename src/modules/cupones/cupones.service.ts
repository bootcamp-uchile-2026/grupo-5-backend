import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { CuponInvalidoException } from '../../common/exceptions/app.exceptions';
import {
  ActualizarCuponDto,
  CrearCuponDto,
  CuponAplicadoDto,
} from './dto/cupon.dto';
import { Cupon, TipoCupon } from './entities/cupon.entity';

/** Quién usa el cupón: un usuario con cuenta o un invitado por su email. */
export interface UsuarioCupon {
  usuarioId?: string | null;
  email?: string | null;
}

/**
 * Códigos de descuento. Un cupón se aplica sobre el subtotal (sin envío):
 *  - inexistente o desactivado      -> 404 CUPON_NO_ENCONTRADO
 *  - fuera de su vigencia           -> 422 CUPON_VENCIDO
 *  - sin usos disponibles           -> 422 CUPON_AGOTADO
 *  - subtotal bajo el mínimo        -> 422 CUPON_MONTO_MINIMO
 *  - de un solo uso y ya utilizado  -> 422 CUPON_YA_USADO
 */
@Injectable()
export class CuponesService {
  constructor(
    @InjectRepository(Cupon) private readonly repo: Repository<Cupon>,
  ) {}

  /** Valida y calcula sin consumir el cupón (para mostrarlo en el checkout). */
  async calcular(
    codigo: string,
    subtotal: number,
    quien: UsuarioCupon,
    manager: EntityManager = this.repo.manager,
    bloquear = false,
  ): Promise<CuponAplicadoDto> {
    const qb = manager
      .getRepository(Cupon)
      .createQueryBuilder('c')
      .where('c.codigo = :codigo AND c.activo = true', {
        codigo: codigo.trim().toUpperCase(),
      });
    if (bloquear) qb.setLock('pessimistic_write');
    const cupon = await qb.getOne();
    if (!cupon)
      throw new CuponInvalidoException(
        'CUPON_NO_ENCONTRADO',
        `El código "${codigo}" no existe`,
        HttpStatus.NOT_FOUND,
      );

    const ahora = new Date();
    if (
      cupon.vigenteDesde > ahora ||
      (cupon.vigenteHasta && cupon.vigenteHasta < ahora)
    )
      throw new CuponInvalidoException(
        'CUPON_VENCIDO',
        `El código "${cupon.codigo}" no está vigente`,
      );
    if (cupon.usosMaximos !== null && cupon.usos >= cupon.usosMaximos)
      throw new CuponInvalidoException(
        'CUPON_AGOTADO',
        `El código "${cupon.codigo}" ya no tiene usos disponibles`,
      );
    if (subtotal < cupon.montoMinimo)
      throw new CuponInvalidoException(
        'CUPON_MONTO_MINIMO',
        `El código "${cupon.codigo}" requiere una compra de al menos $${cupon.montoMinimo.toLocaleString('es-CL')}`,
      );
    if (
      cupon.unUsoPorUsuario &&
      (await this.yaUsado(cupon.codigo, quien, manager))
    )
      throw new CuponInvalidoException(
        'CUPON_YA_USADO',
        `Ya usaste el código "${cupon.codigo}"`,
      );

    const descuento = Math.min(
      subtotal,
      cupon.tipo === TipoCupon.PORCENTAJE
        ? Math.round((subtotal * cupon.valor) / 100)
        : cupon.valor,
    );
    return {
      codigo: cupon.codigo,
      descripcion: cupon.descripcion,
      tipo: cupon.tipo,
      valor: cupon.valor,
      subtotal,
      descuento,
      subtotalConDescuento: subtotal - descuento,
    };
  }

  /** Valida con bloqueo y suma un uso, dentro de la transacción del checkout. */
  async aplicar(
    manager: EntityManager,
    codigo: string,
    subtotal: number,
    quien: UsuarioCupon,
  ): Promise<CuponAplicadoDto> {
    const aplicado = await this.calcular(
      codigo,
      subtotal,
      quien,
      manager,
      true,
    );
    await manager.increment(Cupon, { codigo: aplicado.codigo }, 'usos', 1);
    return aplicado;
  }

  /** Al cancelar un pedido el uso vuelve a estar disponible. */
  async liberar(manager: EntityManager, codigo: string): Promise<void> {
    await manager
      .createQueryBuilder()
      .update(Cupon)
      .set({ usos: () => 'GREATEST(usos - 1, 0)' })
      .where('codigo = :codigo', { codigo })
      .execute();
  }

  async subtotalCarrito(usuarioId: string): Promise<number> {
    const [fila] = await this.repo.query<{ subtotal: number }[]>(
      `SELECT COALESCE(SUM(l.precio * c.cantidad), 0)::int AS subtotal
         FROM carrito_items c JOIN libros l ON l.id = c.libro_id
        WHERE c.usuario_id = $1`,
      [usuarioId],
    );
    return fila.subtotal;
  }

  listar(): Promise<Cupon[]> {
    return this.repo.find({ order: { codigo: 'ASC' } });
  }

  async crear(dto: CrearCuponDto): Promise<Cupon> {
    this.validarValor(dto.tipo, dto.valor);
    if (await this.repo.existsBy({ codigo: dto.codigo }))
      throw new CuponInvalidoException(
        'CUPON_DUPLICADO',
        `Ya existe el código "${dto.codigo}"`,
        HttpStatus.CONFLICT,
      );
    return this.repo.save(
      this.repo.create({
        ...dto,
        descripcion: dto.descripcion ?? null,
        montoMinimo: dto.montoMinimo ?? 0,
        usosMaximos: dto.usosMaximos ?? null,
        unUsoPorUsuario: dto.unUsoPorUsuario ?? false,
        vigenteDesde: dto.vigenteDesde
          ? new Date(dto.vigenteDesde)
          : new Date(),
        vigenteHasta: dto.vigenteHasta ? new Date(dto.vigenteHasta) : null,
      }),
    );
  }

  async actualizar(codigo: string, dto: ActualizarCuponDto): Promise<Cupon> {
    const cupon = await this.repo.findOneBy({ codigo: codigo.toUpperCase() });
    if (!cupon)
      throw new CuponInvalidoException(
        'CUPON_NO_ENCONTRADO',
        `El código "${codigo}" no existe`,
        HttpStatus.NOT_FOUND,
      );
    const { vigenteDesde, vigenteHasta, ...resto } = dto;
    Object.assign(cupon, resto);
    if (vigenteDesde) cupon.vigenteDesde = new Date(vigenteDesde);
    if (vigenteHasta) cupon.vigenteHasta = new Date(vigenteHasta);
    this.validarValor(cupon.tipo, cupon.valor);
    return this.repo.save(cupon);
  }

  private validarValor(tipo: TipoCupon, valor: number): void {
    if (tipo === TipoCupon.PORCENTAJE && valor > 100)
      throw new CuponInvalidoException(
        'VALIDATION_ERROR',
        'Un cupón de porcentaje no puede superar 100',
        HttpStatus.BAD_REQUEST,
      );
  }

  private async yaUsado(
    codigo: string,
    quien: UsuarioCupon,
    manager: EntityManager,
  ): Promise<boolean> {
    if (!quien.usuarioId && !quien.email) return false;
    const filas = await manager.query<unknown[]>(
      `SELECT 1 FROM pedidos
        WHERE codigo_descuento = $1 AND estado <> 'CANCELADO'
          AND (usuario_id = $2 OR LOWER(invitado_email) = LOWER($3))
        LIMIT 1`,
      [codigo, quien.usuarioId ?? null, quien.email ?? null],
    );
    return filas.length > 0;
  }
}
