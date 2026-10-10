-- LeeConNos · Hito 2 · Estructura inicial de la base de datos (PostgreSQL 13+)
-- Se ejecuta sola la primera vez que arranca el contenedor de Postgres
-- (docker-entrypoint-initdb.d) o a mano con: npm run db:setup
-- Es idempotente: se puede volver a ejecutar sin perder datos.

CREATE TABLE IF NOT EXISTS usuarios (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre            VARCHAR(80)  NOT NULL,
  email             VARCHAR(254) NOT NULL UNIQUE,
  password_hash     VARCHAR(100) NOT NULL,
  rol               VARCHAR(20)  NOT NULL DEFAULT 'CLIENTE'
                    CHECK (rol IN ('CLIENTE', 'LIBRERO', 'ADMIN')),
  generos_favoritos TEXT[]       NOT NULL DEFAULT '{}',
  avatar_url        TEXT,
  creado_en         TIMESTAMPTZ  NOT NULL DEFAULT now(),
  actualizado_en    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS libros (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  isbn             VARCHAR(13)  NOT NULL UNIQUE,
  titulo           VARCHAR(200) NOT NULL,
  autor            VARCHAR(120) NOT NULL,
  genero           VARCHAR(60)  NOT NULL,
  descripcion      TEXT,
  editorial        VARCHAR(120),
  anio_publicacion INTEGER,
  formato          VARCHAR(20)  NOT NULL DEFAULT 'FISICO'
                   CHECK (formato IN ('FISICO', 'EBOOK', 'AUDIOLIBRO')),
  estado           VARCHAR(20)  NOT NULL DEFAULT 'DISPONIBLE'
                   CHECK (estado IN ('DISPONIBLE', 'PREVENTA')),
  precio           INTEGER      NOT NULL CHECK (precio > 0),   -- CLP, sin decimales
  stock            INTEGER      NOT NULL DEFAULT 0 CHECK (stock >= 0),
  portada_url      TEXT,
  activo           BOOLEAN      NOT NULL DEFAULT TRUE,          -- borrado lógico
  fecha_ingreso    TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_libros_genero        ON libros (LOWER(genero));
CREATE INDEX IF NOT EXISTS idx_libros_precio        ON libros (precio);
CREATE INDEX IF NOT EXISTS idx_libros_fecha_ingreso ON libros (fecha_ingreso DESC);

-- El carrito de un usuario son sus filas en esta tabla.
CREATE TABLE IF NOT EXISTS carrito_items (
  usuario_id  UUID        NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  libro_id    UUID        NOT NULL REFERENCES libros (id)   ON DELETE CASCADE,
  cantidad    INTEGER     NOT NULL CHECK (cantidad BETWEEN 1 AND 10),
  agregado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (usuario_id, libro_id)
);

CREATE TABLE IF NOT EXISTS pedidos (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  numero             SERIAL      NOT NULL UNIQUE,               -- se muestra como LCN-000123
  usuario_id         UUID        NOT NULL REFERENCES usuarios (id),
  estado             VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE_PAGO'
                     CHECK (estado IN ('PENDIENTE_PAGO', 'PAGADO', 'CANCELADO')),
  metodo_envio       VARCHAR(20) NOT NULL CHECK (metodo_envio IN ('DESPACHO', 'RETIRO')),
  subtotal           INTEGER     NOT NULL CHECK (subtotal >= 0),
  costo_envio        INTEGER     NOT NULL CHECK (costo_envio >= 0),
  total              INTEGER     NOT NULL CHECK (total = subtotal + costo_envio),
  dias_estimados     INTEGER     NOT NULL,
  dir_receptor       VARCHAR(80),
  dir_calle          VARCHAR(120),
  dir_comuna         VARCHAR(60),
  dir_region         VARCHAR(5),
  dir_telefono       VARCHAR(15),
  codigo_seguimiento VARCHAR(20),
  creado_en          TIMESTAMPTZ NOT NULL DEFAULT now(),
  pagado_en          TIMESTAMPTZ,
  cancelado_en       TIMESTAMPTZ,
  -- Un despacho siempre lleva dirección.
  CHECK (metodo_envio = 'RETIRO' OR dir_calle IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_pedidos_usuario ON pedidos (usuario_id, creado_en DESC);

-- Foto del libro al momento de la compra: el precio no cambia aunque cambie el catálogo.
CREATE TABLE IF NOT EXISTS pedido_items (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id       UUID         NOT NULL REFERENCES pedidos (id) ON DELETE CASCADE,
  libro_id        UUID         NOT NULL REFERENCES libros (id),
  titulo          VARCHAR(200) NOT NULL,
  precio_unitario INTEGER      NOT NULL CHECK (precio_unitario > 0),
  cantidad        INTEGER      NOT NULL CHECK (cantidad > 0),
  subtotal        INTEGER      NOT NULL CHECK (subtotal = precio_unitario * cantidad)
);
CREATE INDEX IF NOT EXISTS idx_pedido_items_pedido ON pedido_items (pedido_id);

-- Intentos de pago (pasarela dummy). Nunca se guarda el número completo ni el CVV.
CREATE TABLE IF NOT EXISTS pagos (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id           UUID        NOT NULL REFERENCES pedidos (id) ON DELETE CASCADE,
  monto               INTEGER     NOT NULL CHECK (monto >= 0),
  metodo              VARCHAR(20) NOT NULL CHECK (metodo IN ('TARJETA_CREDITO', 'TARJETA_DEBITO')),
  estado              VARCHAR(20) NOT NULL CHECK (estado IN ('APROBADO', 'RECHAZADO')),
  ultimos4            CHAR(4)     NOT NULL,
  codigo_autorizacion VARCHAR(20),
  motivo_rechazo      VARCHAR(40),
  creado_en           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pagos_pedido ON pagos (pedido_id);
-- Un pedido tiene a lo más un pago aprobado.
CREATE UNIQUE INDEX IF NOT EXISTS uq_pagos_aprobado_por_pedido ON pagos (pedido_id) WHERE estado = 'APROBADO';
