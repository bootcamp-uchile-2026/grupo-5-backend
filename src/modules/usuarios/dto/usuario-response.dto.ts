import { ApiProperty } from '@nestjs/swagger';
import { ProveedorAuth, Rol, Usuario } from '../entities/usuario.entity';

/** Representación pública de un usuario: nunca incluye la contraseña. */
export class UsuarioResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Camila', description: 'Usar en el saludo' })
  nombre: string;

  @ApiProperty({ nullable: true, type: String, example: 'Rojas' })
  apellido: string | null;

  @ApiProperty({ example: 'Camila Rojas' })
  nombreCompleto: string;

  @ApiProperty({ example: 'camila@correo.cl' })
  email: string;

  @ApiProperty({ enum: Rol })
  rol: Rol;

  @ApiProperty({ type: [String], example: ['Ciencia ficción'] })
  generosFavoritos: string[];

  @ApiProperty({ nullable: true, type: String })
  avatarUrl: string | null;

  @ApiProperty({ description: 'Suscrito al newsletter ("Recibir novedades")' })
  recibirNovedades: boolean;

  @ApiProperty({
    description: 'false hasta que confirme el enlace enviado por correo',
  })
  emailVerificado: boolean;

  @ApiProperty({ enum: ProveedorAuth, description: 'LOCAL, GOOGLE o FACEBOOK' })
  proveedorAuth: ProveedorAuth;

  @ApiProperty({
    description: 'false en cuentas sociales sin contraseña propia',
  })
  tieneContrasena: boolean;

  @ApiProperty()
  fechaRegistro: Date;

  @ApiProperty({
    description: 'Igual a fechaRegistro (nombre que usa el Front)',
  })
  creadoEn: Date;

  static desde(u: Usuario): UsuarioResponseDto {
    return {
      id: u.id,
      nombre: u.nombre,
      apellido: u.apellido ?? null,
      nombreCompleto: [u.nombre, u.apellido].filter(Boolean).join(' '),
      email: u.email,
      rol: u.rol,
      generosFavoritos: u.generosFavoritos ?? [],
      avatarUrl: u.avatarUrl ?? null,
      recibirNovedades: u.recibirNovedades ?? false,
      emailVerificado: u.emailVerificado ?? false,
      proveedorAuth: u.proveedorAuth ?? ProveedorAuth.LOCAL,
      tieneContrasena: Boolean(u.passwordHash),
      fechaRegistro: u.creadoEn,
      creadoEn: u.creadoEn,
    };
  }
}
