import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiErrores } from '../../common/dto/api-errores.decorator';
import { CuponInvalidoException } from '../../common/exceptions/app.exceptions';
import {
  CurrentUser,
  UsuarioAutenticado,
} from '../auth/decorators/current-user.decorator';
import { AuthOpcional } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Rol } from '../usuarios/entities/usuario.entity';
import { CuponesService } from './cupones.service';
import {
  ActualizarCuponDto,
  CrearCuponDto,
  CuponAplicadoDto,
  CuponResponseDto,
  ValidarCuponDto,
} from './dto/cupon.dto';

@ApiTags('cupones')
@Controller('cupones')
export class CuponesController {
  constructor(private readonly cupones: CuponesService) {}

  @AuthOpcional()
  @Post('validar')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Validar un código de descuento y calcular el descuento',
    description:
      'No consume el cupón: se aplica al crear el pedido enviando codigoDescuento. ' +
      'Con token y sin subtotal usa el subtotal del carrito. Códigos de prueba: BIENVENIDA10, LIBRERO15, ' +
      'DESCUENTO5000 y VERANO2025 (vencido).',
  })
  @ApiOkResponse({ type: CuponAplicadoDto })
  @ApiErrores(
    400,
    [404, 'CUPON_NO_ENCONTRADO'],
    [422, 'CUPON_VENCIDO, CUPON_AGOTADO, CUPON_MONTO_MINIMO o CUPON_YA_USADO'],
  )
  async validar(
    @Body() dto: ValidarCuponDto,
    @CurrentUser() usuario?: UsuarioAutenticado,
  ): Promise<CuponAplicadoDto> {
    let subtotal = dto.subtotal;
    if (subtotal === undefined && usuario)
      subtotal = await this.cupones.subtotalCarrito(usuario.id);
    if (subtotal === undefined)
      throw new CuponInvalidoException(
        'VALIDATION_ERROR',
        'subtotal es obligatorio si no se envía un token',
        400,
      );
    return this.cupones.calcular(dto.codigo, subtotal, {
      usuarioId: usuario?.id,
      email: usuario?.email ?? dto.email,
    });
  }

  @Get()
  @Roles(Rol.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar cupones (solo ADMIN)' })
  @ApiOkResponse({ type: [CuponResponseDto] })
  @ApiErrores(401, 403)
  async listar(): Promise<CuponResponseDto[]> {
    return (await this.cupones.listar()).map((c) => CuponResponseDto.desde(c));
  }

  @Post()
  @Roles(Rol.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear un cupón (solo ADMIN)' })
  @ApiCreatedResponse({ type: CuponResponseDto })
  @ApiErrores(400, 401, 403, [409, 'CUPON_DUPLICADO'])
  async crear(@Body() dto: CrearCuponDto): Promise<CuponResponseDto> {
    return CuponResponseDto.desde(await this.cupones.crear(dto));
  }

  @Patch(':codigo')
  @Roles(Rol.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modificar o desactivar un cupón (solo ADMIN)' })
  @ApiOkResponse({ type: CuponResponseDto })
  @ApiErrores(400, 401, 403, [404, 'CUPON_NO_ENCONTRADO'])
  async actualizar(
    @Param('codigo') codigo: string,
    @Body() dto: ActualizarCuponDto,
  ): Promise<CuponResponseDto> {
    return CuponResponseDto.desde(await this.cupones.actualizar(codigo, dto));
  }
}
