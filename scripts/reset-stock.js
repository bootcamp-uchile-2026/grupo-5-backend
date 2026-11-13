/* eslint-disable no-console */
// Repone el stock de los libros de prueba y cancela los pedidos pendientes de
// pago (útil antes de una demo). Es lo mismo que POST /admin/reiniciar-stock.
//   npm run db:reset-stock
// La estructura y los datos de prueba NO se crean aquí: los crean las
// migraciones de TypeORM (src/database/migrations) al arrancar la API.
const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('pg');

try {
  process.loadEnvFile(path.join(__dirname, '..', '.env'));
} catch {
  // Sin .env se usan las variables de entorno del sistema.
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('Falta DATABASE_URL (revisa tu archivo .env)');
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });
  await client.connect();
  await client.query(fs.readFileSync(path.join(__dirname, 'reset-stock.sql'), 'utf8'));
  console.log('Listo: stock de prueba repuesto y pedidos pendientes cancelados.');
  await client.end();
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
