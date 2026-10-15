import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class LibroIndispensableDto {
  @ApiProperty({ example: 'El proceso' })
  @IsString()
  @MaxLength(200)
  titulo: string;

  @ApiProperty({ example: 'Franz Kafka' })
  @IsString()
  @MaxLength(120)
  autor: string;

  @ApiPropertyOptional({
    format: 'uuid',
    nullable: true,
    description: 'Libro del catálogo, si existe',
  })
  @IsOptional()
  @IsUUID()
  libroId?: string | null;
}

export class CreatePerfilLibreroDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Usuario con rol LIBRERO dueño del perfil',
  })
  @IsUUID()
  usuarioId: string;

  @ApiProperty({
    example: 'gregorio-samsa',
    description: 'Id legible para la URL: minúsculas, números y guiones',
  })
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    message: 'slug solo admite minúsculas, números y guiones',
  })
  @MaxLength(80)
  slug: string;

  @ApiProperty({ example: 'Gregorio Samsa' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nombre: string;

  @ApiProperty({ example: 'Gregorio S.' })
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  nombreCorto: string;

  @ApiPropertyOptional({
    example: 'Me gustan los libros que terminan y te dejan mirando el techo.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  cita?: string;

  @ApiProperty({
    example:
      'Te recomiendo historias extrañas, incómodas y profundamente humanas.',
  })
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  biografia: string;

  @ApiPropertyOptional({ example: 'https://example.com/foto.jpg' })
  @IsOptional()
  @IsUrl()
  fotoUrl?: string;

  @ApiPropertyOptional({ type: [String], example: ['Existencialismo'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  etiquetas?: string[];

  @ApiPropertyOptional({
    type: [String],
    example: ['Distopía', 'Crítica social'],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(15)
  @IsString({ each: true })
  estilos?: string[];

  @ApiPropertyOptional({ type: [String], example: ['Franz Kafka'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(15)
  @IsString({ each: true })
  autoresFavoritos?: string[];

  @ApiPropertyOptional({
    type: [LibroIndispensableDto],
    description: 'Top 5 libros indispensables',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => LibroIndispensableDto)
  indispensables?: LibroIndispensableDto[];
}
