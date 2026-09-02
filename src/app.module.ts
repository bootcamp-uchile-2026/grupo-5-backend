import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { LibrosModule } from './modules/libros/libros.module';
import { LibrerosModule } from './modules/libreros/libreros.module';
import { RecomendacionesModule } from './modules/recomendaciones/recomendaciones.module';
import { ClubLecturaModule } from './modules/club-lectura/club-lectura.module';
import { ResenasModule } from './modules/resenas/resenas.module';
import { ListasDeseosModule } from './modules/listas-deseos/listas-deseos.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    UsuariosModule,
    LibrosModule,
    LibrerosModule,
    RecomendacionesModule,
    ClubLecturaModule,
    ResenasModule,
    ListasDeseosModule,
  ],
})
export class AppModule {}
