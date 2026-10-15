import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
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
import { Public } from '../auth/decorators/public.decorator';
import { CreateResenaDto, CrearResenaDto } from './dto/create-resena.dto';
import {
  ListarResenasQueryDto,
  ResenaResponseDto,
  ResenasPaginadasDto,
} from './dto/resena-response.dto';
import { UpdateResenaDto } from './dto/update-resena.dto';
import { ResenasService } from './resenas.service';

const ERRORES_CREAR = [
  400,
  401,
  [404, 'LIBRO_NO_ENCONTRADO'],
  [409, 'RESENA_DUPLICADA: ya reseñaste este libro'],
] as Array<number | [number, string]>;

/** Reseñas desde la ficha del libro. */
@ApiTags('reseñas')
@Controller('libros/:libroId/resenas')
export class LibroResenasController {
  constructor(private readonly resenas: ResenasService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary:
      'Reseñas de un libro (lectores y libreros), con resumen de estrellas',
  })
  @ApiOkResponse({ type: ResenasPaginadasDto })
  @ApiErrores(400, [404, 'LIBRO_NO_ENCONTRADO'])
  listar(
    @Param('libroId', UuidPipe) libroId: string,
    @Query() query: ListarResenasQueryDto,
  ): Promise<ResenasPaginadasDto> {
    return this.resenas.listarPorLibro(libroId, query);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Escribir mi reseña de un libro',
    description:
      'Una por libro y usuario. Queda como "compra verificada" si el usuario tiene un pedido pagado con el libro, ' +
      'y como tipo LIBRERO si el usuario tiene ese rol.',
  })
  @ApiCreatedResponse({ type: ResenaResponseDto })
  @ApiErrores(...ERRORES_CREAR)
  async crear(
    @Param('libroId', UuidPipe) libroId: string,
    @Body() dto: CrearResenaDto,
    @CurrentUser() usuario: UsuarioAutenticado,
  ): Promise<ResenaResponseDto> {
    return ResenaResponseDto.desde(
      await this.resenas.crear(libroId, usuario, dto),
    );
  }
}

/** Rutas del Hito 1, ahora persistentes y con el autor tomado del token. */
@ApiTags('reseñas')
@Controller('resenas')
export class ResenasController {
  constructor(private readonly resenas: ResenasService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Crear una reseña (equivale a POST /libros/:id/resenas)',
  })
  @ApiCreatedResponse({ type: ResenaResponseDto })
  @ApiErrores(...ERRORES_CREAR)
  async crear(
    @Body() dto: CreateResenaDto,
    @CurrentUser() usuario: UsuarioAutenticado,
  ): Promise<ResenaResponseDto> {
    const { libroId, calificacion, titulo, comentario } = dto;
    return ResenaResponseDto.desde(
      await this.resenas.crear(libroId, usuario, {
        calificacion,
        titulo,
        comentario,
      }),
    );
  }

  @Get('mias')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mis reseñas (Mi cuenta)' })
  @ApiOkResponse({ type: [ResenaResponseDto] })
  @ApiErrores(401)
  async mias(
    @CurrentUser() usuario: UsuarioAutenticado,
  ): Promise<ResenaResponseDto[]> {
    return (await this.resenas.listarDeUsuario(usuario.id)).map((r) =>
      ResenaResponseDto.desde(r),
    );
  }

  @Public()
  @Get('libro/:libroId')
  @ApiOperation({
    summary:
      'Reseñas de un libro (ruta del Hito 1; preferir GET /libros/:id/resenas)',
  })
  @ApiOkResponse({ type: [ResenaResponseDto] })
  @ApiErrores(400, 404)
  async porLibro(
    @Param('libroId', UuidPipe) libroId: string,
  ): Promise<ResenaResponseDto[]> {
    return (await this.resenas.listarPorLibro(libroId, { page: 1, limit: 50 }))
      .items;
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Editar mi reseña (o cualquiera si es ADMIN)' })
  @ApiOkResponse({ type: ResenaResponseDto })
  @ApiErrores(400, 401, 403, [404, 'RESENA_NO_ENCONTRADA'])
  async actualizar(
    @Param('id', UuidPipe) id: string,
    @Body() dto: UpdateResenaDto,
    @CurrentUser() usuario: UsuarioAutenticado,
  ): Promise<ResenaResponseDto> {
    return ResenaResponseDto.desde(
      await this.resenas.actualizar(id, usuario, dto),
    );
  }

  @Delete(':id')
  @ApiBearerAuth()
  @HttpCode(204)
  @ApiOperation({ summary: 'Eliminar mi reseña (o cualquiera si es ADMIN)' })
  @ApiNoContentResponse({ description: 'Reseña eliminada' })
  @ApiErrores(400, 401, 403, 404)
  eliminar(
    @Param('id', UuidPipe) id: string,
    @CurrentUser() usuario: UsuarioAutenticado,
  ): Promise<void> {
    return this.resenas.eliminar(id, usuario);
  }
}
