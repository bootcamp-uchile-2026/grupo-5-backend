import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { normalizarEmail } from '../../newsletter/dto/newsletter.dto';

const TOKEN = /^[a-f0-9]{64}$/;

export class TokenCuentaDto {
  @ApiProperty({
    description:
      'Token del enlace recibido por correo (64 caracteres hexadecimales)',
  })
  @Matches(TOKEN, { message: 'token inválido' })
  token: string;
}

export class OlvidePasswordDto {
  @ApiProperty({ example: 'cliente@leeconnos.cl' })
  @Transform(normalizarEmail)
  @IsEmail()
  email: string;
}

export class RestablecerPasswordDto extends TokenCuentaDto {
  @ApiProperty({ example: 'nueva-clave-segura', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'refreshToken entregado por login o registro' })
  @IsString()
  @MinLength(10)
  refreshToken: string;
}

export class GoogleLoginDto {
  @ApiProperty({
    description:
      'ID token (JWT) que entrega Google Identity Services en el Front (credential)',
  })
  @IsString()
  @MinLength(10)
  idToken: string;
}

export class FacebookLoginDto {
  @ApiProperty({
    description: 'accessToken que entrega el SDK de Facebook Login en el Front',
  })
  @IsString()
  @MinLength(10)
  accessToken: string;
}

/** Respuesta de las acciones que envían un correo. */
export class MensajeCuentaDto {
  @ApiProperty({
    example:
      'Si el email está registrado, te enviamos un enlace para continuar.',
  })
  mensaje: string;

  @ApiPropertyOptional({
    description:
      'Solo en desarrollo con EXPONER_TOKENS_DEV=true: el token que iría en el correo (no hay proveedor de correo real)',
  })
  tokenDesarrollo?: string;
}
