import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { Rol } from '../../usuarios/entities/usuario.entity';
import { Resena, TipoResena } from '../entities/resena.entity';

export enum OrdenResenas {
  RECIENTES = 'recientes',
  MEJOR_CALIFICADAS = 'mejor_calificadas',
  PEOR_CALIFICADAS = 'peor_calificadas',
}

export class ListarResenasQueryDto {
  @ApiPropertyOptional({
    enum: TipoResena,
    description:
      'LECTOR (opiniones de lectores) o LIBRERO (reseñas de libreros)',
  })
  @IsOptional()
  @IsEnum(TipoResena)
  tipo?: TipoResena;

  @ApiPropertyOptional({ description: 'true: solo compras verificadas' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean()
  soloVerificadas?: boolean;

  @ApiPropertyOptional({ enum: OrdenResenas, default: OrdenResenas.RECIENTES })
  @IsOptional()
  @IsEnum(OrdenResenas)
  orden?: OrdenResenas = OrdenResenas.RECIENTES;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}

export class AutorResenaDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({
    example: 'Camila R.',
    description: 'Nombre e inicial del apellido',
  })
  nombre: string;

  @ApiProperty({ nullable: true, type: String })
  avatarUrl: string | null;

  @ApiProperty({ enum: Rol })
  rol: Rol;
}

export class ResenaResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  libroId: string;

  @ApiProperty({ format: 'uuid' })
  usuarioId: string;

  @ApiProperty({ type: AutorResenaDto })
  autor: AutorResenaDto;

  @ApiProperty({ enum: TipoResena })
  tipo: TipoResena;

  @ApiProperty({ example: 5 })
  calificacion: number;

  @ApiProperty({ nullable: true, type: String })
  titulo: string | null;

  @ApiProperty()
  comentario: string;

  @ApiProperty({ description: 'Compra verificada' })
  verificada: boolean;

  @ApiProperty({ description: 'Fecha de creación (nombre del Hito 1)' })
  fecha: Date;

  @ApiProperty()
  creadoEn: Date;

  @ApiProperty()
  actualizadoEn: Date;

  static desde(r: Resena): ResenaResponseDto {
    const u = r.usuario;
    const inicial = u?.apellido ? ` ${u.apellido.charAt(0)}.` : '';
    return {
      id: r.id,
      libroId: r.libroId,
      usuarioId: r.usuarioId,
      autor: {
        id: r.usuarioId,
        nombre: u ? `${u.nombre}${inicial}` : 'Lector',
        avatarUrl: u?.avatarUrl ?? null,
        rol: u?.rol ?? Rol.CLIENTE,
      },
      tipo: r.tipo,
      calificacion: r.calificacion,
      titulo: r.titulo,
      comentario: r.comentario,
      verificada: r.verificada,
      fecha: r.creadoEn,
      creadoEn: r.creadoEn,
      actualizadoEn: r.actualizadoEn,
    };
  }
}

export class ResumenCalificacionDto {
  @ApiProperty({ example: 4.5 })
  promedio: number;

  @ApiProperty({ example: 18 })
  cantidad: number;

  @ApiProperty({
    example: { '1': 0, '2': 1, '3': 2, '4': 5, '5': 10 },
    description: 'Cantidad de reseñas por estrella',
  })
  distribucion: Record<'1' | '2' | '3' | '4' | '5', number>;
}

export class ResenasPaginadasDto {
  @ApiProperty({ type: [ResenaResponseDto] })
  items: ResenaResponseDto[];

  @ApiProperty({ example: 2 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 1 })
  totalPages: number;

  @ApiProperty({
    type: ResumenCalificacionDto,
    description: 'Resumen de todas las reseñas del libro (sin filtros)',
  })
  resumen: ResumenCalificacionDto;
}
