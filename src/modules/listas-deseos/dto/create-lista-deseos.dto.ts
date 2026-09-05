import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateListaDeseosDto {
  @ApiProperty({ example: 'usr-123' })
  @IsString()
  usuarioId: string;

  @ApiProperty({ example: 'Regalos de cumpleaños para mi hermana' })
  @IsString()
  nombre: string;

  @ApiPropertyOptional({ example: true, default: false })
  @IsOptional()
  @IsBoolean()
  esParaRegalo?: boolean;
}
