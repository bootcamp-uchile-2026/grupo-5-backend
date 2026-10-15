import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum Rol {
  CLIENTE = 'CLIENTE',
  LIBRERO = 'LIBRERO',
  ADMIN = 'ADMIN',
}

/** Cómo se creó la cuenta: con email y contraseña o con un proveedor externo. */
export enum ProveedorAuth {
  LOCAL = 'LOCAL',
  GOOGLE = 'GOOGLE',
  FACEBOOK = 'FACEBOOK',
}

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;

  @Column({ type: 'varchar', nullable: true })
  apellido: string | null;

  @Column({ unique: true })
  email: string;

  /** null en cuentas creadas con Google/Facebook que nunca definieron contraseña. */
  @Column({ name: 'password_hash', type: 'varchar', nullable: true })
  passwordHash: string | null;

  @Column({ type: 'varchar', length: 20 })
  rol: Rol;

  @Column('text', { name: 'generos_favoritos', array: true })
  generosFavoritos: string[];

  @Column({ name: 'avatar_url', type: 'text', nullable: true })
  avatarUrl: string | null;

  /** "Recibir novedades" del formulario de registro: suscribe al newsletter. */
  @Column({ name: 'recibir_novedades', default: false })
  recibirNovedades: boolean;

  @Column({ name: 'email_verificado', default: false })
  emailVerificado: boolean;

  @Column({
    name: 'proveedor_auth',
    type: 'varchar',
    length: 20,
    default: ProveedorAuth.LOCAL,
  })
  proveedorAuth: ProveedorAuth;

  /** Id del usuario en Google/Facebook (claim "sub" o id de la Graph API). */
  @Column({ name: 'proveedor_id', type: 'varchar', nullable: true })
  proveedorId: string | null;

  @CreateDateColumn({ name: 'creado_en', type: 'timestamptz' })
  creadoEn: Date;

  @UpdateDateColumn({ name: 'actualizado_en', type: 'timestamptz' })
  actualizadoEn: Date;
}
