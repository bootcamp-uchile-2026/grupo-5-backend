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

  /** Precio antes del descuento (CLP). Si existe, el libro está "en oferta". */
  @Column({ name: 'precio_anterior', type: 'int', nullable: true })
  precioAnterior: number | null;

  @Column({ type: 'varchar', nullable: true })
  subgenero: string | null;

  @Column({ type: 'varchar', nullable: true })
  encuadernacion: string | null;

  @Column({ type: 'int', nullable: true })
  paginas: number | null;

  @Column({ type: 'varchar', nullable: true })
  dimensiones: string | null;

  @Column('text', { array: true, default: () => "'{}'" })
  etiquetas: string[];

  /** Géneros y temáticas del menú de UX (tabla categorias). */
  @Column('text', { array: true, default: () => "'{}'" })
  categorias: string[];

  @Column({ name: 'video_url', type: 'text', nullable: true })
  videoUrl: string | null;

  @Column('text', { array: true, default: () => "'{}'" })
  galeria: string[];

  /** Promedio de las reseñas (0 a 5); lo mantiene el módulo de reseñas. */
  @Column({
    type: 'numeric',
    precision: 2,
    scale: 1,
    default: 0,
    transformer: { to: (v: number) => v, from: (v: string) => Number(v) },
  })
  calificacion: number;

  /** Cantidad de reseñas. */
  @Column({ type: 'int', default: 0 })
  opiniones: number;

  /** Unidades vendidas (históricas + pedidos pagados). */
  @Column({ type: 'int', default: 0 })
  ventas: number;

  /** Borrado lógico: los pedidos históricos siguen apuntando al libro. */
  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'fecha_ingreso', type: 'timestamptz' })
  fechaIngreso: Date;
}
