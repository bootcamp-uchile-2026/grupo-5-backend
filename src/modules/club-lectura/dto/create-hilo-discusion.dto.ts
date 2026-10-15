import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateHiloDiscusionDto {
  @ApiPropertyOptional({
    deprecated: true,
    description: 'Ignorado: el autor es el usuario del token',
  })
  @IsOptional()
  @IsString()
  usuarioId?: string;

  @ApiProperty({ example: '¿Qué opinan del realismo mágico en el capítulo 3?' })
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  titulo: string;

  @ApiProperty({
    example:
      'Me llamó la atención cómo Márquez mezcla lo cotidiano con lo fantástico...',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  contenido: string;
}
