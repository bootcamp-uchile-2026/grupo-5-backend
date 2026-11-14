import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Cierre del Hito 3:
 *  - imagenes: archivos subidos (portadas y galería de los libros).
 *  - direcciones: direcciones de despacho guardadas por cada usuario.
 *  - preguntas_librero: formulario "¿No sabes qué leer?" del perfil del librero.
 *  - pedidos: RUT, ciudad y código postal del despacho (opcionales).
 *  - usuarios.version_sesion: cerrar sesión invalida los refresh tokens.
 */
export class CierreHito31794355200000 implements MigrationInterface {
  name = 'CierreHito31794355200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
CREATE TABLE IF NOT EXISTS imagenes (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  archivo         VARCHAR(80)  NOT NULL UNIQUE,      -- nombre con que se guardó en disco
  nombre_original VARCHAR(255) NOT NULL,
  mime            VARCHAR(40)  NOT NULL CHECK (mime IN ('image/jpeg', 'image/png', 'image/webp')),
  tamano          INTEGER      NOT NULL CHECK (tamano > 0),   -- bytes
  url             TEXT         NOT NULL,
  uso             VARCHAR(20)  NOT NULL DEFAULT 'GENERAL' CHECK (uso IN ('PORTADA', 'GALERIA', 'GENERAL')),
  libro_id        UUID         REFERENCES libros (id) ON DELETE SET NULL,
  subido_por      UUID         REFERENCES usuarios (id) ON DELETE SET NULL,
  creado_en       TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_imagenes_libro ON imagenes (libro_id);

CREATE TABLE IF NOT EXISTS direcciones (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id      UUID         NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  alias           VARCHAR(40)  NOT NULL,
  nombre_receptor VARCHAR(80)  NOT NULL,
  rut             VARCHAR(12),
  calle           VARCHAR(120) NOT NULL,
  comuna          VARCHAR(60)  NOT NULL,
  ciudad          VARCHAR(60),
  region          VARCHAR(5)   NOT NULL,
  codigo_postal   VARCHAR(10),
  telefono        VARCHAR(15)  NOT NULL,
  predeterminada  BOOLEAN      NOT NULL DEFAULT FALSE,
  creado_en       TIMESTAMPTZ  NOT NULL DEFAULT now(),
  actualizado_en  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_direcciones_usuario ON direcciones (usuario_id);
-- Cada usuario tiene a lo más una dirección predeterminada.
CREATE UNIQUE INDEX IF NOT EXISTS uq_direcciones_predeterminada ON direcciones (usuario_id) WHERE predeterminada;

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS version_sesion INTEGER NOT NULL DEFAULT 0;

ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS dir_rut           VARCHAR(12);
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS dir_ciudad        VARCHAR(60);
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS dir_codigo_postal VARCHAR(10);

CREATE TABLE IF NOT EXISTS preguntas_librero (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  librero_id    UUID         NOT NULL REFERENCES libreros (id) ON DELETE CASCADE,
  usuario_id    UUID         REFERENCES usuarios (id) ON DELETE SET NULL,
  nombre        VARCHAR(80)  NOT NULL,
  email         VARCHAR(254) NOT NULL,
  pregunta      TEXT         NOT NULL CHECK (char_length(pregunta) BETWEEN 10 AND 1000),
  respuesta     TEXT,
  creado_en     TIMESTAMPTZ  NOT NULL DEFAULT now(),
  respondida_en TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_preguntas_librero ON preguntas_librero (librero_id, creado_en DESC);
`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
DROP TABLE IF EXISTS preguntas_librero, direcciones, imagenes;
ALTER TABLE usuarios DROP COLUMN IF EXISTS version_sesion;
ALTER TABLE pedidos
  DROP COLUMN IF EXISTS dir_rut,
  DROP COLUMN IF EXISTS dir_ciudad,
  DROP COLUMN IF EXISTS dir_codigo_postal;
`);
  }
}
