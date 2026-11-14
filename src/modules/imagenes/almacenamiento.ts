import { ConfigService } from '@nestjs/config';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

/** Prefijo público con que el servidor de archivos estáticos entrega las imágenes. */
export const RUTA_PUBLICA_IMAGENES = '/uploads';

/** Formatos aceptados: extensión con que se guardan y firma de sus primeros bytes. */
export const FORMATOS: Record<
  string,
  { extension: string; esValido: (b: Buffer) => boolean }
> = {
  'image/jpeg': {
    extension: 'jpg',
    esValido: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  'image/png': {
    extension: 'png',
    esValido: (b) =>
      b
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  'image/webp': {
    extension: 'webp',
    esValido: (b) =>
      b.subarray(0, 4).toString('ascii') === 'RIFF' &&
      b.subarray(8, 12).toString('ascii') === 'WEBP',
  },
};

/** Tamaño máximo por imagen, en bytes (IMAGEN_MAX_MB, 2 MB por defecto). */
export function tamanoMaximo(config?: ConfigService): number {
  const mb = Number(
    config?.get('IMAGEN_MAX_MB') ?? process.env.IMAGEN_MAX_MB ?? 2,
  );
  return Math.round((Number.isFinite(mb) && mb > 0 ? mb : 2) * 1024 * 1024);
}

/**
 * Carpeta donde se guardan las imágenes (UPLOADS_DIR, ./uploads por defecto).
 * En Docker es un volumen, así que las imágenes sobreviven a cada nueva versión.
 */
export function directorioImagenes(config: ConfigService): string {
  const dir = resolve(config.get<string>('UPLOADS_DIR', 'uploads'));
  mkdirSync(dir, { recursive: true });
  return dir;
}
