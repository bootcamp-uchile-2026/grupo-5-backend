import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AgregarLibroListaDto {
  @ApiProperty({ example: 'libro-456' })
  @IsString()
  libroId: string;
}
