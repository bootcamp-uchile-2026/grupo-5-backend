import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum UsoImagen {
  PORTADA = 'PORTADA',
  GALERIA = 'GALERIA',
  GENERAL = 'GENERAL',
}

/** Metadatos de una imagen subida. El archivo vive en UPLOADS_DIR. */
@Entity('imagenes')
export class Imagen {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Nombre con que se guardó en disco (uuid + extensión). */
  @Column({ type: 'varchar', length: 80, unique: true })
  archivo: string;

  @Column({ name: 'nombre_original', type: 'varchar', length: 255 })
  nombreOriginal: string;

  @Column({ type: 'varchar', length: 40 })
  mime: string;

  /** Bytes. */
  @Column({ type: 'int' })
  tamano: number;

  @Column({ type: 'text' })
  url: string;

  @Column({ type: 'varchar', length: 20, default: UsoImagen.GENERAL })
  uso: UsoImagen;

  @Column({ name: 'libro_id', type: 'uuid', nullable: true })
  libroId: string | null;

  @Column({ name: 'subido_por', type: 'uuid', nullable: true })
  subidoPor: string | null;

  @CreateDateColumn({ name: 'creado_en', type: 'timestamptz' })
  creadoEn: Date;
}
