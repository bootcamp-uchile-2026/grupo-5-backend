import { Body, Controller, Get, Param, Post } from '@nestjs/common';
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
