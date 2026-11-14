import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LibrosModule } from '../libros/libros.module';
import { ListaDeseos, ListaDeseosLibro } from './entities/lista-deseos.entity';
import { ListasDeseosController } from './listas-deseos.controller';
import { ListasDeseosService } from './listas-deseos.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ListaDeseos, ListaDeseosLibro]),
    LibrosModule,
  ],
  controllers: [ListasDeseosController],
  providers: [ListasDeseosService],
})
export class ListasDeseosModule {}
