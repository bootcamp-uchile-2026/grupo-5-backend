import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ListasDeseosService } from './listas-deseos.service';
import { CreateListaDeseosDto } from './dto/create-lista-deseos.dto';
import { UpdateListaDeseosDto } from './dto/update-lista-deseos.dto';
import { AgregarLibroListaDto } from './dto/agregar-libro-lista.dto';

@ApiTags('Listas de deseos')
@Controller('listas-deseos')
export class ListasDeseosController {
  constructor(private readonly listasDeseosService: ListasDeseosService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una lista de deseos' })
  create(@Body() dto: CreateListaDeseosDto) {
    return this.listasDeseosService.create(dto);
  }

  @Get('usuario/:usuarioId')
  @ApiOperation({ summary: 'Listar las listas de deseos de un usuario' })
  findByUsuario(@Param('usuarioId') usuarioId: string) {
    return this.listasDeseosService.findByUsuario(usuarioId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una lista de deseos' })
  findOne(@Param('id') id: string) {
    return this.listasDeseosService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una lista de deseos' })
  update(@Param('id') id: string, @Body() dto: UpdateListaDeseosDto) {
    return this.listasDeseosService.update(id, dto);
  }

  @Post(':id/libros')
  @ApiOperation({ summary: 'Agregar un libro a la lista de deseos' })
  agregarLibro(@Param('id') id: string, @Body() dto: AgregarLibroListaDto) {
    return this.listasDeseosService.agregarLibro(id, dto.libroId);
  }

  @Delete(':id/libros/:libroId')
  @ApiOperation({ summary: 'Quitar un libro de la lista de deseos' })
  quitarLibro(@Param('id') id: string, @Param('libroId') libroId: string) {
    return this.listasDeseosService.quitarLibro(id, libroId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una lista de deseos' })
  remove(@Param('id') id: string) {
    return this.listasDeseosService.remove(id);
  }
}
