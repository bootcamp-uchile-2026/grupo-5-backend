import { join } from 'node:path';
import { DataSourceOptions } from 'typeorm';

/** Las migraciones se leen como .ts al correr con ts-jest y como .js desde dist/. */
const extension = __filename.endsWith('.ts') ? 'ts' : 'js';

export const MIGRACIONES = join(__dirname, 'migrations', `*.${extension}`);
export const ENTIDADES = join(__dirname, '..', '**', `*.entity.${extension}`);

/**
 * Conexión a PostgreSQL compartida por la aplicación y por la CLI de TypeORM.
 * La estructura y los datos de prueba se crean SOLO con migraciones
 * (src/database/migrations); el ORM nunca sincroniza el esquema por su cuenta.
 */
export function opcionesBaseDatos(
  url: string | undefined,
  ssl: boolean,
): DataSourceOptions {
  return {
    type: 'postgres',
    url,
    ssl: ssl ? { rejectUnauthorized: false } : false,
    synchronize: false,
    migrations: [MIGRACIONES],
    migrationsTableName: 'migraciones_typeorm',
  };
}
