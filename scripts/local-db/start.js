/* eslint-disable no-console */
// Levanta un PostgreSQL real en esta máquina, sin Docker ni instalador, para
// desarrollar en local. Los datos quedan en scripts/local-db/data.
// Uso: npm run db:local   (dejar corriendo; Ctrl+C para detener)
const fs = require('node:fs');
const path = require('node:path');
const EmbeddedPostgres = require('embedded-postgres').default;

const PORT = Number(process.env.LOCAL_DB_PORT || 5432);
const DB = 'leeconnos';
const databaseDir = path.join(__dirname, 'data');

async function main() {
  const nueva = !fs.existsSync(path.join(databaseDir, 'PG_VERSION'));
  const pg = new EmbeddedPostgres({
    databaseDir,
    user: 'leeconnos',
    password: 'leeconnos',
    port: PORT,
    persistent: true,
    onLog: () => {},
  });

  if (nueva) await pg.initialise();
  await pg.start();
  if (nueva) await pg.createDatabase(DB);

  console.log(`PostgreSQL local escuchando en el puerto ${PORT}.`);
  console.log(`DATABASE_URL=postgresql://leeconnos:leeconnos@localhost:${PORT}/${DB}`);
  if (nueva) console.log('Base recién creada: en otra terminal ejecuta "npm run db:setup".');
  console.log('Ctrl+C para detener.');

  const detener = async () => {
    await pg.stop();
    process.exit(0);
  };
  process.on('SIGINT', detener);
  process.on('SIGTERM', detener);
}

main().catch((error) => {
  console.error(`No se pudo iniciar PostgreSQL local: ${error.message}`);
  process.exit(1);
});
