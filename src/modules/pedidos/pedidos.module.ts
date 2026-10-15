import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CuponesModule } from '../cupones/cupones.module';
import { EnviosModule } from '../envios/envios.module';
import { Pedido, PedidoItem } from './entities/pedido.entity';
import {
  PedidosController,
  PedidosInvitadoController,
} from './pedidos.controller';
import { PedidosService } from './pedidos.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pedido, PedidoItem]),
    EnviosModule,
    CuponesModule,
  ],
  controllers: [PedidosInvitadoController, PedidosController],
  providers: [PedidosService],
  exports: [PedidosService],
})
export class PedidosModule {}
