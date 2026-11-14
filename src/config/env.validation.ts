/**
 * Valida las variables de entorno al arrancar: si falta algo imprescindible la
 * aplicación no levanta, en vez de fallar más tarde en la primera petición.
 */
export function validateEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const errores: string[] = [];
  const entorno =
    typeof config.NODE_ENV === 'string' ? config.NODE_ENV : 'development';

  if (!config.DATABASE_URL) errores.push('DATABASE_URL es obligatoria');

  const secreto =
    typeof config.JWT_SECRET === 'string' ? config.JWT_SECRET : '';
  if (!secreto) errores.push('JWT_SECRET es obligatoria');
  else if (entorno === 'production' && secreto.length < 32) {
    errores.push('JWT_SECRET debe tener al menos 32 caracteres en producción');
  }

  for (const clave of [
    'PORT',
    'ENVIO_GRATIS_DESDE',
    'SEGUIMIENTO_PASO_SEGUNDOS',
    'IMAGEN_MAX_MB',
  ]) {
    const valor = config[clave];
    if (
      valor !== undefined &&
      valor !== '' &&
      !Number.isFinite(Number(valor))
    ) {
      errores.push(`${clave} debe ser numérica`);
    }
  }

  // Cookies de sesión: SameSite=None solo funciona con Secure (HTTPS).
  const texto = (clave: string) =>
    typeof config[clave] === 'string' ? config[clave] : '';
  const sameSite = texto('COOKIE_SAMESITE').toLowerCase();
  if (sameSite && !['lax', 'strict', 'none'].includes(sameSite)) {
    errores.push('COOKIE_SAMESITE debe ser lax, strict o none');
  }
  const secure = texto('COOKIE_SECURE') || String(entorno === 'production');
  if (sameSite === 'none' && secure !== 'true') {
    errores.push('COOKIE_SAMESITE=none exige COOKIE_SECURE=true (HTTPS)');
  }

  if (errores.length) {
    throw new Error(`Configuración inválida:\n - ${errores.join('\n - ')}`);
  }
  return config;
}
