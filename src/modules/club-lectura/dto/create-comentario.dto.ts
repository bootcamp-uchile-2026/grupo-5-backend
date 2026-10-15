import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateComentarioDto {
  @ApiPropertyOptional({
    deprecated: true,
    description: 'Ignorado: el autor es el usuario del token',
  })
  @IsOptional()
  @IsString()
  usuarioId?: string;

  @ApiProperty({ example: 'Totalmente de acuerdo, además creo que...' })
  @IsString()
  @MinLength(1)
  @MaxLength(3000)
  contenido: string;
}
