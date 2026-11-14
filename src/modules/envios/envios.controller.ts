import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiErrores } from '../../common/dto/api-errores.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CotizacionEnvioDto, CotizarEnvioDto } from './dto/envio.dto';
import { EnviosService } from './envios.service';

@ApiTags('envios (dummy)')
@Controller('envios')
export class EnviosController {
  constructor(private readonly envios: EnviosService) {}

  @Public()
  @Post('cotizar')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Cotizar el costo de envío (DUMMY)',
    description:
      'Reglas fijas: RETIRO $0 · RM $2.990 (2 días) · zonas extremas XV, I, XI, XII $7.990 (7 días) · ' +
      'resto $4.990 (4 días) · gratis desde $40.000 de subtotal · ' +
      'comunas "Isla de Pascua", "Juan Fernández" y "Antártica" responden 422 ENVIO_SIN_COBERTURA.',
  })
  @ApiOkResponse({ type: CotizacionEnvioDto })
  @ApiErrores(400, [422, 'ENVIO_SIN_COBERTURA'])
  cotizar(@Body() dto: CotizarEnvioDto): CotizacionEnvioDto {
    return this.envios.cotizar(dto);
  }
}
