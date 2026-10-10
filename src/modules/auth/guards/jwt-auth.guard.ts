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
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

interface JwtPayload {
  sub: string;
  email: string;
  rol: Rol;
}

/**
 * Guard global: toda ruta exige un JWT válido salvo que esté marcada con
 * @Public(). Deja al usuario autenticado en req.user.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const esPublica = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (esPublica) return true;

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: UsuarioAutenticado }>();
    const [tipo, token] = request.headers.authorization?.split(' ') ?? [];
    if (tipo !== 'Bearer' || !token) throw new TokenRequeridoException();

    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token);
      request.user = {
        id: payload.sub,
        email: payload.email,
        rol: payload.rol,
      };
    } catch {
      throw new TokenInvalidoException();
    }
    return true;
  }
}
