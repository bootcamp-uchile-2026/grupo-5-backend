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

@Module({
  imports: [
    TypeOrmModule.forFeature([Librero, RecomendacionLibrero, Coleccion]),
    LibrosModule,
    UsuariosModule,
  ],
  controllers: [LibrerosController, LibroRecomendacionesController],
  providers: [LibrerosService],
  exports: [LibrerosService],
})
export class LibrerosModule {}
