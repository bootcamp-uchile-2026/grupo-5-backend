# Hito 3 · Lo que agregó Backend

Este documento resume el trabajo de Backend en el Hito 3, en dos partes: lo que UX diseñó y la API no tenía
(rama `feature/hito3-backend-ux`, versión 0.3.0) y el **cierre del hito** frente al PDF de la entrega
(rama `feature/hito-3-backend`, versión 0.4.0, más abajo).

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
| Portadas de Papelucho y Desolación | Resuelto con portadas de otra edición en Open Library | Migración `DatosPruebaHito3` |
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

- Usuarios de prueba (contraseña de desarrollo en la migración `DatosPruebaIniciales`): `cliente@`, `librero@` y `admin@leeconnos.cl`;
  los libreros de los wireframes `gregorio@`, `ana@`, `tyler@` y `clara@leeconnos.cl`; y los lectores que firman
  las reseñas, `lector1@` a `lector6@leeconnos.cl`.
- **Reponer el stock antes de la revisión:** con el usuario ADMIN, `POST /admin/reiniciar-stock` desde Swagger.
  Deja el stock como en los datos de prueba y cancela los pedidos pendientes de pago; no borra nada más.

## Desplegar en el servidor

Desde la versión 0.4.0 el servidor ejecuta la imagen publicada en Docker Hub y se actualiza cambiando
`API_VERSION`; las migraciones se aplican al arrancar. El paso a paso, HTTPS incluido, está en
[`despliegue.md`](./despliegue.md).

## Decisiones técnicas

- **Migraciones idempotentes.** La migración `EsquemaHito3` (antes `db/03-hito3-schema.sql`) usa `ADD COLUMN IF NOT EXISTS` y bloques `DO` que
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

`npm run test:e2e` corre 59 pruebas contra PostgreSQL: las 23 del Hito 2, 21 de la primera parte del Hito 3
(catálogo enriquecido, cuenta, reseñas, libreros, recomendaciones, listas de deseos, club de lectura, cupones,
compra como invitado y reposición de stock) y 15 del cierre (migraciones, cookies, imágenes, direcciones,
preguntas al librero y filtros). Al terminar reponen el stock, así que se pueden correr varias veces seguidas.
Las mismas pruebas corren en GitHub Actions, contra una base vacía, antes de publicar cada imagen.

---

## Cierre del Hito 3 (versión 0.4.0)

Respuesta a la revisión del equipo del 11 de noviembre, que comparó el PDF del Hito 3 con lo publicado.

### Requisitos de Backend del PDF

| Requisito del PDF | Estado | Cómo se resolvió |
|---|---|---|
| Servicios para los flujos principales, conectados a la base | Cumple | 116 operaciones sobre PostgreSQL |
| DTO de entrada y salida, y validaciones de entrada | Cumple | `class-validator` en todos los DTO, `ValidationPipe` global |
| Validaciones que consultan la base con pipes | **Resuelto** | `LibroExistePipe` y `LibreroExistePipe` cargan la entidad o responden 404 antes de llegar al service |
| Respuestas y errores coherentes; Swagger actualizado | Cumple | `ErrorResponseDto` en todos los errores; Swagger muestra la versión |
| Modelo de datos y diagrama entidad-relación | **Resuelto** | [`modelo-datos.md`](./modelo-datos.md): las 24 tablas del dominio, con las del Hito 3 y el cierre |
| Integración con la base mediante TypeORM | Cumple | `synchronize: false` |
| Migraciones de TypeORM con los datos de prueba | **Resuelto** | 6 migraciones en `src/database/migrations`; se aplican al arrancar. Se eliminaron `db/*.sql` y `scripts/db-setup.js` |
| Subida de imágenes y servidor de archivos estáticos | **Resuelto** | `POST /imagenes`; archivos en `/uploads/*`, volumen Docker propio |
| Imágenes integradas con la administración de productos | **Resuelto** | `POST /libros/:id/portada`, `POST /libros/:id/galeria`, `GET /libros/:id/imagenes`, `DELETE /imagenes/:id` |
| Login, hashing, JWT, rutas protegidas, perfiles, 401/403 | Cumple | bcrypt, JWT con refresh, `@Roles`, guard global |
| Reglas de autorización en el registro | Cumple (verificado) | `POST /auth/registro` con `rol` distinto de CLIENTE responde 403; hay prueba e2e |
| Autenticación integrada con Frontend (cookies HttpOnly) | **Resuelto** | Cookies `lcn_access` y `lcn_refresh`, `POST /auth/logout`, CORS con credenciales y control de origen (CSRF) |
| Versión semántica en `package.json` | Cumple | `0.4.0` |
| Tags de Git para versiones estables | Pendiente del cierre | `v0.4.0` y `hito-3` sobre el commit de `main` |
| Imágenes Docker versionadas en Docker Hub | **Resuelto**, falta publicar | Workflow `docker-publish.yml` al subir el tag; requiere los secrets de Docker Hub |
| Actualizar el servidor cambiando la versión de la imagen | **Resuelto** | `docker-compose.yml` usa `image: ${DOCKERHUB_USUARIO}/leeconnos-backend:${API_VERSION}`, sin `build` |
| Contenedor de base de datos en el servidor | Cumple | `postgres:16-alpine` con volumen `pgdata` |
| Wiki actualizada | Pendiente | Ver "Pendiente" abajo |

