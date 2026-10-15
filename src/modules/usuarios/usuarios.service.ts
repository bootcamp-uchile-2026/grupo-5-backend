import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import {
  EmailYaRegistradoException,
  PermisoDenegadoException,
  UsuarioNoEncontradoException,
} from '../../common/exceptions/app.exceptions';
import { NewsletterService } from '../newsletter/newsletter.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { ProveedorAuth, Rol, Usuario } from './entities/usuario.entity';

const RONDAS_BCRYPT = 10;

/** Datos que entrega Google/Facebook al validar un token de acceso. */
export interface PerfilSocial {
  proveedor: ProveedorAuth.GOOGLE | ProveedorAuth.FACEBOOK;
  proveedorId: string;
  email: string;
  nombre: string;
  apellido: string | null;
  avatarUrl: string | null;
}

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario) private readonly repo: Repository<Usuario>,
    private readonly newsletter: NewsletterService,
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
    const usuario = await this.repo.save(
      this.repo.create({
        nombre: dto.nombre.trim(),
        apellido: dto.apellido?.trim() || null,
        email: dto.email,
        passwordHash: await bcrypt.hash(dto.password, RONDAS_BCRYPT),
        rol: Rol.CLIENTE,
        generosFavoritos: dto.generosFavoritos ?? [],
        avatarUrl: dto.avatarUrl ?? null,
        recibirNovedades: dto.recibirNovedades ?? false,
        emailVerificado: false,
        proveedorAuth: ProveedorAuth.LOCAL,
        proveedorId: null,
      }),
    );
    if (usuario.recibirNovedades)
      await this.newsletter.suscribir(usuario.email, usuario.id);
    return usuario;
  }

  /**
   * Cuenta para un acceso con Google/Facebook: si ya existe (por id del
   * proveedor o por email) se reutiliza y se vincula; si no, se crea sin
   * contraseña. El proveedor ya verificó el email.
   */
  async obtenerOCrearSocial(perfil: PerfilSocial): Promise<Usuario> {
    const porProveedor = await this.repo.findOneBy({
      proveedorAuth: perfil.proveedor,
      proveedorId: perfil.proveedorId,
    });
    if (porProveedor) return porProveedor;

    const porEmail = await this.buscarPorEmail(perfil.email);
    if (porEmail) {
      porEmail.emailVerificado = true;
      if (!porEmail.proveedorId) {
        porEmail.proveedorAuth = perfil.proveedor;
        porEmail.proveedorId = perfil.proveedorId;
      }
      porEmail.avatarUrl ??= perfil.avatarUrl;
      return this.repo.save(porEmail);
    }

    return this.repo.save(
      this.repo.create({
        nombre: perfil.nombre.slice(0, 80) || perfil.email.split('@')[0],
        apellido: perfil.apellido?.slice(0, 80) ?? null,
        email: perfil.email,
        passwordHash: null,
        rol: Rol.CLIENTE,
        generosFavoritos: [],
        avatarUrl: perfil.avatarUrl,
        recibirNovedades: false,
        emailVerificado: true,
        proveedorAuth: perfil.proveedor,
        proveedorId: perfil.proveedorId,
      }),
    );
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

  async marcarEmailVerificado(id: string): Promise<void> {
    await this.repo.update({ id }, { emailVerificado: true });
  }

  async cambiarPassword(id: string, password: string): Promise<void> {
    await this.repo.update(
      { id },
      { passwordHash: await bcrypt.hash(password, RONDAS_BCRYPT) },
    );
  }

  async actualizar(id: string, dto: UpdateUsuarioDto): Promise<Usuario> {
    const usuario = await this.obtener(id);
    if (dto.nombre !== undefined) usuario.nombre = dto.nombre.trim();
    if (dto.apellido !== undefined)
      usuario.apellido = dto.apellido.trim() || null;
    if (dto.generosFavoritos !== undefined)
      usuario.generosFavoritos = dto.generosFavoritos;
    if (dto.avatarUrl !== undefined) usuario.avatarUrl = dto.avatarUrl;
    if (dto.password !== undefined)
      usuario.passwordHash = await bcrypt.hash(dto.password, RONDAS_BCRYPT);
    if (
      dto.recibirNovedades !== undefined &&
      dto.recibirNovedades !== usuario.recibirNovedades
    ) {
      usuario.recibirNovedades = dto.recibirNovedades;
      if (dto.recibirNovedades)
        await this.newsletter.suscribir(usuario.email, usuario.id);
      else await this.newsletter.darDeBajaPorEmail(usuario.email);
    }
    return this.repo.save(usuario);
  }

  async eliminar(id: string): Promise<void> {
    const usuario = await this.obtener(id);
    await this.repo.remove(usuario);
  }
}
