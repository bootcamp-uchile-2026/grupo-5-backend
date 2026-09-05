import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class CreatePerfilLibreroDto {
  @ApiProperty({ example: 'usr-123', description: 'id del Usuario con rol LIBRERO' })
  @IsString()
  usuarioId: string;

  @ApiProperty({ example: 'El rincón de Marta' })
  @IsString()
  alias: string;

  @ApiProperty({ example: 'Amante de la ciencia ficción y la poesía latinoamericana.' })
  @IsString()
  bio: string;

  @ApiPropertyOptional({ example: 'Cercano, directo, con humor.' })
  @IsOptional()
  @IsString()
  estiloEditorial?: string;

  @ApiProperty({ example: ['Ciencia ficción', 'Poesía'] })
  @IsArray()
  especialidades: string[];

  @ApiPropertyOptional({ example: 'https://.../marta.jpg' })
  @IsOptional()
  @IsString()
  fotoUrl?: string;
}
