import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { LoginUsuarioDto } from './dto/login-usuario.dto';
import { Usuario } from './entities/usuario.entity';
import { randomUUID } from 'crypto';

/**
 * Servicio de Usuarios.
 * Hito 1: persistencia en memoria como base. Se reemplazará por
 * un repositorio real (TypeORM/Prisma + BD) en los siguientes hitos.
 */
@Injectable()
export class UsuariosService {
  private readonly usuarios: Usuario[] = [];

  create(dto: CreateUsuarioDto): Usuario {
    const existe = this.usuarios.find((u) => u.email === dto.email);
    if (existe) {
      throw new ConflictException('Ya existe un usuario con ese email');
    }
    const nuevoUsuario: Usuario = {
      id: randomUUID(),
      nombre: dto.nombre,
      email: dto.email,
      passwordHash: dto.password, // TODO: hashear con bcrypt en próximos hitos
      rol: dto.rol,
      generosFavoritos: dto.generosFavoritos ?? [],
      fechaRegistro: new Date(),
    };
    this.usuarios.push(nuevoUsuario);
    return nuevoUsuario;
  }

  findAll(): Usuario[] {
    return this.usuarios;
  }

  findOne(id: string): Usuario {
    const usuario = this.usuarios.find((u) => u.id === id);
    if (!usuario) {
      throw new NotFoundException(`Usuario ${id} no encontrado`);
    }
    return usuario;
  }

  update(id: string, dto: UpdateUsuarioDto): Usuario {
    const usuario = this.findOne(id);
    Object.assign(usuario, dto);
    return usuario;
  }

  remove(id: string): void {
    const index = this.usuarios.findIndex((u) => u.id === id);
    if (index === -1) {
      throw new NotFoundException(`Usuario ${id} no encontrado`);
    }
    this.usuarios.splice(index, 1);
  }

  login(dto: LoginUsuarioDto): { accessToken: string; usuario: Usuario } {
    const usuario = this.usuarios.find((u) => u.email === dto.email);
    if (!usuario || usuario.passwordHash !== dto.password) {
      throw new NotFoundException('Credenciales inválidas');
    }
    // TODO: emitir JWT real en el hito de autenticación
    return { accessToken: `fake-jwt-for-${usuario.id}`, usuario };
  }
}