### Pedidos de Frontend

| Pedido | Estado | Dónde |
|---|---|---|
| `POST /auth/logout` | Listo | Borra las cookies e invalida todos los refresh del usuario |
| Campos del despacho: RUT, ciudad, código postal | Listo, opcionales | `direccion.rut` (valida dígito verificador), `ciudad`, `codigoPostal` en `POST /pedidos` |
| Direcciones guardadas | Listo | `GET/POST/PATCH/DELETE /direcciones`; en el checkout `direccionId` y `guardarDireccion` |
| Pregunta al librero | Listo | `POST /libreros/:id/preguntas` (sin sesión); el librero lista y responde |
| Varias editoriales y subgéneros en `GET /libros` | Listo | `editoriales` y `subgeneros`, como `autores` |
| `GET /libros/filtros` con `q` y `genero` | Listo | Solo devuelve opciones con resultados |
| Datos de prueba: subgénero, video y galería | Listo | Los 75 libros tienen subgénero; Dune y Harry Potter tienen tráiler; 4 libros tienen galería |

### Decisiones técnicas del cierre

- **Las migraciones se aplican al arrancar.** Desplegar una versión nueva de la imagen deja la base al día sin
  entrar al servidor. `DB_MIGRAR_AL_INICIAR=false` las desactiva si se prefiere hacerlo a mano.
- **Cookies y Bearer conviven.** La Web usa las cookies HttpOnly; Mobile y Swagger siguen con
  `Authorization: Bearer`. El guard acepta cualquiera de los dos.
- **CSRF.** Con sesión por cookie, las peticiones que modifican datos solo se aceptan desde un origen de
  `CORS_ORIGIN`; las demás responden `403 ORIGEN_NO_PERMITIDO`.
- **Cerrar sesión invalida todos los refresh** del usuario con un contador (`version_sesion`), sin guardar cada
  token. El access token sigue siendo válido hasta que vence (2 h), pero la Web ya no lo tiene.
- **Las imágenes se validan por contenido**, no por la extensión ni el tipo que declara el cliente: se revisan
  los primeros bytes (JPG, PNG o WEBP) y se guardan con un nombre aleatorio.
- **El servidor no compila.** GitHub Actions corre las pruebas y publica la imagen solo si el tag coincide con
  `package.json`.

### Pendiente

- Configurar `DOCKERHUB_USERNAME` y `DOCKERHUB_TOKEN` en GitHub, crear el tag `v0.4.0` y desplegar la imagen.
- Demostrar el cambio de versión en el servidor (0.4.0 → 0.4.1) para el video.
- Activar HTTPS en el servidor; sin él, la sesión por cookie solo funciona con Web y API en el mismo sitio.
- Pasar esta documentación a la wiki del repositorio y eliminar las páginas duplicadas.
- Crear el tag `hito-3` y registrar su hash en la presentación.
