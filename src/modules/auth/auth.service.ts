import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import {
  CredencialesInvalidasException,
  TokenInvalidoException,
} from '../../common/exceptions/app.exceptions';
import { CreateUsuarioDto } from '../usuarios/dto/create-usuario.dto';
import { UsuarioResponseDto } from '../usuarios/dto/usuario-response.dto';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { UsuariosService } from '../usuarios/usuarios.service';
import { CuentaService } from './cuenta.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './guards/jwt-auth.guard';
import { SocialAuthService } from './social-auth.service';

const TIPO_REFRESH = 'refresh';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuarios: UsuariosService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly cuenta: CuentaService,
    private readonly social: SocialAuthService,
  ) {}

  async registrar(dto: CreateUsuarioDto): Promise<AuthResponseDto> {
    const usuario = await this.usuarios.crear(dto);
    const tokenVerificacion = await this.cuenta.enviarVerificacion(usuario);
    const respuesta = await this.emitir(usuario);
    return tokenVerificacion
      ? { ...respuesta, tokenVerificacionDesarrollo: tokenVerificacion }
      : respuesta;
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const usuario = await this.usuarios.buscarPorEmail(dto.email);
    // Mismo error si el email no existe o la contraseña no coincide, para no
    // revelar qué cuentas están registradas. Las cuentas creadas con
    // Google/Facebook no tienen contraseña propia.
    if (
      !usuario?.passwordHash ||
      !(await bcrypt.compare(dto.password, usuario.passwordHash))
    ) {
      throw new CredencialesInvalidasException();
    }
    return this.emitir(usuario);
  }

  /** Entrega un accessToken nuevo sin pedir la contraseña otra vez. */
  async refrescar(refreshToken: string): Promise<AuthResponseDto> {
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken);
    } catch {
      throw new TokenInvalidoException();
    }
    if (payload.typ !== TIPO_REFRESH) throw new TokenInvalidoException();
    // Se relee el usuario: si cambió su rol o se eliminó la cuenta, aplica ya.
    const usuario = await this.usuarios.obtener(payload.sub).catch(() => {
      throw new TokenInvalidoException();
    });
    return this.emitir(usuario);
  }

  async conGoogle(idToken: string): Promise<AuthResponseDto> {
    const perfil = await this.social.validarGoogle(idToken);
    return this.emitir(await this.usuarios.obtenerOCrearSocial(perfil));
  }

  async conFacebook(accessToken: string): Promise<AuthResponseDto> {
    const perfil = await this.social.validarFacebook(accessToken);
    return this.emitir(await this.usuarios.obtenerOCrearSocial(perfil));
  }

  private async emitir(usuario: Usuario): Promise<AuthResponseDto> {
    const claims = { sub: usuario.id, email: usuario.email, rol: usuario.rol };
    const expiresIn = this.config.get<string>('JWT_EXPIRES_IN', '2h');
    const refreshExpiresIn = this.config.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
      '7d',
    );
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(claims),
      this.jwt.signAsync({ ...claims, typ: TIPO_REFRESH }, {
        expiresIn: refreshExpiresIn,
      } as JwtSignOptions),
    ]);
    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn,
      refreshToken,
      refreshExpiresIn,
      usuario: UsuarioResponseDto.desde(usuario),
    };
  }
}
