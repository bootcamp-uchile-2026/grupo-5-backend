import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ResenasService } from './resenas.service';
import { CreateResenaDto } from './dto/create-resena.dto';
import { UpdateResenaDto } from './dto/update-resena.dto';

@ApiTags('Reseñas')
@Controller('resenas')
export class ResenasController {
  constructor(private readonly resenasService: ResenasService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una reseña de un libro' })
  create(@Body() dto: CreateResenaDto) {
    return this.resenasService.create(dto);
  }

  @Get('libro/:libroId')
  @ApiOperation({ summary: 'Listar reseñas de un libro' })
  findByLibro(@Param('libroId') libroId: string) {
    return this.resenasService.findByLibro(libroId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una reseña' })
  update(@Param('id') id: string, @Body() dto: UpdateResenaDto) {
    return this.resenasService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una reseña' })
  remove(@Param('id') id: string) {
    return this.resenasService.remove(id);
  }
}
