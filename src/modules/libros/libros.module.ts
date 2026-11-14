import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Libro } from './entities/libro.entity';
import { LibrosController } from './libros.controller';
import { LibrosService } from './libros.service';
import { LibroExistePipe } from './pipes/libro-existe.pipe';

@Module({
  imports: [TypeOrmModule.forFeature([Libro])],
  controllers: [LibrosController],
  providers: [LibrosService, LibroExistePipe],
  exports: [LibrosService, LibroExistePipe, TypeOrmModule],
})
export class LibrosModule {}
