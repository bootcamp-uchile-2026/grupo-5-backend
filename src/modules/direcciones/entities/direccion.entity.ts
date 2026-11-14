import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/** Dirección de despacho guardada por un usuario para reutilizarla al comprar. */
@Entity('direcciones')
export class Direccion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'usuario_id', type: 'uuid' })
  usuarioId: string;

  @Column({ type: 'varchar', length: 40 })
  alias: string;

  @Column({ name: 'nombre_receptor', type: 'varchar', length: 80 })
  nombreReceptor: string;

  @Column({ type: 'varchar', length: 12, nullable: true })
  rut: string | null;

  @Column({ type: 'varchar', length: 120 })
  calle: string;

  @Column({ type: 'varchar', length: 60 })
  comuna: string;

  @Column({ type: 'varchar', length: 60, nullable: true })
  ciudad: string | null;

  @Column({ type: 'varchar', length: 5 })
  region: string;

  @Column({
    name: 'codigo_postal',
    type: 'varchar',
    length: 10,
    nullable: true,
  })
  codigoPostal: string | null;

  @Column({ type: 'varchar', length: 15 })
  telefono: string;

  @Column({ default: false })
  predeterminada: boolean;

  @CreateDateColumn({ name: 'creado_en', type: 'timestamptz' })
  creadoEn: Date;

  @UpdateDateColumn({ name: 'actualizado_en', type: 'timestamptz' })
  actualizadoEn: Date;
}
