import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LibrosModule } from '../libros/libros.module';
import { Resena } from './entities/resena.entity';
import {
  LibroResenasController,
  ResenasController,
} from './resenas.controller';
import { ResenasService } from './resenas.service';

@Module({
  imports: [TypeOrmModule.forFeature([Resena]), LibrosModule],
  controllers: [LibroResenasController, ResenasController],
  providers: [ResenasService],
})
export class ResenasModule {}
