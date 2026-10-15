-- LeeConNos · Hito 3 · Cambios de estructura
-- Completa lo que UX diseñó y la API no tenía: ficha enriquecida, categorías del
-- menú, reseñas, libreros, listas de deseos y club de lectura persistentes,
-- cupones, newsletter, compra como invitado, verificación de correo,
-- recuperación de contraseña y acceso con Google/Facebook.
--
-- Es idempotente: se puede volver a ejecutar sobre una base del Hito 2 con datos
-- (npm run db:setup) sin perder información.

-- Registro de migraciones de datos que deben correr una sola vez.
CREATE TABLE IF NOT EXISTS migraciones_aplicadas (
  version     VARCHAR(60) PRIMARY KEY,
  aplicada_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------- usuarios
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS apellido          VARCHAR(80);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS recibir_novedades BOOLEAN     NOT NULL DEFAULT FALSE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS email_verificado  BOOLEAN     NOT NULL DEFAULT FALSE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS proveedor_auth    VARCHAR(20) NOT NULL DEFAULT 'LOCAL';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS proveedor_id      VARCHAR(120);
-- Las cuentas creadas con Google/Facebook no tienen contraseña propia.
ALTER TABLE usuarios ALTER COLUMN password_hash DROP NOT NULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'usuarios_proveedor_auth_check') THEN
    ALTER TABLE usuarios ADD CONSTRAINT usuarios_proveedor_auth_check
      CHECK (proveedor_auth IN ('LOCAL', 'GOOGLE', 'FACEBOOK'));
  END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS uq_usuarios_proveedor
  ON usuarios (proveedor_auth, proveedor_id) WHERE proveedor_id IS NOT NULL;

-- Hasta el Hito 2 nombre y apellido se guardaban juntos en "nombre". Se separan
-- una sola vez: la primera palabra queda como nombre y el resto como apellido.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM migraciones_aplicadas WHERE version = '03-separar-apellido') THEN
    UPDATE usuarios
       SET apellido = btrim(substring(btrim(nombre) FROM position(' ' IN btrim(nombre)) + 1)),
           nombre   = split_part(btrim(nombre), ' ', 1)
     WHERE apellido IS NULL AND position(' ' IN btrim(nombre)) > 0;
    -- Las cuentas que ya existían se consideran verificadas.
    UPDATE usuarios SET email_verificado = TRUE;
    INSERT INTO migraciones_aplicadas (version) VALUES ('03-separar-apellido');
  END IF;
END $$;

-- Tokens de un solo uso (verificación de correo y recuperación de contraseña).
-- Se guarda el SHA-256 del token, nunca el token en claro.
CREATE TABLE IF NOT EXISTS tokens_usuario (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  UUID        NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  tipo        VARCHAR(30) NOT NULL CHECK (tipo IN ('VERIFICACION_EMAIL', 'RECUPERACION_PASSWORD')),
  token_hash  CHAR(64)    NOT NULL UNIQUE,
  expira_en   TIMESTAMPTZ NOT NULL,
  usado_en    TIMESTAMPTZ,
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tokens_usuario ON tokens_usuario (usuario_id, tipo);

-- ------------------------------------------------------------------ libros
ALTER TABLE libros ADD COLUMN IF NOT EXISTS precio_anterior INTEGER;
ALTER TABLE libros ADD COLUMN IF NOT EXISTS subgenero       VARCHAR(60);
ALTER TABLE libros ADD COLUMN IF NOT EXISTS encuadernacion  VARCHAR(40);
ALTER TABLE libros ADD COLUMN IF NOT EXISTS paginas         INTEGER;
ALTER TABLE libros ADD COLUMN IF NOT EXISTS dimensiones     VARCHAR(40);
ALTER TABLE libros ADD COLUMN IF NOT EXISTS etiquetas       TEXT[]       NOT NULL DEFAULT '{}';
-- Géneros y temáticas del menú de UX a los que pertenece (ver tabla categorias).
ALTER TABLE libros ADD COLUMN IF NOT EXISTS categorias      TEXT[]       NOT NULL DEFAULT '{}';
ALTER TABLE libros ADD COLUMN IF NOT EXISTS video_url       TEXT;
ALTER TABLE libros ADD COLUMN IF NOT EXISTS galeria         TEXT[]       NOT NULL DEFAULT '{}';
-- Estadísticas desnormalizadas para ordenar y filtrar rápido. La API las
-- recalcula al crear/editar/borrar reseñas y al aprobar un pago.
ALTER TABLE libros ADD COLUMN IF NOT EXISTS calificacion    NUMERIC(2,1) NOT NULL DEFAULT 0;
ALTER TABLE libros ADD COLUMN IF NOT EXISTS opiniones       INTEGER      NOT NULL DEFAULT 0;
ALTER TABLE libros ADD COLUMN IF NOT EXISTS ventas          INTEGER      NOT NULL DEFAULT 0;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'libros_precio_anterior_check') THEN
    -- Un precio anterior solo tiene sentido si es mayor que el actual (descuento).
    ALTER TABLE libros ADD CONSTRAINT libros_precio_anterior_check
      CHECK (precio_anterior IS NULL OR precio_anterior > precio);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'libros_paginas_check') THEN
    ALTER TABLE libros ADD CONSTRAINT libros_paginas_check CHECK (paginas IS NULL OR paginas > 0);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_libros_editorial  ON libros (LOWER(editorial));
