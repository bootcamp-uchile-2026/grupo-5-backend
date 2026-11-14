import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ProveedorNoConfiguradoException,
  ServicioExternoException,
  TokenProveedorInvalidoException,
} from '../../common/exceptions/app.exceptions';
import { ProveedorAuth } from '../usuarios/entities/usuario.entity';
import { PerfilSocial } from '../usuarios/usuarios.service';

interface GoogleTokenInfo {
  aud?: string;
  sub?: string;
  email?: string;
  email_verified?: string | boolean;
  given_name?: string;
  family_name?: string;
  name?: string;
  picture?: string;
}

interface FacebookDebug {
  data?: { is_valid?: boolean; app_id?: string; user_id?: string };
}

interface FacebookPerfil {
  id?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  picture?: { data?: { url?: string } };
}

/**
 * Valida en el servidor los tokens que el Front obtiene con Google Identity
 * Services o con Facebook Login. Nunca se confía en datos enviados por el
 * cliente: el perfil sale de la respuesta del proveedor.
 *
 * Se habilita con GOOGLE_CLIENT_ID y con FACEBOOK_APP_ID + FACEBOOK_APP_SECRET.
 * Sin esas variables los endpoints responden 503 PROVEEDOR_NO_CONFIGURADO.
 */
@Injectable()
export class SocialAuthService {
  private readonly logger = new Logger('SocialAuth');

  constructor(private readonly config: ConfigService) {}

  async validarGoogle(idToken: string): Promise<PerfilSocial> {
    const clientIds = (this.config.get<string>('GOOGLE_CLIENT_ID') ?? '')
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
    if (!clientIds.length) throw new ProveedorNoConfiguradoException('Google');

    const info = await this.consultar<GoogleTokenInfo>(
      'Google',
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
    );
    const emailVerificado =
      info.email_verified === true || info.email_verified === 'true';
    if (
      !info.sub ||
      !info.email ||
      !emailVerificado ||
      !clientIds.includes(info.aud ?? '')
    ) {
      throw new TokenProveedorInvalidoException('Google');
    }
    return {
      proveedor: ProveedorAuth.GOOGLE,
      proveedorId: info.sub,
      email: info.email.toLowerCase(),
      nombre: info.given_name ?? info.name ?? '',
      apellido: info.family_name ?? null,
      avatarUrl: info.picture ?? null,
    };
  }

  async validarFacebook(accessToken: string): Promise<PerfilSocial> {
    const appId = this.config.get<string>('FACEBOOK_APP_ID');
    const appSecret = this.config.get<string>('FACEBOOK_APP_SECRET');
    if (!appId || !appSecret)
      throw new ProveedorNoConfiguradoException('Facebook');

    const token = encodeURIComponent(accessToken);
    const debug = await this.consultar<FacebookDebug>(
      'Facebook',
      `https://graph.facebook.com/debug_token?input_token=${token}` +
        `&access_token=${encodeURIComponent(`${appId}|${appSecret}`)}`,
    );
    // El token debe haber sido emitido para NUESTRA app, no para otra.
    if (!debug.data?.is_valid || debug.data.app_id !== appId)
      throw new TokenProveedorInvalidoException('Facebook');

    const perfil = await this.consultar<FacebookPerfil>(
      'Facebook',
      `https://graph.facebook.com/me?fields=id,email,first_name,last_name,picture.type(large)&access_token=${token}`,
    );
    if (!perfil.id || perfil.id !== debug.data.user_id || !perfil.email)
      throw new TokenProveedorInvalidoException('Facebook');
    return {
      proveedor: ProveedorAuth.FACEBOOK,
      proveedorId: perfil.id,
      email: perfil.email.toLowerCase(),
      nombre: perfil.first_name ?? '',
      apellido: perfil.last_name ?? null,
      avatarUrl: perfil.picture?.data?.url ?? null,
    };
  }

  private async consultar<T>(proveedor: string, url: string): Promise<T> {
    let respuesta: Response;
    try {
      respuesta = await fetch(url, { signal: AbortSignal.timeout(8000) });
    } catch (error) {
      this.logger.warn(
        `${proveedor} no respondió: ${(error as Error).message}`,
      );
      throw new ServicioExternoException(
        'PROVEEDOR_NO_DISPONIBLE',
        `No fue posible contactar a ${proveedor}. Intenta nuevamente.`,
      );
    }
    // 4xx = token inválido o vencido; 5xx = problema del proveedor.
    if (respuesta.status >= 500)
      throw new ServicioExternoException(
        'PROVEEDOR_NO_DISPONIBLE',
        `${proveedor} respondió con error ${respuesta.status}`,
      );
    if (!respuesta.ok) throw new TokenProveedorInvalidoException(proveedor);
    return (await respuesta.json()) as T;
  }
}
