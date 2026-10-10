import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import {
  EmailYaRegistradoException,
  PermisoDenegadoException,
  UsuarioNoEncontradoException,
} from '../../common/exceptions/app.exceptions';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { Rol, Usuario } from './entities/usuario.entity';

const RONDAS_BCRYPT = 10;

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario) private readonly repo: Repository<Usuario>,
  ) {}

  async crear(dto: CreateUsuarioDto): Promise<Usuario> {
    // El registro es público: no se puede auto-asignar un rol con privilegios.
    if (dto.rol && dto.rol !== Rol.CLIENTE) {
      throw new PermisoDenegadoException(
        'El registro público solo permite crear cuentas con rol CLIENTE',
      );
    }
    if (await this.repo.existsBy({ email: dto.email })) {
      throw new EmailYaRegistradoException(dto.email);
    }
    const usuario = this.repo.create({
      nombre: dto.nombre,
      email: dto.email,
      passwordHash: await bcrypt.hash(dto.password, RONDAS_BCRYPT),
      rol: Rol.CLIENTE,
      generosFavoritos: dto.generosFavoritos ?? [],
      avatarUrl: dto.avatarUrl ?? null,
    });
    return this.repo.save(usuario);
  }

  listar(): Promise<Usuario[]> {
    return this.repo.find({ order: { creadoEn: 'ASC' } });
  }

  async obtener(id: string): Promise<Usuario> {
    const usuario = await this.repo.findOneBy({ id });
    if (!usuario) throw new UsuarioNoEncontradoException(id);
    return usuario;
  }

  buscarPorEmail(email: string): Promise<Usuario | null> {
    return this.repo.findOneBy({ email: email.trim().toLowerCase() });
  }

  async actualizar(id: string, dto: UpdateUsuarioDto): Promise<Usuario> {
    const usuario = await this.obtener(id);
    if (dto.nombre !== undefined) usuario.nombre = dto.nombre;
    if (dto.generosFavoritos !== undefined)
      usuario.generosFavoritos = dto.generosFavoritos;
    if (dto.avatarUrl !== undefined) usuario.avatarUrl = dto.avatarUrl;
    if (dto.password !== undefined)
      usuario.passwordHash = await bcrypt.hash(dto.password, RONDAS_BCRYPT);
    return this.repo.save(usuario);
  }

  async eliminar(id: string): Promise<void> {
    const usuario = await this.obtener(id);
    await this.repo.remove(usuario);
  }
}
