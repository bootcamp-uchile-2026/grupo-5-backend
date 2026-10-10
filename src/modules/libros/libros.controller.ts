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
import {
  GeneroDto,
  LibroResponseDto,
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
  @Get(':id')
  @ApiOperation({ summary: 'Detalle de un libro (ficha de producto)' })
  @ApiOkResponse({ type: LibroResponseDto })
  @ApiErrores(400, [404, 'LIBRO_NO_ENCONTRADO'])
  async obtener(@Param('id', UuidPipe) id: string): Promise<LibroResponseDto> {
    return LibroResponseDto.desde(await this.libros.obtener(id));
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
