import { Module } from '@nestjs/common';
import { ClubLecturaService } from './club-lectura.service';
import { ClubLecturaController } from './club-lectura.controller';

@Module({
  controllers: [ClubLecturaController],
  providers: [ClubLecturaService],
})
export class ClubLecturaModule {}
