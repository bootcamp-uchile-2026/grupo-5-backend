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

  if (errores.length) {
    throw new Error(`Configuración inválida:\n - ${errores.join('\n - ')}`);
  }
  return config;
}
