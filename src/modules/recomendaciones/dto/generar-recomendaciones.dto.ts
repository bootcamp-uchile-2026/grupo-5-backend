import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';

export class GenerarRecomendacionesQueryDto {
  @ApiPropertyOptional({ example: 5, description: 'Cantidad máxima de recomendaciones a devolver' })
  @IsOptional()
  @IsInt()
  @Min(1)
  limite?: number;
}
