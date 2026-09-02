import { Module } from '@nestjs/common';
import { LibrerosService } from './libreros.service';
import { LibrerosController } from './libreros.controller';

@Module({
  controllers: [LibrerosController],
  providers: [LibrerosService],
  exports: [LibrerosService],
})
export class LibrerosModule {}
