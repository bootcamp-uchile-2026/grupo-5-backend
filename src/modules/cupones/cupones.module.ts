import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CuponesController } from './cupones.controller';
import { CuponesService } from './cupones.service';
import { Cupon } from './entities/cupon.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Cupon])],
  controllers: [CuponesController],
  providers: [CuponesService],
  exports: [CuponesService],
})
export class CuponesModule {}
