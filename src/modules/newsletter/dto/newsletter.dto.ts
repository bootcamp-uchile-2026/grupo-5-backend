import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsUUID } from 'class-validator';
import { SuscripcionNewsletter } from '../entities/suscripcion-newsletter.entity';

export const normalizarEmail = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class SuscribirNewsletterDto {
  @ApiProperty({ example: 'camila@correo.cl' })
  @Transform(normalizarEmail)
  @IsEmail()
  email: string;
}

export class BajaNewsletterDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Token del enlace "darse de baja" incluido en cada correo',
  })
  @IsUUID()
  token: string;
}

export class SuscripcionResponseDto {
  @ApiProperty({ example: 'camila@correo.cl' })
  email: string;

  @ApiProperty()
  activa: boolean;

  @ApiProperty()
  creadoEn: Date;

  static desde(s: SuscripcionNewsletter): SuscripcionResponseDto {
    return { email: s.email, activa: s.activa, creadoEn: s.creadoEn };
  }
}
