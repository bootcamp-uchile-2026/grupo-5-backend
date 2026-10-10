import { ApiProperty } from '@nestjs/swagger';
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

  @ApiProperty({ type: UsuarioResponseDto })
  usuario: UsuarioResponseDto;
}
