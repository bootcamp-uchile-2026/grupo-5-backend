import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Libro } from '../../libros/entities/libro.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';

@Entity('clubes_lectura')
export class ClubLectura {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'libro_id', type: 'uuid' })
  libroId: string;

  @ManyToOne(() => Libro)
  @JoinColumn({ name: 'libro_id' })
  libro: Libro;

  @Column({ name: 'creador_id', type: 'uuid', nullable: true })
  creadorId: string | null;

  @Column()
  titulo: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Column({ name: 'fecha_inicio', type: 'date' })
  fechaInicio: string;

  @Column({ name: 'fecha_fin', type: 'date', nullable: true })
  fechaFin: string | null;

  @CreateDateColumn({ name: 'creado_en', type: 'timestamptz' })
  creadoEn: Date;
}

/** Participante de un club y su progreso de lectura. */
@Entity('club_participantes')
export class ClubParticipante {
  @PrimaryColumn({ name: 'club_id', type: 'uuid' })
  clubId: string;

  @PrimaryColumn({ name: 'usuario_id', type: 'uuid' })
  usuarioId: string;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column({ name: 'pagina_actual', type: 'int', default: 0 })
  paginaActual: number;

  /** 0 a 100 */
  @Column({ type: 'int', default: 0 })
  porcentaje: number;

  @CreateDateColumn({ name: 'unido_en', type: 'timestamptz' })
  unidoEn: Date;

  @UpdateDateColumn({ name: 'actualizado_en', type: 'timestamptz' })
  actualizadoEn: Date;
}

@Entity('club_hilos')
export class HiloDiscusion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'club_id', type: 'uuid' })
  clubLecturaId: string;

  @Column({ name: 'usuario_id', type: 'uuid' })
  usuarioId: string;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column()
  titulo: string;

  @Column({ type: 'text' })
  contenido: string;

  @CreateDateColumn({ name: 'creado_en', type: 'timestamptz' })
  fechaCreacion: Date;
}

@Entity('club_comentarios')
export class ComentarioHilo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'hilo_id', type: 'uuid' })
  hiloId: string;

  @Column({ name: 'usuario_id', type: 'uuid' })
  usuarioId: string;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column({ type: 'text' })
  contenido: string;

  @CreateDateColumn({ name: 'creado_en', type: 'timestamptz' })
  fechaCreacion: Date;
}
