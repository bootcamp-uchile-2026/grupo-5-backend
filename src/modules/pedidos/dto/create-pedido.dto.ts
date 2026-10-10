import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDefined,
  IsEnum,
  IsObject,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { MetodoEnvio, Region } from '../../envios/dto/envio.dto';

export class DireccionDto {
  @ApiProperty({
    example: 'Camila Rojas',
    description: 'Quién recibe el pedido',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  nombreReceptor: string;

  @ApiProperty({ example: 'Av. Irarrázaval 2401, depto 52' })
  @IsString()
  @MinLength(5)
  @MaxLength(120)
  calle: string;

  @ApiProperty({ example: 'Ñuñoa' })
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  comuna: string;

  @ApiProperty({ enum: Region, example: Region.RM })
  @IsEnum(Region)
  region: Region;

  @ApiProperty({
    example: '+56912345678',
    description: 'Celular chileno con o sin +56',
  })
  @Matches(/^(\+?56)?9\d{8}$/, {
    message: 'telefono debe ser un celular chileno, por ejemplo +56912345678',
  })
  telefono: string;
}

/** Checkout: convierte el carrito del usuario en un pedido pendiente de pago. */
export class CreatePedidoDto {
  @ApiProperty({ enum: MetodoEnvio })
  @IsEnum(MetodoEnvio)
  metodoEnvio: MetodoEnvio;

  @ApiPropertyOptional({
    type: DireccionDto,
    description: 'Obligatoria si metodoEnvio es DESPACHO',
  })
  @ValidateIf(
    (o: CreatePedidoDto) =>
      o.metodoEnvio === MetodoEnvio.DESPACHO || o.direccion !== undefined,
  )
  @IsDefined({
    message: 'direccion es obligatoria cuando metodoEnvio es DESPACHO',
  })
  @IsObject()
  @ValidateNested()
  @Type(() => DireccionDto)
  direccion?: DireccionDto;
}
