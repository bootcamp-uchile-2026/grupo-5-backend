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
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Rol } from '../usuarios/entities/usuario.entity';
import { BuscarLibrosDto } from './dto/buscar-libros.dto';
import { CreateLibroDto } from './dto/create-libro.dto';
import { ImportarIsbnDto } from './dto/importar-isbn.dto';
import { LimiteQueryDto } from '../../common/dto/limite-query.dto';
import {
  FiltrosDisponiblesDto,
  GeneroDto,
  GrupoCategoriasDto,
  LibroResponseDto,
  LibroResumenDto,
  LibrosPaginadosDto,
} from './dto/libro-response.dto';
import { UpdateLibroDto } from './dto/update-libro.dto';
import { LibrosService } from './libros.service';

@ApiTags('libros')
@Controller('libros')
export class LibrosController {
  constructor(private readonly libros: LibrosService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Explorar, buscar y filtrar el catálogo (paginado)',
  })
  @ApiOkResponse({ type: LibrosPaginadosDto })
  @ApiErrores(400)
  buscar(@Query() filtros: BuscarLibrosDto): Promise<LibrosPaginadosDto> {
    return this.libros.buscar(filtros);
  }

  @Public()
  @Get('generos')
  @ApiOperation({
    summary:
      'Géneros disponibles con su cantidad de libros (para armar los filtros)',
  })
  @ApiOkResponse({ type: [GeneroDto] })
  generos(): Promise<GeneroDto[]> {
    return this.libros.generos();
  }

  @Public()
  @Get('categorias')
  @ApiOperation({
    summary: 'Menú de géneros y temáticas de UX, con la cantidad de libros',
    description:
      'Cada nombre se puede usar tal cual en GET /libros?genero= o ?categoria=. ' +
      'Una categoría con cantidad 0 es la que muestra "Aún no hay libros en este género".',
  })
  @ApiOkResponse({ type: [GrupoCategoriasDto] })
  categorias(): Promise<GrupoCategoriasDto[]> {
    return this.libros.categorias();
  }

  @Public()
  @Get('filtros')
  @ApiOperation({
    summary:
      'Valores disponibles para el panel de filtros (editoriales, subgéneros, autores, etiquetas, precios)',
  })
  @ApiOkResponse({ type: FiltrosDisponiblesDto })
  filtros(): Promise<FiltrosDisponiblesDto> {
    return this.libros.filtros();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Detalle de un libro (ficha de producto)' })
  @ApiOkResponse({ type: LibroResponseDto })
  @ApiErrores(400, [404, 'LIBRO_NO_ENCONTRADO'])
  async obtener(@Param('id', UuidPipe) id: string): Promise<LibroResponseDto> {
    return LibroResponseDto.desde(await this.libros.obtener(id));
  }

  @Public()
  @Get(':id/relacionados')
  @ApiOperation({
    summary: '"Lo que la comunidad también leyó" (ficha del libro)',
    description:
      'Libros comprados junto a este en pedidos pagados; se completa con los más vendidos de sus categorías.',
  })
  @ApiOkResponse({ type: [LibroResumenDto] })
  @ApiErrores(400, [404, 'LIBRO_NO_ENCONTRADO'])
  relacionados(
    @Param('id', UuidPipe) id: string,
    @Query() query: LimiteQueryDto,
  ): Promise<LibroResumenDto[]> {
    return this.libros.relacionados(id, query.limite);
  }

  @Post()
  @Roles(Rol.LIBRERO, Rol.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Agregar un libro al catálogo (LIBRERO o ADMIN)' })
  @ApiCreatedResponse({ type: LibroResponseDto })
  @ApiErrores(400, 401, 403, [409, 'ISBN_DUPLICADO'])
  async crear(@Body() dto: CreateLibroDto): Promise<LibroResponseDto> {
    return LibroResponseDto.desde(await this.libros.crear(dto));
  }

  @Post('importar-isbn')
  @Roles(Rol.LIBRERO, Rol.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Crear un libro completando sus datos desde Open Library (LIBRERO o ADMIN)',
  })
  @ApiCreatedResponse({ type: LibroResponseDto })
  @ApiErrores(
    400,
    401,
    403,
    [404, 'ISBN_NO_ENCONTRADO'],
    [409, 'ISBN_DUPLICADO'],
    [502, 'OPEN_LIBRARY_NO_DISPONIBLE'],
  )
  async importar(@Body() dto: ImportarIsbnDto): Promise<LibroResponseDto> {
    return LibroResponseDto.desde(await this.libros.importarPorIsbn(dto));
  }

  @Patch(':id')
  @Roles(Rol.LIBRERO, Rol.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Modificar un libro: precio, stock, estado, etc. (LIBRERO o ADMIN)',
  })
  @ApiOkResponse({ type: LibroResponseDto })
  @ApiErrores(400, 401, 403, 404, [409, 'ISBN_DUPLICADO'])
  async actualizar(
    @Param('id', UuidPipe) id: string,
    @Body() dto: UpdateLibroDto,
  ): Promise<LibroResponseDto> {
    return LibroResponseDto.desde(await this.libros.actualizar(id, dto));
  }

  @Delete(':id')
  @Roles(Rol.LIBRERO, Rol.ADMIN)
  @ApiBearerAuth()
  @HttpCode(204)
  @ApiOperation({
    summary: 'Retirar un libro del catálogo (borrado lógico; LIBRERO o ADMIN)',
  })
  @ApiNoContentResponse({ description: 'Libro retirado' })
  @ApiErrores(400, 401, 403, 404)
  eliminar(@Param('id', UuidPipe) id: string): Promise<void> {
    return this.libros.eliminar(id);
  }
}
