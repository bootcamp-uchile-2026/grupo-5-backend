# LeeConNos — Backend API

API RESTful desarrollada con **NestJS** para **LeeConNos**, la tienda online de una librería
independiente que traslada al mundo digital la experiencia de recomendación personalizada
de sus libreros.

Permite registrarse e iniciar sesión, explorar y buscar en el catálogo, armar un carrito,
comprar, pagar y seguir un pedido. Suma perfiles de libreros con secciones curadas,
recomendaciones según géneros e historial de compras, club de lectura, reseñas y listas de
deseos. El catálogo se enriquece con metadatos de la API gratuita de **Open Library**.

> Entrega correspondiente al **Hito 3** del Bootcamp DCC — Universidad de Chile. Versión **0.4.0**.

| Estado en el Hito 3 | Módulos | Persistencia |
|---|---|---|
| **Funcional** | auth (JWT con refresh, verificación de correo, recuperación de contraseña, Google y Facebook), usuarios, catálogo con filtros y categorías del menú, carrito, cupones, pedidos (también como invitado), reseñas, libreros, recomendaciones, listas de deseos, club de lectura, newsletter | PostgreSQL |
| **Dummy con reglas predecibles** | costo de envío, pago, seguimiento, envío de correos | Reglas fijas |

## Contenidos

