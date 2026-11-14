import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateClubLecturaDto {
  @ApiProperty({ format: 'uuid', description: 'Libro del catálogo a leer' })
  @IsUUID()
  libroId: string;

  @ApiProperty({ example: 'Club de lectura: Cien años de soledad' })
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  titulo: string;

  @ApiPropertyOptional({
    example: 'Leeremos y discutiremos un capítulo por semana.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  descripcion?: string;

  @ApiProperty({ example: '2026-11-01' })
  @IsDateString()
  fechaInicio: string;

  @ApiPropertyOptional({ example: '2026-12-01' })
  @IsOptional()
  @IsDateString()
  fechaFin?: string;
}
