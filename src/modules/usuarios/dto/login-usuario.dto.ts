import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginUsuarioDto {
  @ApiProperty({ example: 'camila@correo.cl' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'contraseñaSegura123' })
  @IsString()
  password: string;
}