1. [Requisitos previos](#1-requisitos-previos)
2. [Instalación](#2-instalación)
3. [Configuración](#3-configuración)
4. [Ejecución - Desarrollo](#4-ejecución---desarrollo)
5. [Ejecución - Producción](#5-ejecución---producción)
6. [Estructura del proyecto](#6-estructura-del-proyecto)
7. [Documentación de la API (Swagger)](#7-documentación-de-la-api-swagger)
8. [Flujo de trabajo](#8-flujo-de-trabajo)
9. [Contacto](#9-contacto)
10. [Otros](#10-otros)

## 1. Requisitos previos

Antes de ejecutar el proyecto, asegúrate de tener instalados los siguientes componentes:

- **Node.js**: >= v20.0.0 — [descargar](https://nodejs.org/es/download). Es la versión
  mínima que exige NestJS 11. El proyecto se ejecutó con v22 (imagen Docker) y v24 (local).
- **npm**: >= 10, incluido con Node.js.
- **Git**: [descargar](https://git-scm.com/downloads).
- **PostgreSQL**: >= 13. No hace falta instalarlo: se puede usar el contenedor de Docker
  o el PostgreSQL embebido del proyecto (`npm run db:local`).
- **Docker** y **Docker Compose** (opcional en desarrollo, necesario para producción):
  [descargar](https://docs.docker.com/get-docker/).
- **NestJS CLI** (opcional): `npm install -g @nestjs/cli`. No es necesario para ejecutar
  el proyecto, porque los scripts de `npm` usan la versión incluida en las dependencias.

## 2. Instalación

1. Clona el repositorio:

   ```bash
   git clone https://github.com/bootcamp-uchile-2026/grupo-5-backend.git
   ```

2. Entra en el directorio del proyecto:

   ```bash
   cd grupo-5-backend
   ```

3. Instala las dependencias:

   ```bash
   npm install
   ```

> En Windows conviene clonar en una ruta corta (por ejemplo `C:\dev`), porque el PostgreSQL
> embebido no funciona en rutas muy largas.

## 3. Configuración

1. Crea el archivo `.env` en la raíz del proyecto a partir del ejemplo:

   ```bash
   cp .env.example .env
   ```

   Para desarrollo local los valores del ejemplo funcionan sin cambios.

2. Variables de entorno. La aplicación valida las obligatorias al arrancar y no levanta si
   faltan:

   | Variable | Obligatoria | Por defecto | Para qué sirve |
   |---|---|---|---|
   | `DATABASE_URL` | Sí | — | Conexión a PostgreSQL: `postgresql://usuario:clave@host:puerto/base` |
   | `JWT_SECRET` | Sí | — | Secreto con el que se firman los tokens de sesión |
   | `NODE_ENV` | No | `development` | Ambiente: `development` o `production` |
   | `PORT` | No | `3000` | Puerto HTTP de la API |
   | `DB_SSL` | No | `false` | `true` si el proveedor de la base exige SSL |
   | `JWT_EXPIRES_IN` | No | `2h` | Vigencia del token (`30m`, `2h`, `7d`) |
   | `JWT_REFRESH_EXPIRES_IN` | No | `7d` | Vigencia del `refreshToken` para renovar la sesión con `POST /auth/refresh` |
   | `FRONTEND_URL` | No | `http://localhost:5173` | URL de la Web a la que apuntan los enlaces de los correos |
   | `EXPONER_TOKENS_DEV` | No | `false` | `true` (fuera de producción) incluye el token de los correos en la respuesta |
   | `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` | No | — | Servidor de correo. Sin `SMTP_HOST` los correos no se envían: quedan en el log |
   | `MAIL_FROM` | No | `LeeConNos <no-responder@leeconnos.cl>` | Remitente de los correos |
   | `GOOGLE_CLIENT_ID` | No | — | Habilita `POST /auth/google`. Sin ella responde `503` |
   | `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET` | No | — | Habilitan `POST /auth/facebook`. Sin ellas responde `503` |
   | `DOMINIO` | Solo HTTPS | `localhost` | Dominio del certificado del perfil `https` (ver [despliegue](./docs/despliegue.md)) |
   | `CORS_ORIGIN` | No | `*` | Orígenes permitidos, separados por coma. `*` permite cualquiera. Con sesión por cookie, solo desde ellos se aceptan cambios de datos |
   | `DB_MIGRAR_AL_INICIAR` | No | `true` | Aplicar las migraciones pendientes al arrancar |
   | `COOKIE_SECURE` | No | `true` en producción | Cookies de sesión solo por HTTPS |
   | `COOKIE_SAMESITE` | No | `lax` | `none` si Web y API están en dominios distintos (exige `COOKIE_SECURE=true`) |
   | `COOKIE_DOMAIN` | No | — | Dominio padre para compartir la cookie entre subdominios |
   | `UPLOADS_DIR` | No | `uploads` | Carpeta de las imágenes subidas |
   | `IMAGEN_MAX_MB` | No | `2` | Tamaño máximo por imagen |
   | `PUBLIC_URL` | No | host de la petición | URL pública de la API, para armar la URL de las imágenes |
   | `ENVIO_GRATIS_DESDE` | No | `40000` | Subtotal (CLP) desde el que el despacho es gratis |
   | `SEGUIMIENTO_PASO_SEGUNDOS` | No | `60` | Segundos entre cada hito del seguimiento simulado |
   | `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Solo Docker | `leeconnos` | Credenciales con que se crea el contenedor de PostgreSQL |
   | `DOCKERHUB_USUARIO`, `API_VERSION` | Solo Docker | — | Imagen de la API que descarga el servidor: `<usuario>/leeconnos-backend:<versión>` |

3. En caso de ejecutar en ambiente productivo, adicionalmente se debe modificar:

   - `NODE_ENV=production`.
   - `JWT_SECRET`: un valor propio y aleatorio de al menos 32 caracteres. Se puede generar
     con `openssl rand -hex 48`.
   - `POSTGRES_PASSWORD`: una clave propia, solo con letras y números.
   - `CORS_ORIGIN`: la URL de la aplicación Web en vez de `*`.

   El archivo `.env` nunca se sube al repositorio.

## 4. Ejecución - Desarrollo

1. En una terminal, deja corriendo un PostgreSQL local (la primera vez descarga sus
   binarios dentro de `scripts/local-db`):

   ```bash
   npm run db:local
   ```

2. En otra terminal, levanta la API con recarga automática al guardar. Al arrancar aplica
   las migraciones de TypeORM pendientes, que crean las tablas y cargan los datos de prueba:

   ```bash
   npm run start:dev
   ```

3. Verifica que responde:

   ```bash
   curl http://localhost:3000/health
   ```

   Debe devolver `{"status":"ok","version":"0.4.0","db":"ok",...}`.

Si ya tienes un PostgreSQL propio, omite el paso 1 y apunta `DATABASE_URL` a esa base.

Otros scripts útiles:

| Script | Qué hace |
|---|---|
| `npm run migration:show` | Lista las migraciones y cuáles están aplicadas |
| `npm run migration:run` / `migration:revert` | Aplica las pendientes / revierte la última |
| `npm run migration:generate -- src/database/migrations/Nombre` | Crea una migración comparando las entidades con la base |
| `npm run db:reset` | Borra todas las tablas y vuelve a aplicar las migraciones |
| `npm run db:reset-stock` | Repone el stock de los libros de prueba y cancela los pedidos pendientes de pago |
| `npm run test:e2e` | 59 pruebas de punta a punta contra la base configurada en `.env` |
| `npm run lint` / `npm run format` | ESLint y Prettier |

## 5. Ejecución - Producción

En producción la API corre desde una imagen versionada publicada en Docker Hub; el
servidor no compila código. La versión de `package.json`, el tag de Git (`v0.4.0`) y el
tag de la imagen (`0.4.0`) coinciden:

1. Crear el tag `v0.4.0` en `main`. GitHub Actions corre las pruebas y publica
   `usuario/leeconnos-backend:0.4.0` en Docker Hub.
2. En el servidor, indicar `DOCKERHUB_USUARIO` y `API_VERSION=0.4.0` en el `.env` y levantar:

   ```bash
   docker compose up -d
   ```

3. Para cambiar de versión, editar `API_VERSION` y:

   ```bash
   docker compose pull api && docker compose up -d api
   ```

Las migraciones pendientes se aplican al arrancar cada versión. Alternativa sin Docker,
con un PostgreSQL ya disponible en `DATABASE_URL`:

```bash
npm run build
npm run start:prod
```

El paso a paso para desplegar en un servidor en la nube y los comandos de operación están
en [`docs/despliegue.md`](./docs/despliegue.md).

## 6. Estructura del proyecto

El proyecto está organizado por **módulos de dominio**; lo transversal a toda la API vive
en `common/`:

```bash
src/
├── main.ts                 # Punto de entrada y Swagger
├── app.setup.ts            # Validación global, errores, cookies, CORS y archivos estáticos
├── app.module.ts           # Módulo raíz: configuración y conexión a PostgreSQL
├── config/                 # Variables de entorno, orígenes permitidos y versión
├── database/
│   ├── data-source.ts      # Conexión para la CLI de TypeORM
│   └── migrations/         # Estructura y datos de prueba, versionados
├── common/                 # Componentes transversales
│   ├── middleware/         # x-request-id, logs de entrada/salida, tiempo de ejecución
│   ├── context/            # Request id disponible en cualquier capa
│   ├── exceptions/         # Errores personalizados de negocio
│   ├── filters/            # Convierte cualquier error en la respuesta HTTP estándar
│   ├── pipes/              # Validación de parámetros (UuidPipe)
│   ├── validators/         # Validadores propios (RUT)
│   └── dto/                # Estructura de error para Swagger
└── modules/                # Un módulo por funcionalidad del negocio
    ├── auth/               # JWT, cookies HttpOnly, refresh y logout, verificación, Google/Facebook
    ├── usuarios/           # Cuentas de clientes y libreros            → PostgreSQL
    ├── libros/             # Catálogo, filtros, categorías del menú    → PostgreSQL
    ├── imagenes/           # Subida de portadas y galería              → disco + PostgreSQL
    ├── carrito/            # Carrito del usuario autenticado           → PostgreSQL
    ├── direcciones/        # Direcciones de despacho guardadas         → PostgreSQL
    ├── cupones/            # Códigos de descuento                      → PostgreSQL
    ├── pedidos/            # Checkout (con cuenta o invitado)          → PostgreSQL
    ├── resenas/            # Reseñas de lectores y libreros            → PostgreSQL
    ├── libreros/           # Perfiles, recomendaciones, preguntas      → PostgreSQL
    ├── recomendaciones/    # Destacadas del Home y personalizadas      → PostgreSQL
    ├── listas-deseos/      # Listas de deseos y "Favoritos"            → PostgreSQL
    ├── club-lectura/       # Clubes, hilos y progreso compartido       → PostgreSQL
    ├── newsletter/         # Suscripciones                             → PostgreSQL
    ├── admin/              # Reposición del stock de prueba
    ├── mail/               # Envío de correos                          → dummy (log)
    ├── envios/             # Cotización de envío                       → dummy
    ├── pagos/              # Pasarela de pago                          → dummy
    └── seguimiento/        # Seguimiento del pedido                    → dummy
scripts/                    # Reposición de stock, publicación de la imagen y PostgreSQL local
test/                       # Pruebas e2e del flujo de compra
docs/                       # Documentación técnica y backlog
.github/workflows/          # Publicación de la imagen en Docker Hub al crear un tag
Dockerfile                  # Imagen de la API
docker-compose.yml          # Servidor: imagen de Docker Hub + PostgreSQL (+ Caddy con el perfil https)
docker-compose.build.yml    # Override para construir la imagen desde el código
Caddyfile                   # Proxy HTTPS con certificado automático
```

Cada módulo contiene su `*.module.ts`, `*.controller.ts` (rutas), `*.service.ts` (lógica),
`dto/` (entrada y salida validadas) y `entities/`.

## 7. Documentación de la API (Swagger)

Swagger está habilitado en este proyecto y se genera desde el propio código, por lo que
siempre refleja los servicios, DTO y validaciones vigentes.

1. Inicia el proyecto:

   ```bash
   npm run start:dev
   ```

2. Accede a Swagger en tu navegador:

   - Local: http://localhost:3000/docs
   - Desplegado: http://3.131.220.134:3000/docs
   - Especificación OpenAPI en JSON: `/docs-json`

3. Para probar las rutas privadas: crea una cuenta en `POST /auth/registro` (o inicia
   sesión en `POST /auth/login`), copia el `accessToken` de la respuesta y pégalo en el
   botón **Authorize**.

Flujo de compra sugerido para recorrer en Swagger:

1. `GET /libros?q=asimov` — buscar en el catálogo
2. `POST /carrito/items` — agregar un libro
3. `POST /envios/cotizar` — costo de envío (dummy)
4. `POST /pedidos` — checkout
5. `POST /pagos` — pagar con una tarjeta ficticia (`4111111111111111` aprueba, terminada en `0002` rechaza)
6. `GET /pedidos/{id}/seguimiento` — seguimiento (dummy)

El detalle de cada servicio, las reglas de los dummy, los códigos de error y los cambios
de contrato respecto del Hito 1 están en [`docs/servicios.md`](./docs/servicios.md).

## 8. Flujo de trabajo

En este proyecto seguimos un flujo de trabajo basado en ramas. El detalle completo está en
[`CONTRIBUTING.md`](./CONTRIBUTING.md).

### Branches principales

- `main`: contiene la última versión estable, la entregada en cada hito. No se modifica
  directamente.
- `develop`: rama de integración del equipo. Tampoco recibe cambios directos.

### Creación de branches para desarrollo

Toda funcionalidad o corrección nace en una rama propia, derivada de `develop`:

```bash
git checkout develop
git pull origin develop
git checkout -b feature/nombre-funcionalidad
```

#### Nomenclatura de las ramas

- Nuevas funcionalidades: prefijo `feature/`. Ejemplo: `feature/carrito-compras`
- Corrección de errores: prefijo `fix/`. Ejemplo: `fix/error-en-login`

Los commits siguen [Conventional Commits](https://www.conventionalcommits.org/):
`feat(pedidos): agregar cancelación`, `fix(libros): corregir filtro por precio`, `docs: ...`.

### Integración a producción

1. Al terminar, se abre un Pull Request hacia `develop` usando la plantilla del
   repositorio: qué se hizo, cómo probarlo y qué endpoints cambian.
2. Antes de pedir revisión deben pasar `npm run build` y `npm run test:e2e`.
3. Se requiere al menos **una revisión aprobada**. Se integra con *Squash and merge*.
4. Al cerrar un hito se abre un Pull Request de `develop` hacia `main` y se etiqueta el
   commit resultante (`hito-1`, `hito-2`, …). Ver
   [`docs/como-taguear-el-hito.md`](./docs/como-taguear-el-hito.md).
5. El servidor se actualiza desde `main` siguiendo [`docs/despliegue.md`](./docs/despliegue.md).

## 9. Contacto

Equipo Backend — **grupo 5**, Bootcamp DCC Universidad de Chile 2026.

- Montserrat Valenzuela — GitHub: [MontserratValenzuela](https://github.com/MontserratValenzuela)

Para dudas o problemas con la API, abre un *issue* en
[este repositorio](https://github.com/bootcamp-uchile-2026/grupo-5-backend/issues).

## 10. Otros

### Datos de prueba

Las migraciones de TypeORM, al arrancar la API por primera vez, cargan 75 libros (con reseñas, cubriendo
todas las categorías del menú de UX), 5 perfiles de libreros, cupones, un club de lectura y
cuentas de ejemplo: `cliente@leeconnos.cl`, `librero@leeconnos.cl` y `admin@leeconnos.cl`, los
libreros de los wireframes (`gregorio@`, `ana@`, `tyler@`, `clara@`) y los lectores que firman
las reseñas (`lector1@` a `lector6@`).
Su contraseña de desarrollo está indicada en la migración
[`DatosPruebaIniciales`](./src/database/migrations/1788220800001-DatosPruebaIniciales.ts) y es
válida solo para ambientes locales; en un ambiente público debe cambiarse.

Para probar sin esas cuentas basta con registrarse en `POST /auth/registro`.

### Trazabilidad y manejo de errores

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

### Modelo de datos

Las seis tablas del Hito 2 (`usuarios`, `libros`, `carrito_items`, `pedidos`, `pedido_items` y
`pagos`) más las del Hito 3: `categorias`, `resenas`, `libreros`, `recomendaciones_librero`,
`colecciones`, `librero_seguidores`, `listas_deseos`, `lista_deseos_libros`, `clubes_lectura`,
`club_participantes`, `club_hilos`, `club_comentarios`, `cupones`, `suscripciones_newsletter` y
`tokens_usuario`, y las del cierre del Hito 3: `imagenes`, `direcciones` y `preguntas_librero`. El diagrama entidad-relación y las decisiones de modelado están en
[`docs/modelo-datos.md`](./docs/modelo-datos.md).

### Imagen Docker y versiones

El `Dockerfile` construye la imagen en dos etapas (compilar y ejecutar), deja solo las
dependencias de producción y corre con un usuario sin privilegios. La publica GitHub Actions
al crear un tag `vX.Y.Z` que coincida con `package.json`. Para construirla a mano:

```bash
docker build -t usuario/leeconnos-backend:0.4.0 .
```

El detalle (secrets de Docker Hub, cambio de versión en el servidor, HTTPS y cookies) está en
[`docs/despliegue.md`](./docs/despliegue.md).

### Sesión de la Aplicación Web

Al iniciar sesión la API deja el token en cookies HttpOnly (`lcn_access` y `lcn_refresh`),
que el JavaScript del navegador no puede leer. La Web debe enviar las peticiones con
credenciales (`credentials: 'include'`); Mobile y Swagger siguen usando
`Authorization: Bearer`. `POST /auth/logout` cierra la sesión en todos los dispositivos.

### Decisiones técnicas

- **Foco en los flujos core.** Se priorizó que explorar, comprar y seguir un pedido
  funcionen de verdad, por sobre profundizar los módulos diferenciales, que conservan su
  contrato del Hito 1.
- **Migraciones de TypeORM en vez de `synchronize`.** La estructura y los datos de prueba se
  versionan en `src/database/migrations` y se aplican al arrancar cada versión.
- **El servidor no compila.** Se despliega una imagen versionada de Docker Hub; actualizar es
  cambiar `API_VERSION`.
- **Checkout en una transacción.** Validar stock, descontarlo, guardar los precios del
  momento y vaciar el carrito ocurre todo o nada.
- **Guard de autenticación global.** Toda ruta exige sesión salvo las marcadas con
  `@Public()`: olvidar proteger un endpoint nuevo no lo deja abierto.
- **Pipes que consultan la base.** `LibroExistePipe` y `LibreroExistePipe` cargan la entidad
  de la ruta o responden 404 antes de llegar al service.
- **Dummy con reglas predecibles.** Envío, pago y seguimiento responden según los datos
  enviados, para poder demostrar casos de éxito y de error a voluntad.

### Más documentación

| Documento | Contenido |
|---|---|
| [`docs/servicios.md`](./docs/servicios.md) | Endpoints, reglas dummy, códigos de error, cambios de contrato |
| [`docs/modelo-datos.md`](./docs/modelo-datos.md) | Modelo de datos y diagrama entidad-relación |
| [`docs/despliegue.md`](./docs/despliegue.md) | Versionado, Docker Hub, despliegue, HTTPS y cookies |
| [`docs/hito3-backend.md`](./docs/hito3-backend.md) | Lo agregado en el Hito 3, estado frente al PDF y guía para el Front |
| [`docs/hito2-backend.md`](./docs/hito2-backend.md) | Estado frente a las bases del Hito 2 y trabajo para el Hito 3 |
| [`CONTRIBUTING.md`](./CONTRIBUTING.md) | Flujo de ramas, commits y Pull Requests |
