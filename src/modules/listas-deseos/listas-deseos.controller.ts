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
import {
  AgregarLibroListaDto,
  ListaDeseosResponseDto,
} from './dto/agregar-libro-lista.dto';
import { CreateListaDeseosDto } from './dto/create-lista-deseos.dto';
import { UpdateListaDeseosDto } from './dto/update-lista-deseos.dto';
import { ListasDeseosService } from './listas-deseos.service';

@ApiTags('listas de deseos')
@ApiBearerAuth()
@Controller('listas-deseos')
export class ListasDeseosController {
  constructor(private readonly listas: ListasDeseosService) {}

  @Get()
  @ApiOperation({ summary: 'Mis listas de deseos' })
  @ApiOkResponse({ type: [ListaDeseosResponseDto] })
  @ApiErrores(401)
  mias(
    @CurrentUser() usuario: UsuarioAutenticado,
  ): Promise<ListaDeseosResponseDto[]> {
    return this.listas.delUsuario(usuario.id, usuario);
  }

  @Post()
  @ApiOperation({ summary: 'Crear una lista de deseos' })
  @ApiCreatedResponse({ type: ListaDeseosResponseDto })
  @ApiErrores(400, 401)
  crear(
    @Body() dto: CreateListaDeseosDto,
    @CurrentUser() usuario: UsuarioAutenticado,
  ): Promise<ListaDeseosResponseDto> {
    return this.listas.crear(usuario.id, dto);
  }

  @Get('favoritos')
  @ApiOperation({
    summary: 'Mi lista "Favoritos" (la del botón corazón; se crea sola)',
  })
  @ApiOkResponse({ type: ListaDeseosResponseDto })
  @ApiErrores(401)
  favoritos(
    @CurrentUser() usuario: UsuarioAutenticado,
  ): Promise<ListaDeseosResponseDto> {
    return this.listas.favoritos(usuario.id);
  }

  @Post('favoritos/libros/:libroId')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Marcar un libro como favorito ("Añadir a lista de deseos")',
  })
  @ApiOkResponse({ type: ListaDeseosResponseDto })
  @ApiErrores(400, 401, [404, 'LIBRO_NO_ENCONTRADO'])
  marcar(
    @Param('libroId', UuidPipe) libroId: string,
    @CurrentUser() usuario: UsuarioAutenticado,
  ): Promise<ListaDeseosResponseDto> {
    return this.listas.marcarFavorito(usuario.id, libroId, true);
  }

  @Delete('favoritos/libros/:libroId')
  @ApiOperation({ summary: 'Quitar un libro de favoritos' })
  @ApiOkResponse({ type: ListaDeseosResponseDto })
  @ApiErrores(400, 401)
  desmarcar(
    @Param('libroId', UuidPipe) libroId: string,
    @CurrentUser() usuario: UsuarioAutenticado,
  ): Promise<ListaDeseosResponseDto> {
    return this.listas.marcarFavorito(usuario.id, libroId, false);
  }

  @Get('usuario/:usuarioId')
  @ApiOperation({
    summary:
      'Listas de un usuario (ruta del Hito 1: el propio, o cualquiera si es ADMIN)',
  })
  @ApiOkResponse({ type: [ListaDeseosResponseDto] })
  @ApiErrores(400, 401, 403)
  delUsuario(
    @Param('usuarioId', UuidPipe) usuarioId: string,
    @CurrentUser() usuario: UsuarioAutenticado,
  ): Promise<ListaDeseosResponseDto[]> {
    return this.listas.delUsuario(usuarioId, usuario);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una lista propia' })
  @ApiOkResponse({ type: ListaDeseosResponseDto })
  @ApiErrores(400, 401, 403, [404, 'LISTA_NO_ENCONTRADA'])
  obtener(
    @Param('id', UuidPipe) id: string,
    @CurrentUser() usuario: UsuarioAutenticado,
  ): Promise<ListaDeseosResponseDto> {
    return this.listas.obtener(id, usuario);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Renombrar o marcar una lista como regalo' })
  @ApiOkResponse({ type: ListaDeseosResponseDto })
  @ApiErrores(400, 401, 403, 404)
  actualizar(
    @Param('id', UuidPipe) id: string,
    @Body() dto: UpdateListaDeseosDto,
    @CurrentUser() usuario: UsuarioAutenticado,
  ): Promise<ListaDeseosResponseDto> {
    return this.listas.actualizar(id, usuario, dto);
  }

  @Post(':id/libros')
  @ApiOperation({ summary: 'Agregar un libro a la lista' })
  @ApiCreatedResponse({ type: ListaDeseosResponseDto })
  @ApiErrores(400, 401, 403, 404)
  agregarLibro(
    @Param('id', UuidPipe) id: string,
    @Body() dto: AgregarLibroListaDto,
    @CurrentUser() usuario: UsuarioAutenticado,
  ): Promise<ListaDeseosResponseDto> {
    return this.listas.agregarLibro(id, usuario, dto.libroId);
  }

  @Delete(':id/libros/:libroId')
  @ApiOperation({ summary: 'Quitar un libro de la lista' })
  @ApiOkResponse({ type: ListaDeseosResponseDto })
  @ApiErrores(400, 401, 403, 404)
  quitarLibro(
    @Param('id', UuidPipe) id: string,
    @Param('libroId', UuidPipe) libroId: string,
    @CurrentUser() usuario: UsuarioAutenticado,
  ): Promise<ListaDeseosResponseDto> {
    return this.listas.quitarLibro(id, usuario, libroId);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Eliminar una lista' })
  @ApiNoContentResponse()
  @ApiErrores(400, 401, 403, 404)
  eliminar(
    @Param('id', UuidPipe) id: string,
    @CurrentUser() usuario: UsuarioAutenticado,
  ): Promise<void> {
    return this.listas.eliminar(id, usuario);
  }
}
