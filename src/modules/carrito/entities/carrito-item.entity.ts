import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Libro } from '../../libros/entities/libro.entity';

/** Cada usuario tiene un único carrito: sus filas en esta tabla. */
@Entity('carrito_items')
export class CarritoItem {
  @PrimaryColumn({ name: 'usuario_id', type: 'uuid' })
  usuarioId: string;

  @PrimaryColumn({ name: 'libro_id', type: 'uuid' })
  libroId: string;

  @ManyToOne(() => Libro, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'libro_id' })
  libro: Libro;

  @Column({ type: 'int' })
  cantidad: number;

  @CreateDateColumn({ name: 'agregado_en', type: 'timestamptz' })
  agregadoEn: Date;
}
