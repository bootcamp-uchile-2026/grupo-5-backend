import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';

export class ActualizarProgresoDto {
  @ApiProperty({ example: 120 })
  @IsInt()
  @Min(0)
  paginaActual: number;

  @ApiProperty({ example: 35 })
  @IsInt()
  @Min(0)
  @Max(100)
  porcentaje: number;
}
