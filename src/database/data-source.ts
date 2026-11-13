import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { ENTIDADES, opcionesBaseDatos } from './opciones';

// La CLI de TypeORM no pasa por Nest: lee el .env directamente (si existe).
try {
  process.loadEnvFile();
} catch {
  // Sin .env se usan las variables de entorno del sistema (por ejemplo en Docker).
}

/**
 * DataSource para la CLI de TypeORM (npm run migration:*).
 * Uso: npm run migration:show | migration:run | migration:revert
 */
export default new DataSource({
  ...opcionesBaseDatos(process.env.DATABASE_URL, process.env.DB_SSL === 'true'),
  entities: [ENTIDADES],
});
