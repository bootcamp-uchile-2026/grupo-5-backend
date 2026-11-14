import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateListaDeseosDto {
  @ApiPropertyOptional({
    deprecated: true,
    description: 'Ignorado: la lista es del usuario del token',
  })
  @IsOptional()
  @IsString()
  usuarioId?: string;

  @ApiProperty({ example: 'Regalos de cumpleaños para mi hermana' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  nombre: string;

  @ApiPropertyOptional({ example: true, default: false })
  @IsOptional()
  @IsBoolean()
  esParaRegalo?: boolean;
}
