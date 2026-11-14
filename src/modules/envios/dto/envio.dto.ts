import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

export enum MetodoEnvio {
  DESPACHO = 'DESPACHO',
  RETIRO = 'RETIRO',
}

/** Regiones de Chile, por su código habitual. */
export enum Region {
  XV = 'XV',
  I = 'I',
  II = 'II',
  III = 'III',
  IV = 'IV',
  V = 'V',
  RM = 'RM',
  VI = 'VI',
  VII = 'VII',
  XVI = 'XVI',
  VIII = 'VIII',
  IX = 'IX',
  XIV = 'XIV',
  X = 'X',
  XI = 'XI',
  XII = 'XII',
}

export class CotizarEnvioDto {
  @ApiProperty({ enum: MetodoEnvio })
  @IsEnum(MetodoEnvio)
  metodoEnvio: MetodoEnvio;

  @ApiPropertyOptional({
    enum: Region,
    description: 'Obligatoria si metodoEnvio es DESPACHO',
  })
  @ValidateIf((o: CotizarEnvioDto) => o.metodoEnvio === MetodoEnvio.DESPACHO)
  @IsEnum(Region)
  region?: Region;

  @ApiPropertyOptional({
    example: 'Ñuñoa',
    description: 'Obligatoria si metodoEnvio es DESPACHO',
  })
  @ValidateIf((o: CotizarEnvioDto) => o.metodoEnvio === MetodoEnvio.DESPACHO)
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  comuna?: string;

  @ApiProperty({
    example: 25980,
    description:
      'Subtotal de los productos (CLP), para evaluar el envío gratis',
  })
  @IsInt()
  @Min(0)
  subtotal: number;
}

export class CotizacionEnvioDto {
  @ApiProperty({ enum: MetodoEnvio })
  metodoEnvio: MetodoEnvio;

  @ApiProperty({ example: 2990, description: 'Costo del envío (CLP)' })
  costo: number;

  @ApiProperty({ example: 2, description: 'Días hábiles estimados' })
  diasEstimados: number;

  @ApiProperty({ description: 'true si aplicó envío gratis por monto' })
  gratis: boolean;

  @ApiProperty({
    example: 'Despacho Región Metropolitana',
    description: 'Regla dummy que se aplicó',
  })
  regla: string;
}
