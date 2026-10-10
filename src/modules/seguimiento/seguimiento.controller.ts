import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiBearerAuth,
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
import { SeguimientoResponseDto } from './dto/seguimiento.dto';
import { SeguimientoService } from './seguimiento.service';

@ApiTags('seguimiento (dummy)')
@ApiBearerAuth()
@Controller('pedidos')
export class SeguimientoController {
  constructor(private readonly seguimiento: SeguimientoService) {}

  @Get(':id/seguimiento')
  @ApiOperation({
    summary: 'Seguimiento de un pedido pagado (DUMMY)',
    description:
      'La línea de tiempo se calcula desde la hora de pago: cada hito se completa un "paso" después del anterior ' +
      '(SEGUIMIENTO_PASO_SEGUNDOS, 60 s por defecto). Una calle con "S/N" o "SIN NUMERO" termina en ENTREGA_FALLIDA. ' +
      'Un pedido sin pagar responde 409.',
  })
  @ApiOkResponse({ type: SeguimientoResponseDto })
  @ApiErrores(
    400,
    401,
    403,
    [404, 'PEDIDO_NO_ENCONTRADO'],
    [409, 'SEGUIMIENTO_NO_DISPONIBLE: el pedido no está pagado'],
  )
  consultar(
    @Param('id', UuidPipe) id: string,
    @CurrentUser() usuario: UsuarioAutenticado,
  ): Promise<SeguimientoResponseDto> {
    return this.seguimiento.consultar(id, usuario);
  }
}
