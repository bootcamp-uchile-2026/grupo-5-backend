import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDefined,
  IsEmail,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { CANTIDAD_MAXIMA_POR_LIBRO } from '../../carrito/dto/carrito.dto';
import { normalizarCodigo } from '../../cupones/dto/cupon.dto';
import { MetodoEnvio, Region } from '../../envios/dto/envio.dto';
import { normalizarEmail } from '../../newsletter/dto/newsletter.dto';

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

  @ApiPropertyOptional({
    example: 'BIENVENIDA10',
    description:
      'Código de descuento (validar antes con POST /cupones/validar)',
  })
  @IsOptional()
  @Transform(normalizarCodigo)
  @Matches(/^[A-Z0-9_-]{3,30}$/, { message: 'codigoDescuento inválido' })
  codigoDescuento?: string;
}

export class ItemInvitadoDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  libroId: string;

  @ApiProperty({ minimum: 1, maximum: CANTIDAD_MAXIMA_POR_LIBRO, example: 1 })
  @IsInt()
  @Min(1)
  @Max(CANTIDAD_MAXIMA_POR_LIBRO)
  cantidad: number;
}

/**
 * Compra como invitado: sin cuenta ni carrito en el servidor. Los libros van
 * en el body (el Front guarda el carrito localmente).
 */
export class CrearPedidoInvitadoDto extends CreatePedidoDto {
  @ApiProperty({
    example: 'invitado@correo.cl',
    description: 'Para la confirmación y para consultar el pedido',
  })
  @Transform(normalizarEmail)
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Camila Rojas' })
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  nombre: string;

  @ApiProperty({ type: [ItemInvitadoDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => ItemInvitadoDto)
  items: ItemInvitadoDto[];
}
