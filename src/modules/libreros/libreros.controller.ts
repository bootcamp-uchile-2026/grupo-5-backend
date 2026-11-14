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
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ApiErrores } from '../../common/dto/api-errores.decorator';
import { UuidPipe } from '../../common/pipes/uuid.pipe';
import {
  CurrentUser,
  UsuarioAutenticado,
} from '../auth/decorators/current-user.decorator';
import { AuthOpcional, Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Rol } from '../usuarios/entities/usuario.entity';
import { CreatePerfilLibreroDto } from './dto/create-perfil-librero.dto';
import {
  CreateColeccionDto,
  CreateRecomendacionDto,
  CreateSeccionCuradaDto,
} from './dto/create-seccion-curada.dto';
import {
  ColeccionResponseDto,
  LibreroPerfilDto,
  LibreroResumenDto,
  RecomendacionLibreroResponseDto,
  SeguimientoLibreroDto,
} from './dto/librero-response.dto';
import { UpdatePerfilLibreroDto } from './dto/update-perfil-librero.dto';
import { LibrerosService } from './libreros.service';

const PARAM_ID = ApiParam({
  name: 'id',
  description: 'uuid o slug del librero (p. ej. "gregorio-samsa")',
});

@ApiTags('libreros')
@Controller('libreros')
export class LibrerosController {
  constructor(private readonly libreros: LibrerosService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Listar libreros (carrusel del Home y menú)' })
  @ApiOkResponse({ type: [LibreroResumenDto] })
  listar(): Promise<LibreroResumenDto[]> {
    return this.libreros.listar();
  }

  @Get('yo')
  @Roles(Rol.LIBRERO)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mi perfil de librero (usuario LIBRERO)' })
  @ApiOkResponse({ type: LibreroPerfilDto })
  @ApiErrores(401, 403, [404, 'LIBRERO_NO_ENCONTRADO'])
  async yo(
    @CurrentUser() usuario: UsuarioAutenticado,
  ): Promise<LibreroPerfilDto> {
    const librero = await this.libreros.delUsuario(usuario.id);
    return this.libreros.perfil(librero.id, usuario);
  }

  @AuthOpcional()
  @Get(':id')
  @PARAM_ID
  @ApiOperation({
    summary: 'Perfil completo del librero',
    description:
      'Biografía, estilos, autores, top 5 indispensables, colecciones y últimas recomendaciones. ' +
      'Con token indica además si el usuario lo sigue.',
  })
  @ApiOkResponse({ type: LibreroPerfilDto })
  @ApiErrores([404, 'LIBRERO_NO_ENCONTRADO'])
  perfil(
    @Param('id') id: string,
    @CurrentUser() usuario?: UsuarioAutenticado,
  ): Promise<LibreroPerfilDto> {
    return this.libreros.perfil(id, usuario);
  }

  @Post()
  @Roles(Rol.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Crear el perfil de un usuario LIBRERO (solo ADMIN)',
  })
  @ApiCreatedResponse({ type: LibreroPerfilDto })
  @ApiErrores(400, 401, 403, 404, [409, 'LIBRERO_YA_TIENE_PERFIL'])
  async crear(
    @Body() dto: CreatePerfilLibreroDto,
    @CurrentUser() usuario: UsuarioAutenticado,
  ): Promise<LibreroPerfilDto> {
    const librero = await this.libreros.crear(dto);
    return this.libreros.perfil(librero.id, usuario);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @PARAM_ID
  @ApiOperation({ summary: 'Editar el perfil (su dueño o un ADMIN)' })
  @ApiOkResponse({ type: LibreroPerfilDto })
  @ApiErrores(400, 401, 403, 404, 409)
  async actualizar(
    @Param('id') id: string,
    @Body() dto: UpdatePerfilLibreroDto,
    @CurrentUser() usuario: UsuarioAutenticado,
  ): Promise<LibreroPerfilDto> {
    const librero = await this.libreros.actualizar(id, usuario, dto);
    return this.libreros.perfil(librero.id, usuario);
  }

  @Post(':id/seguir')
  @HttpCode(200)
  @ApiBearerAuth()
  @PARAM_ID
  @ApiOperation({ summary: 'Seguir a un librero' })
  @ApiOkResponse({ type: SeguimientoLibreroDto })
  @ApiErrores(401, 404)
  seguir(
    @Param('id') id: string,
    @CurrentUser() usuario: UsuarioAutenticado,
  ): Promise<SeguimientoLibreroDto> {
    return this.libreros.seguir(id, usuario.id, true);
  }

  @Delete(':id/seguir')
  @ApiBearerAuth()
  @PARAM_ID
  @ApiOperation({ summary: 'Dejar de seguir a un librero' })
  @ApiOkResponse({ type: SeguimientoLibreroDto })
  @ApiErrores(401, 404)
  dejarDeSeguir(
    @Param('id') id: string,
    @CurrentUser() usuario: UsuarioAutenticado,
  ): Promise<SeguimientoLibreroDto> {
    return this.libreros.seguir(id, usuario.id, false);
  }

  @Public()
  @Get(':id/recomendaciones')
  @PARAM_ID
  @ApiOperation({ summary: 'Libros recomendados por el librero, con su nota' })
  @ApiOkResponse({ type: [RecomendacionLibreroResponseDto] })
  @ApiErrores(404)
  async recomendaciones(
    @Param('id') id: string,
  ): Promise<RecomendacionLibreroResponseDto[]> {
    const librero = await this.libreros.buscar(id);
    return this.libreros.listarRecomendaciones(librero.id);
  }

  @Post(':id/recomendaciones')
  @ApiBearerAuth()
  @PARAM_ID
  @ApiOperation({
    summary: 'Recomendar un libro con nota personal (dueño del perfil o ADMIN)',
    description: 'Si ya lo recomendaba, se actualiza la nota.',
  })
  @ApiCreatedResponse({ type: RecomendacionLibreroResponseDto })
  @ApiErrores(400, 401, 403, 404)
  recomendar(
    @Param('id') id: string,
    @Body() dto: CreateRecomendacionDto,
    @CurrentUser() usuario: UsuarioAutenticado,
  ): Promise<RecomendacionLibreroResponseDto> {
    return this.libreros.recomendar(id, usuario, dto);
  }

  @Delete(':id/recomendaciones/:libroId')
  @HttpCode(204)
  @ApiBearerAuth()
  @PARAM_ID
  @ApiOperation({ summary: 'Quitar una recomendación (dueño o ADMIN)' })
  @ApiNoContentResponse()
  @ApiErrores(400, 401, 403, 404)
  quitar(
    @Param('id') id: string,
    @Param('libroId', UuidPipe) libroId: string,
    @CurrentUser() usuario: UsuarioAutenticado,
  ): Promise<void> {
    return this.libreros.quitarRecomendacion(id, usuario, libroId);
  }

  @Post(':id/colecciones')
  @ApiBearerAuth()
  @PARAM_ID
  @ApiOperation({ summary: 'Publicar una colección (dueño o ADMIN)' })
  @ApiCreatedResponse({ type: ColeccionResponseDto })
  @ApiErrores(400, 401, 403, 404)
  crearColeccion(
    @Param('id') id: string,
    @Body() dto: CreateColeccionDto,
    @CurrentUser() usuario: UsuarioAutenticado,
  ): Promise<ColeccionResponseDto> {
    return this.libreros.crearColeccion(id, usuario, dto);
  }

  // ----- Rutas del Hito 1 ("sección curada" = recomendaciones) -----

  @Public()
  @Get(':id/seccion-curada')
  @PARAM_ID
  @ApiOperation({
    summary:
      'Sección curada (ruta del Hito 1; equivale a GET :id/recomendaciones)',
    deprecated: true,
  })
  @ApiOkResponse({ type: [RecomendacionLibreroResponseDto] })
  seccionCurada(
    @Param('id') id: string,
  ): Promise<RecomendacionLibreroResponseDto[]> {
    return this.recomendaciones(id);
  }

  @Post(':id/seccion-curada')
  @ApiBearerAuth()
  @PARAM_ID
  @ApiOperation({
    summary:
      'Agregar a la sección curada (ruta del Hito 1; equivale a POST :id/recomendaciones)',
    deprecated: true,
  })
  @ApiCreatedResponse({ type: RecomendacionLibreroResponseDto })
  agregarSeccionCurada(
    @Param('id') id: string,
    @Body() dto: CreateSeccionCuradaDto,
    @CurrentUser() usuario: UsuarioAutenticado,
  ): Promise<RecomendacionLibreroResponseDto> {
    return this.libreros.recomendar(id, usuario, dto);
  }
}

/** "Quién lo recomienda" en la ficha del libro. */
@ApiTags('libreros')
@Controller('libros/:libroId/recomendaciones-libreros')
export class LibroRecomendacionesController {
  constructor(private readonly libreros: LibrerosService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary:
      'Libreros que recomiendan este libro, con su nota (ficha del libro)',
  })
  @ApiOkResponse({ type: [RecomendacionLibreroResponseDto] })
  @ApiErrores(400, [404, 'LIBRO_NO_ENCONTRADO'])
  deLibro(
    @Param('libroId', UuidPipe) libroId: string,
  ): Promise<RecomendacionLibreroResponseDto[]> {
    return this.libreros.deLibro(libroId);
  }
}
