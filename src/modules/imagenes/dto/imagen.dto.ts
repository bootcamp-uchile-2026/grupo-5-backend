import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Imagen, UsoImagen } from '../entities/imagen.entity';

/** Esquema del formulario multipart para Swagger. */
export class SubirImagenDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description:
      'Archivo JPG, PNG o WEBP de hasta IMAGEN_MAX_MB (2 MB por defecto)',
  })
  imagen: unknown;
}

export class ImagenResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({
    example:
      'http://3.131.220.134:3000/uploads/5f0e9b7c-2d1a-4c7b-9a51-0e8f3a2b1c4d.jpg',
    description:
      'Dirección pública de la imagen, servida como archivo estático',
  })
  url: string;

  @ApiProperty({ example: 'portada-fundacion.jpg' })
  nombreOriginal: string;

  @ApiProperty({
    example: 'image/jpeg',
    enum: ['image/jpeg', 'image/png', 'image/webp'],
  })
  mime: string;

  @ApiProperty({ example: 184233, description: 'Tamaño en bytes' })
  tamano: number;

  @ApiProperty({ enum: UsoImagen })
  uso: UsoImagen;

  @ApiPropertyOptional({ format: 'uuid', nullable: true, type: String })
  libroId: string | null;

  @ApiProperty()
  creadoEn: Date;

  static desde(i: Imagen): ImagenResponseDto {
    return {
      id: i.id,
      url: i.url,
      nombreOriginal: i.nombreOriginal,
      mime: i.mime,
      tamano: i.tamano,
      uso: i.uso,
      libroId: i.libroId,
      creadoEn: i.creadoEn,
    };
  }
}
