import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiErrores } from '../../common/dto/api-errores.decorator';
import { PermisoDenegadoException } from '../../common/exceptions/app.exceptions';
import { UuidPipe } from '../../common/pipes/uuid.pipe';
import {
  CurrentUser,
  UsuarioAutenticado,
} from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { UsuarioResponseDto } from './dto/usuario-response.dto';
import { Rol } from './entities/usuario.entity';
import { UsuariosService } from './usuarios.service';

// El registro (POST /usuarios) y el login (POST /usuarios/login) viven en el
// módulo auth, que es quien emite el JWT.
@ApiTags('usuarios')
@ApiBearerAuth()
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuarios: UsuariosService) {}

  @Get()
  @Roles(Rol.ADMIN)
  @ApiOperation({ summary: 'Listar usuarios (solo ADMIN)' })
  @ApiOkResponse({ type: [UsuarioResponseDto] })
  @ApiErrores(401, 403)
  async listar(): Promise<UsuarioResponseDto[]> {
    return (await this.usuarios.listar()).map((u) =>
      UsuarioResponseDto.desde(u),
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener un usuario (el propio, o cualquiera si es ADMIN)',
  })
  @ApiOkResponse({ type: UsuarioResponseDto })
  @ApiErrores(400, 401, 403, 404)
  async obtener(
    @Param('id', UuidPipe) id: string,
    @CurrentUser() actual: UsuarioAutenticado,
  ): Promise<UsuarioResponseDto> {
    this.exigirPropietario(id, actual);
    return UsuarioResponseDto.desde(await this.usuarios.obtener(id));
  }

  @Patch(':id')
  @ApiOperation({
    summary:
      'Actualizar datos de la cuenta (nombre, géneros, avatar, contraseña)',
  })
  @ApiOkResponse({ type: UsuarioResponseDto })
  @ApiErrores(400, 401, 403, 404)
  async actualizar(
    @Param('id', UuidPipe) id: string,
    @Body() dto: UpdateUsuarioDto,
    @CurrentUser() actual: UsuarioAutenticado,
  ): Promise<UsuarioResponseDto> {
    this.exigirPropietario(id, actual);
    return UsuarioResponseDto.desde(await this.usuarios.actualizar(id, dto));
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Eliminar una cuenta (la propia, o cualquiera si es ADMIN)',
  })
  @ApiNoContentResponse({ description: 'Cuenta eliminada' })
  @ApiErrores(400, 401, 403, 404, [409, 'La cuenta tiene pedidos asociados'])
  async eliminar(
    @Param('id', UuidPipe) id: string,
    @CurrentUser() actual: UsuarioAutenticado,
  ): Promise<void> {
    this.exigirPropietario(id, actual);
    await this.usuarios.eliminar(id);
  }

  private exigirPropietario(id: string, actual: UsuarioAutenticado): void {
    if (actual.rol !== Rol.ADMIN && actual.id !== id)
      throw new PermisoDenegadoException();
  }
}
