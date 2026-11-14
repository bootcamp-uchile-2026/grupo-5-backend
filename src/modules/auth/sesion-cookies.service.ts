import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CookieOptions, Response } from 'express';
import { AuthResponseDto } from './dto/auth-response.dto';

export const COOKIE_ACCESO = 'lcn_access';
export const COOKIE_REFRESH = 'lcn_refresh';
/** El refresh solo viaja a las rutas que lo usan, no en cada petición. */
const RUTA_REFRESH = '/auth';

const UNIDADES: Record<string, number> = {
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

/** Convierte "2h", "7d", "30m" o un número de segundos a milisegundos. */
export function duracionMs(valor: string): number {
  const m = /^(\d+)\s*([smhd])?$/i.exec(valor.trim());
  if (!m) return 0;
  return Number(m[1]) * UNIDADES[(m[2] ?? 's').toLowerCase()];
}

/**
 * Sesión por cookies HttpOnly para la Aplicación Web: el JavaScript del
 * navegador no puede leer los tokens, así que un XSS no puede robarlos.
 * Mobile sigue usando el header Authorization: Bearer con los tokens del body.
 *
 * Variables:
 *  - COOKIE_SECURE   true en producción (exige HTTPS). Por defecto: NODE_ENV=production.
 *  - COOKIE_SAMESITE lax (misma web), none (Web y API en dominios distintos; exige secure) o strict.
 *  - COOKIE_DOMAIN   opcional, para compartir la cookie entre subdominios.
 */
@Injectable()
export class SesionCookiesService {
  constructor(private readonly config: ConfigService) {}

  establecer(res: Response, auth: AuthResponseDto): void {
    res.cookie(COOKIE_ACCESO, auth.accessToken, {
      ...this.base(),
      path: '/',
      maxAge: duracionMs(auth.expiresIn),
    });
    res.cookie(COOKIE_REFRESH, auth.refreshToken, {
      ...this.base(),
      path: RUTA_REFRESH,
      maxAge: duracionMs(auth.refreshExpiresIn),
    });
  }

  limpiar(res: Response): void {
    res.clearCookie(COOKIE_ACCESO, { ...this.base(), path: '/' });
    res.clearCookie(COOKIE_REFRESH, { ...this.base(), path: RUTA_REFRESH });
  }

  private base(): CookieOptions {
    const produccion = this.config.get('NODE_ENV') === 'production';
    const secure =
      (this.config.get<string>('COOKIE_SECURE') ?? String(produccion)) ===
      'true';
    const sameSite = this.config
      .get<string>('COOKIE_SAMESITE', 'lax')
      .toLowerCase() as 'lax' | 'strict' | 'none';
    const domain = this.config.get<string>('COOKIE_DOMAIN') || undefined;
    return { httpOnly: true, secure, sameSite, domain };
  }
}
