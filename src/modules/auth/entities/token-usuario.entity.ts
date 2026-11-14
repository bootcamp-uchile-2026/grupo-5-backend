import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum TipoTokenUsuario {
  VERIFICACION_EMAIL = 'VERIFICACION_EMAIL',
  RECUPERACION_PASSWORD = 'RECUPERACION_PASSWORD',
}

/** Token de un solo uso enviado por correo. Solo se guarda su SHA-256. */
@Entity('tokens_usuario')
export class TokenUsuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'usuario_id', type: 'uuid' })
  usuarioId: string;

  @Column({ type: 'varchar', length: 30 })
  tipo: TipoTokenUsuario;

  @Column({ name: 'token_hash', type: 'char', length: 64 })
  tokenHash: string;

  @Column({ name: 'expira_en', type: 'timestamptz' })
  expiraEn: Date;

  @Column({ name: 'usado_en', type: 'timestamptz', nullable: true })
  usadoEn: Date | null;

  @CreateDateColumn({ name: 'creado_en', type: 'timestamptz' })
  creadoEn: Date;
}
