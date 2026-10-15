# Servicios de la API · Hito 3

La fuente oficial y siempre actualizada es Swagger (`/docs`). Este documento resume qué hay, en qué estado
está cada servicio y qué cambió respecto de los hitos anteriores, para coordinar con Web y Mobile.

> **Novedades del Hito 3:** ver la [sección 6](#6-novedades-del-hito-3) y la guía para el Front en
> [`hito3-backend.md`](./hito3-backend.md). Reseñas, listas de deseos, libreros y club de lectura ya no
> están en memoria (la sección 3 queda como referencia histórica).

**Autenticación.** Toda ruta exige `Authorization: Bearer <token>` salvo las marcadas como *Pública*.
El token se obtiene en `POST /auth/login` o `POST /auth/registro` y dura `JWT_EXPIRES_IN` (2 h por defecto).

## 1. Funcionales sobre PostgreSQL

### Auth y cuenta

| Método y ruta | Acceso | Qué hace |
|---|---|---|
| `POST /auth/registro` | Pública | Crea una cuenta CLIENTE y devuelve `{ accessToken, tokenType, expiresIn, usuario }` |
| `POST /auth/login` | Pública | Devuelve el mismo objeto. `401 CREDENCIALES_INVALIDAS` si falla |
| `GET /auth/me` | Token | Datos de la cuenta dueña del token |
| `GET /usuarios` | ADMIN | Lista de usuarios |
| `GET /usuarios/:id` | Dueño o ADMIN | Datos de una cuenta |
| `PATCH /usuarios/:id` | Dueño o ADMIN | Nombre, géneros favoritos, avatar, contraseña |
| `DELETE /usuarios/:id` | Dueño o ADMIN | Elimina la cuenta (`409` si tiene pedidos) |
| `POST /usuarios`, `POST /usuarios/login` | Pública | Rutas del Hito 1; equivalen a `/auth/registro` y `/auth/login` (marcadas *deprecated*) |

Las contraseñas se guardan con bcrypt y nunca se devuelven. El registro público solo crea cuentas CLIENTE.

### Catálogo

| Método y ruta | Acceso | Qué hace |
|---|---|---|
| `GET /libros` | Pública | Explorar, buscar y filtrar, paginado |
| `GET /libros/generos` | Pública | Géneros con su cantidad de libros |
| `GET /libros/:id` | Pública | Ficha de producto |
| `POST /libros` | LIBRERO o ADMIN | Agregar un libro |
| `POST /libros/importar-isbn` | LIBRERO o ADMIN | Crea el libro con datos de Open Library |
| `PATCH /libros/:id` | LIBRERO o ADMIN | Modificar precio, stock, estado, etc. |
| `DELETE /libros/:id` | LIBRERO o ADMIN | Retira el libro (borrado lógico) |

Parámetros de `GET /libros` (todos opcionales y combinables):

| Parámetro | Ejemplo | Regla |
|---|---|---|
| `q` | `asimov` | Busca en título, autor e ISBN. Mínimo 2 caracteres |
| `genero` | `Fantasía` | Coincidencia exacta, sin distinguir mayúsculas |
| `autor` | `Allende` | Coincidencia parcial |
| `formato` | `FISICO` · `EBOOK` · `AUDIOLIBRO` | |
| `estado` | `DISPONIBLE` · `PREVENTA` | |
| `precioMin`, `precioMax` | `5000`, `20000` | Enteros ≥ 0 (CLP) |
| `enStock` | `true` | Solo libros con stock |
| `orden` | `novedades` (defecto) · `precio_asc` · `precio_desc` · `titulo` | |
| `page`, `limit` | `1`, `12` | `limit` máximo 50 |

Respuesta: `{ items: Libro[], total, page, limit, totalPages }`.

### Carrito

El carrito es siempre el del usuario del token; no se envía `usuarioId`.

| Método y ruta | Qué hace |
|---|---|
| `GET /carrito` | Ítems con precio y stock vigentes, `totalItems` y `subtotal` |
| `POST /carrito/items` | `{ libroId, cantidad? }`. Suma si el libro ya estaba |
| `PATCH /carrito/items/:libroId` | `{ cantidad }`. Fija la cantidad |
| `DELETE /carrito/items/:libroId` | Quita el libro |
| `DELETE /carrito` | Vacía el carrito (`204`) |

Reglas: entre 1 y 10 unidades por libro y nunca más que el stock (`409 STOCK_INSUFICIENTE`).
Las cuatro primeras devuelven el carrito completo ya actualizado.

### Pedidos

| Método y ruta | Qué hace |
|---|---|
| `POST /pedidos` | Checkout: `{ metodoEnvio: "DESPACHO" \| "RETIRO", direccion? }` |
| `GET /pedidos` | Historial de compras del usuario |
| `GET /pedidos/:id` | Detalle (solo el dueño o ADMIN) |
| `POST /pedidos/:id/cancelar` | Cancela un pedido aún no pagado y devuelve el stock |

El checkout ocurre en una transacción: valida y descuenta stock, calcula el envío, guarda el precio de cada
libro en ese momento y vacía el carrito. `direccion` (`nombreReceptor`, `calle`, `comuna`, `region`, `telefono`)
es obligatoria si el método es `DESPACHO`.

Estados del pedido:

```
PENDIENTE_PAGO ──pago aprobado──▶ PAGADO
      └────────cancelar─────────▶ CANCELADO
```

### Recomendaciones

`GET /recomendaciones/usuario/:usuarioId?limite=5` (pública) mantiene la respuesta del Hito 1 (`libroId`, `titulo`,
`genero`, `score`, `motivo`) y el parámetro `limite` (10 por defecto), pero ahora se calcula con datos reales: 0.6 si el género es uno de los favoritos del usuario + 0.4 si ya compró
libros de ese género (pedidos pagados). Excluye lo ya comprado y lo que no tiene stock.

## 2. Dummy con reglas predecibles

No hay courier ni pasarela reales. Las respuestas dependen solo de los datos enviados, para poder demostrar
casos de éxito y de error a voluntad.

### Costo de envío — `POST /envios/cotizar` (pública)

Body: `{ metodoEnvio, region?, comuna?, subtotal }`. Es el mismo cálculo que usa el checkout.

| Caso | Resultado |
|---|---|
| `metodoEnvio: "RETIRO"` | $0, 1 día |
| Región `RM` | $2.990, 2 días |
| Regiones `XV`, `I`, `XI`, `XII` (zonas extremas) | $7.990, 7 días |
| Cualquier otra región | $4.990, 4 días |
| `subtotal` ≥ $40.000 (`ENVIO_GRATIS_DESDE`) | $0, `gratis: true` |
| Comuna `Isla de Pascua`, `Rapa Nui`, `Juan Fernández` o `Antártica` | **`422 ENVIO_SIN_COBERTURA`** |

### Pago — `POST /pagos`

Body: `{ pedidoId, metodo, numeroTarjeta, titular, vencimiento, cvv }`. **Solo tarjetas ficticias**: no se cobra
nada, y del número solo se guardan los últimos 4 dígitos.

| Tarjeta | Resultado |
|---|---|
| `4111111111111111` (o cualquiera que no calce abajo) | **`201`** `APROBADO`; el pedido pasa a `PAGADO` y recibe `codigoSeguimiento` |
| Termina en `0002` | **`402 PAGO_RECHAZADO`**, `detalles: ["FONDOS_INSUFICIENTES"]` |
| Termina en `0005` | **`402 PAGO_RECHAZADO`**, `detalles: ["TARJETA_BLOQUEADA"]` |
| `vencimiento` en el pasado (ej. `01/20`) | **`402 PAGO_RECHAZADO`**, `detalles: ["TARJETA_VENCIDA"]` |
| Termina en `0009` | **`502 PASARELA_NO_DISPONIBLE`** |
| Pedido ya pagado o cancelado | **`409 ESTADO_PEDIDO_INVALIDO`** |

Tras un rechazo el pedido sigue en `PENDIENTE_PAGO` y se puede reintentar.
`GET /pagos/pedido/:pedidoId` lista todos los intentos.

### Seguimiento — `GET /pedidos/:id/seguimiento`

La línea de tiempo se calcula desde la hora de pago: cada hito se cumple `SEGUIMIENTO_PASO_SEGUNDOS`
(60 s por defecto) después del anterior. La respuesta trae todos los hitos, con `completado: true/false`,
y `estadoActual` con el último cumplido.

| Caso | Hitos |
|---|---|
| Despacho | `CONFIRMADO` → `EN_PREPARACION` → `DESPACHADO` → `EN_REPARTO` → `ENTREGADO` |
| Retiro en tienda | `CONFIRMADO` → `EN_PREPARACION` → `LISTO_PARA_RETIRO` |
| La calle contiene `S/N` o `SIN NUMERO` | Igual que despacho, pero termina en **`ENTREGA_FALLIDA`** |
| Pedido cancelado | Un único hito `CANCELADO` |
| Pedido sin pagar | **`409 SEGUIMIENTO_NO_DISPONIBLE`** |

Para la demo, con el valor por defecto un despacho llega a `ENTREGADO` 4 minutos después de pagar.

## 3. En memoria, contrato congelado

Reseñas (`/resenas`), listas de deseos (`/listas-deseos`), libreros (`/libreros`) y club de lectura
(`/club-lectura`) son **el mismo código del Hito 1, sin cambios** en rutas, DTO ni respuestas. Lo único agregado
es `@Public()` en sus controllers, para que sigan funcionando sin token. Guardan los datos en memoria:
**se pierden al reiniciar la API**. No validan contra la base que los `usuarioId` o `libroId` existan.
Su paso a PostgreSQL y a rutas con token queda para el Hito 3.

## 4. Códigos de error

Todos responden con `ErrorResponseDto`: `{ statusCode, error, message, detalles?, timestamp, path, requestId }`.

| HTTP | `error` | Cuándo |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Body o query inválidos; `detalles` trae un mensaje por campo |
| 400 | `ID_INVALIDO` | Un id de la ruta no es UUID |
| 401 | `TOKEN_REQUERIDO` · `TOKEN_INVALIDO` · `CREDENCIALES_INVALIDAS` | |
| 402 | `PAGO_RECHAZADO` | El motivo viene en `detalles[0]` |
| 403 | `PERMISO_DENEGADO` | Rol insuficiente o recurso de otro usuario |
| 404 | `LIBRO_NO_ENCONTRADO` · `USUARIO_NO_ENCONTRADO` · `PEDIDO_NO_ENCONTRADO` · `ITEM_NO_ESTA_EN_CARRITO` · `ISBN_NO_ENCONTRADO` · `RECURSO_NO_ENCONTRADO` · `RUTA_NO_ENCONTRADA` | |
| 409 | `EMAIL_YA_REGISTRADO` · `ISBN_DUPLICADO` · `STOCK_INSUFICIENTE` · `CARRITO_VACIO` · `ESTADO_PEDIDO_INVALIDO` · `SEGUIMIENTO_NO_DISPONIBLE` · `RECURSO_EN_USO` | |
| 422 | `ENVIO_SIN_COBERTURA` | |
| 502 | `PASARELA_NO_DISPONIBLE` · `OPEN_LIBRARY_NO_DISPONIBLE` | |
| 500 | `ERROR_INTERNO` | Error no controlado; el detalle queda solo en los logs |

## 5. Cambios de contrato respecto del Hito 1

Web y Mobile deben revisar estos puntos:

| Antes (Hito 1) | Ahora (Hito 2) |
|---|---|
| Login devolvía un token simulado | JWT real. Las rutas privadas exigen `Authorization: Bearer` |
| `POST /usuarios` devolvía el usuario | Devuelve `{ accessToken, tokenType, expiresIn, usuario }`. Ruta nueva recomendada: `/auth/registro` |
| Se podía registrar cualquier `rol` | El registro público solo acepta `CLIENTE` |
| `GET /libros` devolvía un arreglo | Devuelve `{ items, total, page, limit, totalPages }` |
| Crear, editar y borrar libros era abierto | Requiere rol LIBRERO o ADMIN |
| `GET /usuarios` y `GET /usuarios/:id` eran abiertos | ADMIN, o el dueño de la cuenta |
| `POST /libros/importar-isbn` recibía `{ isbn }` y solo devolvía los metadatos | Recibe `{ isbn, precio, stock, genero? }` y **crea** el libro con los datos de Open Library |
| `Libro` no tenía `formato`, `estado` ni `fechaIngreso` | Campos nuevos en la respuesta, más `enStock`. `sinopsis` y `portadaUrl` se mantienen |
| `isbn` y `precio` aceptaban cualquier valor | `isbn` debe ser un ISBN válido y `precio` un entero mayor que 0 |
| `Usuario` se devolvía con `passwordHash` | La respuesta ya no lo incluye; se agrega `avatarUrl`. `fechaRegistro` se mantiene |
| Los ids de ruta aceptaban cualquier texto | En los módulos sobre PostgreSQL deben ser UUID (`400 ID_INVALIDO`) |
| `POST /recomendaciones/usuario/:id/compras` (compra simulada) | **Eliminado**: el historial sale de los pedidos pagados |
| Errores con el formato por defecto de NestJS | Formato único `ErrorResponseDto` con código estable |
| — | Nuevos: `/auth/*`, `/libros/generos`, `/carrito/*`, `/pedidos/*`, `/envios/cotizar`, `/pagos/*`, `/health` |

## 6. Novedades del Hito 3

### Auth y cuenta

| Método y ruta | Acceso | Qué hace |
|---|---|---|
| `POST /auth/registro` | Pública | Ahora acepta `apellido` y `recibirNovedades`, y envía el correo de verificación |
| `POST /auth/refresh` | Pública | `{ refreshToken }` → sesión nueva sin pedir la contraseña |
| `POST /auth/verificar-email` | Pública | `{ token }` del enlace del correo. Vincula los pedidos de invitado con ese email |
| `POST /auth/reenviar-verificacion` | Token | Reenvía el correo (`409 EMAIL_YA_VERIFICADO`) |
| `POST /auth/olvide-password` | Pública | Siempre `202`, exista o no la cuenta |
| `POST /auth/restablecer-password` | Pública | `{ token, password }` |
| `POST /auth/google` | Pública | `{ idToken }` de Google Identity Services. `503` sin `GOOGLE_CLIENT_ID` |
| `POST /auth/facebook` | Pública | `{ accessToken }` de Facebook Login. `503` sin `FACEBOOK_APP_ID`/`SECRET` |

Login y registro devuelven además `refreshToken` y `refreshExpiresIn`. El usuario trae `apellido`,
`nombreCompleto`, `recibirNovedades`, `emailVerificado`, `proveedorAuth` y `creadoEn`.

### Catálogo

Campos nuevos del libro: `calificacion`, `opiniones`, `ventas`, `precioAnterior`, `descuentoPorcentaje`,
`enOferta`, `subgenero`, `categorias`, `encuadernacion`, `paginas`, `dimensiones`, `etiquetas`, `videoUrl`,
`galeria` y `descripcion` (igual a `sinopsis`). Los LIBRERO/ADMIN los editan con `POST`/`PATCH /libros`
(`422 PRECIO_ANTERIOR_INVALIDO` si el precio anterior no es mayor que el actual).

| Parámetro nuevo de `GET /libros` | Ejemplo | Regla |
|---|---|---|
| `genero` | `Romance` | Ahora también acepta las categorías del menú de UX |
| `categoria` | `Clásicos` | Solo categorías del menú |
| `editorial` | `anagrama` | Coincidencia parcial |
| `subgenero` | `Novela negra` | Exacto |
| `autores` | `Allende,Cortázar` | Varios a la vez (o repitiendo el parámetro) |
| `etiquetas` | `Clásico,Chile` | Debe tener todas |
| `enOferta` | `true` | Solo con precio anterior |
| `calificacionMin` | `4` | 0 a 5 |
| `orden` | `mas_vendidos` | Además: `mejor_calificados`, `mas_comentados`, `mayor_descuento` |

| Método y ruta | Acceso | Qué hace |
|---|---|---|
| `GET /libros/categorias` | Pública | Menú de géneros y temáticas con la cantidad de libros |
| `GET /libros/filtros` | Pública | Editoriales, subgéneros, autores, etiquetas y rango de precios existentes |
| `GET /libros/:id/relacionados` | Pública | "Lo que la comunidad también leyó" |
| `GET /libros/:id/resenas` | Pública | Reseñas paginadas con resumen por estrella (`?tipo=LECTOR|LIBRERO`, `?soloVerificadas=true`) |
| `POST /libros/:id/resenas` | Token | Una por usuario; `verificada` si compró el libro (`409 RESENA_DUPLICADA`) |
| `GET /libros/:id/recomendaciones-libreros` | Pública | Notas de los libreros que lo recomiendan |

### Reseñas, libreros y recomendaciones

| Método y ruta | Acceso | Qué hace |
|---|---|---|
| `POST /resenas`, `GET /resenas/libro/:libroId` | Token / Pública | Rutas del Hito 1, ahora persistentes; el autor es el del token |
| `GET /resenas/mias` | Token | Mis reseñas |
| `PATCH`/`DELETE /resenas/:id` | Autor o ADMIN | Editar o borrar |
| `GET /libreros` | Pública | Libreros con seguidores |
| `GET /libreros/:id` | Pública (token opcional) | Perfil completo por uuid o slug (`gregorio-samsa`) |
| `GET /libreros/yo` | LIBRERO | Mi perfil |
| `POST /libreros` | ADMIN | Crear perfil para un usuario LIBRERO |
| `PATCH /libreros/:id` | Dueño o ADMIN | Editar perfil |
| `POST`/`DELETE /libreros/:id/seguir` | Token | Seguir / dejar de seguir |
| `GET`/`POST /libreros/:id/recomendaciones` | Pública / Dueño o ADMIN | Recomendaciones con nota (`destacada: true` las lleva al Home) |
| `DELETE /libreros/:id/recomendaciones/:libroId` | Dueño o ADMIN | Quitar recomendación |
| `POST /libreros/:id/colecciones` | Dueño o ADMIN | Publicar colección |
| `GET /recomendaciones/destacadas` | Pública | Recomendados de los libreros para el Home |
| `GET /recomendaciones/para-mi` | Token | Personalizadas (sin datos: los más vendidos) |

### Listas de deseos y club de lectura

Escribir requiere token; el dueño siempre es el usuario del token.

| Método y ruta | Acceso | Qué hace |
|---|---|---|
| `GET`/`POST /listas-deseos` | Token | Mis listas / crear |
| `GET /listas-deseos/favoritos` | Token | Lista "Favoritos" (se crea sola) |
| `POST`/`DELETE /listas-deseos/favoritos/libros/:libroId` | Token | Botón corazón |
| `GET`/`PATCH`/`DELETE /listas-deseos/:id`, `POST /:id/libros`, `DELETE /:id/libros/:libroId` | Dueño o ADMIN | Igual que en el Hito 1 |
| `GET /club-lectura`, `GET /club-lectura/:id`, `GET /:id/hilos`, `GET /hilos/:id/comentarios`, `GET /:id/progreso` | Pública | Leer |
| `POST /club-lectura` | Token | Crear club (el creador queda unido) |
| `POST`/`DELETE /club-lectura/:id/unirse` | Token | Unirse / salir |
| `POST /club-lectura/:id/hilos`, `POST /hilos/:id/comentarios`, `PUT /:id/progreso` | Participante | `403 NO_ES_PARTICIPANTE` si no se unió |

### Cupones, newsletter, invitado y administración

| Método y ruta | Acceso | Qué hace |
|---|---|---|
| `POST /cupones/validar` | Pública (token opcional) | Calcula el descuento sin consumir el cupón |
| `GET`/`POST /cupones`, `PATCH /cupones/:codigo` | ADMIN | Administrar cupones |
| `POST /pedidos` | Token | Acepta `codigoDescuento`; el pedido trae `descuento` y `codigoDescuento` |
| `POST /pedidos/invitado` | Pública | Checkout sin cuenta → `{ pedido, tokenPedido }` |
| `GET /pedidos/invitado/:id`, `POST /pedidos/invitado/:id/cancelar`, `GET /pedidos/invitado/:id/seguimiento` | Header `X-Pedido-Token` | Consultar, cancelar y seguir |
| `POST /pagos/invitado` | Header `X-Pedido-Token` | Pagar (mismas tarjetas dummy que `POST /pagos`) |
| `POST /newsletter/suscripciones` | Pública | Suscribirse (idempotente) |
| `POST /newsletter/baja` | Pública | `{ token }` del enlace del correo |
| `GET /newsletter/suscripciones` | ADMIN | Suscripciones activas |
| `POST /admin/reiniciar-stock` | ADMIN | Repone el stock de prueba y cancela pedidos pendientes |

Las ventas de cada libro (`ventas`) aumentan cuando se aprueba un pago.

### Códigos de error nuevos

| Código | HTTP | Cuándo |
|---|---|---|
| `PRECIO_ANTERIOR_INVALIDO` | 422 | El precio anterior no es mayor que el precio |
| `RESENA_NO_ENCONTRADA` / `RESENA_DUPLICADA` | 404 / 409 | Reseñas |
| `LIBRERO_NO_ENCONTRADO` / `LIBRERO_YA_TIENE_PERFIL` | 404 / 409 | Libreros |
| `LISTA_NO_ENCONTRADA` | 404 | Listas de deseos |
| `CLUB_NO_ENCONTRADO` / `HILO_NO_ENCONTRADO` / `NO_ES_PARTICIPANTE` | 404 / 404 / 403 | Club de lectura |
| `CUPON_NO_ENCONTRADO` | 404 | Código inexistente o desactivado |
| `CUPON_VENCIDO` / `CUPON_AGOTADO` / `CUPON_MONTO_MINIMO` / `CUPON_YA_USADO` | 422 | Cupón no aplicable |
| `CUPON_DUPLICADO` | 409 | Crear un código existente |
| `TOKEN_CUENTA_INVALIDO` | 400 | Enlace de correo inválido, usado o vencido |
| `EMAIL_YA_VERIFICADO` | 409 | Reenviar verificación de una cuenta verificada |
| `TOKEN_PROVEEDOR_INVALIDO` | 401 | Google/Facebook no validó el token |
| `PROVEEDOR_NO_DISPONIBLE` | 502 | Google/Facebook no respondió |
| `PROVEEDOR_NO_CONFIGURADO` | 503 | Faltan las credenciales del proveedor en el servidor |
| `TOKEN_PEDIDO_INVALIDO` | 401 | Falta o es inválido `X-Pedido-Token` |
