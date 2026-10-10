import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiErrores } from '../../common/dto/api-errores.decorator';
import { CreateUsuarioDto } from '../usuarios/dto/create-usuario.dto';
import { UsuarioResponseDto } from '../usuarios/dto/usuario-response.dto';
import { UsuariosService } from '../usuarios/usuarios.service';
import { AuthService } from './auth.service';
import {
  CurrentUser,
  UsuarioAutenticado,
} from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly usuarios: UsuariosService,
  ) {}

  @Public()
  @Post('registro')
  @ApiOperation({ summary: 'Registrar una cuenta de cliente y obtener su JWT' })
  @ApiCreatedResponse({ type: AuthResponseDto })
  @ApiErrores(400, 403, [
    409,
    'El email ya está registrado (EMAIL_YA_REGISTRADO)',
  ])
  registrar(@Body() dto: CreateUsuarioDto): Promise<AuthResponseDto> {
    return this.auth.registrar(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Iniciar sesión y obtener un JWT' })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiErrores(400, [
    401,
    'Email o contraseña incorrectos (CREDENCIALES_INVALIDAS)',
  ])
  login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.auth.login(dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Datos de la cuenta dueña del token' })
  @ApiOkResponse({ type: UsuarioResponseDto })
  @ApiErrores(401)
  async me(
    @CurrentUser() actual: UsuarioAutenticado,
  ): Promise<UsuarioResponseDto> {
    return UsuarioResponseDto.desde(await this.usuarios.obtener(actual.id));
  }
}

/**
 * Rutas de registro y login del Hito 1. Se mantienen para no romper a Web y
 * Mobile, pero ahora emiten el mismo JWT real que /auth.
 */
@ApiTags('usuarios')
@Controller('usuarios')
export class UsuariosAuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post()
  @ApiOperation({
    summary:
      'Registrar usuario (ruta del Hito 1, equivale a POST /auth/registro)',
    deprecated: true,
  })
  @ApiCreatedResponse({ type: AuthResponseDto })
  @ApiErrores(400, 403, 409)
  registrar(@Body() dto: CreateUsuarioDto): Promise<AuthResponseDto> {
    return this.auth.registrar(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Login (ruta del Hito 1, equivale a POST /auth/login)',
    deprecated: true,
  })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiErrores(400, 401)
  login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.auth.login(dto);
  }
}
