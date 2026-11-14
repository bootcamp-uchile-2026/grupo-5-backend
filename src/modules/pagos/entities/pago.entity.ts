import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum EstadoPago {
  APROBADO = 'APROBADO',
  RECHAZADO = 'RECHAZADO',
}

export enum MetodoPago {
  TARJETA_CREDITO = 'TARJETA_CREDITO',
  TARJETA_DEBITO = 'TARJETA_DEBITO',
}

/** Cada intento de pago de un pedido. Nunca se guarda el número completo ni el CVV. */
@Entity('pagos')
export class Pago {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'pedido_id', type: 'uuid' })
  pedidoId: string;

  @Column({ type: 'int' })
  monto: number;

  @Column({ type: 'varchar', length: 20 })
  metodo: MetodoPago;

  @Column({ type: 'varchar', length: 20 })
  estado: EstadoPago;

  @Column({ type: 'varchar', length: 4 })
  ultimos4: string;

  @Column({ name: 'codigo_autorizacion', type: 'varchar', nullable: true })
  codigoAutorizacion: string | null;

  @Column({ name: 'motivo_rechazo', type: 'varchar', nullable: true })
  motivoRechazo: string | null;

  @CreateDateColumn({ name: 'creado_en', type: 'timestamptz' })
  creadoEn: Date;
}
