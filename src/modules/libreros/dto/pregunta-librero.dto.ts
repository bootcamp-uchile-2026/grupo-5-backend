import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { normalizarEmail } from '../../newsletter/dto/newsletter.dto';
import { PreguntaLibrero } from '../entities/pregunta-librero.entity';

export class CrearPreguntaLibreroDto {
  @ApiProperty({ example: 'Camila' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  nombre: string;

  @ApiProperty({
    example: 'camila@correo.cl',
    description: 'Para recibir la respuesta',
  })
  @Transform(normalizarEmail)
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Me gustó mucho Rayuela, ¿qué me recomiendas leer después?',
    minLength: 10,
    maxLength: 1000,
  })
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  pregunta: string;
}

export class ResponderPreguntaDto {
  @ApiProperty({
    example: 'Te recomiendo "Los detectives salvajes" de Bolaño.',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(2000)
  respuesta: string;
}

export class PreguntaEnviadaDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({
    example: 'Lucía recibió tu pregunta y te responderá a camila@correo.cl',
  })
  mensaje: string;
}

export class PreguntaLibreroDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  nombre: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  pregunta: string;

  @ApiPropertyOptional({ nullable: true, type: String })
  respuesta: string | null;

  @ApiProperty()
  creadoEn: Date;

  @ApiPropertyOptional({ nullable: true, type: Date })
  respondidaEn: Date | null;

  static desde(p: PreguntaLibrero): PreguntaLibreroDto {
    return {
      id: p.id,
      nombre: p.nombre,
      email: p.email,
      pregunta: p.pregunta,
      respuesta: p.respuesta,
      creadoEn: p.creadoEn,
      respondidaEn: p.respondidaEn,
    };
  }
}
