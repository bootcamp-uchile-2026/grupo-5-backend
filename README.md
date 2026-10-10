# LeeConNos — Backend API

API REST para **LeeConNos**, la tienda online de una librería independiente que traslada
al mundo digital la experiencia de recomendación personalizada de sus libreros.

> Entrega correspondiente al **Hito 2** del Bootcamp DCC — Universidad de Chile.

| Recurso | Enlace |
|---|---|
| Swagger desplegado | http://3.131.220.134:3000/docs |
| URL base de la API | http://3.131.220.134:3000 |
| Estado frente a las bases del hito | [`docs/hito2-backend.md`](./docs/hito2-backend.md) |

## 📖 Contexto del producto

LeeConNos permite a los libreros expresar su personalidad mediante secciones curadas de
recomendaciones y perfiles editoriales propios, ofrece un motor de recomendaciones básico
basado en géneros e historial de compras, y un club de lectura online con hilos de
discusión y progreso compartido. El catálogo se enriquece con metadatos obtenidos desde la
API gratuita de **Open Library**.

## 🎯 Qué cambió en el Hito 2

El Hito 1 construyó los módulos diferenciales sobre datos en memoria. En el Hito 2 el foco
pasó a los **flujos core de un e-commerce**, que ahora funcionan sobre PostgreSQL:

| Estado | Módulos | Persistencia |
|---|---|---|
| **Funcional** | auth (JWT), usuarios, catálogo con búsqueda y filtros, carrito, pedidos, recomendaciones | PostgreSQL |
| **Dummy con reglas predecibles** | costo de envío, pago, seguimiento | Reglas fijas (los intentos de pago sí se guardan) |
| **Sin cambios desde el Hito 1** | reseñas, listas de deseos, libreros, club de lectura | En memoria |

Los servicios dummy respetan el contrato definitivo: permiten que Web y Mobile integren y
demuestren casos de éxito y de error (pago rechazado, comuna sin cobertura, entrega
fallida) sin depender de proveedores externos. Sus reglas están en
[`docs/servicios.md`](./docs/servicios.md).

## 🧱 Stack técnico

- **NestJS 11** (TypeScript)
- **PostgreSQL 16** con **TypeORM** (la estructura la crean los scripts de `db/`, no el ORM)
- **@nestjs/jwt** + **bcryptjs** para autenticación
- **class-validator** / **class-transformer** para validación de DTOs
- **@nestjs/swagger** para documentación OpenAPI
- **@nestjs/config** para variables de entorno
- **Docker** y **docker compose** para ejecutar y desplegar

## 📂 Organización del proyecto

El proyecto sigue estructurado por **módulos de dominio**. Lo transversal a toda la API
vive en `common/`:

```
src/
├── main.ts                     # Bootstrap, Swagger, validación global, filtro de errores, CORS
├── app.module.ts               # Módulo raíz, configuración y conexión a PostgreSQL
├── config/                     # Validación de variables de entorno al arrancar
├── common/
│   ├── middleware/             # x-request-id, logs de entrada/salida, tiempo de ejecución
│   ├── context/                # request id disponible en cualquier capa
│   ├── exceptions/             # Errores personalizados de negocio (AppException)
│   ├── filters/                # Convierte cualquier error en la respuesta HTTP estándar
│   ├── pipes/                  # UuidPipe
│   └── dto/                    # ErrorResponseDto y @ApiErrores para Swagger
└── modules/
    ├── auth/                   # JWT, guards global y por rol, @Public, @Roles, @CurrentUser
    ├── usuarios/               # Cuentas de clientes y libreros            → PostgreSQL
    ├── libros/                 # Catálogo, búsqueda, filtros, Open Library → PostgreSQL
    ├── carrito/                # Carrito del usuario autenticado           → PostgreSQL
    ├── pedidos/                # Checkout, historial y cancelación         → PostgreSQL
    ├── envios/                 # Cotización de envío                       → dummy
    ├── pagos/                  # Pasarela de pago                          → dummy
    ├── seguimiento/            # Seguimiento del pedido                    → dummy
    ├── recomendaciones/        # Motor de recomendaciones (esfuerzo diferencial)
    ├── libreros/               # Perfiles editoriales y secciones curadas  → en memoria
    ├── club-lectura/           # Clubes, hilos y progreso compartido       → en memoria
    ├── resenas/                # Reseñas de clientes                       → en memoria
    └── listas-deseos/          # Listas de deseos, modo "para regalo"      → en memoria
db/                             # 01-schema.sql (estructura) y 02-seed.sql (datos de prueba)
scripts/                        # db-setup.js y PostgreSQL local sin Docker
test/                           # Pruebas e2e del flujo de compra
docs/                           # Documentación técnica y backlog
```

