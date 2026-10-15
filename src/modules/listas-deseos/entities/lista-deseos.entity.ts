import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('listas_deseos')
export class ListaDeseos {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'usuario_id', type: 'uuid' })
  usuarioId: string;

  @Column()
  nombre: string;

  @Column({ name: 'es_para_regalo', default: false })
  esParaRegalo: boolean;

  /** La lista "Favoritos" se crea sola al marcar el primer libro. */
  @Column({ name: 'es_favoritos', default: false })
  esFavoritos: boolean;

  @OneToMany(() => ListaDeseosLibro, (l) => l.lista)
  libros: ListaDeseosLibro[];

  @CreateDateColumn({ name: 'creado_en', type: 'timestamptz' })
  creadoEn: Date;
}

@Entity('lista_deseos_libros')
export class ListaDeseosLibro {
  @PrimaryColumn({ name: 'lista_id', type: 'uuid' })
  listaId: string;

  @PrimaryColumn({ name: 'libro_id', type: 'uuid' })
  libroId: string;

  @ManyToOne(() => ListaDeseos, (l) => l.libros, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lista_id' })
  lista: ListaDeseos;

  @CreateDateColumn({ name: 'agregado_en', type: 'timestamptz' })
  agregadoEn: Date;
}
