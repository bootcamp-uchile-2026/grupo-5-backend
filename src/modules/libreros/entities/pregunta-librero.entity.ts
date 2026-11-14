import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

/** Pregunta del formulario "¿No sabes qué leer?" del perfil de un librero. */
@Entity('preguntas_librero')
export class PreguntaLibrero {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'librero_id', type: 'uuid' })
  libreroId: string;

  @Column({ name: 'usuario_id', type: 'uuid', nullable: true })
  usuarioId: string | null;

  @Column({ type: 'varchar', length: 80 })
  nombre: string;

  @Column({ type: 'varchar', length: 254 })
  email: string;

  @Column({ type: 'text' })
  pregunta: string;

  @Column({ type: 'text', nullable: true })
  respuesta: string | null;

  @CreateDateColumn({ name: 'creado_en', type: 'timestamptz' })
  creadoEn: Date;

  @Column({ name: 'respondida_en', type: 'timestamptz', nullable: true })
  respondidaEn: Date | null;
}
