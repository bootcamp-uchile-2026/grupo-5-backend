import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('suscripciones_newsletter')
export class SuscripcionNewsletter {
  @PrimaryColumn()
  email: string;

  @Column({ name: 'usuario_id', type: 'uuid', nullable: true })
  usuarioId: string | null;

  @Column({ default: true })
  activa: boolean;

  /** Token del enlace "darse de baja" del correo; no requiere iniciar sesión. */
  @Column({ name: 'token_baja', type: 'uuid', insert: false, update: false })
  tokenBaja: string;

  @CreateDateColumn({ name: 'creado_en', type: 'timestamptz' })
  creadoEn: Date;

  @Column({ name: 'baja_en', type: 'timestamptz', nullable: true })
  bajaEn: Date | null;
}
