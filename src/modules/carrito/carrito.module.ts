import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LibrosModule } from '../libros/libros.module';
import { CarritoController } from './carrito.controller';
import { CarritoService } from './carrito.service';
import { CarritoItem } from './entities/carrito-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CarritoItem]), LibrosModule],
  controllers: [CarritoController],
  providers: [CarritoService],
})
export class CarritoModule {}
