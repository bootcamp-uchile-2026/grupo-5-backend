# Cómo ejecutar el proyecto

Requisitos: Node.js 20 o superior y Git. PostgreSQL no hace falta instalarlo: el proyecto trae uno embebido
para desarrollo (`npm run db:local`), o se puede usar Docker.

## Desarrollo

```bash
git clone https://github.com/bootcamp-uchile-2026/grupo-5-backend.git
cd grupo-5-backend
npm install
cp .env.example .env
```

En una terminal, dejar corriendo PostgreSQL:

```bash
npm run db:local
```

En otra, levantar la API:

```bash
npm run start:dev
```

Al arrancar, la API aplica las **migraciones de TypeORM** pendientes: crea las tablas y carga los datos de
prueba (75 libros, libreros, reseñas, cupones y cuentas de ejemplo). No hay que ejecutar scripts SQL.

- API: http://localhost:3000
- Swagger: http://localhost:3000/docs
- Estado y versión: http://localhost:3000/health

En Windows, clonar en una ruta corta (por ejemplo `C:\dev`): el PostgreSQL embebido falla en rutas largas.

## Scripts útiles

| Script | Qué hace |
|---|---|
| `npm run migration:show` | Migraciones aplicadas y pendientes |
| `npm run migration:run` / `migration:revert` | Aplicar las pendientes / revertir la última |
| `npm run db:reset` | Borrar todas las tablas y volver a aplicar las migraciones |
| `npm run db:reset-stock` | Reponer el stock de prueba antes de una demo |
| `npm run test:e2e` | Las 59 pruebas de punta a punta |
| `npm run lint` | ESLint y Prettier |

## Con Docker

Para construir la imagen desde el código:

```bash
docker compose -f docker-compose.yml -f docker-compose.build.yml up -d --build
```

En el servidor no se construye: se usa la imagen publicada en Docker Hub. Ver
[Versionado y despliegue](Versionado-y-Despliegue).

## Variables de entorno

Todas están documentadas en
[`.env.example`](https://github.com/bootcamp-uchile-2026/grupo-5-backend/blob/main/.env.example) y en el
[README](https://github.com/bootcamp-uchile-2026/grupo-5-backend#3-configuración). La API valida las
obligatorias al arrancar y no levanta si falta alguna.
