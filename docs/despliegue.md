# Docker y despliegue en la nube

> **Estado:** el `Dockerfile` y el `docker-compose.yml` están escritos pero todavía no se han ejecutado:
> el equipo donde se desarrolló no tiene Docker. La primera construcción hay que hacerla y revisarla en
> el servidor (o en un equipo con Docker) siguiendo estos pasos.

## Qué se despliega

`docker-compose.yml` levanta dos contenedores:

| Servicio | Imagen | Detalle |
|---|---|---|
| `db` | `postgres:16-alpine` | Datos en el volumen `pgdata`. La primera vez ejecuta `db/01-schema.sql` y `db/02-seed.sql`. Solo se publica en `127.0.0.1` del servidor |
| `api` | `leeconnos-backend:hito-2` (construida con el `Dockerfile`) | Espera a que la base esté sana. Publica el puerto `PORT` |

La imagen de la API se construye en dos etapas (compilar / ejecutar), queda solo con las dependencias de
producción, corre con un usuario sin privilegios y trae un `HEALTHCHECK` contra `/health`.

## Pasos en el servidor (VM Ubuntu, por ejemplo Oracle Cloud)

1. Instalar Docker y el plugin de compose:

```bash
curl -fsSL https://get.docker.com | sudo sh
```

```bash
sudo usermod -aG docker $USER
```

   Cerrar la sesión SSH y volver a entrar para que el grupo tome efecto.

2. Clonar el repositorio en el tag del hito:

```bash
git clone --branch hito-2 <URL-del-repositorio> leeconnos-backend
```

3. Crear el `.env` de producción dentro de la carpeta del proyecto:

```bash
cp .env.example .env
```

   Editar como mínimo:

   | Variable | Valor |
   |---|---|
   | `NODE_ENV` | `production` |
   | `JWT_SECRET` | 32 caracteres aleatorios o más. Nunca el del ejemplo |
   | `POSTGRES_PASSWORD` | Una clave propia |
   | `CORS_ORIGIN` | La URL de la aplicación Web |

4. Construir y levantar:

```bash
docker compose up -d --build
```

5. Verificar:

```bash
docker compose ps
```

```bash
curl http://localhost:3000/health
```

   Debe responder `{"status":"ok","db":"ok",...}`.

6. Abrir el puerto de la API hacia internet. En Oracle Cloud son **dos** lugares: la *Security List* de la
   subred (regla de entrada TCP al puerto 3000) y el firewall de la propia VM:

```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 3000 -j ACCEPT
```

```bash
sudo netfilter-persistent save
```

   El puerto 5432 de la base **no** se abre.

7. Compartir con Web y Mobile la URL base (`http://<IP-pública>:3000`) y la de Swagger (`/docs`).

## Operación

| Tarea | Comando |
|---|---|
| Ver logs de la API (ahí aparece el `x-request-id` de cada petición) | `docker compose logs -f api` |
| Actualizar a una versión nueva | `git pull`, `docker compose up -d --build` y `docker compose exec api node scripts/db-setup.js` (aplica las migraciones nuevas sin borrar datos) |
| Reponer el stock de prueba antes de una revisión | `POST /admin/reiniciar-stock` con un usuario ADMIN, o `docker compose exec api node scripts/db-setup.js --reset-stock` |
| Activar HTTPS (Caddy + Let's Encrypt) | Definir `DOMINIO` en `.env` (sin dominio propio: `3-131-220-134.sslip.io`), abrir los puertos 80 y 443, y `docker compose --profile https up -d` |
| Ver los correos dummy (verificación, contraseña) | `docker compose logs api \| grep correo_enviado` |
| Volver a aplicar los scripts SQL (no borra datos) | `docker compose exec api node scripts/db-setup.js` |
| Reiniciar la base con los datos de prueba (**borra todo**) | `docker compose exec api node scripts/db-setup.js --reset` |
| Entrar a la base | `docker compose exec db psql -U leeconnos` |

## Pendiente para el siguiente hito

- HTTPS con un dominio y un proxy inverso (Caddy o Nginx) delante de la API.
- Respaldo periódico del volumen `pgdata`.
- Integración continua que construya la imagen y ejecute las pruebas en cada Pull Request.
