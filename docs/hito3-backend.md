# Hito 3 · Lo que agregó Backend

Este documento resume los cambios de la rama `feature/hito3-backend-ux`. Cubre lo que UX diseñó y la API no
tenía (el Front lo mostraba con datos de prueba) y los puntos pendientes que levantó el equipo Web.
Los endpoints completos están en Swagger (`/docs`) y en [`servicios.md`](./servicios.md).

## Resumen por pedido del equipo

| Pedido | Estado | Dónde |
|---|---|---|
| Pago con tarjeta, historial, detalle, seguimiento y cancelación | Ya existía en el Hito 2; solo faltan las pantallas del Front | `POST /pagos`, `GET /pedidos`, `GET /pedidos/:id`, `GET /pedidos/:id/seguimiento`, `POST /pedidos/:id/cancelar` |
| Libros: calificación, opiniones, ventas, precio anterior, subgénero, encuadernación, páginas, dimensiones, etiquetas | Listo | Campos nuevos en `GET /libros` y `GET /libros/:id` |
| Ficha: video y galería | Listo (campos vacíos hasta que un librero los cargue) | `videoUrl`, `galeria` en el libro; se editan con `PATCH /libros/:id` |
| Filtros: editorial, subgénero, varios autores, "en oferta" | Listo | `GET /libros?editorial=&subgenero=&autores=&enOferta=` y `GET /libros/filtros` |
| Ficha: reseñas de libreros y de lectores | Listo, en PostgreSQL | `GET /libros/:id/resenas`, `GET /libros/:id/recomendaciones-libreros` |
| Perfiles de libreros y recomendados del Home | Listo, en PostgreSQL, con los 4 perfiles de los wireframes | `GET /libreros`, `GET /libreros/:slug`, `GET /recomendaciones/destacadas` |
| Registro: apellido y "Recibir novedades" | Listo | `apellido` y `recibirNovedades` en `POST /auth/registro` |
| Código de descuento | Listo | `POST /cupones/validar` y `codigoDescuento` en `POST /pedidos` |
| Newsletter | Listo | `POST /newsletter/suscripciones` |
| Compra como invitado | Listo | `POST /pedidos/invitado`, `POST /pagos/invitado` |
| Verificación de correo | Listo (correo dummy, ver abajo) | `POST /auth/verificar-email`, `POST /auth/reenviar-verificacion` |
| "Olvidé mi contraseña" | Listo (correo dummy) | `POST /auth/olvide-password`, `POST /auth/restablecer-password` |
| Acceso con Google y Facebook | Listo; falta configurar las credenciales | `POST /auth/google`, `POST /auth/facebook` |
| Géneros del menú sin libros | Resuelto: 51 libros nuevos; todas las categorías del menú tienen libros | `GET /libros/categorias`; `genero` acepta los nombres del menú |
| Stock compartido antes de la revisión | Listo | `POST /admin/reiniciar-stock` (ADMIN) o `npm run db:reset-stock` |
| Portadas de Papelucho y Desolación | Resuelto con portadas de otra edición en Open Library | `db/04-hito3-seed.sql` |
| HTTPS | Listo para activar | Perfil `https` de `docker-compose.yml` (Caddy + Let's Encrypt) |
| Sesión de 2 horas sin renovación | Resuelto | `refreshToken` (7 días) + `POST /auth/refresh` |
| Nombre y apellido juntos | Resuelto: se guardan por separado (las cuentas existentes se separan solas) | `nombre`, `apellido`, `nombreCompleto` en el usuario |
| Reseñas, listas de deseos, libreros y club de lectura en memoria | Resuelto: todo en PostgreSQL | — |
| Recomendaciones personalizadas en el Home | Listo | `GET /recomendaciones/para-mi` |

Sin cambios: las pantallas de gestión de usuarios y libros (LIBRERO/ADMIN) siguen sin diseño; la API ya
tenía esos endpoints.

## Guía para el Front: reemplazar los datos dummy

### `src/datos/complementosLibros.ts` → campos del libro

Cada libro de `GET /libros` y `GET /libros/:id` ahora trae los mismos nombres que usa `ComplementoLibro`,
así que el archivo se puede eliminar:

| Dummy | API | Nota |
|---|---|---|
| `calificacion` | `calificacion` | Promedio real de las reseñas (0 a 5, un decimal) |
| `opiniones` | `opiniones` | Cantidad de reseñas |
| `ventas` | `ventas` | Ventas históricas + pedidos pagados (sube al aprobar un pago) |
| `precioAnterior` | `precioAnterior` | `null` si no está en oferta. Extra: `descuentoPorcentaje`, `enOferta` |
| `subgenero`, `encuadernacion`, `paginas`, `dimensiones`, `etiquetas` | Mismo nombre | `null` o `[]` si no hay dato |
| — | `categorias` | Géneros y temáticas del menú a los que pertenece |
| — | `videoUrl`, `galeria` | Para la ficha |

El campo `descripcion` que esperan Web y Mobile ahora existe (igual a `sinopsis`, que se mantiene).

### `src/datos/generos.ts` → menú de categorías

- `GET /libros?genero=<nombre del menú>` ya funciona tal cual: el parámetro `genero` busca en el género de la
  API **y** en las categorías del menú. `generoEnApi()` ya no es necesario (si se deja, sigue funcionando:
  "Misterio y thriller" → "Policial" devuelve lo mismo).
- `GET /libros/categorias` devuelve el menú completo (grupos Ficción, No ficción, Arte y Diseño, Bienestar,
  Negocios y las temáticas) con la cantidad de libros de cada uno. Hoy ninguna tiene 0.
- Subgéneros reales: `GET /libros/filtros` (`subgeneros`).

### `src/datos/libreros.ts` → libreros

| Dummy (`Librero`) | API (`GET /libreros/:id`) |
|---|---|
| `id` ("gregorio-samsa") | `slug` (se acepta en la URL: `/libreros/gregorio-samsa`) |
| `nombre`, `nombreCorto`, `etiquetas`, `cita` | Mismo nombre |
| `biografia`, `estilos` | Mismo nombre |
| `autores` | `autores` (también `autoresFavoritos`) |
| `indispensables` `{titulo, autor}` | `indispensables` `{titulo, autor, libroId, libro}` (`libro` trae la tarjeta si está en el catálogo) |
| `colecciones` `{titulo, descripcion, fecha}` | `colecciones` `{id, titulo, descripcion, fecha, libros[]}` (la más reciente primero; la 4.ª es la de "Ver más") |
| `ultimasRecomendaciones` `{titulo, autor}` | `ultimasRecomendaciones` `{libro, nota, fecha, librero}` |

Extras: `seguidores`, `siguiendo` (con token), `POST`/`DELETE /libreros/:id/seguir`.

### Home

| Sección | Endpoint |
|---|---|
| Más vendidos | `GET /libros?orden=mas_vendidos&limit=10` |
| Nuevos lanzamientos | `GET /libros?orden=novedades&limit=10` |
| Más comentados por la comunidad | `GET /libros?orden=mas_comentados&limit=10` |
| Mejor calificados | `GET /libros?orden=mejor_calificados&limit=10` |
| En oferta | `GET /libros?enOferta=true&orden=mayor_descuento` |
| Recomendados de nuestros libreros | `GET /recomendaciones/destacadas` |
| Carrusel de libreros | `GET /libreros` |
| Recomendaciones para ti (con sesión) | `GET /recomendaciones/para-mi` (sin datos del usuario, devuelve los más vendidos) |
| Newsletter | `POST /newsletter/suscripciones` `{ email }` |

### Ficha del libro

| Bloque | Endpoint |
|---|---|
| Datos, ficha técnica, precio con descuento | `GET /libros/:id` |
| Recomendación del librero ("quién lo recomienda") | `GET /libros/:id/recomendaciones-libreros` |
| Puntaje y reseñas | `GET /libros/:id/resenas` (trae `resumen.distribucion` por estrella; `?tipo=LECTOR` o `LIBRERO`) |
| Escribir reseña | `POST /libros/:id/resenas` (token) |
| "Lo que la comunidad también leyó" | `GET /libros/:id/relacionados` |
| Añadir a lista de deseos (corazón) | `POST`/`DELETE /listas-deseos/favoritos/libros/:libroId` |

### Registro e inicio de sesión

- Enviar `nombre` y `apellido` por separado, y `recibirNovedades` (la casilla ahora sí se guarda y suscribe al
  newsletter). Si se manda solo `nombre`, se guarda tal cual, como antes.
- Para el saludo usar `usuario.nombre`; para el nombre completo, `usuario.nombreCompleto`.
- `UsuarioResponseDto` trae `creadoEn` (el Front lo tipaba así) además de `fechaRegistro`.
- Guardar el `refreshToken` de la respuesta. Cuando una ruta privada responda `401 TOKEN_INVALIDO`, llamar a
  `POST /auth/refresh` `{ refreshToken }` y reintentar; si también falla, mandar al login.

### Correos (verificación y contraseña)

No hay proveedor de correo real: como el pago, el envío es **dummy** y cada correo queda en el log del servidor
(`docker compose logs api | grep correo_enviado`) con su enlace. Los enlaces apuntan a `FRONTEND_URL`:

| Correo | Ruta del Front que debe existir |
|---|---|
| Verificación | `/verificar-correo?token=...` → `POST /auth/verificar-email { token }` |
| Restablecer contraseña | `/restablecer-password?token=...` → `POST /auth/restablecer-password { token, password }` |
| Baja del newsletter | `/newsletter/baja?token=...` → `POST /newsletter/baja { token }` |
| Pedido de invitado | `/pedido-invitado?id=...&token=...` |

En desarrollo, con `EXPONER_TOKENS_DEV=true`, las respuestas incluyen el token (`tokenVerificacionDesarrollo`,
`tokenDesarrollo`) para probar sin bandeja de entrada. Nunca ocurre con `NODE_ENV=production`.

### Google y Facebook

El Front obtiene el token con el SDK de cada proveedor y lo envía; el Backend lo valida contra Google/Facebook
y nunca confía en datos del cliente:

- Google Identity Services → `POST /auth/google { idToken }` (el `credential` del botón).
- Facebook Login → `POST /auth/facebook { accessToken }` (con permiso `email`).

Responden igual que el login. Mientras el servidor no tenga `GOOGLE_CLIENT_ID` o `FACEBOOK_APP_ID` +
`FACEBOOK_APP_SECRET`, responden `503 PROVEEDOR_NO_CONFIGURADO` (el Front puede ocultar el botón).

### Código de descuento

1. `POST /cupones/validar { codigo, subtotal }` → muestra `descuento` y `subtotalConDescuento` (con token y sin
   `subtotal` usa el carrito).
2. `POST /pedidos { metodoEnvio, direccion?, codigoDescuento }` → el pedido trae `descuento` y
   `codigoDescuento`; `total = subtotal - descuento + costoEnvio`.

Cupones de prueba: `BIENVENIDA10` (10 %, uno por cliente), `LIBRERO15` (15 % desde $30.000),
`DESCUENTO5000` ($5.000 desde $20.000) y `VERANO2025` (vencido, para mostrar el error).
Errores: `CUPON_NO_ENCONTRADO` (404), `CUPON_VENCIDO`, `CUPON_AGOTADO`, `CUPON_MONTO_MINIMO`, `CUPON_YA_USADO` (422).

### Compra como invitado

1. `POST /pedidos/invitado { email, nombre, items: [{ libroId, cantidad }], metodoEnvio, direccion?, codigoDescuento? }`
   → `{ pedido, tokenPedido }`. El carrito del invitado vive en el Front.
2. Guardar `tokenPedido` y enviarlo en el header `X-Pedido-Token` para:
   `POST /pagos/invitado`, `GET /pedidos/invitado/:id`, `GET /pedidos/invitado/:id/seguimiento` y
   `POST /pedidos/invitado/:id/cancelar`.
3. Si después crea una cuenta con el mismo email y la verifica, sus pedidos de invitado pasan a "Mi cuenta".

### Cambios que exigen ajustar el Front

- **Reseñas, listas de deseos y club de lectura ahora requieren token para escribir** (antes eran públicas y se
  borraban al reiniciar). Leer reseñas, libreros y clubes sigue siendo público. El autor siempre es el usuario
  del token: `usuarioId` en el body se ignora.
- `GET /listas-deseos/usuario/:usuarioId` solo responde para la propia cuenta (o ADMIN); preferir
  `GET /listas-deseos`.

## Para la revisión: datos y stock

- Usuarios de prueba (contraseña de desarrollo en `db/02-seed.sql`): `cliente@`, `librero@` y `admin@leeconnos.cl`;
  los libreros de los wireframes `gregorio@`, `ana@`, `tyler@` y `clara@leeconnos.cl`; y los lectores que firman
  las reseñas, `lector1@` a `lector6@leeconnos.cl`.
- **Reponer el stock antes de la revisión:** con el usuario ADMIN, `POST /admin/reiniciar-stock` desde Swagger.
  Deja el stock como en los datos de prueba y cancela los pedidos pendientes de pago; no borra nada más.

## Desplegar en el servidor actual

La base del servidor ya tiene datos del Hito 2. Los scripts nuevos (`db/03` y `db/04`) son idempotentes y se
aplican sin borrar nada:

```bash
git pull
docker compose up -d --build
docker compose exec api node scripts/db-setup.js
```

Revisar en `.env` las variables nuevas (ver `.env.example`): `JWT_REFRESH_EXPIRES_IN`, `FRONTEND_URL`,
`EXPONER_TOKENS_DEV`, `GOOGLE_CLIENT_ID`, `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET` y `DOMINIO`.

### Activar HTTPS

Si la Web se publica con `https`, el navegador bloquea las llamadas a una API `http`. El perfil `https`
agrega Caddy delante de la API y obtiene el certificado de Let's Encrypt solo:

1. Sin dominio propio sirve [sslip.io](https://sslip.io): `3-131-220-134.sslip.io` resuelve a la IP del
   servidor. En `.env`: `DOMINIO=3-131-220-134.sslip.io`.
2. Abrir los puertos 80 y 443 en el firewall/grupo de seguridad del servidor.
3. `docker compose --profile https up -d`
4. La API queda en `https://3-131-220-134.sslip.io` (Swagger en `/docs`). Actualizar `VITE_API_URL` en la Web
   y `CORS_ORIGIN` en el `.env` de la API.

## Decisiones técnicas

- **Migraciones idempotentes.** `db/03-hito3-schema.sql` usa `ADD COLUMN IF NOT EXISTS` y bloques `DO` que
  revisan el catálogo de Postgres, así que corre igual sobre una base vacía (Docker) o sobre la del servidor.
  La separación de nombre y apellido se registra en `migraciones_aplicadas` para ejecutarse una sola vez.
- **Estadísticas desnormalizadas.** `calificacion`, `opiniones` y `ventas` viven en `libros` para poder ordenar
  y filtrar con índices; se recalculan al cambiar una reseña y al aprobar un pago.
- **Categorías del menú como dato.** La taxonomía de UX vive en la tabla `categorias` y cada libro tiene su
  arreglo `categorias`; cambiar el menú no exige tocar código.
- **Tokens de correo de un solo uso.** Se guardan como SHA-256, vencen (24 h verificación, 1 h contraseña) y
  "Olvidé mi contraseña" responde igual exista o no la cuenta.
- **Refresh token sin estado.** Es un JWT firmado con `typ: refresh`; el guard rechaza usarlo como token de
  acceso. Al renovar se relee el usuario, así que un cambio de rol aplica de inmediato.
- **Invitado sin cuenta fantasma.** El pedido guarda el email del invitado y un JWT propio (`typ: pedido-invitado`)
  reemplaza a la sesión solo para ese pedido.
- **Cupón dentro de la transacción del checkout**, con bloqueo de fila: dos compras simultáneas no pueden
  superar los usos máximos. Cancelar el pedido devuelve el uso.
- **Correo dummy detrás de `MailService`**, igual que el pago: cambiar a un proveedor real es reemplazar un
  método.

## Pruebas

`npm run test:e2e` corre 44 pruebas (23 del Hito 2 + 21 nuevas) contra PostgreSQL: catálogo enriquecido, cuenta
(apellido, newsletter, verificación, contraseña, refresh, acceso social), reseñas, libreros, recomendaciones,
listas de deseos, club de lectura, cupones, compra como invitado y reposición de stock. Al terminar reponen el
stock, así que se pueden correr varias veces seguidas.
