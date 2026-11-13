import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
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
import { DireccionesService, MAXIMO_DIRECCIONES } from './direcciones.service';
import {
  ActualizarDireccionDto,
  CrearDireccionDto,
  DireccionGuardadaDto,
} from './dto/direccion.dto';

// Siempre son las direcciones del usuario dueño del token.
@ApiTags('direcciones')
@ApiBearerAuth()
@Controller('direcciones')
export class DireccionesController {
  constructor(private readonly direcciones: DireccionesService) {}

  @Get()
  @ApiOperation({
    summary: 'Mis direcciones guardadas (la predeterminada primero)',
  })
  @ApiOkResponse({ type: [DireccionGuardadaDto] })
  @ApiErrores(401)
  async listar(
    @CurrentUser() usuario: UsuarioAutenticado,
  ): Promise<DireccionGuardadaDto[]> {
    return (await this.direcciones.listar(usuario.id)).map((d) =>
      DireccionGuardadaDto.desde(d),
    );
  }

  @Post()
  @ApiOperation({
    summary: 'Guardar una dirección de despacho',
    description: `Hasta ${MAXIMO_DIRECCIONES} por usuario. La primera queda como predeterminada.`,
  })
  @ApiCreatedResponse({ type: DireccionGuardadaDto })
  @ApiErrores(400, 401, [409, 'LIMITE_DIRECCIONES'])
  async crear(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Body() dto: CrearDireccionDto,
  ): Promise<DireccionGuardadaDto> {
    return DireccionGuardadaDto.desde(
      await this.direcciones.crear(usuario.id, dto),
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar una dirección guardada' })
  @ApiOkResponse({ type: DireccionGuardadaDto })
  @ApiErrores(400, 401, [404, 'DIRECCION_NO_ENCONTRADA'])
  async actualizar(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Param('id', UuidPipe) id: string,
    @Body() dto: ActualizarDireccionDto,
  ): Promise<DireccionGuardadaDto> {
    return DireccionGuardadaDto.desde(
      await this.direcciones.actualizar(usuario.id, id, dto),
    );
  }

  @Post(':id/predeterminada')
  @HttpCode(200)
  @ApiOperation({ summary: 'Usar esta dirección por defecto en el checkout' })
  @ApiOkResponse({ type: DireccionGuardadaDto })
  @ApiErrores(400, 401, [404, 'DIRECCION_NO_ENCONTRADA'])
  async predeterminada(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Param('id', UuidPipe) id: string,
  ): Promise<DireccionGuardadaDto> {
    return DireccionGuardadaDto.desde(
      await this.direcciones.marcarPredeterminada(usuario.id, id),
    );
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Eliminar una dirección guardada',
    description:
      'Si era la predeterminada, pasa a serlo la más antigua que quede.',
  })
  @ApiNoContentResponse({ description: 'Dirección eliminada' })
  @ApiErrores(400, 401, [404, 'DIRECCION_NO_ENCONTRADA'])
  eliminar(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Param('id', UuidPipe) id: string,
  ): Promise<void> {
    return this.direcciones.eliminar(usuario.id, id);
  }
}
