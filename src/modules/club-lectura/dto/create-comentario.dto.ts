import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateComentarioDto {
  @ApiProperty({ example: 'usr-789' })
  @IsString()
  usuarioId: string;

  @ApiProperty({ example: 'Totalmente de acuerdo, además creo que...' })
  @IsString()
  contenido: string;
}
