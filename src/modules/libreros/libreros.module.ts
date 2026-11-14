import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LibrosModule } from '../libros/libros.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
import {
  Coleccion,
  Librero,
  RecomendacionLibrero,
} from './entities/perfil-librero.entity';
import {
  LibrerosController,
  LibroRecomendacionesController,
} from './libreros.controller';
import { LibrerosService } from './libreros.service';
import { PreguntaLibrero } from './entities/pregunta-librero.entity';
import { LibreroExistePipe } from './pipes/librero-existe.pipe';
import { PreguntasLibreroController } from './preguntas-librero.controller';
import { PreguntasLibreroService } from './preguntas-librero.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Librero,
      RecomendacionLibrero,
      Coleccion,
      PreguntaLibrero,
    ]),
    LibrosModule,
    UsuariosModule,
  ],
  controllers: [
    LibrerosController,
    LibroRecomendacionesController,
    PreguntasLibreroController,
  ],
  providers: [LibrerosService, PreguntasLibreroService, LibreroExistePipe],
  exports: [LibrerosService],
})
export class LibrerosModule {}
