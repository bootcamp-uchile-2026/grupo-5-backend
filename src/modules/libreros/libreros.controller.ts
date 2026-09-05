import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LibrerosService } from './libreros.service';
import { CreatePerfilLibreroDto } from './dto/create-perfil-librero.dto';
import { UpdatePerfilLibreroDto } from './dto/update-perfil-librero.dto';
import { CreateSeccionCuradaDto } from './dto/create-seccion-curada.dto';

@ApiTags('Libreros')
@Controller('libreros')
export class LibrerosController {
  constructor(private readonly librerosService: LibrerosService) {}

  @Post()
  @ApiOperation({ summary: 'Crear el perfil editorial de un librero' })
  create(@Body() dto: CreatePerfilLibreroDto) {
    return this.librerosService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar perfiles de libreros' })
  findAll() {
    return this.librerosService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener el perfil de un librero' })
  findOne(@Param('id') id: string) {
    return this.librerosService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar el perfil editorial de un librero' })
  update(@Param('id') id: string, @Body() dto: UpdatePerfilLibreroDto) {
    return this.librerosService.update(id, dto);
  }

  @Post(':id/seguir/:usuarioId')
  @ApiOperation({ summary: 'Un cliente sigue a un librero' })
  seguir(@Param('id') id: string, @Param('usuarioId') usuarioId: string) {
    return this.librerosService.seguir(id, usuarioId);
  }

  @Post(':id/seccion-curada')
  @ApiOperation({ summary: 'Agregar un libro a la sección curada del librero, con nota personal' })
  agregarSeccionCurada(@Param('id') id: string, @Body() dto: CreateSeccionCuradaDto) {
    return this.librerosService.agregarSeccionCurada(id, dto);
  }

  @Get(':id/seccion-curada')
  @ApiOperation({ summary: 'Obtener la sección curada de un librero' })
  obtenerSeccionCurada(@Param('id') id: string) {
    return this.librerosService.obtenerSeccionCurada(id);
  }
}
