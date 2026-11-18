# Versionado y despliegue

El servidor nunca compila código: descarga de Docker Hub la imagen de una versión estable y la ejecuta.
Para actualizarlo basta con cambiar la versión de la imagen.

```
package.json 0.4.0  →  tag de Git v0.4.0  →  imagen usuario/leeconnos-backend:0.4.0  →  API_VERSION=0.4.0 en el servidor
```

Los tres números deben coincidir; el workflow de publicación falla si el tag no coincide con `package.json`.

## 1. Publicar una versión

### Una sola vez: credenciales de Docker Hub en GitHub

1. En [Docker Hub](https://hub.docker.com): **Account settings → Personal access tokens → Generate new token**,
   con permiso *Read & Write*. Copiar el token.
2. En GitHub, repositorio Backend: **Settings → Secrets and variables → Actions → New repository secret**:

   | Secret | Valor |
   |---|---|
   | `DOCKERHUB_USERNAME` | Usuario de Docker Hub |
   | `DOCKERHUB_TOKEN` | El token del paso anterior |

### Cada versión

1. Subir la versión en `package.json` siguiendo [versionado semántico](https://semver.org/lang/es/):
   - `0.4.0` → `0.4.1`: solo correcciones.
   - `0.4.0` → `0.5.0`: funcionalidades nuevas compatibles.
   - Mientras el proyecto esté en `0.x`, un cambio que rompe el contrato también sube el segundo número.

   ```bash
   npm version 0.4.1 --no-git-tag-version
   ```

2. Integrar a `main` por Pull Request, como siempre.
3. Crear el tag en el commit de `main` y subirlo:

   ```bash
   git checkout main && git pull
   ```

   ```bash
   git tag v0.4.1
   ```

   ```bash
   git push origin v0.4.1
   ```

4. GitHub Actions (`.github/workflows/docker-publish.yml`) verifica que el tag coincide con `package.json`,
   corre las pruebas e2e contra un PostgreSQL limpio y publica:
   - `usuario/leeconnos-backend:0.4.1`
   - `usuario/leeconnos-backend:latest`

   El avance se ve en la pestaña **Actions** del repositorio; la imagen, en Docker Hub.

**Sin GitHub Actions** (por ejemplo, desde el servidor, que tiene Docker):

```bash
docker login
```

```bash
sh scripts/publicar-imagen.sh usuario-docker-hub
```

## 2. Preparar el servidor (una sola vez)

En la VM (Ubuntu en AWS EC2), con Docker ya instalado. Solo se necesitan cuatro archivos del repositorio,
no el código:

```bash
mkdir -p ~/leeconnos && cd ~/leeconnos
```

```bash
for f in docker-compose.yml Caddyfile .env.example; do curl -fsSLO "https://raw.githubusercontent.com/bootcamp-uchile-2026/grupo-5-backend/v0.4.0/$f"; done
```

```bash
cp .env.example .env && nano .env
```

Variables a revisar en el `.env` del servidor:

| Variable | Valor en el servidor |
|---|---|
| `DOCKERHUB_USUARIO` | Usuario de Docker Hub donde se publicó la imagen |
| `API_VERSION` | Versión a ejecutar, por ejemplo `0.4.0` |
| `NODE_ENV` | `production` |
| `JWT_SECRET` | 32 caracteres aleatorios o más (`openssl rand -hex 48`) |
| `POSTGRES_PASSWORD` | Clave propia (solo letras y números) |
| `CORS_ORIGIN` | URL de la Aplicación Web, por ejemplo `http://localhost:5173` mientras Front desarrolla |
| `PUBLIC_URL` | URL pública de la API, para las URL de las imágenes: `http://3.131.220.134:3000` |
| `FRONTEND_URL` | URL de la Aplicación Web: los enlaces de los correos apuntan ahí (`/verificar-correo?token=...`) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | Servidor de correo para enviar los correos de verdad (ver abajo). Sin ellos, solo quedan en el log |
| `COOKIE_SECURE` / `COOKIE_SAMESITE` | Ver sección 4 |

Si el servidor ya ejecutaba la API construida desde el código (Hito 2), **conservar el mismo `.env` y la
misma carpeta**: el volumen `pgdata` mantiene los datos, y al arrancar la versión nueva las migraciones
completan la base existente.

## 3. Desplegar y cambiar de versión

Primera vez:

```bash
docker compose up -d
```

Al arrancar, la API aplica las migraciones pendientes. Comprobar:

```bash
docker compose ps
```

```bash
curl http://localhost:3000/health
```

La respuesta incluye `"version":"0.4.0"`.

**Cambiar de versión** (subir o volver atrás), sin tocar el código:

```bash
sed -i 's/^API_VERSION=.*/API_VERSION=0.4.1/' .env
```

```bash
docker compose pull api && docker compose up -d api
```

```bash
curl http://localhost:3000/health
```

Ahora responde `"version":"0.4.1"`. La base y las imágenes subidas se conservan porque viven en volúmenes.

> Para la demo del video: desplegar `0.4.0`, mostrar `/health` y `/docs` (versión arriba a la izquierda),
> cambiar `API_VERSION` a `0.4.1`, repetir los dos comandos y volver a mostrar `/health`.

### Volver atrás una migración

Las migraciones nuevas se aplican solas. Si una versión trae una migración que hay que deshacer, se revierte
**antes** de bajar de versión, con la imagen que la trajo:

```bash
docker compose exec api npm run typeorm -- migration:show
```

```bash
docker compose exec api npm run typeorm -- migration:revert
```

## 4. HTTPS y cookies de sesión

La Aplicación Web guarda la sesión en cookies HttpOnly (`lcn_access`, `lcn_refresh`). El navegador solo
las envía entre dominios distintos si son `SameSite=None; Secure`, y `Secure` exige HTTPS.

| Escenario | `COOKIE_SECURE` | `COOKIE_SAMESITE` | ¿Necesita HTTPS? |
|---|---|---|---|
| Web y API en el mismo sitio (ej. ambas en `localhost`) | `false` | `lax` | No |
| Web en `localhost:5173` y API en el servidor por IP | — | — | No funciona: usar HTTPS o el header `Authorization` |
| Web y API en dominios distintos, ambos con HTTPS | `true` | `none` | Sí |

Activar HTTPS con Caddy y [sslip.io](https://sslip.io) (un dominio gratuito que apunta a la IP del servidor):

1. Abrir los puertos **80** y **443** en el Security Group de la instancia.
2. En el `.env`:

   ```
   DOMINIO=3-131-220-134.sslip.io
   PUBLIC_URL=https://3-131-220-134.sslip.io
   COOKIE_SECURE=true
   COOKIE_SAMESITE=none
   CORS_ORIGIN=https://url-de-la-web,http://localhost:5173
   ```

3. Levantar con el perfil `https`:

   ```bash
   docker compose --profile https up -d
   ```

Caddy pide y renueva solo el certificado. La API queda en `https://3-131-220-134.sslip.io` y Swagger en
`/docs`. Safari bloquea las cookies de terceros aunque sean `SameSite=None`; la solución definitiva es
publicar Web y API bajo el mismo dominio (por ejemplo `app.dominio.cl` y `api.dominio.cl` con
`COOKIE_DOMAIN=.dominio.cl`).

## 5. Correos reales

Sin `SMTP_HOST`, los correos (verificación de cuenta, recuperación de contraseña, pedidos, preguntas al
librero) quedan en el log con su enlace: sirve para desarrollar, pero no llegan a nadie. Para enviarlos de
verdad basta con una cuenta de Gmail:

1. En la cuenta de Google, activar la **verificación en dos pasos**.
2. Crear una **contraseña de aplicación** en https://myaccount.google.com/apppasswords (16 letras).
3. En el `.env` del servidor:

   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_USER=cuenta@gmail.com
   SMTP_PASS=la contraseña de aplicación, sin espacios
   MAIL_FROM=LeeConNos <cuenta@gmail.com>
   FRONTEND_URL=https://url-de-la-web
   ```

4. Reiniciar la API:

   ```bash
   docker compose up -d api
   ```

Al registrarse, el usuario recibe el correo con el enlace `FRONTEND_URL/verificar-correo?token=...`. Si el
proveedor falla, el registro igual se completa, el error queda en el log y el usuario puede pedir el reenvío
con `POST /auth/reenviar-verificacion`. Gmail permite unos 500 correos al día, de sobra para la demo.

## 6. Operación

| Tarea | Comando |
|---|---|
| Logs de la API (cada línea lleva el `x-request-id`) | `docker compose logs -f api` |
| Versión desplegada | `curl http://localhost:3000/health` |
| Estado de las migraciones | `docker compose exec api npm run typeorm -- migration:show` |
| Reponer stock antes de una demo | `docker compose exec api npm run db:reset-stock` |
| Entrar a la base | `docker compose exec db psql -U leeconnos` |
| Respaldo de la base | `docker compose exec db pg_dump -U leeconnos leeconnos > respaldo.sql` |

## 7. Construir en local

Para probar una versión antes de publicarla:

```bash
docker compose -f docker-compose.yml -f docker-compose.build.yml up -d --build
```
