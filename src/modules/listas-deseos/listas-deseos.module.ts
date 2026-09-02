import { Module } from '@nestjs/common';
import { ListasDeseosService } from './listas-deseos.service';
import { ListasDeseosController } from './listas-deseos.controller';

@Module({
  controllers: [ListasDeseosController],
  providers: [ListasDeseosService],
})
export class ListasDeseosModule {}
