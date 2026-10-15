import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
} from '@nestjs/common';
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
import { ClubLecturaService } from './club-lectura.service';
import { ActualizarProgresoDto } from './dto/actualizar-progreso.dto';
import {
  ClubResponseDto,
  ComentarioResponseDto,
  HiloResponseDto,
  ProgresoResponseDto,
} from './dto/club-response.dto';
import { CreateClubLecturaDto } from './dto/create-club-lectura.dto';
import { CreateComentarioDto } from './dto/create-comentario.dto';
import { CreateHiloDiscusionDto } from './dto/create-hilo-discusion.dto';

@ApiTags('club de lectura')
@Controller('club-lectura')
export class ClubLecturaController {
  constructor(private readonly club: ClubLecturaService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Crear un club de lectura (el creador queda unido)',
  })
  @ApiCreatedResponse({ type: ClubResponseDto })
  @ApiErrores(400, 401, [404, 'LIBRO_NO_ENCONTRADO'])
  crearClub(
    @Body() dto: CreateClubLecturaDto,
    @CurrentUser() usuario: UsuarioAutenticado,
  ): Promise<ClubResponseDto> {
    return this.club.crearClub(usuario, dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Listar clubes de lectura' })
  @ApiOkResponse({ type: [ClubResponseDto] })
  listarClubes(): Promise<ClubResponseDto[]> {
    return this.club.listarClubes();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Obtener un club de lectura' })
  @ApiOkResponse({ type: ClubResponseDto })
  @ApiErrores(400, [404, 'CLUB_NO_ENCONTRADO'])
  obtenerClub(@Param('id', UuidPipe) id: string): Promise<ClubResponseDto> {
    return this.club.obtenerClub(id);
  }

  @Post(':id/unirse')
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unirme a un club de lectura' })
  @ApiOkResponse({ type: ClubResponseDto })
  @ApiErrores(400, 401, 404)
  unirme(
    @Param('id', UuidPipe) id: string,
    @CurrentUser() usuario: UsuarioAutenticado,
  ): Promise<ClubResponseDto> {
    return this.club.unirse(id, usuario.id, usuario);
  }

  @Delete(':id/unirse')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Salir de un club de lectura' })
  @ApiOkResponse({ type: ClubResponseDto })
  @ApiErrores(400, 401, 404)
  salir(
    @Param('id', UuidPipe) id: string,
    @CurrentUser() usuario: UsuarioAutenticado,
  ): Promise<ClubResponseDto> {
    return this.club.salir(id, usuario.id);
  }

  @Post(':id/participantes/:usuarioId')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Unirse a un club (ruta del Hito 1; solo la propia cuenta o ADMIN)',
    deprecated: true,
  })
  @ApiCreatedResponse({ type: ClubResponseDto })
  @ApiErrores(400, 401, 403, 404)
  unirse(
    @Param('id', UuidPipe) id: string,
    @Param('usuarioId', UuidPipe) usuarioId: string,
    @CurrentUser() usuario: UsuarioAutenticado,
  ): Promise<ClubResponseDto> {
    return this.club.unirse(id, usuarioId, usuario);
  }

  @Post(':id/hilos')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear un hilo de discusión (participantes)' })
  @ApiCreatedResponse({ type: HiloResponseDto })
  @ApiErrores(400, 401, [403, 'NO_ES_PARTICIPANTE'], 404)
  crearHilo(
    @Param('id', UuidPipe) id: string,
    @Body() dto: CreateHiloDiscusionDto,
    @CurrentUser() usuario: UsuarioAutenticado,
  ): Promise<HiloResponseDto> {
    return this.club.crearHilo(id, usuario, dto);
  }

  @Public()
  @Get(':id/hilos')
  @ApiOperation({ summary: 'Listar hilos de discusión de un club' })
  @ApiOkResponse({ type: [HiloResponseDto] })
  @ApiErrores(400, 404)
  listarHilos(@Param('id', UuidPipe) id: string): Promise<HiloResponseDto[]> {
    return this.club.listarHilos(id);
  }

  @Post('hilos/:hiloId/comentarios')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Comentar en un hilo (participantes)' })
  @ApiCreatedResponse({ type: ComentarioResponseDto })
  @ApiErrores(
    400,
    401,
    [403, 'NO_ES_PARTICIPANTE'],
    [404, 'HILO_NO_ENCONTRADO'],
  )
  comentarHilo(
    @Param('hiloId', UuidPipe) hiloId: string,
    @Body() dto: CreateComentarioDto,
    @CurrentUser() usuario: UsuarioAutenticado,
  ): Promise<ComentarioResponseDto> {
    return this.club.comentar(hiloId, usuario, dto);
  }

  @Public()
  @Get('hilos/:hiloId/comentarios')
  @ApiOperation({ summary: 'Listar comentarios de un hilo' })
  @ApiOkResponse({ type: [ComentarioResponseDto] })
  @ApiErrores(400, 404)
  listarComentarios(
    @Param('hiloId', UuidPipe) hiloId: string,
  ): Promise<ComentarioResponseDto[]> {
    return this.club.listarComentarios(hiloId);
  }

  @Put(':id/progreso')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar mi progreso de lectura en el club' })
  @ApiOkResponse({ type: ProgresoResponseDto })
  @ApiErrores(400, 401, [403, 'NO_ES_PARTICIPANTE'], 404)
  miProgreso(
    @Param('id', UuidPipe) id: string,
    @Body() dto: ActualizarProgresoDto,
    @CurrentUser() usuario: UsuarioAutenticado,
  ): Promise<ProgresoResponseDto> {
    return this.club.actualizarProgreso(id, usuario.id, usuario, dto);
  }

  @Put(':id/progreso/:usuarioId')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Actualizar progreso (ruta del Hito 1; solo la propia cuenta o ADMIN)',
    deprecated: true,
  })
  @ApiOkResponse({ type: ProgresoResponseDto })
  @ApiErrores(400, 401, 403, 404)
  actualizarProgreso(
    @Param('id', UuidPipe) id: string,
    @Param('usuarioId', UuidPipe) usuarioId: string,
    @Body() dto: ActualizarProgresoDto,
    @CurrentUser() usuario: UsuarioAutenticado,
  ): Promise<ProgresoResponseDto> {
    return this.club.actualizarProgreso(id, usuarioId, usuario, dto);
  }

  @Public()
  @Get(':id/progreso')
  @ApiOperation({ summary: 'Progreso de lectura de todos los participantes' })
  @ApiOkResponse({ type: [ProgresoResponseDto] })
  @ApiErrores(400, 404)
  progreso(@Param('id', UuidPipe) id: string): Promise<ProgresoResponseDto[]> {
    return this.club.progresoCompartido(id);
  }
}
