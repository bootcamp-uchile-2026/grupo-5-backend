import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ClubLecturaService } from './club-lectura.service';
import { CreateClubLecturaDto } from './dto/create-club-lectura.dto';
import { CreateHiloDiscusionDto } from './dto/create-hilo-discusion.dto';
import { CreateComentarioDto } from './dto/create-comentario.dto';
import { ActualizarProgresoDto } from './dto/actualizar-progreso.dto';

@ApiTags('Club de Lectura')
@Controller('club-lectura')
export class ClubLecturaController {
  constructor(private readonly clubLecturaService: ClubLecturaService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un club de lectura' })
  crearClub(@Body() dto: CreateClubLecturaDto) {
    return this.clubLecturaService.crearClub(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar clubes de lectura' })
  listarClubes() {
    return this.clubLecturaService.listarClubes();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un club de lectura' })
  obtenerClub(@Param('id') id: string) {
    return this.clubLecturaService.obtenerClub(id);
  }

  @Post(':id/participantes/:usuarioId')
  @ApiOperation({ summary: 'Unirse a un club de lectura' })
  unirse(@Param('id') id: string, @Param('usuarioId') usuarioId: string) {
    return this.clubLecturaService.unirseAClub(id, usuarioId);
  }

  @Post(':id/hilos')
  @ApiOperation({ summary: 'Crear un hilo de discusión en el club' })
  crearHilo(@Param('id') id: string, @Body() dto: CreateHiloDiscusionDto) {
    return this.clubLecturaService.crearHilo(id, dto);
  }

  @Get(':id/hilos')
  @ApiOperation({ summary: 'Listar hilos de discusión de un club' })
  listarHilos(@Param('id') id: string) {
    return this.clubLecturaService.listarHilos(id);
  }

  @Post('hilos/:hiloId/comentarios')
  @ApiOperation({ summary: 'Comentar en un hilo de discusión' })
  comentarHilo(@Param('hiloId') hiloId: string, @Body() dto: CreateComentarioDto) {
    return this.clubLecturaService.comentarHilo(hiloId, dto);
  }

  @Get('hilos/:hiloId/comentarios')
  @ApiOperation({ summary: 'Listar comentarios de un hilo' })
  listarComentarios(@Param('hiloId') hiloId: string) {
    return this.clubLecturaService.listarComentarios(hiloId);
  }

  @Put(':id/progreso/:usuarioId')
  @ApiOperation({ summary: 'Actualizar el progreso de lectura de un usuario en el club' })
  actualizarProgreso(
    @Param('id') id: string,
    @Param('usuarioId') usuarioId: string,
    @Body() dto: ActualizarProgresoDto,
  ) {
    return this.clubLecturaService.actualizarProgreso(id, usuarioId, dto);
  }

  @Get(':id/progreso')
  @ApiOperation({ summary: 'Ver el progreso de lectura compartido de todos los participantes' })
  obtenerProgresoCompartido(@Param('id') id: string) {
    return this.clubLecturaService.obtenerProgresoCompartido(id);
  }
}
