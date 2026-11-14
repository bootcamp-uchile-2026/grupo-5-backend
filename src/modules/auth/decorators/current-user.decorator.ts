import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Rol } from '../../usuarios/entities/usuario.entity';

/** Datos del usuario que viajan en el JWT y quedan disponibles en req.user. */
export class UsuarioAutenticado {
  id: string;
  email: string;
  rol: Rol;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UsuarioAutenticado =>
    ctx.switchToHttp().getRequest<{ user: UsuarioAutenticado }>().user,
);
