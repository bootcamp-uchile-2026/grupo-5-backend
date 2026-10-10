import { ApiProperty } from '@nestjs/swagger';
import { Rol, Usuario } from '../entities/usuario.entity';

/** Representación pública de un usuario: nunca incluye la contraseña. */
export class UsuarioResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Camila Rojas' })
  nombre: string;

  @ApiProperty({ example: 'camila@correo.cl' })
  email: string;

  @ApiProperty({ enum: Rol })
  rol: Rol;

  @ApiProperty({ type: [String], example: ['Ciencia ficción'] })
  generosFavoritos: string[];

  @ApiProperty({ nullable: true, type: String })
  avatarUrl: string | null;

  @ApiProperty()
  fechaRegistro: Date;

  static desde(u: Usuario): UsuarioResponseDto {
    return {
      id: u.id,
      nombre: u.nombre,
      email: u.email,
      rol: u.rol,
      generosFavoritos: u.generosFavoritos ?? [],
      avatarUrl: u.avatarUrl ?? null,
      fechaRegistro: u.creadoEn,
    };
  }
}
