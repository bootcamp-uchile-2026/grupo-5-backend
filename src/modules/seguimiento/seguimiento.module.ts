import { Module } from '@nestjs/common';
import { PedidosModule } from '../pedidos/pedidos.module';
import { SeguimientoController } from './seguimiento.controller';
import { SeguimientoService } from './seguimiento.service';

@Module({
  imports: [PedidosModule],
  controllers: [SeguimientoController],
  providers: [SeguimientoService],
})
export class SeguimientoModule {}
