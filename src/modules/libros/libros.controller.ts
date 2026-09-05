import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { LibrosService } from './libros.service';
import { CreateLibroDto } from './dto/create-libro.dto';
import { UpdateLibroDto } from './dto/update-libro.dto';
import { ImportarLibroPorIsbnDto } from './dto/importar-libro-isbn.dto';

@ApiTags('Libros')
@Controller('libros')
export class LibrosController {
  constructor(private readonly librosService: LibrosService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar un libro en el catálogo' })
  create(@Body() createLibroDto: CreateLibroDto) {
    return this.librosService.create(createLibroDto);
  }

  @Post('importar-isbn')
  @ApiOperation({ summary: 'Obtener metadatos de un libro desde Open Library por ISBN' })
  importarPorIsbn(@Body() dto: ImportarLibroPorIsbnDto) {
    return this.librosService.importarPorIsbn(dto.isbn);
  }

  @Get()
  @ApiOperation({ summary: 'Listar catálogo, con filtro opcional por género o autor' })
  @ApiQuery({ name: 'genero', required: false })
  @ApiQuery({ name: 'autor', required: false })
  findAll(@Query('genero') genero?: string, @Query('autor') autor?: string) {
    return this.librosService.findAll({ genero, autor });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un libro por id' })
  findOne(@Param('id') id: string) {
    return this.librosService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un libro' })
  update(@Param('id') id: string, @Body() updateLibroDto: UpdateLibroDto) {
    return this.librosService.update(id, updateLibroDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un libro del catálogo' })
  remove(@Param('id') id: string) {
    return this.librosService.remove(id);
  }
}