## ▶️ Cómo ejecutar el proyecto

### Requisitos

- Node.js 20 o superior
- PostgreSQL 13 o superior: con Docker, o el embebido de `npm run db:local`

### Opción A — con Docker

Levanta la API y PostgreSQL, y carga la estructura y los datos de prueba:

```bash
cp .env.example .env
docker compose up -d --build
```

### Opción B — sin Docker

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar variables de entorno de ejemplo
cp .env.example .env

# 3. En una terminal aparte, dejar corriendo un PostgreSQL local
npm run db:local

# 4. Crear las tablas y cargar los datos de prueba
npm run db:setup

# 5. Levantar en modo desarrollo (hot-reload)
npm run start:dev
```

La API quedará disponible en `http://localhost:3000` y la documentación interactiva
Swagger en **`http://localhost:3000/docs`**.

> `npm run db:local` descarga los binarios de PostgreSQL dentro de `scripts/local-db`. En
> Windows necesita que el proyecto esté en una ruta corta (por ejemplo `C:\dev\grupo-5-backend`).

### Verificar que todo funciona

```bash
curl http://localhost:3000/health
```

Debería responder `{"status":"ok","db":"ok",...}`.

### Scripts

| Script | Qué hace |
|---|---|
| `npm run start:dev` | API en modo desarrollo, recarga al guardar |
| `npm run build` / `npm run start:prod` | Compila a `dist/` y ejecuta la versión compilada |
| `npm run db:local` | PostgreSQL local sin Docker (dejar corriendo) |
| `npm run db:setup` | Ejecuta los scripts de `db/` (se puede repetir sin perder datos) |
| `npm run db:reset` | Borra las tablas y las vuelve a crear con los datos de prueba |
| `npm run test:e2e` | 23 pruebas de punta a punta contra la base configurada en `.env` |
| `npm run lint` / `npm run format` | ESLint y Prettier |

## ⚙️ Variables de entorno

Todas están en [`.env.example`](./.env.example). La aplicación valida las obligatorias al
arrancar y no levanta si faltan.

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

## 🧪 Datos de prueba

`db/02-seed.sql` carga 24 libros y tres cuentas, todas con la contraseña de desarrollo
`LeeConNos2026`:

| Email | Rol |
|---|---|
| `cliente@leeconnos.cl` | CLIENTE |
| `librero@leeconnos.cl` | LIBRERO (puede administrar el catálogo) |
| `admin@leeconnos.cl` | ADMIN |

Son solo para desarrollo y demo: hay que eliminarlas o cambiarles la clave antes de usar
datos reales.

### Probar el flujo de compra en Swagger

`POST /auth/login` → botón **Authorize** con el `accessToken` → y luego, en orden:

1. `GET /libros?q=asimov` — buscar en el catálogo
2. `POST /carrito/items` — agregar un libro
3. `POST /envios/cotizar` — costo de envío (dummy)
4. `POST /pedidos` — checkout
5. `POST /pagos` — pagar con una tarjeta ficticia (`4111111111111111` aprueba, terminada en `0002` rechaza)
6. `GET /pedidos/{id}/seguimiento` — seguimiento (dummy)

## 🔌 Servicios (resumen)

El detalle de endpoints, reglas dummy, códigos de error y **cambios de contrato respecto
del Hito 1** está en [`docs/servicios.md`](./docs/servicios.md), y de forma interactiva en
Swagger (`/docs`).

| Módulo | Servicios principales | Acceso |
|---|---|---|
| Auth | Registro, login, datos de mi cuenta | Público / token |
| Usuarios | Consultar, editar y eliminar la cuenta | Dueño o ADMIN |
| Libros | Explorar, buscar, filtrar, detalle, géneros | Público |
| Libros (gestión) | Crear, editar, retirar, importar por ISBN (Open Library) | LIBRERO o ADMIN |
| Carrito | Ver, agregar, modificar cantidad, quitar, vaciar | Token |
| Pedidos | Checkout, historial, detalle, cancelación | Token |
| Envíos (dummy) | Cotizar costo y plazo | Público |
| Pagos (dummy) | Pagar un pedido, listar intentos | Token |
| Seguimiento (dummy) | Línea de tiempo del pedido | Token |
| Recomendaciones | Recomendaciones por usuario | Público |
| Libreros | Perfil editorial, seguir librero, sección curada | Público |
| Club de Lectura | Clubes, hilos, comentarios, progreso compartido | Público |
| Reseñas | Crear, editar y eliminar reseñas por libro | Público |
| Listas de deseos | CRUD de listas, agregar/quitar libros, modo "para regalo" | Público |

