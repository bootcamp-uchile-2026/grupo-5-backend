import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MetodoEnvio } from '../../envios/dto/envio.dto';

export enum EstadoPedido {
  PENDIENTE_PAGO = 'PENDIENTE_PAGO',
  PAGADO = 'PAGADO',
  CANCELADO = 'CANCELADO',
}

@Entity('pedidos')
export class Pedido {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Correlativo legible para el cliente; se expone como LCN-000123. */
  @Column({ type: 'int' })
  @Generated('increment')
  numero: number;

  @Column({ name: 'usuario_id', type: 'uuid' })
  usuarioId: string;

  @Column({ type: 'varchar', length: 20 })
  estado: EstadoPedido;

  @Column({ name: 'metodo_envio', type: 'varchar', length: 20 })
  metodoEnvio: MetodoEnvio;

  @Column({ type: 'int' })
  subtotal: number;

  @Column({ name: 'costo_envio', type: 'int' })
  costoEnvio: number;

  @Column({ type: 'int' })
  total: number;

  @Column({ name: 'dias_estimados', type: 'int' })
  diasEstimados: number;

  @Column({ name: 'dir_receptor', type: 'varchar', nullable: true })
  dirReceptor: string | null;

  @Column({ name: 'dir_calle', type: 'varchar', nullable: true })
  dirCalle: string | null;

  @Column({ name: 'dir_comuna', type: 'varchar', nullable: true })
  dirComuna: string | null;

  @Column({ name: 'dir_region', type: 'varchar', nullable: true })
  dirRegion: string | null;

  @Column({ name: 'dir_telefono', type: 'varchar', nullable: true })
  dirTelefono: string | null;

  @Column({ name: 'codigo_seguimiento', type: 'varchar', nullable: true })
  codigoSeguimiento: string | null;

  @CreateDateColumn({ name: 'creado_en', type: 'timestamptz' })
  creadoEn: Date;

  @Column({ name: 'pagado_en', type: 'timestamptz', nullable: true })
  pagadoEn: Date | null;

  @Column({ name: 'cancelado_en', type: 'timestamptz', nullable: true })
  canceladoEn: Date | null;

  @OneToMany(() => PedidoItem, (item) => item.pedido, { cascade: ['insert'] })
  items: PedidoItem[];
}

/** Foto del libro al momento de comprar: el precio no cambia si después cambia el catálogo. */
@Entity('pedido_items')
export class PedidoItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'pedido_id', type: 'uuid' })
  pedidoId: string;

  @ManyToOne(() => Pedido, (pedido) => pedido.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pedido_id' })
  pedido: Pedido;

  @Column({ name: 'libro_id', type: 'uuid' })
  libroId: string;

  @Column()
  titulo: string;

  @Column({ name: 'precio_unitario', type: 'int' })
  precioUnitario: number;

  @Column({ type: 'int' })
  cantidad: number;

  @Column({ type: 'int' })
  subtotal: number;
}
