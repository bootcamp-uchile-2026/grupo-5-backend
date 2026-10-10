import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PedidosModule } from '../pedidos/pedidos.module';
import { Pago } from './entities/pago.entity';
import { PagosController } from './pagos.controller';
import { PagosService } from './pagos.service';

@Module({
  imports: [TypeOrmModule.forFeature([Pago]), PedidosModule],
  controllers: [PagosController],
  providers: [PagosService],
})
export class PagosModule {}