CREATE INDEX IF NOT EXISTS idx_libros_subgenero  ON libros (LOWER(subgenero));
CREATE INDEX IF NOT EXISTS idx_libros_etiquetas  ON libros USING GIN (etiquetas);
CREATE INDEX IF NOT EXISTS idx_libros_categorias ON libros USING GIN (categorias);
CREATE INDEX IF NOT EXISTS idx_libros_ventas     ON libros (ventas DESC);

-- Menú de UX: géneros (agrupados en Ficción, No ficción, ...) y temáticas.
CREATE TABLE IF NOT EXISTS categorias (
  nombre VARCHAR(60) PRIMARY KEY,
  tipo   VARCHAR(20) NOT NULL CHECK (tipo IN ('GENERO', 'TEMATICA')),
  grupo  VARCHAR(60) NOT NULL,
  orden  INTEGER     NOT NULL DEFAULT 0
);

-- ----------------------------------------------------------------- reseñas
CREATE TABLE IF NOT EXISTS resenas (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  libro_id       UUID        NOT NULL REFERENCES libros (id)   ON DELETE CASCADE,
  usuario_id     UUID        NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  -- LIBRERO si quien la escribe tiene ese rol; LECTOR en cualquier otro caso.
  tipo           VARCHAR(10) NOT NULL DEFAULT 'LECTOR' CHECK (tipo IN ('LECTOR', 'LIBRERO')),
  calificacion   INTEGER     NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
  titulo         VARCHAR(120),
  comentario     TEXT        NOT NULL,
  -- true si el autor tiene un pedido PAGADO que incluye el libro ("compra verificada").
  verificada     BOOLEAN     NOT NULL DEFAULT FALSE,
  creado_en      TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (libro_id, usuario_id)
);
CREATE INDEX IF NOT EXISTS idx_resenas_libro ON resenas (libro_id, creado_en DESC);