## 🔎 Trazabilidad y manejo de errores

- Cada respuesta lleva el header `x-request-id` (se reutiliza el que envíe el cliente, o
  se genera un UUID).
- Por cada petición se registran dos líneas con ese id: la entrada (fecha y hora, método,
  path y body con los datos sensibles ocultos) y la salida (código de respuesta y tiempo
  de ejecución), tanto si termina bien como con error.

```
[HTTP] [225d4aa4-…] --> 2026-10-03T14:15:22.929Z POST /auth/login body={"email":"cliente@leeconnos.cl","password":"***"}
[HTTP] [225d4aa4-…] <-- POST /auth/login 200 241.0ms
```

- Todos los errores responden con la misma estructura; `error` es un código estable para
  Web y Mobile:

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

## 🗄️ Modelo de datos

Seis tablas: `usuarios`, `libros`, `carrito_items`, `pedidos`, `pedido_items` y `pagos`.
El diagrama entidad-relación y las decisiones de modelado están en
[`docs/modelo-datos.md`](./docs/modelo-datos.md).

## 🚀 Despliegue

La API y su base de datos corren en contenedores Docker sobre una máquina virtual en la
nube. El paso a paso y los comandos de operación están en
[`docs/despliegue.md`](./docs/despliegue.md).

## 🌿 Estrategia de ramas y contribución

El flujo de ramas, convención de commits y reglas de Pull Request están detallados en
[`CONTRIBUTING.md`](./CONTRIBUTING.md). Resumen rápido: `main` ← `develop` ← `feature/*`,
commits en formato Conventional Commits, PR con al menos 1 revisión antes del merge.

Para etiquetar la entrega del hito, ver
[`docs/como-taguear-el-hito.md`](./docs/como-taguear-el-hito.md) (el procedimiento es el
mismo, usando el tag `hito-2`).

## 📌 Decisiones técnicas del Hito 2

- **Foco en los flujos core.** Se priorizó que explorar, comprar y seguir un pedido
  funcionen de verdad, por sobre profundizar los módulos diferenciales, que conservan su
  contrato del Hito 1.
- **Scripts SQL en vez de `synchronize`.** La estructura de la base se versiona en
  `db/01-schema.sql`; el ORM nunca la modifica, así lo desplegado es predecible.
- **Checkout en una transacción.** Validar stock, descontarlo, guardar los precios del
  momento y vaciar el carrito ocurre todo o nada, con bloqueo de filas para que dos
  compras simultáneas no vendan la misma unidad.
- **Dinero como entero en CLP.** El peso chileno no tiene decimales; se evitan errores de
  redondeo.
- **Guard de autenticación global.** Toda ruta exige token salvo las marcadas con
  `@Public()`: olvidar proteger un endpoint nuevo no lo deja abierto.
- **Dummy con reglas predecibles.** Envío, pago y seguimiento responden según los datos
  enviados (por ejemplo, los últimos dígitos de la tarjeta), para poder demostrar casos de
  éxito y de error a voluntad.
- **Errores con código estable.** Cada error de negocio tiene un código (`STOCK_INSUFICIENTE`,
  `PAGO_RECHAZADO`, …) independiente del texto del mensaje, para que Web y Mobile decidan
  qué mostrar.
- Se mantienen del Hito 1 el **ValidationPipe global** estricto, el motor de
  recomendaciones basado en reglas con su `motivo`, y la integración con **Open Library**
  mediante `fetch` nativo.

## 🚧 Trabajo planificado para el siguiente hito

- Pasar reseñas, listas de deseos, libreros y club de lectura a PostgreSQL y protegerlos
  con token.
- Validar las reseñas contra pedidos pagados ("cliente verificado").
- Reemplazar los dummy de pago y envío por integraciones reales o de sandbox.
- Ranking y top ventas a partir de los pedidos.
- HTTPS, respaldo de la base e integración continua.
- Sumar pruebas unitarias por módulo, además de las e2e.
