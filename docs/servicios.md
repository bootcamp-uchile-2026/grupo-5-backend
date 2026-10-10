# Servicios de la API · Hito 2

La fuente oficial y siempre actualizada es Swagger (`/docs`). Este documento resume qué hay, en qué estado
está cada servicio y qué cambió respecto del Hito 1, para coordinar con Web y Mobile.

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