-- ---------------------------------------------------------------- libreros
CREATE TABLE IF NOT EXISTS libreros (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id        UUID         UNIQUE REFERENCES usuarios (id) ON DELETE SET NULL,
  slug              VARCHAR(80)  NOT NULL UNIQUE,   -- id legible para la URL: "gregorio-samsa"
  nombre            VARCHAR(120) NOT NULL,
  nombre_corto      VARCHAR(60)  NOT NULL,
  cita              TEXT,
  biografia         TEXT         NOT NULL,
  foto_url          TEXT,
  etiquetas         TEXT[]       NOT NULL DEFAULT '{}',
  estilos           TEXT[]       NOT NULL DEFAULT '{}',
  autores_favoritos TEXT[]       NOT NULL DEFAULT '{}',
  -- Top 5: [{ "titulo": "...", "autor": "...", "libroId": "uuid" | null }]
  indispensables    JSONB        NOT NULL DEFAULT '[]',
  activo            BOOLEAN      NOT NULL DEFAULT TRUE,
  creado_en         TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS librero_seguidores (
  librero_id UUID        NOT NULL REFERENCES libreros (id) ON DELETE CASCADE,
  usuario_id UUID        NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  creado_en  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (librero_id, usuario_id)
);

-- Recomendación de un libro del catálogo con la nota personal del librero.
-- "destacada" la muestra en el Home; se ve también en la ficha del libro.
CREATE TABLE IF NOT EXISTS recomendaciones_librero (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  librero_id UUID        NOT NULL REFERENCES libreros (id) ON DELETE CASCADE,
  libro_id   UUID        NOT NULL REFERENCES libros (id)   ON DELETE CASCADE,
  nota       TEXT        NOT NULL,
  destacada  BOOLEAN     NOT NULL DEFAULT FALSE,
  orden      INTEGER     NOT NULL DEFAULT 0,
  creado_en  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (librero_id, libro_id)
);
CREATE INDEX IF NOT EXISTS idx_recomendaciones_libro ON recomendaciones_librero (libro_id);

CREATE TABLE IF NOT EXISTS colecciones (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  librero_id   UUID         NOT NULL REFERENCES libreros (id) ON DELETE CASCADE,
  titulo       VARCHAR(150) NOT NULL,
  descripcion  TEXT,
  publicada_en DATE         NOT NULL DEFAULT CURRENT_DATE,
  libros       UUID[]       NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_colecciones_librero ON colecciones (librero_id, publicada_en DESC);

-- -------------------------------------------------------- listas de deseos
CREATE TABLE IF NOT EXISTS listas_deseos (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id     UUID        NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  nombre         VARCHAR(80) NOT NULL,
  es_para_regalo BOOLEAN     NOT NULL DEFAULT FALSE,
  -- La lista "Favoritos" se crea sola la primera vez que se marca un libro.
  es_favoritos   BOOLEAN     NOT NULL DEFAULT FALSE,
  creado_en      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_listas_usuario ON listas_deseos (usuario_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_listas_favoritos ON listas_deseos (usuario_id) WHERE es_favoritos;

CREATE TABLE IF NOT EXISTS lista_deseos_libros (
  lista_id    UUID        NOT NULL REFERENCES listas_deseos (id) ON DELETE CASCADE,
  libro_id    UUID        NOT NULL REFERENCES libros (id)        ON DELETE CASCADE,
  agregado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (lista_id, libro_id)
);

-- --------------------------------------------------------- club de lectura
CREATE TABLE IF NOT EXISTS clubes_lectura (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  libro_id     UUID         NOT NULL REFERENCES libros (id),
  creador_id   UUID         REFERENCES usuarios (id) ON DELETE SET NULL,
  titulo       VARCHAR(150) NOT NULL,
  descripcion  TEXT,
  fecha_inicio DATE         NOT NULL,
  fecha_fin    DATE,
  creado_en    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio)
);

-- Un participante y su progreso de lectura en el club.
CREATE TABLE IF NOT EXISTS club_participantes (
  club_id        UUID        NOT NULL REFERENCES clubes_lectura (id) ON DELETE CASCADE,
  usuario_id     UUID        NOT NULL REFERENCES usuarios (id)       ON DELETE CASCADE,
  pagina_actual  INTEGER     NOT NULL DEFAULT 0 CHECK (pagina_actual >= 0),
  porcentaje     INTEGER     NOT NULL DEFAULT 0 CHECK (porcentaje BETWEEN 0 AND 100),
  unido_en       TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (club_id, usuario_id)
);

CREATE TABLE IF NOT EXISTS club_hilos (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id    UUID         NOT NULL REFERENCES clubes_lectura (id) ON DELETE CASCADE,
  usuario_id UUID         NOT NULL REFERENCES usuarios (id)       ON DELETE CASCADE,
  titulo     VARCHAR(150) NOT NULL,
  contenido  TEXT         NOT NULL,
  creado_en  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_club_hilos_club ON club_hilos (club_id, creado_en DESC);

CREATE TABLE IF NOT EXISTS club_comentarios (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  hilo_id    UUID        NOT NULL REFERENCES club_hilos (id) ON DELETE CASCADE,
  usuario_id UUID        NOT NULL REFERENCES usuarios (id)   ON DELETE CASCADE,
  contenido  TEXT        NOT NULL,
  creado_en  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_club_comentarios_hilo ON club_comentarios (hilo_id, creado_en);

-- ----------------------------------------------------- cupones de descuento
CREATE TABLE IF NOT EXISTS cupones (
  codigo             VARCHAR(30) PRIMARY KEY,            -- siempre en mayúsculas
  descripcion        VARCHAR(150),
  tipo               VARCHAR(20) NOT NULL CHECK (tipo IN ('PORCENTAJE', 'MONTO_FIJO')),
  valor              INTEGER     NOT NULL CHECK (valor > 0),
  monto_minimo       INTEGER     NOT NULL DEFAULT 0 CHECK (monto_minimo >= 0),
  usos_maximos       INTEGER     CHECK (usos_maximos IS NULL OR usos_maximos >= 0),
  usos               INTEGER     NOT NULL DEFAULT 0 CHECK (usos >= 0),
  un_uso_por_usuario BOOLEAN     NOT NULL DEFAULT FALSE,
  vigente_desde      TIMESTAMPTZ NOT NULL DEFAULT now(),
  vigente_hasta      TIMESTAMPTZ,
  activo             BOOLEAN     NOT NULL DEFAULT TRUE,
  CHECK (tipo <> 'PORCENTAJE' OR valor <= 100)
);

-- ------------------------------------------------------------- newsletter
CREATE TABLE IF NOT EXISTS suscripciones_newsletter (
  email      VARCHAR(254) PRIMARY KEY,
  usuario_id UUID         REFERENCES usuarios (id) ON DELETE SET NULL,
  activa     BOOLEAN      NOT NULL DEFAULT TRUE,
  -- Token para darse de baja desde el enlace del correo, sin iniciar sesión.
  token_baja UUID         NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  creado_en  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  baja_en    TIMESTAMPTZ
);

-- ---------------------------------------------------------------- pedidos
-- Descuento por cupón y compra como invitado (sin cuenta).
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS descuento        INTEGER NOT NULL DEFAULT 0;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS codigo_descuento VARCHAR(30) REFERENCES cupones (codigo);
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS invitado_email   VARCHAR(254);
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS invitado_nombre  VARCHAR(160);
ALTER TABLE pedidos ALTER COLUMN usuario_id DROP NOT NULL;
DO $$
DECLARE regla RECORD;
BEGIN
  -- El total del Hito 2 no consideraba descuentos: se reemplaza la regla. Postgres
  -- le puso un nombre automático (pedidos_check), así que se busca por su definición.
  FOR regla IN
    SELECT conname FROM pg_constraint
     WHERE conrelid = 'pedidos'::regclass AND contype = 'c'
       AND pg_get_constraintdef(oid) = 'CHECK ((total = (subtotal + costo_envio)))'
  LOOP
    EXECUTE format('ALTER TABLE pedidos DROP CONSTRAINT %I', regla.conname);
  END LOOP;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pedidos_total_con_descuento_check') THEN
    ALTER TABLE pedidos ADD CONSTRAINT pedidos_total_con_descuento_check
      CHECK (descuento >= 0 AND descuento <= subtotal AND total = subtotal - descuento + costo_envio);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pedidos_dueno_check') THEN
    -- Todo pedido es de un usuario o de un invitado identificado por su email.
    ALTER TABLE pedidos ADD CONSTRAINT pedidos_dueno_check
      CHECK (usuario_id IS NOT NULL OR invitado_email IS NOT NULL);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_pedidos_invitado ON pedidos (LOWER(invitado_email)) WHERE invitado_email IS NOT NULL;
