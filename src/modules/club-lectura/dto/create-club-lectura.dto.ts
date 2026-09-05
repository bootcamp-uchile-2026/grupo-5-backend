import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateClubLecturaDto {
  @ApiProperty({ example: 'libro-456' })
  @IsString()
  libroId: string;

  @ApiProperty({ example: 'Club de lectura: Cien años de soledad' })
  @IsString()
  titulo: string;

  @ApiPropertyOptional({ example: 'Leeremos y discutiremos un capítulo por semana.' })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiProperty({ example: '2026-08-01' })
  @IsDateString()
  fechaInicio: string;

  @ApiPropertyOptional({ example: '2026-09-01' })
  @IsOptional()
  @IsDateString()
  fechaFin?: string;
}
