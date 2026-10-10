import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum FormatoLibro {
  FISICO = 'FISICO',
  EBOOK = 'EBOOK',
  AUDIOLIBRO = 'AUDIOLIBRO',
}

export enum EstadoLibro {
  DISPONIBLE = 'DISPONIBLE',
  PREVENTA = 'PREVENTA',
}

@Entity('libros')
export class Libro {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  isbn: string;

  @Column()
  titulo: string;

  @Column()
  autor: string;

  @Column()
  genero: string;

  @Column({ name: 'descripcion', type: 'text', nullable: true })
  sinopsis: string | null;

  @Column({ type: 'varchar', nullable: true })
  editorial: string | null;

  @Column({ name: 'anio_publicacion', type: 'int', nullable: true })
  anioPublicacion: number | null;

  @Column({ type: 'varchar', length: 20 })
  formato: FormatoLibro;

  @Column({ type: 'varchar', length: 20 })
  estado: EstadoLibro;

  /** Precio en pesos chilenos (CLP), sin decimales. */
  @Column({ type: 'int' })
  precio: number;

  @Column({ type: 'int' })
  stock: number;

  @Column({ name: 'portada_url', type: 'text', nullable: true })
  portadaUrl: string | null;

  /** Borrado lógico: los pedidos históricos siguen apuntando al libro. */
  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'fecha_ingreso', type: 'timestamptz' })
  fechaIngreso: Date;
}
