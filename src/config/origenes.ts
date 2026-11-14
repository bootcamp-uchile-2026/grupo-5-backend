/**
 * Lista de orígenes de CORS_ORIGIN. Devuelve null cuando es "*" (cualquiera),
 * que solo debe usarse en desarrollo.
 */
export function origenesPermitidos(valor: string | undefined): string[] | null {
  const limpio = (valor ?? '*').trim();
  if (limpio === '' || limpio === '*') return null;
  return limpio
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean);
}
