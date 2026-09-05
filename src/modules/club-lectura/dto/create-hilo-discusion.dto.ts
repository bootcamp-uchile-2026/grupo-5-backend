import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateHiloDiscusionDto {
  @ApiProperty({ example: 'usr-123' })
  @IsString()
  usuarioId: string;

  @ApiProperty({ example: '¿Qué opinan del realismo mágico en el capítulo 3?' })
  @IsString()
  titulo: string;

  @ApiProperty({ example: 'Me llamó la atención cómo Márquez mezcla lo cotidiano con lo fantástico...' })
  @IsString()
  contenido: string;
}
