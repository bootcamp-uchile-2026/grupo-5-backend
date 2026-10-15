import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LibrosModule } from '../libros/libros.module';
import { ClubLecturaController } from './club-lectura.controller';
import { ClubLecturaService } from './club-lectura.service';
import {
  ClubLectura,
  ClubParticipante,
  ComentarioHilo,
  HiloDiscusion,
} from './entities/club-lectura.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClubLectura,
      ClubParticipante,
      HiloDiscusion,
      ComentarioHilo,
    ]),
    LibrosModule,
  ],
  controllers: [ClubLecturaController],
  providers: [ClubLecturaService],
})
export class ClubLecturaModule {}
