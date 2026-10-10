/* eslint-disable no-console */
// Crea la estructura e inserta los datos de prueba ejecutando, en orden, los
// scripts de db/. Sirve cuando la base no se levantó con docker compose
// (que ya los ejecuta solo), por ejemplo en un Postgres administrado.
//
//   npm run db:setup          -> aplica db/*.sql (idempotente)
//   npm run db:reset          -> borra todas las tablas y vuelve a aplicarlos
const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('pg');

function leerEnv() {
  const archivo = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(archivo)) return;
  for (const linea of fs.readFileSync(archivo, 'utf8').split(/\r?\n/)) {
    const m = linea.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

async function main() {
  leerEnv();
  if (!process.env.DATABASE_URL) throw new Error('Falta DATABASE_URL (revisa tu archivo .env)');

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });
  await client.connect();

  if (process.argv.includes('--reset')) {
    console.log('Eliminando tablas...');
    await client.query('DROP TABLE IF EXISTS pagos, pedido_items, pedidos, carrito_items, libros, usuarios CASCADE');
  }

  const dir = path.join(__dirname, '..', 'db');
  for (const archivo of fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
    console.log(`Ejecutando db/${archivo}...`);
    await client.query(fs.readFileSync(path.join(dir, archivo), 'utf8'));
  }

  const { rows } = await client.query(
    'SELECT (SELECT COUNT(*) FROM usuarios)::int AS usuarios, (SELECT COUNT(*) FROM libros)::int AS libros',
  );
  console.log(`Listo: ${rows[0].usuarios} usuarios y ${rows[0].libros} libros en la base.`);
  await client.end();
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
