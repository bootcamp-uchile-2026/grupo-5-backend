import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
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
import { CuentaService } from './cuenta.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import {
  FacebookLoginDto,
  GoogleLoginDto,
  MensajeCuentaDto,
  OlvidePasswordDto,
  RefreshTokenDto,
  RestablecerPasswordDto,
  TokenCuentaDto,
} from './dto/cuenta.dto';
import { LoginDto } from './dto/login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly usuarios: UsuariosService,
    private readonly cuenta: CuentaService,
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

  @Public()
  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Renovar la sesión con el refreshToken (sin pedir la contraseña)',
    description:
      'Entrega un accessToken y un refreshToken nuevos. Usar cuando una ruta privada responda TOKEN_INVALIDO.',
  })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiErrores(400, [401, 'TOKEN_INVALIDO: refreshToken inválido o vencido'])
  refrescar(@Body() dto: RefreshTokenDto): Promise<AuthResponseDto> {
    return this.auth.refrescar(dto.refreshToken);
  }

  @Public()
  @Post('verificar-email')
  @HttpCode(200)
  @ApiOperation({
    summary:
      'Confirmar el correo con el token del enlace enviado al registrarse',
    description:
      'Además, las compras hechas como invitado con ese email pasan al historial de la cuenta.',
  })
  @ApiOkResponse({ type: UsuarioResponseDto })
  @ApiErrores(400, [400, 'TOKEN_CUENTA_INVALIDO'])
  async verificarEmail(
    @Body() dto: TokenCuentaDto,
  ): Promise<UsuarioResponseDto> {
    return UsuarioResponseDto.desde(
      await this.cuenta.verificarEmail(dto.token),
    );
  }

  @Post('reenviar-verificacion')
  @HttpCode(202)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reenviar el correo de verificación' })
  @ApiResponse({ status: 202, type: MensajeCuentaDto })
  @ApiErrores(401, [409, 'EMAIL_YA_VERIFICADO'])
  async reenviarVerificacion(
    @CurrentUser() actual: UsuarioAutenticado,
  ): Promise<MensajeCuentaDto> {
    const token = await this.cuenta.enviarVerificacion(
      await this.usuarios.obtener(actual.id),
    );
    return {
      mensaje: 'Te enviamos un nuevo enlace de verificación.',
      ...(token && { tokenDesarrollo: token }),
    };
  }

  @Public()
  @Post('olvide-password')
  @HttpCode(202)
  @ApiOperation({
    summary: '"Olvidé mi contraseña": envía un enlace para restablecerla',
    description:
      'Responde siempre 202, exista o no la cuenta, para no revelar qué emails están registrados. El enlace vence en 1 hora.',
  })
  @ApiResponse({ status: 202, type: MensajeCuentaDto })
  @ApiErrores(400)
  olvidePassword(@Body() dto: OlvidePasswordDto): Promise<MensajeCuentaDto> {
    return this.cuenta.olvidePassword(dto.email);
  }

  @Public()
  @Post('restablecer-password')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Definir una contraseña nueva con el token del enlace',
  })
  @ApiOkResponse({ type: MensajeCuentaDto })
  @ApiErrores(400, [400, 'TOKEN_CUENTA_INVALIDO'])
  async restablecerPassword(
    @Body() dto: RestablecerPasswordDto,
  ): Promise<MensajeCuentaDto> {
    await this.cuenta.restablecerPassword(dto.token, dto.password);
    return {
      mensaje: 'Tu contraseña fue actualizada. Ya puedes iniciar sesión.',
    };
  }

  @Public()
  @Post('google')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Acceder con Google (crea la cuenta si no existe)',
    description:
      'Recibe el ID token de Google Identity Services y lo valida contra Google. Requiere GOOGLE_CLIENT_ID.',
  })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiErrores(
    400,
    [401, 'TOKEN_PROVEEDOR_INVALIDO'],
    [502, 'PROVEEDOR_NO_DISPONIBLE'],
    [503, 'PROVEEDOR_NO_CONFIGURADO'],
  )
  google(@Body() dto: GoogleLoginDto): Promise<AuthResponseDto> {
    return this.auth.conGoogle(dto.idToken);
  }

  @Public()
  @Post('facebook')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Acceder con Facebook (crea la cuenta si no existe)',
    description:
      'Recibe el accessToken del SDK de Facebook y lo valida contra la Graph API. Requiere FACEBOOK_APP_ID y FACEBOOK_APP_SECRET.',
  })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiErrores(
    400,
    [401, 'TOKEN_PROVEEDOR_INVALIDO'],
    [502, 'PROVEEDOR_NO_DISPONIBLE'],
    [503, 'PROVEEDOR_NO_CONFIGURADO'],
  )
  facebook(@Body() dto: FacebookLoginDto): Promise<AuthResponseDto> {
    return this.auth.conFacebook(dto.accessToken);
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
