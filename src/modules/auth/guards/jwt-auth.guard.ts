import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import {
  TokenInvalidoException,
  TokenRequeridoException,
} from '../../../common/exceptions/app.exceptions';
import { Rol } from '../../usuarios/entities/usuario.entity';
import { UsuarioAutenticado } from '../decorators/current-user.decorator';
import {
  IS_OPTIONAL_AUTH_KEY,
  IS_PUBLIC_KEY,
} from '../decorators/public.decorator';

export interface JwtPayload {
  sub: string;
  email: string;
  rol: Rol;
  /** Solo lo llevan los tokens que no son de acceso (p. ej. "refresh"). */
  typ?: string;
}

/**
 * Guard global: toda ruta exige un JWT válido salvo que esté marcada con
 * @Public(). Con @AuthOpcional() el token no es obligatorio, pero si viene se
 * valida. Deja al usuario autenticado en req.user.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
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
    const [tipo, token] = request.headers.authorization?.split(' ') ?? [];
    if (tipo !== 'Bearer' || !token) {
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
}
