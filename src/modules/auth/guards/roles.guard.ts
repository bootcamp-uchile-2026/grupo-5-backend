import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermisoDenegadoException } from '../../../common/exceptions/app.exceptions';
import { Rol } from '../../usuarios/entities/usuario.entity';
import { UsuarioAutenticado } from '../decorators/current-user.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';

/** Se ejecuta después de JwtAuthGuard y aplica las restricciones de @Roles(). */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<Rol[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles?.length) return true;

    const usuario: UsuarioAutenticado | undefined = context
      .switchToHttp()
      .getRequest<{ user?: UsuarioAutenticado }>().user;
    if (!usuario || !roles.includes(usuario.rol)) {
      throw new PermisoDenegadoException(
        `Esta operación requiere rol ${roles.join(' o ')}`,
      );
    }
    return true;
  }
}
