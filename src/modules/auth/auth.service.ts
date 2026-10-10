import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { CredencialesInvalidasException } from '../../common/exceptions/app.exceptions';
import { CreateUsuarioDto } from '../usuarios/dto/create-usuario.dto';
import { UsuarioResponseDto } from '../usuarios/dto/usuario-response.dto';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { UsuariosService } from '../usuarios/usuarios.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuarios: UsuariosService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async registrar(dto: CreateUsuarioDto): Promise<AuthResponseDto> {
    return this.emitir(await this.usuarios.crear(dto));
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const usuario = await this.usuarios.buscarPorEmail(dto.email);
    // Mismo error si el email no existe o la contraseña no coincide, para no
    // revelar qué cuentas están registradas.
    if (
      !usuario ||
      !(await bcrypt.compare(dto.password, usuario.passwordHash))
    ) {
      throw new CredencialesInvalidasException();
    }
    return this.emitir(usuario);
  }

  private async emitir(usuario: Usuario): Promise<AuthResponseDto> {
    const accessToken = await this.jwt.signAsync({
      sub: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
    });
    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: this.config.get<string>('JWT_EXPIRES_IN', '2h'),
      usuario: UsuarioResponseDto.desde(usuario),
    };
  }
}
