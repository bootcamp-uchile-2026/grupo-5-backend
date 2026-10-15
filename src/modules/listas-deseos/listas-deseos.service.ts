import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ListaNoEncontradaException,
  PermisoDenegadoException,
} from '../../common/exceptions/app.exceptions';
import { UsuarioAutenticado } from '../auth/decorators/current-user.decorator';
import { LibrosService } from '../libros/libros.service';
import { Rol } from '../usuarios/entities/usuario.entity';
import { ListaDeseosResponseDto } from './dto/agregar-libro-lista.dto';
import { CreateListaDeseosDto } from './dto/create-lista-deseos.dto';
import { UpdateListaDeseosDto } from './dto/update-lista-deseos.dto';
import { ListaDeseos, ListaDeseosLibro } from './entities/lista-deseos.entity';

/** Listas de deseos del usuario, persistidas en PostgreSQL desde el Hito 3. */
@Injectable()
export class ListasDeseosService {
  constructor(
    @InjectRepository(ListaDeseos)
    private readonly repo: Repository<ListaDeseos>,
    @InjectRepository(ListaDeseosLibro)
    private readonly items: Repository<ListaDeseosLibro>,
    private readonly libros: LibrosService,
  ) {}

  async crear(
    usuarioId: string,
    dto: CreateListaDeseosDto,
  ): Promise<ListaDeseosResponseDto> {
    const lista = await this.repo.save(
      this.repo.create({
        usuarioId,
        nombre: dto.nombre,
        esParaRegalo: dto.esParaRegalo ?? false,
        esFavoritos: false,
      }),
    );
    return this.respuesta(lista.id);
  }

  async delUsuario(
    usuarioId: string,
    actual: UsuarioAutenticado,
  ): Promise<ListaDeseosResponseDto[]> {
    if (actual.rol !== Rol.ADMIN && actual.id !== usuarioId)
      throw new PermisoDenegadoException();
    const listas = await this.repo.find({
      where: { usuarioId },
      relations: { libros: true },
      order: { esFavoritos: 'DESC', creadoEn: 'ASC' },
    });
    const resumenes = await this.libros.resumenes(
      listas.flatMap((l) => l.libros.map((i) => i.libroId)),
    );
    return listas.map((l) => ListaDeseosResponseDto.desde(l, resumenes));
  }

  async obtener(
    id: string,
    actual: UsuarioAutenticado,
  ): Promise<ListaDeseosResponseDto> {
    await this.propia(id, actual);
    return this.respuesta(id);
  }

  async favoritos(usuarioId: string): Promise<ListaDeseosResponseDto> {
    return this.respuesta((await this.listaFavoritos(usuarioId)).id);
  }

  async marcarFavorito(
    usuarioId: string,
    libroId: string,
    marcar: boolean,
  ): Promise<ListaDeseosResponseDto> {
    const lista = await this.listaFavoritos(usuarioId);
    return marcar
      ? this.agregarA(lista.id, libroId)
      : this.quitarDe(lista.id, libroId);
  }

  async actualizar(
    id: string,
    actual: UsuarioAutenticado,
    dto: UpdateListaDeseosDto,
  ): Promise<ListaDeseosResponseDto> {
    const lista = await this.propia(id, actual);
    if (dto.nombre !== undefined) lista.nombre = dto.nombre;
    if (dto.esParaRegalo !== undefined) lista.esParaRegalo = dto.esParaRegalo;
    await this.repo.save(lista);
    return this.respuesta(id);
  }

  async agregarLibro(
    id: string,
    actual: UsuarioAutenticado,
    libroId: string,
  ): Promise<ListaDeseosResponseDto> {
    await this.propia(id, actual);
    return this.agregarA(id, libroId);
  }

  async quitarLibro(
    id: string,
    actual: UsuarioAutenticado,
    libroId: string,
  ): Promise<ListaDeseosResponseDto> {
    await this.propia(id, actual);
    return this.quitarDe(id, libroId);
  }

  async eliminar(id: string, actual: UsuarioAutenticado): Promise<void> {
    await this.propia(id, actual);
    await this.repo.delete({ id });
  }

  private async agregarA(
    listaId: string,
    libroId: string,
  ): Promise<ListaDeseosResponseDto> {
    await this.libros.obtener(libroId);
    await this.items
      .createQueryBuilder()
      .insert()
      .values({ listaId, libroId })
      .orIgnore()
      .execute();
    return this.respuesta(listaId);
  }

  private async quitarDe(
    listaId: string,
    libroId: string,
  ): Promise<ListaDeseosResponseDto> {
    await this.items.delete({ listaId, libroId });
    return this.respuesta(listaId);
  }

  private async listaFavoritos(usuarioId: string): Promise<ListaDeseos> {
    await this.repo
      .createQueryBuilder()
      .insert()
      .values({ usuarioId, nombre: 'Favoritos', esFavoritos: true })
      .orIgnore()
      .execute();
    return this.repo.findOneByOrFail({ usuarioId, esFavoritos: true });
  }

  private async propia(
    id: string,
    actual: UsuarioAutenticado,
  ): Promise<ListaDeseos> {
    const lista = await this.repo.findOneBy({ id });
    if (!lista) throw new ListaNoEncontradaException(id);
    if (actual.rol !== Rol.ADMIN && lista.usuarioId !== actual.id)
      throw new PermisoDenegadoException('La lista pertenece a otro usuario');
    return lista;
  }

  private async respuesta(id: string): Promise<ListaDeseosResponseDto> {
    const lista = await this.repo.findOneOrFail({
      where: { id },
      relations: { libros: true },
    });
    const resumenes = await this.libros.resumenes(
      lista.libros.map((l) => l.libroId),
    );
    return ListaDeseosResponseDto.desde(lista, resumenes);
  }
}
