import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Min } from 'class-validator';

export class CreateSeccionCuradaDto {
  @ApiProperty({ example: 'libro-456' })
  @IsString()
  libroId: string;

  @ApiProperty({ example: 'Este libro me acompañó en un viaje que cambió mi forma de leer.' })
  @IsString()
  notaPersonal: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(0)
  orden: number;
}
