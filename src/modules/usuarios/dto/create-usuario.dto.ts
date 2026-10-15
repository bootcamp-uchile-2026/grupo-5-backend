import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Rol } from '../entities/usuario.entity';

export class CreateUsuarioDto {
  @ApiProperty({
    example: 'Camila',
    description:
      'Nombre. Si no se envía apellido se guarda tal cual (compatibilidad con el Hito 2).',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  nombre: string;

  @ApiPropertyOptional({ example: 'Rojas' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  apellido?: string;

  @ApiProperty({
    example: 'camila@correo.cl',
    description: 'Se guarda en minúsculas; debe ser único',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'contraseña123',
    minLength: 8,
    description: 'Se almacena hasheada con bcrypt',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @ApiPropertyOptional({
    enum: Rol,
    default: Rol.CLIENTE,
    description:
      'Se mantiene por compatibilidad con el Hito 1. El registro público solo acepta CLIENTE.',
  })
  @IsOptional()
  @IsEnum(Rol)
  rol?: Rol;

  @ApiPropertyOptional({
    example: ['Ciencia ficción', 'Novela'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  generosFavoritos?: string[];

  @ApiPropertyOptional({ example: 'https://i.pravatar.cc/150?img=5' })
  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @ApiPropertyOptional({
    default: false,
    description:
      'Casilla "Recibir novedades": suscribe el email al newsletter (se puede cambiar después)',
  })
  @IsOptional()
  @IsBoolean()
  recibirNovedades?: boolean;
}
