import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UsuarioResponseDto } from '../../usuarios/dto/usuario-response.dto';

export class AuthResponseDto {
  @ApiProperty({
    description:
      'JWT firmado. Se envía en el header Authorization: Bearer <token>',
  })
  accessToken: string;

  @ApiProperty({ example: 'Bearer' })
  tokenType: string;

  @ApiProperty({
    example: '2h',
    description: 'Vigencia del token (JWT_EXPIRES_IN)',
  })
  expiresIn: string;

  @ApiProperty({
    description:
      'Token para pedir un accessToken nuevo con POST /auth/refresh sin volver a iniciar sesión',
  })
  refreshToken: string;

  @ApiProperty({
    example: '7d',
    description: 'Vigencia del refreshToken (JWT_REFRESH_EXPIRES_IN)',
  })
  refreshExpiresIn: string;

  @ApiProperty({ type: UsuarioResponseDto })
  usuario: UsuarioResponseDto;

  @ApiPropertyOptional({
    description:
      'Solo al registrarse en desarrollo con EXPONER_TOKENS_DEV=true: token de verificación de correo',
  })
  tokenVerificacionDesarrollo?: string;
}
