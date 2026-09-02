import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { RolUsuario } from '../entities/usuario.entity';

export class CreateUsuarioDto {
  @ApiProperty({ example: 'Camila Rojas' })
  @IsString()
  nombre: string;

  @ApiProperty({ example: 'camila@correo.cl' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'contraseñaSegura123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ enum: RolUsuario, example: RolUsuario.CLIENTE })
  @IsEnum(RolUsuario)
  rol: RolUsuario;

  @ApiPropertyOptional({ example: ['Ciencia ficción', 'Poesía'] })
  @IsOptional()
  @IsArray()
  generosFavoritos?: string[];
}
