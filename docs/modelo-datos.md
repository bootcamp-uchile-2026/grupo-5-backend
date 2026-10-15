# Modelo de datos · primera versión (Hito 2)

Motor: PostgreSQL 16. La estructura se crea con [`db/01-schema.sql`](../db/01-schema.sql) y los datos de
prueba con [`db/02-seed.sql`](../db/02-seed.sql). El ORM (TypeORM) nunca modifica la estructura (`synchronize: false`).

## Diagrama entidad-relación

```mermaid
erDiagram
    USUARIOS ||--o{ CARRITO_ITEMS : "tiene en su carrito"
    LIBROS   ||--o{ CARRITO_ITEMS : "está en"
    USUARIOS ||--o{ PEDIDOS       : "realiza"
    PEDIDOS  ||--|{ PEDIDO_ITEMS  : "contiene"
    LIBROS   ||--o{ PEDIDO_ITEMS  : "se vendió en"
    PEDIDOS  ||--o{ PAGOS         : "recibe intentos de"

    USUARIOS {
        uuid        id PK
        varchar     nombre
        varchar     email UK
        varchar     password_hash "bcrypt"
        varchar     rol "CLIENTE | LIBRERO | ADMIN"
        text_array  generos_favoritos
        text        avatar_url "opcional"
        timestamptz creado_en
        timestamptz actualizado_en
    }
    LIBROS {
        uuid        id PK
        varchar     isbn UK
        varchar     titulo
        varchar     autor
        varchar     genero
        text        descripcion "opcional"
        varchar     editorial "opcional"
        int         anio_publicacion "opcional"
        varchar     formato "FISICO | EBOOK | AUDIOLIBRO"
        varchar     estado "DISPONIBLE | PREVENTA"
        int         precio "CLP, mayor que 0"
        int         stock "mayor o igual a 0"
        text        portada_url "opcional"
        boolean     activo "borrado lógico"
        timestamptz fecha_ingreso
    }
    CARRITO_ITEMS {
        uuid        usuario_id PK, FK
        uuid        libro_id PK, FK
        int         cantidad "1 a 10"
        timestamptz agregado_en
    }
    PEDIDOS {
        uuid        id PK
        serial      numero UK "se muestra como LCN-000123"
        uuid        usuario_id FK
        varchar     estado "PENDIENTE_PAGO | PAGADO | CANCELADO"
        varchar     metodo_envio "DESPACHO | RETIRO"
        int         subtotal
        int         costo_envio
        int         total "subtotal + costo_envio"
        int         dias_estimados
        varchar     dir_receptor "null si es RETIRO"
        varchar     dir_calle
        varchar     dir_comuna
        varchar     dir_region
        varchar     dir_telefono
        varchar     codigo_seguimiento "se asigna al pagar"
        timestamptz creado_en
        timestamptz pagado_en
        timestamptz cancelado_en
    }
    PEDIDO_ITEMS {
        uuid    id PK
        uuid    pedido_id FK
        uuid    libro_id FK
        varchar titulo "copia al momento de comprar"
        int     precio_unitario "copia al momento de comprar"
        int     cantidad
        int     subtotal "precio_unitario x cantidad"
    }
    PAGOS {
        uuid        id PK
        uuid        pedido_id FK
        int         monto
        varchar     metodo "TARJETA_CREDITO | TARJETA_DEBITO"
        varchar     estado "APROBADO | RECHAZADO"
        char        ultimos4
        varchar     codigo_autorizacion "si fue aprobado"
        varchar     motivo_rechazo "si fue rechazado"
        timestamptz creado_en
    }
```

## Decisiones

| Decisión | Motivo |
|---|---|
| Identificadores UUID | No exponen cuántos usuarios o pedidos existen y los puede generar cualquier capa |
| Dinero como `INTEGER` en CLP | El peso chileno no tiene decimales: se evitan errores de redondeo |
| El carrito no tiene tabla propia | Un usuario tiene un solo carrito: basta `carrito_items` con llave `(usuario_id, libro_id)` |
| `pedido_items` copia título y precio | El pedido debe mostrar lo que se cobró aunque el catálogo cambie después |
| El stock se descuenta al crear el pedido | Reserva las unidades mientras se paga; cancelar las devuelve |
| Dirección dentro de `pedidos` | Todavía no hay libreta de direcciones. Si UX/UI la define, pasa a una tabla propia |
| Borrado lógico de libros (`activo`) | Los pedidos históricos siguen apuntando al libro |
| Restricciones `CHECK` | La base rechaza por sí sola stock negativo, totales que no cuadran o estados inexistentes |
| Índice único parcial en `pagos` | Garantiza a nivel de base que un pedido tenga a lo más un pago aprobado |
| `pagos` no guarda número de tarjeta ni CVV | Solo los últimos 4 dígitos, aunque la pasarela sea ficticia |

## Fuera de la base por ahora

Reseñas, listas de deseos, perfiles de librero y club de lectura siguen en memoria en este hito.
Su modelado en PostgreSQL (con llaves foráneas a `usuarios` y `libros`) queda para el Hito 3.

## Tablas agregadas en el Hito 3

Definidas en `db/03-hito3-schema.sql` (idempotente; también migra una base del Hito 2 con datos).

| Tabla | Para qué |
|---|---|
| `categorias` | Menú de UX: géneros (agrupados en Ficción, No ficción, ...) y temáticas |
| `resenas` | Reseñas de lectores y libreros (una por usuario y libro; `verificada` si lo compró) |
| `libreros`, `librero_seguidores` | Perfiles editoriales (slug, biografía, top 5 en JSONB) y sus seguidores |
| `recomendaciones_librero`, `colecciones` | Libros recomendados con nota (los `destacada` van al Home) y colecciones |
| `listas_deseos`, `lista_deseos_libros` | Listas de deseos; una por usuario es la de "Favoritos" |
| `clubes_lectura`, `club_participantes`, `club_hilos`, `club_comentarios` | Club de lectura y progreso de cada participante |
| `cupones` | Códigos de descuento (porcentaje o monto fijo, vigencia, mínimo y usos) |
| `suscripciones_newsletter` | Emails suscritos y token de baja |
| `tokens_usuario` | SHA-256 de los tokens de verificación de correo y recuperación de contraseña |
| `migraciones_aplicadas` | Migraciones de datos que deben correr una sola vez |

Columnas nuevas:

- `usuarios`: `apellido`, `recibir_novedades`, `email_verificado`, `proveedor_auth`, `proveedor_id`;
  `password_hash` pasa a ser opcional (cuentas de Google/Facebook).
- `libros`: `precio_anterior` (mayor que `precio`), `subgenero`, `encuadernacion`, `paginas`, `dimensiones`,
  `etiquetas`, `categorias`, `video_url`, `galeria` y las estadísticas desnormalizadas `calificacion`,
  `opiniones` y `ventas`.
- `pedidos`: `descuento`, `codigo_descuento`, `invitado_email`, `invitado_nombre`; `usuario_id` pasa a ser
  opcional y la regla del total queda `total = subtotal - descuento + costo_envio`.
