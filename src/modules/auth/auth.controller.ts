import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
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
import { COOKIE_REFRESH, SesionCookiesService } from './sesion-cookies.service';

const NOTA_COOKIES =
  'Además del body, deja la sesión en cookies HttpOnly (lcn_access y lcn_refresh) para la Aplicación Web.';

/** refreshToken del body (Mobile) o de la cookie HttpOnly (Web). */
const refreshDe = (req: Request, dto?: RefreshTokenDto): string | undefined =>
  dto?.refreshToken ??
  (req.cookies as Record<string, string> | undefined)?.[COOKIE_REFRESH];

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly usuarios: UsuariosService,
    private readonly cuenta: CuentaService,
    private readonly sesion: SesionCookiesService,
  ) {}

  private async conCookies(
    res: Response,
    auth: Promise<AuthResponseDto>,
  ): Promise<AuthResponseDto> {
    const respuesta = await auth;
    this.sesion.establecer(res, respuesta);
    return respuesta;
  }

  @Public()
  @Post('registro')
  @ApiOperation({
    summary: 'Registrar una cuenta de cliente y obtener su JWT',
    description: NOTA_COOKIES,
  })
  @ApiCreatedResponse({ type: AuthResponseDto })
  @ApiErrores(400, 403, [
    409,
    'El email ya está registrado (EMAIL_YA_REGISTRADO)',
  ])
  registrar(
    @Body() dto: CreateUsuarioDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    return this.conCookies(res, this.auth.registrar(dto));
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Iniciar sesión y obtener un JWT',
    description: NOTA_COOKIES,
  })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiErrores(400, [
    401,
    'Email o contraseña incorrectos (CREDENCIALES_INVALIDAS)',
  ])
  login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    return this.conCookies(res, this.auth.login(dto));
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
      'Entrega un accessToken y un refreshToken nuevos. Usar cuando una ruta privada responda TOKEN_INVALIDO. ' +
      'Mobile envía el refreshToken en el body; la Web puede omitir el body y se usa la cookie lcn_refresh.',
  })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiErrores(400, [
    401,
    'TOKEN_REQUERIDO (sin body ni cookie) o TOKEN_INVALIDO: refreshToken inválido, vencido o de una sesión cerrada',
  ])
  refrescar(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    return this.conCookies(res, this.auth.refrescar(refreshDe(req, dto)));
  }

  @Public()
  @Post('logout')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Cerrar sesión',
    description:
      'Borra las cookies de sesión e invalida todos los refreshToken del usuario (en todos sus dispositivos). ' +
      'Recibe el refreshToken en el body (Mobile) o lo toma de la cookie (Web). Siempre responde 204.',
  })
  @ApiNoContentResponse({ description: 'Sesión cerrada' })
  async cerrarSesion(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.auth.cerrarSesion(refreshDe(req, dto));
    this.sesion.limpiar(res);
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
  google(
    @Body() dto: GoogleLoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    return this.conCookies(res, this.auth.conGoogle(dto.idToken));
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
  facebook(
    @Body() dto: FacebookLoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    return this.conCookies(res, this.auth.conFacebook(dto.accessToken));
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
