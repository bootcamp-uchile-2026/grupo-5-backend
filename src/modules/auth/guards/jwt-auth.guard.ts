import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import {
  OrigenNoPermitidoException,
  TokenInvalidoException,
  TokenRequeridoException,
} from '../../../common/exceptions/app.exceptions';
import { origenesPermitidos } from '../../../config/origenes';
import { Rol } from '../../usuarios/entities/usuario.entity';
import { UsuarioAutenticado } from '../decorators/current-user.decorator';
import {
  IS_OPTIONAL_AUTH_KEY,
  IS_PUBLIC_KEY,
} from '../decorators/public.decorator';
import { COOKIE_ACCESO } from '../sesion-cookies.service';

const METODOS_SEGUROS = new Set(['GET', 'HEAD', 'OPTIONS']);

function origenDe(url: string | undefined): string {
  try {
    return url ? new URL(url).origin : '';
  } catch {
    return '';
  }
}

export interface JwtPayload {
  sub: string;
  email: string;
  rol: Rol;
  /** Solo lo llevan los tokens que no son de acceso (p. ej. "refresh"). */
  typ?: string;
  /** Versión de sesión del usuario (refresh): cerrar sesión la incrementa. */
  ver?: number;
}

/**
 * Guard global: toda ruta exige un JWT válido salvo que esté marcada con
 * @Public(). Con @AuthOpcional() el token no es obligatorio, pero si viene se
 * valida. Deja al usuario autenticado en req.user.
 *
 * El token se lee del header Authorization: Bearer (Mobile, Swagger) o, si no
 * viene, de la cookie HttpOnly de sesión (Web). Con cookie, las peticiones que
 * modifican datos deben venir de un origen de CORS_ORIGIN: así otro sitio no
 * puede aprovechar la cookie del navegador (CSRF).
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const metadata = (clave: string) =>
      this.reflector.getAllAndOverride<boolean>(clave, [
        context.getHandler(),
        context.getClass(),
      ]);
    const opcional = metadata(IS_OPTIONAL_AUTH_KEY);
    if (metadata(IS_PUBLIC_KEY) && !opcional) return true;

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: UsuarioAutenticado }>();
    const token = this.extraerToken(request);
    if (!token) {
      if (opcional) return true;
      throw new TokenRequeridoException();
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(token);
    } catch {
      throw new TokenInvalidoException();
    }
    // Un refresh token (o el de un pedido de invitado) no sirve como token de acceso.
    if (payload.typ) throw new TokenInvalidoException();
    request.user = { id: payload.sub, email: payload.email, rol: payload.rol };
    return true;
  }

  private extraerToken(request: Request): string | undefined {
    const [tipo, bearer] = request.headers.authorization?.split(' ') ?? [];
    if (tipo === 'Bearer' && bearer) return bearer;

    const cookies = request.cookies as Record<string, string> | undefined;
    const deCookie = cookies?.[COOKIE_ACCESO];
    if (deCookie && !METODOS_SEGUROS.has(request.method)) {
      this.exigirOrigenPermitido(request);
    }
    return deCookie;
  }

  private exigirOrigenPermitido(request: Request): void {
    const permitidos = origenesPermitidos(this.config.get('CORS_ORIGIN'));
    if (!permitidos) return; // CORS_ORIGIN=* (solo desarrollo)
    const origen = request.headers.origin ?? origenDe(request.headers.referer);
    if (!permitidos.includes(origen))
      throw new OrigenNoPermitidoException(origen);
  }
}
