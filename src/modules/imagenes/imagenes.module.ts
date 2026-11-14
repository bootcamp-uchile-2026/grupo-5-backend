import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LibrosModule } from '../libros/libros.module';
import { Imagen } from './entities/imagen.entity';
import {
  ImagenesController,
  LibrosImagenesController,
} from './imagenes.controller';
import { ImagenesService } from './imagenes.service';

@Module({
  imports: [TypeOrmModule.forFeature([Imagen]), LibrosModule],
  controllers: [ImagenesController, LibrosImagenesController],
  providers: [ImagenesService],
})
export class ImagenesModule {}
