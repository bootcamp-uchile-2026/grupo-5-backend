# LeeConNos · Backend (Hito 2)

API REST del e-commerce de libros **LeeConNos**. NestJS 11 + TypeScript + PostgreSQL.

En el Hito 2 el foco pasó de los módulos diferenciales a los **flujos core de un e-commerce**:

| Estado | Módulos | Persistencia |
|---|---|---|
| **Funcional** | auth (JWT), usuarios, catálogo (búsqueda y filtros), carrito, pedidos, recomendaciones | PostgreSQL |
| **Dummy con reglas predecibles** | costo de envío, pago, seguimiento | Reglas fijas (los intentos de pago sí se guardan) |
| **Contrato congelado del Hito 1** | reseñas, listas de deseos, libreros, club de lectura | En memoria |

Documentación:

- Swagger / OpenAPI: `http://localhost:3000/docs` (JSON en `/docs-json`)
- [docs/servicios.md](docs/servicios.md) — endpoints, reglas dummy, códigos de error y cambios respecto del Hito 1
- [docs/modelo-datos.md](docs/modelo-datos.md) — modelo de datos y diagrama entidad-relación
- [docs/despliegue.md](docs/despliegue.md) — Docker y despliegue en un servidor en la nube
- [docs/hito2-backend.md](docs/hito2-backend.md) — estado frente a las bases del Hito 2

## Requisitos

- Node.js 20 o superior
- PostgreSQL 13 o superior (con Docker, o el embebido de `npm run db:local`)

## Ejecutar en local

```bash
npm install
cp .env.example .env
```

**Opción A — con Docker** (levanta API + PostgreSQL y carga estructura y datos de prueba):

```bash
docker compose up -d --build
```

**Opción B — sin Docker.** En una terminal, dejar corriendo un PostgreSQL local:

```bash
npm run db:local
```

En otra terminal, crear las tablas con datos de prueba y levantar la API:

```bash
npm run db:setup
npm run start:dev
```

La API queda en `http://localhost:3000` y Swagger en `http://localhost:3000/docs`.

> `npm run db:local` descarga los binarios de PostgreSQL dentro de `scripts/local-db`. En Windows
> necesita que el proyecto esté en una ruta corta (por ejemplo `C:\dev\leeconnos-backend`).

## Scripts

| Script | Qué hace |
|---|---|
| `npm run start:dev` | API en modo desarrollo, recarga al guardar |
| `npm run build` / `npm run start:prod` | Compila a `dist/` y ejecuta la versión compilada |
| `npm run db:local` | PostgreSQL local sin Docker (dejar corriendo) |
| `npm run db:setup` | Ejecuta `db/01-schema.sql` y `db/02-seed.sql` (idempotente) |
| `npm run db:reset` | Borra las tablas y las vuelve a crear con los datos de prueba |
| `npm run test:e2e` | 23 pruebas de punta a punta contra la base configurada en `.env` |

## Variables de entorno

Todas están en [.env.example](.env.example). La aplicación valida las obligatorias al arrancar y no levanta si faltan.

| Variable | Obligatoria | Por defecto | Descripción |
|---|---|---|---|
| `DATABASE_URL` | Sí | — | `postgresql://usuario:clave@host:puerto/base` |
| `JWT_SECRET` | Sí | — | Secreto con que se firman los JWT. En producción, mínimo 32 caracteres |
| `NODE_ENV` | No | `development` | `development` o `production` |
| `PORT` | No | `3000` | Puerto HTTP |
| `DB_SSL` | No | `false` | `true` si la base exige SSL |
| `JWT_EXPIRES_IN` | No | `2h` | Vigencia del token (`30m`, `2h`, `7d`) |
| `CORS_ORIGIN` | No | `*` | Orígenes permitidos, separados por coma |
| `ENVIO_GRATIS_DESDE` | No | `40000` | Subtotal (CLP) desde el que el despacho es gratis |
| `SEGUIMIENTO_PASO_SEGUNDOS` | No | `60` | Segundos entre cada hito del seguimiento simulado |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Solo compose | `leeconnos` | Credenciales del contenedor de PostgreSQL |

## Datos de prueba

`db/02-seed.sql` carga 24 libros y tres cuentas, todas con la contraseña de desarrollo `LeeConNos2026`:

| Email | Rol |
|---|---|
| `cliente@leeconnos.cl` | CLIENTE |
| `librero@leeconnos.cl` | LIBRERO (puede administrar el catálogo) |
| `admin@leeconnos.cl` | ADMIN |

Son solo para desarrollo y demo: hay que eliminarlas o cambiarles la clave antes de usar datos reales.

## Probar el flujo de compra

En Swagger: `POST /auth/login` → botón **Authorize** con el `accessToken` → y luego, en orden:

1. `GET /libros?q=asimov` — buscar en el catálogo
2. `POST /carrito/items` — agregar un libro
3. `POST /envios/cotizar` — costo de envío (dummy)
4. `POST /pedidos` — checkout
5. `POST /pagos` — pagar con una tarjeta ficticia (`4111111111111111` aprueba, terminada en `0002` rechaza)
6. `GET /pedidos/{id}/seguimiento` — seguimiento (dummy)

## Estructura

```
src/
├── main.ts                  ValidationPipe global, filtro de errores, CORS y Swagger
├── app.module.ts            Config, conexión a PostgreSQL y módulos
├── config/                  Validación de variables de entorno
├── common/
│   ├── middleware/          request id + logs de entrada/salida + tiempo de ejecución
│   ├── context/             request id disponible en cualquier capa (AsyncLocalStorage)
│   ├── exceptions/          errores personalizados de negocio (AppException)
│   ├── filters/             convierte cualquier error en la respuesta HTTP estándar
│   ├── pipes/               UuidPipe
│   └── dto/                 ErrorResponseDto y @ApiErrores para Swagger
└── modules/
    ├── auth/                JWT, guards global y por rol, @Public, @Roles, @CurrentUser
    ├── usuarios/ libros/ carrito/ pedidos/          → PostgreSQL
    ├── envios/ pagos/ seguimiento/                  → dummy
    ├── resenas/ listas-deseos/ libreros/ club-lectura/   → en memoria
    └── recomendaciones/
db/                          01-schema.sql y 02-seed.sql
scripts/                     db-setup.js y PostgreSQL local
test/                        pruebas e2e
```

## Trazabilidad y errores

- Cada respuesta lleva el header `x-request-id` (se reutiliza el que envíe el cliente, o se genera un UUID).
- Por cada petición se registran dos líneas con ese id: la entrada (fecha y hora, método, path y body con los
  datos sensibles ocultos) y la salida (código de respuesta y tiempo de ejecución), tanto si termina bien como con error.

```
[HTTP] [225d4aa4-…] --> 2026-10-03T14:15:22.929Z POST /auth/login body={"email":"cliente@leeconnos.cl","password":"***"}
[HTTP] [225d4aa4-…] <-- POST /auth/login 200 241.0ms
```

- Todos los errores responden con la misma estructura; `error` es un código estable para Web y Mobile:

```json
{
  "statusCode": 409,
  "error": "STOCK_INSUFICIENTE",
  "message": "No hay stock suficiente para uno o más libros",
  "detalles": ["\"El hobbit\": solicitado 1, disponible 0"],
  "timestamp": "2026-10-03T14:21:09.120Z",
  "path": "/carrito/items",
  "requestId": "b0f6f0a2-5f0e-4a36-9d0c-3f7c2b5a8f11"
}
```
