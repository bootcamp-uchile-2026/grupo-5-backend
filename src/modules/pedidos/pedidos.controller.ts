import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiErrores } from '../../common/dto/api-errores.decorator';
import { UuidPipe } from '../../common/pipes/uuid.pipe';
import {
  CurrentUser,
  UsuarioAutenticado,
} from '../auth/decorators/current-user.decorator';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { PedidoResponseDto } from './dto/pedido-response.dto';
import { PedidosService } from './pedidos.service';

@ApiTags('pedidos')
@ApiBearerAuth()
@Controller('pedidos')
export class PedidosController {
  constructor(private readonly pedidos: PedidosService) {}

  @Post()
  @ApiOperation({
    summary: 'Checkout: crear un pedido a partir de mi carrito',
    description:
      'Valida y reserva stock, calcula el envío (dummy), guarda los precios del momento y vacía el carrito. ' +
      'El pedido queda en PENDIENTE_PAGO hasta llamar a POST /pagos.',
  })
  @ApiCreatedResponse({ type: PedidoResponseDto })
  @ApiErrores(
    400,
    401,
    [409, 'CARRITO_VACIO o STOCK_INSUFICIENTE'],
    [422, 'ENVIO_SIN_COBERTURA'],
  )
  async crear(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Body() dto: CreatePedidoDto,
  ): Promise<PedidoResponseDto> {
    return PedidoResponseDto.desde(await this.pedidos.crear(usuario.id, dto));
  }

  @Get()
  @ApiOperation({
    summary: 'Mi historial de pedidos (del más reciente al más antiguo)',
  })
  @ApiOkResponse({ type: [PedidoResponseDto] })
  @ApiErrores(401)
  async listar(
    @CurrentUser() usuario: UsuarioAutenticado,
  ): Promise<PedidoResponseDto[]> {
    return (await this.pedidos.listar(usuario.id)).map((p) =>
      PedidoResponseDto.desde(p),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de un pedido propio' })
  @ApiOkResponse({ type: PedidoResponseDto })
  @ApiErrores(400, 401, 403, [404, 'PEDIDO_NO_ENCONTRADO'])
  async obtener(
    @Param('id', UuidPipe) id: string,
    @CurrentUser() usuario: UsuarioAutenticado,
  ): Promise<PedidoResponseDto> {
    return PedidoResponseDto.desde(await this.pedidos.obtener(id, usuario));
  }

  @Post(':id/cancelar')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Cancelar un pedido pendiente de pago (devuelve el stock)',
  })
  @ApiOkResponse({ type: PedidoResponseDto })
  @ApiErrores(400, 401, 403, 404, [
    409,
    'ESTADO_PEDIDO_INVALIDO: el pedido ya está pagado o cancelado',
  ])
  async cancelar(
    @Param('id', UuidPipe) id: string,
    @CurrentUser() usuario: UsuarioAutenticado,
  ): Promise<PedidoResponseDto> {
    return PedidoResponseDto.desde(await this.pedidos.cancelar(id, usuario));
  }
}
