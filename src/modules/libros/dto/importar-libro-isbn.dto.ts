import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ImportarLibroPorIsbnDto {
  @ApiProperty({ example: '9788433979107', description: 'ISBN a buscar en Open Library' })
  @IsString()
  isbn: string;
}
