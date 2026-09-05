import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RecomendacionesService } from './recomendaciones.service';
import { GenerarRecomendacionesQueryDto } from './dto/generar-recomendaciones.dto';

@ApiTags('Recomendaciones')
@Controller('recomendaciones')
export class RecomendacionesController {
  constructor(private readonly recomendacionesService: RecomendacionesService) {}

  @Get('usuario/:usuarioId')
  @ApiOperation({ summary: 'Generar recomendaciones personalizadas para un usuario' })
  generarParaUsuario(
    @Param('usuarioId') usuarioId: string,
    @Query() query: GenerarRecomendacionesQueryDto,
  ) {
    return this.recomendacionesService.generarParaUsuario(usuarioId, query.limite);
  }

  @Post('usuario/:usuarioId/compras')
  @ApiOperation({ summary: '(Simulado) Registrar una compra para alimentar el motor de recomendaciones' })
  registrarCompra(
    @Param('usuarioId') usuarioId: string,
    @Body() body: { libroId: string; genero: string },
  ) {
    this.recomendacionesService.registrarCompra(usuarioId, body.libroId, body.genero);
    return { mensaje: 'Compra registrada para el motor de recomendaciones' };
  }
}
