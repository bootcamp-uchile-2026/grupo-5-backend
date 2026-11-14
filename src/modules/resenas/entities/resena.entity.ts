import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';

/** LIBRERO si quien la escribe tiene ese rol; LECTOR en cualquier otro caso. */
export enum TipoResena {
  LECTOR = 'LECTOR',
  LIBRERO = 'LIBRERO',
}

@Entity('resenas')
export class Resena {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'libro_id', type: 'uuid' })
  libroId: string;

  @Column({ name: 'usuario_id', type: 'uuid' })
  usuarioId: string;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column({ type: 'varchar', length: 10 })
  tipo: TipoResena;

  /** 1 a 5 */
  @Column({ type: 'int' })
  calificacion: number;

  @Column({ type: 'varchar', nullable: true })
  titulo: string | null;

  @Column({ type: 'text' })
  comentario: string;

  /** true si el autor tiene un pedido PAGADO que incluye el libro. */
  @Column()
  verificada: boolean;

  @CreateDateColumn({ name: 'creado_en', type: 'timestamptz' })
  creadoEn: Date;

  @UpdateDateColumn({ name: 'actualizado_en', type: 'timestamptz' })
  actualizadoEn: Date;
}
