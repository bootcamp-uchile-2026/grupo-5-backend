import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Libro } from '../../libros/entities/libro.entity';

/** Uno de los cinco libros indispensables del perfil (puede no estar en el catálogo). */
export interface LibroIndispensable {
  titulo: string;
  autor: string;
  libroId: string | null;
}

/** Perfil editorial de un librero: su voz propia dentro de la tienda. */
@Entity('libreros')
export class Librero {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'usuario_id', type: 'uuid', nullable: true })
  usuarioId: string | null;

  /** Id legible para la URL, p. ej. "gregorio-samsa". */
  @Column({ unique: true })
  slug: string;

  @Column()
  nombre: string;

  @Column({ name: 'nombre_corto' })
  nombreCorto: string;

  @Column({ type: 'text', nullable: true })
  cita: string | null;

  @Column({ type: 'text' })
  biografia: string;

  @Column({ name: 'foto_url', type: 'text', nullable: true })
  fotoUrl: string | null;

  @Column('text', { array: true, default: () => "'{}'" })
  etiquetas: string[];

  @Column('text', { array: true, default: () => "'{}'" })
  estilos: string[];

  @Column('text', {
    name: 'autores_favoritos',
    array: true,
    default: () => "'{}'",
  })
  autoresFavoritos: string[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  indispensables: LibroIndispensable[];

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'creado_en', type: 'timestamptz' })
  creadoEn: Date;
}

/** Libro del catálogo recomendado por un librero, con su nota personal. */
@Entity('recomendaciones_librero')
export class RecomendacionLibrero {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'librero_id', type: 'uuid' })
  libreroId: string;

  @ManyToOne(() => Librero, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'librero_id' })
  librero: Librero;

  @Column({ name: 'libro_id', type: 'uuid' })
  libroId: string;

  @ManyToOne(() => Libro, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'libro_id' })
  libro: Libro;

  @Column({ type: 'text' })
  nota: string;

  /** true: aparece en "Recomendados de nuestros libreros" del Home. */
  @Column({ default: false })
  destacada: boolean;

  @Column({ type: 'int', default: 0 })
  orden: number;

  @CreateDateColumn({ name: 'creado_en', type: 'timestamptz' })
  creadoEn: Date;
}

@Entity('colecciones')
export class Coleccion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'librero_id', type: 'uuid' })
  libreroId: string;

  @Column()
  titulo: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Column({ name: 'publicada_en', type: 'date' })
  publicadaEn: string;

  @Column('uuid', { array: true, default: () => "'{}'" })
  libros: string[];
}
