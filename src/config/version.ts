import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Versión de la aplicación, leída de package.json. Es la misma del tag de Git
 * (v0.4.0) y del tag de la imagen en Docker Hub (0.4.0), y se muestra en
 * Swagger y en GET /health para comprobar qué versión está desplegada.
 */
export const VERSION_APP: string = (
  JSON.parse(
    readFileSync(join(__dirname, '..', '..', 'package.json'), 'utf8'),
  ) as { version: string }
).version;
