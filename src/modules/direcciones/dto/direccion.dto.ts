import {
  ApiProperty,
  ApiPropertyOptional,
  IntersectionType,
  PartialType,
} from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Region } from '../../envios/dto/envio.dto';
import { DireccionDto } from '../../pedidos/dto/create-pedido.dto';
import { Direccion } from '../entities/direccion.entity';

class DatosDireccionGuardadaDto {
  @ApiProperty({
    example: 'Casa',
    description: 'Nombre corto para reconocerla',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  alias: string;

  @ApiPropertyOptional({
    default: false,
    description:
      'Se usa por defecto en el checkout. La primera dirección siempre lo es.',
  })
  @IsOptional()
  @IsBoolean()
  predeterminada?: boolean;
}

/** Mismos campos y validaciones que la dirección del checkout, más alias. */
export class CrearDireccionDto extends IntersectionType(
  DatosDireccionGuardadaDto,
  DireccionDto,
) {}

export class ActualizarDireccionDto extends PartialType(CrearDireccionDto) {}

export class DireccionGuardadaDto extends DireccionDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Casa' })
  alias: string;

  @ApiProperty()
  predeterminada: boolean;

  @ApiProperty()
  creadoEn: Date;

  static desde(d: Direccion): DireccionGuardadaDto {
    return {
      id: d.id,
      alias: d.alias,
      predeterminada: d.predeterminada,
      nombreReceptor: d.nombreReceptor,
      rut: d.rut ?? undefined,
      calle: d.calle,
      comuna: d.comuna,
      ciudad: d.ciudad ?? undefined,
      region: d.region as Region,
      codigoPostal: d.codigoPostal ?? undefined,
      telefono: d.telefono,
      creadoEn: d.creadoEn,
    };
  }
}
