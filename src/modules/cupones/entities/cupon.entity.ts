import { Column, Entity, PrimaryColumn } from 'typeorm';

export enum TipoCupon {
  PORCENTAJE = 'PORCENTAJE',
  MONTO_FIJO = 'MONTO_FIJO',
}

@Entity('cupones')
export class Cupon {
  /** Siempre en mayúsculas. */
  @PrimaryColumn()
  codigo: string;

  @Column({ type: 'varchar', nullable: true })
  descripcion: string | null;

  @Column({ type: 'varchar', length: 20 })
  tipo: TipoCupon;

  /** Porcentaje (1 a 100) o monto en CLP según el tipo. */
  @Column({ type: 'int' })
  valor: number;

  /** Subtotal mínimo (CLP) para poder usarlo. */
  @Column({ name: 'monto_minimo', type: 'int', default: 0 })
  montoMinimo: number;

  /** null = sin límite. */
  @Column({ name: 'usos_maximos', type: 'int', nullable: true })
  usosMaximos: number | null;

  @Column({ type: 'int', default: 0 })
  usos: number;

  @Column({ name: 'un_uso_por_usuario', default: false })
  unUsoPorUsuario: boolean;

  @Column({ name: 'vigente_desde', type: 'timestamptz' })
  vigenteDesde: Date;

  @Column({ name: 'vigente_hasta', type: 'timestamptz', nullable: true })
  vigenteHasta: Date | null;

  @Column({ default: true })
  activo: boolean;
}
