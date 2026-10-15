import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiHeader,
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
import { Public } from '../auth/decorators/public.decorator';
import {
  CreatePedidoDto,
  CrearPedidoInvitadoDto,
} from './dto/create-pedido.dto';
import {
  PedidoInvitadoResponseDto,
  PedidoResponseDto,
} from './dto/pedido-response.dto';
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
    [404, 'CUPON_NO_ENCONTRADO'],
    [409, 'CARRITO_VACIO o STOCK_INSUFICIENTE'],
    [
      422,
      'ENVIO_SIN_COBERTURA o cupón no aplicable (CUPON_VENCIDO, CUPON_MONTO_MINIMO...)',
    ],
  )
  async crear(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Body() dto: CreatePedidoDto,
  ): Promise<PedidoResponseDto> {
    return PedidoResponseDto.desde(await this.pedidos.crear(usuario, dto));
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

export const HEADER_TOKEN_PEDIDO = ApiHeader({
  name: 'X-Pedido-Token',
  required: true,
  description: 'tokenPedido entregado por POST /pedidos/invitado',
});

/** Compra como invitado (sin cuenta). */
@ApiTags('pedidos (invitado)')
@Public()
@Controller('pedidos/invitado')
export class PedidosInvitadoController {
  constructor(private readonly pedidos: PedidosService) {}

  @Post()
  @ApiOperation({
    summary: 'Checkout como invitado: crear un pedido sin cuenta',
    description:
      'Los libros van en el body. Responde el pedido (PENDIENTE_PAGO) y un tokenPedido para pagarlo con ' +
      'POST /pagos/invitado y consultarlo. Si después se crea una cuenta con el mismo email y se verifica, ' +
      'el pedido pasa a su historial.',
  })
  @ApiCreatedResponse({ type: PedidoInvitadoResponseDto })
  @ApiErrores(
    400,
    [404, 'CUPON_NO_ENCONTRADO'],
    [409, 'STOCK_INSUFICIENTE'],
    [422, 'ENVIO_SIN_COBERTURA o cupón no aplicable'],
  )
  async crear(
    @Body() dto: CrearPedidoInvitadoDto,
  ): Promise<PedidoInvitadoResponseDto> {
    const { pedido, tokenPedido } = await this.pedidos.crearInvitado(dto);
    return { pedido: PedidoResponseDto.desde(pedido), tokenPedido };
  }

  @Get(':id')
  @HEADER_TOKEN_PEDIDO
  @ApiOperation({ summary: 'Detalle de un pedido de invitado' })
  @ApiOkResponse({ type: PedidoResponseDto })
  @ApiErrores(400, [401, 'TOKEN_PEDIDO_INVALIDO'], 404)
  async obtener(
    @Param('id', UuidPipe) id: string,
    @Headers('x-pedido-token') token?: string,
  ): Promise<PedidoResponseDto> {
    return PedidoResponseDto.desde(
      await this.pedidos.obtenerInvitado(id, token),
    );
  }

  @Post(':id/cancelar')
  @HttpCode(200)
  @HEADER_TOKEN_PEDIDO
  @ApiOperation({ summary: 'Cancelar un pedido de invitado pendiente de pago' })
  @ApiOkResponse({ type: PedidoResponseDto })
  @ApiErrores(400, 401, 404, [409, 'ESTADO_PEDIDO_INVALIDO'])
  async cancelar(
    @Param('id', UuidPipe) id: string,
    @Headers('x-pedido-token') token?: string,
  ): Promise<PedidoResponseDto> {
    return PedidoResponseDto.desde(
      await this.pedidos.cancelarInvitado(id, token),
    );
  }
}
