import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
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
import { Public } from '../auth/decorators/public.decorator';
import { HEADER_TOKEN_PEDIDO } from '../pedidos/pedidos.controller';
import { CrearPagoDto, PagoAprobadoDto, PagoResponseDto } from './dto/pago.dto';
import { PagosService } from './pagos.service';

@ApiTags('pagos (dummy)')
@ApiBearerAuth()
@Controller('pagos')
export class PagosController {
  constructor(private readonly pagos: PagosService) {}

  @Post()
  @ApiOperation({
    summary: 'Pagar un pedido (pasarela DUMMY)',
    description:
      'No se cobra dinero real: usar solo tarjetas ficticias. El resultado depende de los últimos 4 dígitos: ' +
      '**0002** fondos insuficientes (402) · **0005** tarjeta bloqueada (402) · **0009** pasarela caída (502) · ' +
      'vencimiento pasado, tarjeta vencida (402) · cualquier otro caso se aprueba y el pedido pasa a PAGADO.',
  })
  @ApiCreatedResponse({ type: PagoAprobadoDto, description: 'Pago aprobado' })
  @ApiErrores(
    400,
    401,
    [402, 'PAGO_RECHAZADO; el motivo viene en detalles[0]'],
    403,
    [404, 'PEDIDO_NO_ENCONTRADO'],
    [409, 'ESTADO_PEDIDO_INVALIDO: el pedido ya está pagado o cancelado'],
    [502, 'PASARELA_NO_DISPONIBLE'],
  )
  pagar(
    @Body() dto: CrearPagoDto,
    @CurrentUser() usuario: UsuarioAutenticado,
  ): Promise<PagoAprobadoDto> {
    return this.pagos.pagar(dto, usuario);
  }

  @Public()
  @Post('invitado')
  @HEADER_TOKEN_PEDIDO
  @ApiOperation({
    summary: 'Pagar un pedido de invitado (pasarela DUMMY)',
    description:
      'Igual que POST /pagos, pero sin sesión: se autentica con el header X-Pedido-Token.',
  })
  @ApiCreatedResponse({ type: PagoAprobadoDto, description: 'Pago aprobado' })
  @ApiErrores(
    400,
    [401, 'TOKEN_PEDIDO_INVALIDO'],
    [402, 'PAGO_RECHAZADO'],
    [404, 'PEDIDO_NO_ENCONTRADO'],
    [409, 'ESTADO_PEDIDO_INVALIDO'],
    [502, 'PASARELA_NO_DISPONIBLE'],
  )
  pagarInvitado(
    @Body() dto: CrearPagoDto,
    @Headers('x-pedido-token') token?: string,
  ): Promise<PagoAprobadoDto> {
    return this.pagos.pagarInvitado(dto, token);
  }

  @Get('pedido/:pedidoId')
  @ApiOperation({
    summary: 'Intentos de pago de un pedido propio (aprobados y rechazados)',
  })
  @ApiOkResponse({ type: [PagoResponseDto] })
  @ApiErrores(400, 401, 403, 404)
  async listar(
    @Param('pedidoId', UuidPipe) pedidoId: string,
    @CurrentUser() usuario: UsuarioAutenticado,
  ): Promise<PagoResponseDto[]> {
    return (await this.pagos.listarPorPedido(pedidoId, usuario)).map((p) =>
      PagoResponseDto.desde(p),
    );
  }
}
