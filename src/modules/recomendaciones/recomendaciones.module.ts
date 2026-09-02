import { Module } from '@nestjs/common';
import { RecomendacionesService } from './recomendaciones.service';
import { RecomendacionesController } from './recomendaciones.controller';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { LibrosModule } from '../libros/libros.module';

@Module({
  imports: [UsuariosModule, LibrosModule],
  controllers: [RecomendacionesController],
  providers: [RecomendacionesService],
})
export class RecomendacionesModule {}
