-- LeeConNos · Hito 3 · Datos de prueba
-- Idempotente: si los registros ya existen no los duplica. Los UPDATE sobre los
-- libros del Hito 2 solo completan campos vacíos, para no pisar cambios hechos
-- desde la API (por ejemplo un precio editado por un librero).
--
-- Libros nuevos: ISBN, editorial, año y portada provienen de Open Library
-- (https://openlibrary.org). Las portadas usan el id de imagen de Open Library
-- porque no todas las ediciones tienen portada asociada a su ISBN.

-- ------------------------------------------------------------- categorías
-- Menú de UX (Figma: Componentes Global, nodes 2294:20831 y 2294:20860).
INSERT INTO categorias (nombre, tipo, grupo, orden) VALUES
  ('Literatura contemporánea', 'GENERO', 'Ficción', 1), ('Misterio y thriller', 'GENERO', 'Ficción', 2),
  ('Fantasía', 'GENERO', 'Ficción', 3), ('Ciencia ficción', 'GENERO', 'Ficción', 4),
  ('Romance', 'GENERO', 'Ficción', 5), ('Terror', 'GENERO', 'Ficción', 6),
  ('Clásicos', 'GENERO', 'Ficción', 7), ('Distopía', 'GENERO', 'Ficción', 8),
  ('Historia', 'GENERO', 'No ficción', 1), ('Filosofía', 'GENERO', 'No ficción', 2),
  ('Ciencia', 'GENERO', 'No ficción', 3), ('Sociedad', 'GENERO', 'No ficción', 4),
  ('Biografías', 'GENERO', 'No ficción', 5), ('Ensayo', 'GENERO', 'No ficción', 6),
  ('Crónica', 'GENERO', 'No ficción', 7), ('Naturaleza', 'GENERO', 'No ficción', 8),
  ('Arte', 'GENERO', 'Arte y Diseño', 1), ('Diseño', 'GENERO', 'Arte y Diseño', 2),
  ('Fotografía', 'GENERO', 'Arte y Diseño', 3), ('Cine', 'GENERO', 'Arte y Diseño', 4),
  ('Música', 'GENERO', 'Arte y Diseño', 5), ('Arquitectura', 'GENERO', 'Arte y Diseño', 6),
  ('Ilustración', 'GENERO', 'Arte y Diseño', 7), ('Moda', 'GENERO', 'Arte y Diseño', 8),
  ('Psicología', 'GENERO', 'Bienestar', 1), ('Desarrollo personal', 'GENERO', 'Bienestar', 2),
  ('Esoterismo', 'GENERO', 'Bienestar', 3), ('Tarot y oráculos', 'GENERO', 'Bienestar', 4),
  ('Vida Saludable', 'GENERO', 'Bienestar', 5), ('Nutrición', 'GENERO', 'Bienestar', 6),
  ('Familia', 'GENERO', 'Bienestar', 7), ('Autoayuda', 'GENERO', 'Bienestar', 8),
  ('Emprendimiento', 'GENERO', 'Negocios', 1), ('Finanzas', 'GENERO', 'Negocios', 2),
  ('Economía', 'GENERO', 'Negocios', 3), ('Liderazgo', 'GENERO', 'Negocios', 4),
  ('Marketing', 'GENERO', 'Negocios', 5), ('Innovación', 'GENERO', 'Negocios', 6),
  ('Productividad', 'GENERO', 'Negocios', 7), ('Tecnología', 'GENERO', 'Negocios', 8),
  ('Enamorarse', 'TEMATICA', 'Para cada momento', 1), ('Llorar', 'TEMATICA', 'Para cada momento', 2),
  ('Reír', 'TEMATICA', 'Para cada momento', 3), ('Emocionarse', 'TEMATICA', 'Para cada momento', 4),
  ('Sentirse acompañado', 'TEMATICA', 'Para cada momento', 5), ('Inquietarse', 'TEMATICA', 'Para cada momento', 6),
  ('Darle vueltas', 'TEMATICA', 'Para pensar', 1), ('Cuestionarlo todo', 'TEMATICA', 'Para pensar', 2),
  ('Cambiar de perspectiva', 'TEMATICA', 'Para pensar', 3), ('Entender el mundo', 'TEMATICA', 'Para pensar', 4),
  ('Conocerse mejor', 'TEMATICA', 'Para pensar', 5), ('Aprender algo nuevo', 'TEMATICA', 'Para pensar', 6),
  ('Joyas escondidas', 'TEMATICA', 'Para descubrir', 1), ('Más allá del hype', 'TEMATICA', 'Para descubrir', 2),
  ('Autores por descubrir', 'TEMATICA', 'Para descubrir', 3), ('Historias que sorprenden', 'TEMATICA', 'Para descubrir', 4),
  ('Favoritos inesperados', 'TEMATICA', 'Para descubrir', 5), ('Merecen más atención', 'TEMATICA', 'Para descubrir', 6),
  ('Regalos', 'TEMATICA', 'Para compartir', 1), ('Lecturas compartidas', 'TEMATICA', 'Para compartir', 2),
  ('Para conversar', 'TEMATICA', 'Para compartir', 3), ('Para alguien especial', 'TEMATICA', 'Para compartir', 4)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------- usuarios
-- Misma contraseña de desarrollo que el Hito 2: "LeeConNos2026".
INSERT INTO usuarios (id, nombre, apellido, email, password_hash, rol, generos_favoritos, email_verificado) VALUES
  -- Libreros (dueños de los perfiles diseñados por UX)
  ('bbbbbbbb-0000-4000-8000-000000000001', 'Gregorio', 'Samsa', 'gregorio@leeconnos.cl',
   '$2b$10$4oSrcbZDf0NamZJRZvtjd.GB4lCrkNVBaJMZ3KWx8tm/D0H1IfISu', 'LIBRERO', '{"Distopía","Clásicos"}', TRUE),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'Ana', 'Karenina', 'ana@leeconnos.cl',
   '$2b$10$4oSrcbZDf0NamZJRZvtjd.GB4lCrkNVBaJMZ3KWx8tm/D0H1IfISu', 'LIBRERO', '{"Romance","Clásicos"}', TRUE),
  ('bbbbbbbb-0000-4000-8000-000000000003', 'Tyler', 'Durden', 'tyler@leeconnos.cl',
   '$2b$10$4oSrcbZDf0NamZJRZvtjd.GB4lCrkNVBaJMZ3KWx8tm/D0H1IfISu', 'LIBRERO', '{"Literatura contemporánea","Distopía"}', TRUE),
  ('bbbbbbbb-0000-4000-8000-000000000004', 'Clara', 'del Valle', 'clara@leeconnos.cl',
   '$2b$10$4oSrcbZDf0NamZJRZvtjd.GB4lCrkNVBaJMZ3KWx8tm/D0H1IfISu', 'LIBRERO', '{"Novela","Poesía"}', TRUE),
  -- Lectores que firman las reseñas de ejemplo
  ('aaaaaaaa-0000-4000-8000-000000000001', 'Martín', 'Soto', 'lector1@leeconnos.cl',
   '$2b$10$4oSrcbZDf0NamZJRZvtjd.GB4lCrkNVBaJMZ3KWx8tm/D0H1IfISu', 'CLIENTE', '{"Ciencia ficción"}', TRUE),
  ('aaaaaaaa-0000-4000-8000-000000000002', 'Valentina', 'Muñoz', 'lector2@leeconnos.cl',
   '$2b$10$4oSrcbZDf0NamZJRZvtjd.GB4lCrkNVBaJMZ3KWx8tm/D0H1IfISu', 'CLIENTE', '{"Romance","Novela"}', TRUE),
  ('aaaaaaaa-0000-4000-8000-000000000003', 'Diego', 'Fuentes', 'lector3@leeconnos.cl',
   '$2b$10$4oSrcbZDf0NamZJRZvtjd.GB4lCrkNVBaJMZ3KWx8tm/D0H1IfISu', 'CLIENTE', '{"Historia","No ficción"}', TRUE),
  ('aaaaaaaa-0000-4000-8000-000000000004', 'Josefa', 'Araya', 'lector4@leeconnos.cl',
   '$2b$10$4oSrcbZDf0NamZJRZvtjd.GB4lCrkNVBaJMZ3KWx8tm/D0H1IfISu', 'CLIENTE', '{"Fantasía","Infantil"}', TRUE),
  ('aaaaaaaa-0000-4000-8000-000000000005', 'Tomás', 'Herrera', 'lector5@leeconnos.cl',
   '$2b$10$4oSrcbZDf0NamZJRZvtjd.GB4lCrkNVBaJMZ3KWx8tm/D0H1IfISu', 'CLIENTE', '{"Policial","Terror"}', TRUE),
  ('aaaaaaaa-0000-4000-8000-000000000006', 'Antonia', 'Vergara', 'lector6@leeconnos.cl',
   '$2b$10$4oSrcbZDf0NamZJRZvtjd.GB4lCrkNVBaJMZ3KWx8tm/D0H1IfISu', 'CLIENTE', '{"Poesía","Psicología"}', TRUE)
ON CONFLICT DO NOTHING;

-- ------------------------------------------- libros del Hito 2: ficha completa
-- Datos que UX diseñó (antes dummy en el Front: src/datos/complementosLibros.ts).
UPDATE libros l SET
  precio_anterior = COALESCE(l.precio_anterior, d.precio_anterior),
  subgenero       = COALESCE(l.subgenero, d.subgenero),
  encuadernacion  = COALESCE(l.encuadernacion, d.encuadernacion),
  paginas         = COALESCE(l.paginas, d.paginas),
  dimensiones     = COALESCE(l.dimensiones, d.dimensiones),
  etiquetas       = CASE WHEN l.etiquetas = '{}' THEN d.etiquetas ELSE l.etiquetas END,
  categorias      = CASE WHEN l.categorias = '{}' THEN d.categorias ELSE l.categorias END,
  ventas          = GREATEST(l.ventas, d.ventas)
FROM (VALUES
  ('9780553293357', NULL::int, NULL, 'Tapa blanda', 304, '13 x 19 cm', '{"Ficción","Ciencia ficción","Saga","Clásico"}'::text[], '{"Ciencia ficción","Clásicos","Entender el mundo"}'::text[], 39),
  ('9780441172719', NULL, NULL, 'Tapa blanda', 688, '15 x 23 cm', '{"Ficción","Ciencia ficción","Épica","Clásico"}', '{"Ciencia ficción","Clásicos","Lecturas compartidas"}', 72),
  ('9780441569595', NULL, NULL, NULL, 288, NULL, '{"Ficción","Ciencia ficción","Cyberpunk","Clásico"}', '{"Ciencia ficción","Tecnología","Joyas escondidas"}', 20),
  ('9781451673319', 12990, NULL, 'Tapa blanda', 256, '13 x 19 cm', '{"Ficción","Distopía","Clásico","Libros"}', '{"Ciencia ficción","Distopía","Clásicos","Cuestionarlo todo"}', 47),
  ('9780451524935', 10990, NULL, 'Tapa blanda', 328, '13 x 19 cm', '{"Ficción","Distopía","Clásico","Política"}', '{"Distopía","Ciencia ficción","Clásicos","Cuestionarlo todo"}', 120),
  ('9780307474728', 16990, NULL, 'Tapa blanda', 496, '15 x 23 cm', '{"Ficción","Realismo mágico","Clásico","Latinoamérica"}', '{"Clásicos","Historias que sorprenden","Lecturas compartidas"}', 140),
  ('9781501117015', 15990, NULL, 'Tapa blanda', 496, '15 x 23 cm', '{"Ficción","Realismo mágico","Chile","Familia"}', '{"Clásicos","Romance","Emocionarse"}', 58),
  ('9788437604572', 17990, NULL, 'Tapa blanda', 736, '13 x 19 cm', '{"Ficción","Novela","Experimental","Latinoamérica"}', '{"Clásicos","Enamorarse","Darle vueltas"}', 41),
  ('9788433920836', NULL, NULL, 'Tapa blanda', 624, '15 x 23 cm', '{"Ficción","Novela","Chile","Poesía"}', '{"Literatura contemporánea","Autores por descubrir"}', 28),
  ('9780547928210', NULL, NULL, 'Tapa blanda', 576, '15 x 23 cm', '{"Ficción","Fantasía","Épica","Saga"}', '{"Fantasía","Clásicos","Lecturas compartidas"}', 76),
  ('9780547928227', NULL, NULL, 'Tapa blanda', 320, '13 x 19 cm', '{"Ficción","Fantasía","Aventura","Clásico"}', '{"Fantasía","Clásicos","Regalos"}', 95),
  ('9788478884452', NULL, NULL, 'Tapa blanda', 264, '13 x 19 cm', '{"Ficción","Fantasía","Magia","Saga"}', '{"Fantasía","Regalos","Lecturas compartidas"}', 150),
  ('9780756404741', 21990, NULL, 'Tapa blanda', 880, '15 x 23 cm', '{"Ficción","Fantasía","Magia","Saga"}', '{"Fantasía","Más allá del hype"}', 88),
  ('9780062073501', NULL, 'Misterio policial', 'Tapa blanda', 256, '13 x 19 cm', '{"Ficción","Misterio","Detectives","Clásico"}', '{"Misterio y thriller","Clásicos"}', 64),
  ('9780679722649', NULL, 'Novela negra', 'Tapa blanda', 224, '13 x 19 cm', '{"Ficción","Novela negra","Detectives","Clásico"}', '{"Misterio y thriller","Clásicos"}', 22),
  ('9780307454546', 13990, 'Thriller psicológico', 'Tapa blanda', 672, '15 x 23 cm', '{"Ficción","Thriller","Misterio","Saga"}', '{"Misterio y thriller","Inquietarse"}', 54),
  ('9780143039969', NULL, NULL, 'Tapa blanda', 112, '13 x 19 cm', '{"Poesía","Amor","Chile","Nobel"}', '{"Clásicos","Enamorarse","Para alguien especial"}', 61),
  ('9789561100015', NULL, NULL, 'Tapa blanda', 176, '13 x 19 cm', '{"Poesía","Clásico","Chile","Nobel"}', '{"Clásicos","Llorar","Merecen más atención"}', 18),
  ('9780156013925', NULL, NULL, 'Tapa dura', 96, '13 x 19 cm', '{"Infantil","Clásico","Fábula","Filosofía"}', '{"Clásicos","Filosofía","Regalos","Para alguien especial","Emocionarse"}', 130),
  ('9789561200012', NULL, NULL, 'Tapa blanda', 112, '13 x 19 cm', '{"Infantil","Humor","Chile","Clásico"}', '{"Reír","Regalos","Familia"}', 66),
  ('9780062316097', NULL, NULL, 'Tapa blanda', 496, '15 x 23 cm', '{"No ficción","Historia","Ciencia","Sociedad"}', '{"Historia","Sociedad","Ciencia","Entender el mundo"}', 84),
  ('9780553380163', NULL, NULL, NULL, NULL, NULL, '{"No ficción","Ciencia","Universo","Divulgación"}', '{"Ciencia","Aprender algo nuevo"}', 25),
  ('9780853459910', NULL, NULL, 'Tapa blanda', 384, '15 x 23 cm', '{"No ficción","Historia","Latinoamérica","Ensayo"}', '{"Historia","Ensayo","Economía","Sociedad"}', 30),
  ('9780593598108', NULL, NULL, 'Tapa dura', 352, '15 x 23 cm', '{"Ficción","Novela","Historia","Migración"}', '{"Literatura contemporánea","Emocionarse"}', 15)
) AS d (isbn, precio_anterior, subgenero, encuadernacion, paginas, dimensiones, etiquetas, categorias, ventas)
WHERE l.isbn = d.isbn;

-- Open Library no tiene portada para estas ediciones; se usa la de otra edición de la misma obra.
UPDATE libros SET portada_url = 'https://covers.openlibrary.org/b/id/12679281-L.jpg'
 WHERE isbn = '9789561200012' AND portada_url = 'https://covers.openlibrary.org/b/isbn/9789561200012-L.jpg';
UPDATE libros SET portada_url = 'https://covers.openlibrary.org/b/id/5308731-L.jpg'
 WHERE isbn = '9789561100015' AND portada_url = 'https://covers.openlibrary.org/b/isbn/9789561100015-L.jpg';

-- --------------------------------------------- libros nuevos (géneros del menú)
INSERT INTO libros
  (id, isbn, titulo, autor, genero, editorial, anio_publicacion, precio, precio_anterior, stock, ventas,
   paginas, encuadernacion, dimensiones, subgenero, etiquetas, categorias, portada_url, descripcion, fecha_ingreso)
SELECT ('00000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid, isbn, titulo, autor, genero, editorial, anio,
       precio, precio_anterior, stock, ventas, paginas, encuadernacion, dimensiones, subgenero, etiquetas, categorias,
       'https://covers.openlibrary.org/b/id/' || portada || '-L.jpg', descripcion, now() - (dias || ' days')::interval
FROM (VALUES
  (25, '9788415083696', 'Orgullo y prejuicio', 'Jane Austen', 'Romance', 'Albor Libros', 1813, 9990, NULL::int, 10, 54, 432, 'Tapa blanda', '13 x 19 cm', 'Romance clásico',
   '{"Ficción","Romance","Clásico","Inglaterra"}'::text[], '{"Romance","Clásicos","Enamorarse","Regalos"}'::text[], 13745414,
   'Elizabeth Bennet y el señor Darcy chocan una y otra vez hasta descubrir que el orgullo y los prejuicios eran de ambos.', 95),
  (26, '9789580421931', 'Madame Bovary', 'Gustave Flaubert', 'Novela', 'Grupo Editorial Norma', 1856, 10990, NULL, 6, 21, 351, 'Tapa blanda', '13 x 19 cm', NULL,
   '{"Ficción","Clásico","Francia","Realismo"}', '{"Clásicos","Romance","Llorar"}', 12993424,
   'Emma Bovary sueña con la vida de las novelas románticas y se ahoga en la monotonía de un pueblo de provincia.', 94),
  (27, '9788441411982', 'Drácula', 'Bram Stoker', 'Terror', 'Edaf', 1897, 11990, 13990, 7, 33, 495, 'Tapa blanda', '15 x 23 cm', 'Terror gótico',
   '{"Ficción","Terror","Vampiros","Clásico"}', '{"Terror","Clásicos","Inquietarse"}', 12216503,
   'Cartas, diarios y recortes de prensa narran la llegada del conde Drácula a Inglaterra y la cacería para detenerlo.', 93),
  (28, '9788426137203', 'Frankenstein o el moderno Prometeo', 'Mary Shelley', 'Terror', 'Editorial Juventud', 1818, 9490, NULL, 8, 29, 289, 'Tapa blanda', '13 x 19 cm', 'Terror gótico',
   '{"Ficción","Terror","Ciencia ficción","Clásico"}', '{"Terror","Clásicos","Ciencia ficción","Cuestionarlo todo"}', 10696162,
   'Victor Frankenstein da vida a una criatura y luego la abandona, sin medir lo que significa crear y rechazar.', 92),
  (29, '9789877250244', 'It', 'Stephen King', 'Terror', 'Debolsillo', 1986, 18990, 21990, 5, 47, 1168, 'Tapa blanda', '15 x 23 cm', 'Terror sobrenatural',
   '{"Ficción","Terror","Amistad","Bestseller"}', '{"Terror","Inquietarse"}', 10705796,
   'Siete amigos de Derry enfrentan de niños a una criatura que despierta cada veintisiete años, y vuelven de adultos a terminar el trabajo.', 91),
  (30, '9789807716352', 'Un mundo feliz', 'Aldous Huxley', 'Ciencia ficción', 'Lucemar', 1932, 8990, NULL, 9, 38, 223, 'Tapa blanda', '13 x 19 cm', NULL,
   '{"Ficción","Distopía","Clásico","Sociedad"}', '{"Distopía","Ciencia ficción","Clásicos","Cuestionarlo todo"}', 15136602,
   'Una sociedad que fabrica personas felices por diseño, donde nadie sufre y nadie elige.', 90),
  (31, '9786073139113', 'Ensayo sobre la ceguera', 'José Saramago', 'Novela', 'Debolsillo', 1995, 12990, NULL, 6, 31, 432, 'Tapa blanda', '13 x 19 cm', NULL,
   '{"Ficción","Distopía","Nobel","Portugal"}', '{"Distopía","Literatura contemporánea","Cuestionarlo todo"}', 12329495,
   'Una epidemia de ceguera blanca se extiende por una ciudad y deja al descubierto lo peor y lo mejor de las personas.', 89),
  (32, '9789877251517', 'El proceso', 'Franz Kafka', 'Novela', 'Debolsillo', 1925, 8990, NULL, 7, 19, 288, 'Tapa blanda', '13 x 19 cm', NULL,
   '{"Ficción","Clásico","Absurdo","Existencialismo"}', '{"Clásicos","Cuestionarlo todo","Darle vueltas"}', 12334469,
   'Josef K. es detenido una mañana sin saber de qué se le acusa y se pierde en un tribunal que nunca termina de mostrarse.', 88),
  (33, '9788448705046', 'El extranjero', 'Albert Camus', 'Novela', 'Altaya', 1942, 7990, NULL, 8, 26, 118, 'Tapa blanda', '13 x 19 cm', NULL,
   '{"Ficción","Clásico","Existencialismo","Nobel"}', '{"Clásicos","Filosofía","Darle vueltas"}', 11047962,
   'Meursault no llora en el funeral de su madre y días después mata a un hombre en una playa de Argel.', 87),
  (34, '9788433972743', 'Nunca me abandones', 'Kazuo Ishiguro', 'Novela', 'Anagrama', 2005, 14990, NULL, 5, 17, 351, 'Tapa blanda', '13 x 19 cm', NULL,
   '{"Ficción","Distopía","Nobel","Memoria"}', '{"Literatura contemporánea","Distopía","Llorar"}', 15239437,
   'Kathy recuerda su infancia en Hailsham, un internado inglés donde nada era lo que parecía.', 86),
  (35, '9788433980878', 'Klara y el Sol', 'Kazuo Ishiguro', 'Novela', 'Anagrama', 2021, 17990, 19990, 6, 22, 335, 'Tapa blanda', '15 x 23 cm', NULL,
   '{"Ficción","Inteligencia artificial","Nobel","Contemporáneo"}', '{"Literatura contemporánea","Ciencia ficción","Emocionarse"}', 10675098,
   'Klara, una amiga artificial, observa desde un escaparate el mundo humano hasta que una niña enferma la elige.', 5),
  (36, '9788416738137', 'La vegetariana', 'Han Kang', 'Novela', 'Rata', 2007, 15990, NULL, 4, 14, 192, 'Tapa blanda', '13 x 19 cm', NULL,
   '{"Ficción","Nobel","Corea","Contemporáneo"}', '{"Literatura contemporánea","Inquietarse","Joyas escondidas"}', 8027440,
   'Yeong-hye deja de comer carne tras un sueño y su decisión desata la violencia silenciosa de su familia.', 7),
  (37, '9788418363283', 'Piranesi', 'Susanna Clarke', 'Fantasía', 'Salamandra', 2020, 16990, NULL, 6, 18, 272, 'Tapa blanda', '15 x 23 cm', NULL,
   '{"Ficción","Fantasía","Misterio","Contemporáneo"}', '{"Fantasía","Literatura contemporánea","Historias que sorprenden","Favoritos inesperados"}', 15240267,
   'Piranesi vive en una casa infinita de salones y estatuas bañada por el mar, y lleva un diario de todo lo que encuentra.', 3),
  (38, '9789685208512', 'Pedro Páramo', 'Juan Rulfo', 'Novela', 'Fundación Juan Rulfo', 1955, 8490, NULL, 7, 24, 130, 'Tapa blanda', '13 x 19 cm', NULL,
   '{"Ficción","Clásico","México","Realismo mágico"}', '{"Clásicos","Historias que sorprenden"}', 5419076,
   'Juan Preciado llega a Comala buscando a su padre y encuentra un pueblo habitado por murmullos y muertos.', 85),
  (39, '9789703215126', 'La amortajada', 'María Luisa Bombal', 'Novela', NULL, 1938, 7990, NULL, 5, 12, 116, 'Tapa blanda', '13 x 19 cm', NULL,
   '{"Ficción","Chile","Clásico","Vanguardia"}', '{"Clásicos","Autores por descubrir","Merecen más atención"}', 4926717,
   'Ana María, ya muerta, ve desfilar ante su ataúd a quienes amó y repasa su vida con una lucidez que nunca tuvo.', 84),
  (40, '9788439706380', 'Como agua para chocolate', 'Laura Esquivel', 'Romance', 'Mondadori', 1989, 11990, NULL, 6, 27, 296, 'Tapa blanda', '13 x 19 cm', NULL,
   '{"Ficción","Realismo mágico","México","Cocina"}', '{"Romance","Enamorarse","Lecturas compartidas"}', 8372632,
   'Tita no puede casarse con Pedro y vuelca en sus recetas todo lo que siente, con efectos sobre quien las come.', 83),
  (41, '9789875802452', 'El perfume', 'Patrick Süskind', 'Policial', NULL, 1985, 10990, 12930, 8, 35, 326, 'Tapa blanda', '13 x 19 cm', 'Thriller psicológico',
   '{"Ficción","Terror","Thriller","Misterio","Clásico"}', '{"Misterio y thriller","Clásicos","Terror"}', 12335106,
   'Para conseguir el favor de las damas y el dominio de los poderosos, Grenouille elabora un perfume que subyuga a quien lo huele.', 82),
  (42, '9788439721918', 'El club de la lucha', 'Chuck Palahniuk', 'Novela', 'Mondadori', 1996, 12990, NULL, 5, 20, 224, 'Tapa blanda', '13 x 19 cm', NULL,
   '{"Ficción","Sátira","Transgresora","Culto"}', '{"Literatura contemporánea","Cuestionarlo todo","Más allá del hype"}', 7263568,
   'Un oficinista con insomnio conoce a Tyler Durden y juntos fundan un club clandestino que se les va de las manos.', 81),
  (43, '9788445078822', 'La naranja mecánica', 'Anthony Burgess', 'Ciencia ficción', 'Booket', 1962, 9990, NULL, 7, 23, 224, 'Tapa blanda', '13 x 19 cm', NULL,
   '{"Ficción","Distopía","Clásico","Violencia"}', '{"Distopía","Clásicos","Inquietarse"}', 12338379,
   'Alex y sus drugos siembran el terror hasta que el Estado decide curarlo de la violencia con un método experimental.', 80),
  (44, '9788425432026', 'El hombre en busca de sentido', 'Viktor E. Frankl', 'Psicología', 'Herder', 1946, 11990, NULL, 10, 58, 168, 'Tapa blanda', '13 x 19 cm', NULL,
   '{"No ficción","Psicología","Holocausto","Sentido"}', '{"Psicología","Desarrollo personal","Filosofía","Conocerse mejor"}', 7443586,
   'El psiquiatra Viktor Frankl relata su paso por los campos de concentración y lo que aprendió sobre el sentido de la vida.', 79),
  (45, '9788478448159', 'El mundo de Sofía', 'Jostein Gaarder', 'Filosofía', 'Siruela', 1991, 15990, NULL, 6, 30, 638, 'Tapa blanda', '15 x 23 cm', NULL,
   '{"Ficción","Filosofía","Juvenil","Clásico"}', '{"Filosofía","Aprender algo nuevo","Lecturas compartidas"}', 9088390,
   'Sofía recibe cartas anónimas con preguntas filosóficas y recorre con ellas la historia del pensamiento occidental.', 78),
  (46, '9788416540129', 'Meditaciones', 'Marco Aurelio', 'Filosofía', 'La Otra H', NULL, 7990, NULL, 9, 25, 200, 'Tapa blanda', '13 x 19 cm', NULL,
   '{"No ficción","Filosofía","Estoicismo","Clásico"}', '{"Filosofía","Clásicos","Desarrollo personal","Conocerse mejor"}', 10692944,
   'Las notas personales del emperador romano: una guía estoica para vivir con serenidad lo que no depende de uno.', 77),
  (47, '9788432036262', 'Cosmos', 'Carl Sagan', 'No ficción', 'Planeta', 1980, 16990, NULL, 5, 28, 366, 'Tapa blanda', '15 x 23 cm', NULL,
   '{"No ficción","Ciencia","Universo","Divulgación"}', '{"Ciencia","Naturaleza","Entender el mundo","Aprender algo nuevo"}', 7912424,
   'Un viaje por quince mil millones de años de evolución cósmica, contado por el gran divulgador de la ciencia.', 76),
  (48, '9788498921373', 'Primavera silenciosa', 'Rachel Carson', 'No ficción', 'Crítica', 1962, 13990, NULL, 4, 9, NULL, 'Tapa blanda', '15 x 23 cm', NULL,
   '{"No ficción","Ecología","Ciencia","Clásico"}', '{"Naturaleza","Ciencia","Sociedad","Merecen más atención"}', 15115450,
   'La investigación sobre los pesticidas que despertó la conciencia ambiental moderna.', 75),
  (49, '9788483468548', 'Hiroshima', 'John Hersey', 'Historia', 'Debolsillo', 1946, 8990, NULL, 6, 13, 184, 'Tapa blanda', '13 x 19 cm', NULL,
   '{"No ficción","Periodismo","Historia","Guerra"}', '{"Crónica","Historia","Entender el mundo"}', 13716212,
   'La crónica de seis sobrevivientes de la bomba atómica, considerada una de las grandes obras del periodismo.', 74),
  (50, '9788499897318', 'Steve Jobs', 'Walter Isaacson', 'No ficción', 'Debolsillo', 2011, 14990, 16990, 6, 36, 752, 'Tapa blanda', '15 x 23 cm', NULL,
   '{"No ficción","Biografía","Tecnología","Apple"}', '{"Biografías","Tecnología","Innovación","Liderazgo"}', 9033156,
   'La biografía autorizada del fundador de Apple, basada en más de cuarenta entrevistas con él y con su entorno.', 73),
  (51, '9788417910143', 'Persépolis', 'Marjane Satrapi', 'Historia', 'Reservoir Books', 2000, 19990, NULL, 4, 19, 352, 'Tapa blanda', '17 x 24 cm', NULL,
   '{"No ficción","Novela gráfica","Irán","Memorias"}', '{"Biografías","Ilustración","Historia"}', 15167498,
   'La infancia y juventud de Marjane en el Irán de la revolución islámica, contada en viñetas en blanco y negro.', 72),
  (52, '9786075694122', 'Hábitos atómicos', 'James Clear', 'Bienestar', 'Planeta', 2018, 15990, 18990, 12, 97, 336, 'Tapa blanda', '15 x 23 cm', NULL,
   '{"No ficción","Hábitos","Productividad","Bestseller"}', '{"Autoayuda","Desarrollo personal","Productividad"}', 13249133,
   'Un método práctico para crear buenos hábitos y abandonar los malos a partir de cambios pequeños.', 2),
  (53, '9786073156738', 'Padre rico, padre pobre', 'Robert T. Kiyosaki', 'Negocios', 'Aguilar', 1997, 12990, NULL, 9, 61, 243, 'Tapa blanda', '13 x 19 cm', NULL,
   '{"No ficción","Finanzas personales","Inversión","Bestseller"}', '{"Finanzas","Emprendimiento"}', 12329704,
   'Lo que los ricos enseñan a sus hijos sobre el dinero y que los demás no, contado a través de dos padres.', 71),
  (54, '9788423409495', 'El método Lean Startup', 'Eric Ries', 'Negocios', 'Deusto', 2011, 18990, NULL, 5, 16, 320, 'Tapa blanda', '15 x 23 cm', NULL,
   '{"No ficción","Emprendimiento","Startups","Innovación"}', '{"Emprendimiento","Innovación","Productividad"}', 8135254,
   'Cómo crear empresas exitosas con ciclos cortos de construir, medir y aprender.', 70),
  (55, '9788498723311', 'Freakonomics', 'Steven D. Levitt y Stephen J. Dubner', 'Negocios', 'Ediciones B', 2005, 10990, NULL, 6, 18, 336, 'Tapa blanda', '13 x 19 cm', NULL,
   '{"No ficción","Economía","Sociedad","Divulgación"}', '{"Economía","Sociedad","Cambiar de perspectiva"}', 13975948,
   'Un economista aplica sus herramientas a preguntas insólitas, desde luchadores de sumo hasta traficantes.', 69),
  (56, '9788498750041', 'La vaca púrpura', 'Seth Godin', 'Negocios', 'Gestión 2000', 2003, 13990, NULL, 4, 8, 186, 'Tapa blanda', '15 x 23 cm', NULL,
   '{"No ficción","Marketing","Negocios"}', '{"Marketing","Innovación"}', 14214985,
   'En un mercado saturado, solo lo extraordinario se nota: una invitación a diseñar productos memorables.', 68),
  (57, '9789588613680', 'Pensar rápido, pensar despacio', 'Daniel Kahneman', 'Psicología', 'Debate', 2011, 19990, NULL, 5, 34, 548, 'Tapa blanda', '15 x 23 cm', NULL,
   '{"No ficción","Psicología","Economía conductual","Nobel"}', '{"Psicología","Economía","Cambiar de perspectiva","Entender el mundo"}', 8104984,
   'El Nobel de Economía explica los dos sistemas que gobiernan cómo pensamos y por qué nos equivocamos.', 67),
  (58, '9788483060445', 'La historia del arte', 'E. H. Gombrich', 'Arte', 'Círculo de Lectores', 1950, 39990, 44990, 3, 11, 688, 'Tapa dura', '17 x 24 cm', NULL,
   '{"No ficción","Arte","Historia","Ilustrado"}', '{"Arte","Historia","Aprender algo nuevo","Regalos"}', 10660176,
   'La introducción al arte más leída del mundo, desde las cuevas prehistóricas hasta el siglo XX.', 66),
  (59, '9789870403043', 'Sobre la fotografía', 'Susan Sontag', 'Arte', 'Alfaguara', 1977, 13990, NULL, 4, 7, 285, 'Tapa blanda', '13 x 19 cm', NULL,
   '{"No ficción","Fotografía","Ensayo","Cultura"}', '{"Fotografía","Ensayo","Arte"}', 1055634,
   'Ensayos sobre cómo la fotografía cambió nuestra forma de mirar, recordar y relacionarnos con el mundo.', 65),
  (60, '9788415042013', 'La psicología de los objetos cotidianos', 'Donald A. Norman', 'Arte', 'Nerea', 1988, 21990, NULL, 4, 9, 302, 'Tapa blanda', '15 x 23 cm', NULL,
   '{"No ficción","Diseño","Usabilidad","Psicología"}', '{"Diseño","Innovación","Psicología"}', 13609000,
   'Por qué hay puertas que no sabemos abrir: el clásico sobre diseño centrado en las personas.', 64),
  (61, '9786070248016', 'Esculpir el tiempo', 'Andréi Tarkovski', 'Arte', 'UNAM', 1986, 16990, NULL, 3, 5, 274, 'Tapa blanda', '15 x 23 cm', NULL,
   '{"No ficción","Cine","Ensayo","Memorias"}', '{"Cine","Ensayo","Arte","Joyas escondidas"}', 14579411,
   'El cineasta ruso reflexiona sobre el arte, el tiempo y el sentido de hacer cine.', 63),
  (62, '9788432209130', 'El ruido eterno', 'Alex Ross', 'Arte', 'Seix Barral', 2007, 24990, NULL, 3, 6, NULL, 'Tapa blanda', '15 x 23 cm', NULL,
   '{"No ficción","Música","Historia","Siglo XX"}', '{"Música","Historia","Arte"}', 7440285,
   'Una historia del siglo XX contada a través de su música, de Strauss y Mahler a John Adams.', 62),
  (63, '9789873970047', 'Hacia una arquitectura', 'Le Corbusier', 'Arte', 'Infinito', 1923, 18990, NULL, 3, 4, 264, 'Tapa blanda', '15 x 23 cm', NULL,
   '{"No ficción","Arquitectura","Manifiesto","Clásico"}', '{"Arquitectura","Diseño","Arte"}', 10393660,
   'El manifiesto que definió la arquitectura moderna: la casa como máquina para habitar.', 61),
  (64, '9788478448937', 'La vía del tarot', 'Alejandro Jodorowsky y Marianne Costa', 'Bienestar', 'Siruela', 2004, 29990, NULL, 4, 15, 611, 'Tapa blanda', '15 x 23 cm', NULL,
   '{"No ficción","Tarot","Esoterismo","Simbolismo"}', '{"Tarot y oráculos","Esoterismo","Conocerse mejor"}', 7311072,
   'Un estudio completo del tarot de Marsella como herramienta de autoconocimiento.', 60),
  (65, '9788484287148', 'El cerebro del niño', 'Daniel J. Siegel y Tina Payne Bryson', 'Psicología', 'Alba', 2011, 15990, NULL, 6, 22, NULL, 'Tapa blanda', '15 x 23 cm', NULL,
   '{"No ficción","Crianza","Neurociencia","Familia"}', '{"Familia","Psicología","Aprender algo nuevo"}', 8143901,
   'Doce estrategias basadas en neurociencia para acompañar el desarrollo emocional de los niños.', 59),
  (66, '9786075697345', 'Comer para no morir', 'Michael Greger', 'Bienestar', 'Planeta', 2015, 19990, NULL, 5, 17, 680, 'Tapa blanda', '15 x 23 cm', NULL,
   '{"No ficción","Nutrición","Salud","Ciencia"}', '{"Vida Saludable","Nutrición","Ciencia"}', 7444992,
   'Qué dice la evidencia científica sobre la alimentación y las principales causas de muerte prematura.', 58),
  (67, '9788484454663', 'El poder del ahora', 'Eckhart Tolle', 'Bienestar', 'Gaia Ediciones', 1997, 13990, NULL, 8, 44, NULL, 'Tapa blanda', '13 x 19 cm', NULL,
   '{"No ficción","Espiritualidad","Meditación","Bestseller"}', '{"Desarrollo personal","Esoterismo","Autoayuda","Sentirse acompañado"}', 12335770,
   'Una guía espiritual para dejar de vivir en el pasado o el futuro y habitar el presente.', 57),
  (68, '9788433967787', 'El imperio de lo efímero', 'Gilles Lipovetsky', 'No ficción', 'Anagrama', 1987, 15990, NULL, 3, 5, NULL, 'Tapa blanda', '13 x 19 cm', NULL,
   '{"No ficción","Moda","Sociología","Ensayo"}', '{"Moda","Sociedad","Ensayo"}', 2270205,
   'La moda como motor de las sociedades modernas: un ensayo sobre la seducción y lo efímero.', 56),
  (69, '9788449331152', 'Los 7 hábitos de la gente altamente efectiva', 'Stephen R. Covey', 'Negocios', 'Paidós', 1989, 16990, NULL, 7, 39, 480, 'Tapa blanda', '15 x 23 cm', NULL,
   '{"No ficción","Liderazgo","Productividad","Clásico"}', '{"Liderazgo","Productividad","Desarrollo personal"}', 7383820,
   'Siete principios para la efectividad personal y profesional, del clásico del liderazgo.', 55),
  (70, '9788466361422', 'Homo Deus', 'Yuval Noah Harari', 'No ficción', 'Debolsillo', 2015, 14990, NULL, 6, 42, 496, 'Tapa blanda', '13 x 19 cm', NULL,
   '{"No ficción","Futuro","Tecnología","Sociedad"}', '{"Tecnología","Sociedad","Ciencia","Cuestionarlo todo"}', 7914168,
   'Una breve historia del mañana: qué pasará cuando la humanidad busque la inmortalidad, la felicidad y la divinidad.', 54),
  (71, '9788432230387', 'Una habitación propia', 'Virginia Woolf', 'No ficción', 'Seix Barral', 1929, 9990, NULL, 7, 23, 160, 'Tapa blanda', '13 x 19 cm', NULL,
   '{"No ficción","Ensayo","Feminismo","Clásico"}', '{"Ensayo","Sociedad","Clásicos","Para conversar"}', 6368401,
   'Para escribir, una mujer necesita dinero y una habitación propia: el ensayo fundacional de Virginia Woolf.', 53),
  (72, '9788420671710', 'La señora Dalloway', 'Virginia Woolf', 'Novela', 'Alianza Editorial', 1925, 11990, NULL, 5, 14, 272, 'Tapa blanda', '13 x 19 cm', NULL,
   '{"Ficción","Clásico","Modernismo","Londres"}', '{"Clásicos","Darle vueltas"}', 12391513,
   'Un día de junio en Londres: Clarissa Dalloway prepara una fiesta mientras repasa las decisiones de su vida.', 52),
  (73, '9788439736318', 'Gente normal', 'Sally Rooney', 'Romance', 'Literatura Random House', 2018, 15990, 17990, 6, 37, 256, 'Tapa blanda', '15 x 23 cm', NULL,
   '{"Ficción","Romance","Contemporáneo","Irlanda"}', '{"Romance","Literatura contemporánea","Enamorarse","Llorar"}', 13217759,
   'Connell y Marianne se acercan y se alejan durante años, sin terminar de entender lo que son el uno para el otro.', 4),
  (74, '9789688679890', 'Guía del autoestopista galáctico', 'Douglas Adams', 'Ciencia ficción', 'Anagrama', 1979, 10990, NULL, 8, 32, NULL, 'Tapa blanda', '13 x 19 cm', 'Humor',
   '{"Ficción","Ciencia ficción","Humor","Culto"}', '{"Ciencia ficción","Reír","Favoritos inesperados"}', 15114331,
   'Minutos antes de que demuelan la Tierra, Arthur Dent es rescatado por un amigo que resulta ser extraterrestre.', 51),
  (75, '9788466358293', 'El infinito en un junco', 'Irene Vallejo', 'Historia', 'Debolsillo', 2019, 14990, NULL, 8, 48, 600, 'Tapa blanda', '13 x 19 cm', NULL,
   '{"No ficción","Historia","Libros","Ensayo"}', '{"Ensayo","Historia","Sentirse acompañado","Para conversar"}', 14092108,
   'La invención de los libros en el mundo antiguo, contada como una aventura de lectores, copistas y bibliotecas.', 6)
) AS d (n, isbn, titulo, autor, genero, editorial, anio, precio, precio_anterior, stock, ventas, paginas,
        encuadernacion, dimensiones, subgenero, etiquetas, categorias, portada, descripcion, dias)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------- libreros
-- Perfiles de los wireframes "Perfiles de libreros" (Figma: Wireframes Desktop,
-- nodes 1547:4321, 1547:4583, 1547:4849 y 1584:4835). El slug coincide con el id
-- que ya usa el Front (/perfil-librero?librero=gregorio-samsa).
INSERT INTO libreros (id, usuario_id, slug, nombre, nombre_corto, cita, biografia, etiquetas, estilos, autores_favoritos, indispensables) VALUES
  ('cccccccc-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000001', 'gregorio-samsa', 'Gregorio Samsa', 'Gregorio S.',
   'Me gustan los libros que terminan y te dejan mirando el techo un rato.',
   'Te recomiendo historias extrañas, incómodas y profundamente humanas. Me interesan los personajes que no terminan de encajar, las sociedades que parecen funcionar pero no tanto y los libros que dejan más preguntas que respuestas.',
   '{"Existencialismo","Distopía","Contemporáneo"}',
   '{"Existencialismo","Distopía","Contemporáneo","Ficción Psicológica","Crítica Social","Terror Psicológico"}',
   '{"Franz Kafka","Milan Kundera","Han Kang","George Orwell"}',
   '[{"titulo":"El proceso","autor":"Franz Kafka","libroId":"00000000-0000-4000-8000-000000000032"},
     {"titulo":"El extranjero","autor":"Albert Camus","libroId":"00000000-0000-4000-8000-000000000033"},
     {"titulo":"1984","autor":"George Orwell","libroId":"00000000-0000-4000-8000-000000000005"},
     {"titulo":"Ensayo sobre la ceguera","autor":"José Saramago","libroId":"00000000-0000-4000-8000-000000000031"},
     {"titulo":"Nunca me abandones","autor":"Kazuo Ishiguro","libroId":"00000000-0000-4000-8000-000000000034"}]'),
  ('cccccccc-0000-4000-8000-000000000002', 'bbbbbbbb-0000-4000-8000-000000000002', 'ana-karenina', 'Ana Karenina', 'Ana Karenina',
   'Me interesan las historias donde amar a alguien también significa enfrentarse a una misma.',
   'Te recomiendo historias donde el amor no siempre llega en el momento correcto, donde las decisiones tienen consecuencias y los personajes deben elegir entre lo que desean y lo que se espera de ellos. Me interesan las relaciones complejas, las emociones contenidas y esas novelas que siguen dando vueltas en la cabeza mucho después de terminarlas.',
   '{"Romance","Drama","Clásicos","Realismo"}',
   '{"Romance","Drama psicológico","Realismo","Clásicos","Ficción literaria","Relaciones humanas"}',
   '{"Edith Wharton","Virginia Woolf","Gustave Flaubert","Marguerite Duras"}',
   '[{"titulo":"La edad de la inocencia","autor":"Edith Wharton","libroId":null},
     {"titulo":"Madame Bovary","autor":"Gustave Flaubert","libroId":"00000000-0000-4000-8000-000000000026"},
     {"titulo":"Orgullo y prejuicio","autor":"Jane Austen","libroId":"00000000-0000-4000-8000-000000000025"},
     {"titulo":"La señora Dalloway","autor":"Virginia Woolf","libroId":"00000000-0000-4000-8000-000000000072"},
     {"titulo":"El amante","autor":"Marguerite Duras","libroId":null}]'),
  ('cccccccc-0000-4000-8000-000000000003', 'bbbbbbbb-0000-4000-8000-000000000003', 'tyler-durden', 'Tyler Durden', 'Tyler D.',
   '¿Eres dueño de tus cosas o ellas son dueñas de ti?',
   'Me interesan los libros que incomodan, cuestionan las reglas y ponen en duda todo eso que damos por normal. Historias sobre identidades que se desmoronan, sociedades obsesionadas con aparentar y personajes que están hartos de seguir el guion. Si un libro te deja pensando que algo no cuadra, probablemente me va a gustar.',
   '{"Ficción transgresora","Sátira social","Existencialismo"}',
   '{"Ficción transgresora","Sátira social","Existencialismo","Distopía","Crítica social","Thriller psicológico"}',
   '{"Chuck Palahniuk","Bret Easton Ellis","J. G. Ballard","Albert Camus"}',
   '[{"titulo":"El club de la lucha","autor":"Chuck Palahniuk","libroId":"00000000-0000-4000-8000-000000000042"},
     {"titulo":"American Psycho","autor":"Bret Easton Ellis","libroId":null},
     {"titulo":"Rascacielos","autor":"J. G. Ballard","libroId":null},
     {"titulo":"Memorias del subsuelo","autor":"Fiódor Dostoyevski","libroId":null},
     {"titulo":"La naranja mecánica","autor":"Anthony Burgess","libroId":"00000000-0000-4000-8000-000000000043"}]'),
  ('cccccccc-0000-4000-8000-000000000004', 'bbbbbbbb-0000-4000-8000-000000000004', 'clara-del-valle', 'Clara del Valle', 'Clara V.',
   'Hay historias que no terminan cuando alguien se va. Se quedan viviendo en nosotros.',
   'Me gustan las historias donde lo cotidiano se vuelve extraordinario, las casas guardan secretos y los recuerdos nunca se van del todo. Te recomiendo libros sobre la familia, la memoria y la magia de lo cotidiano.',
   '{"Realismo mágico","Distopía","Contemporáneo"}',
   '{"Realismo mágico","Saga familiar","Memoria","Literatura latinoamericana","Contemporáneo"}',
   '{"Isabel Allende","Gabriel García Márquez","María Luisa Bombal","Laura Esquivel"}',
   '[{"titulo":"La casa de los espíritus","autor":"Isabel Allende","libroId":"00000000-0000-4000-8000-000000000007"},
     {"titulo":"Cien años de soledad","autor":"Gabriel García Márquez","libroId":"00000000-0000-4000-8000-000000000006"},
     {"titulo":"La amortajada","autor":"María Luisa Bombal","libroId":"00000000-0000-4000-8000-000000000039"},
     {"titulo":"Como agua para chocolate","autor":"Laura Esquivel","libroId":"00000000-0000-4000-8000-000000000040"},
     {"titulo":"Pedro Páramo","autor":"Juan Rulfo","libroId":"00000000-0000-4000-8000-000000000038"}]'),
  ('cccccccc-0000-4000-8000-000000000005', '22222222-2222-4222-8222-222222222222', 'lucia-librera', 'Lucía Librera', 'Lucía L.',
   'Un buen libro es una conversación que no se termina en la última página.',
   'Llevo años detrás del mesón de la librería. Te recomiendo poesía chilena, novelas que se leen de una sentada y clásicos infantiles para volver a leer de grande.',
   '{"Poesía","Novela","Infantil"}',
   '{"Poesía chilena","Novela latinoamericana","Clásicos infantiles"}',
   '{"Gabriela Mistral","Pablo Neruda","Roberto Bolaño","Marcela Paz"}',
   '[{"titulo":"Veinte poemas de amor y una canción desesperada","autor":"Pablo Neruda","libroId":"00000000-0000-4000-8000-000000000017"},
     {"titulo":"Desolación","autor":"Gabriela Mistral","libroId":"00000000-0000-4000-8000-000000000018"},
     {"titulo":"Los detectives salvajes","autor":"Roberto Bolaño","libroId":"00000000-0000-4000-8000-000000000009"},
     {"titulo":"Papelucho","autor":"Marcela Paz","libroId":"00000000-0000-4000-8000-000000000020"},
     {"titulo":"El principito","autor":"Antoine de Saint-Exupéry","libroId":"00000000-0000-4000-8000-000000000019"}]')
ON CONFLICT DO NOTHING;

-- Recomendaciones con nota personal. Las "destacadas" se muestran en el Home.
INSERT INTO recomendaciones_librero (librero_id, libro_id, nota, destacada, orden, creado_en)
SELECT ('cccccccc-0000-4000-8000-' || lpad(librero::text, 12, '0'))::uuid,
       ('00000000-0000-4000-8000-' || lpad(libro::text, 12, '0'))::uuid,
       nota, destacada, orden, now() - (dias || ' days')::interval
FROM (VALUES
  (1, 35, 'Una inteligencia artificial que observa a los humanos con más ternura de la que nos tenemos. Me dejó mirando el techo un buen rato.', TRUE, 1, 2),
  (1, 36, 'Incómodo, extraño y hermoso. Una mujer que decide dejar de obedecer y una familia que no se lo perdona.', FALSE, 2, 9),
  (1, 37, 'No sé cómo explicarlo sin arruinarlo: entra a la casa sin preguntar nada y déjate llevar.', FALSE, 3, 15),
  (1, 5, 'Lo releo cada cierto tiempo y siempre se parece un poco más a las noticias.', FALSE, 4, 30),
  (1, 32, 'Nadie le dice a Josef K. de qué lo acusan. A veces la vida adulta se siente igual.', FALSE, 5, 45),
  (2, 73, 'Dos personas que se entienden perfecto y aun así no saben quererse bien. Duele de la mejor manera.', TRUE, 1, 3),
  (2, 25, 'El primer malentendido amoroso que me enamoró. Elizabeth Bennet sigue siendo mi heroína.', FALSE, 2, 12),
  (2, 26, 'Emma quiere vivir como en las novelas y la realidad no se lo perdona. Imposible no sentirla cerca.', FALSE, 3, 20),
  (2, 72, 'Un solo día alcanza para repasar una vida entera. Woolf escribe como se piensa.', FALSE, 4, 40),
  (3, 42, 'La primera regla es no hablar de este libro. Yo ya la rompí.', TRUE, 1, 1),
  (3, 43, 'Si te parece que la violencia se cura con un tratamiento, lee esto antes de opinar.', FALSE, 2, 10),
  (3, 30, 'Todos felices, todos iguales, nadie se pregunta nada. Te va a sonar más familiar de lo que quisieras.', FALSE, 3, 18),
  (3, 33, 'Meursault no finge sentir lo que no siente, y eso es lo que la sociedad no le perdona.', FALSE, 4, 35),
  (4, 7, 'Clara del Valle me prestó el nombre. Esta casa está llena de espíritus y de mujeres que no se rinden.', TRUE, 1, 4),
  (4, 6, 'Macondo es el pueblo donde todos crecimos sin saberlo. Léelo con un árbol genealógico a mano.', FALSE, 2, 14),
  (4, 38, 'Un pueblo hecho de murmullos. Corto, extraño y perfecto para leer de una sentada.', FALSE, 3, 22),
  (4, 39, 'Bombal escribió esta joya en los años treinta y todavía sorprende. Merece muchos más lectores.', FALSE, 4, 28),
  (4, 40, 'Las recetas también cuentan historias. Ten algo rico a mano porque te va a dar hambre.', FALSE, 5, 50),
  (5, 17, 'Para regalar o para regalarse. Los leí a los quince y todavía me los sé de memoria.', TRUE, 1, 6),
  (5, 19, 'El regalo que nunca falla. Lo esencial sigue siendo invisible a los ojos.', TRUE, 2, 8),
  (5, 9, 'Una novela de poetas perdidos que se lee como una aventura. Bolaño en estado puro.', FALSE, 3, 25),
  (5, 20, 'Lo leí de niña y lo releí de adulta riéndome igual. Papelucho es patrimonio nacional.', FALSE, 4, 33),
  (5, 18, 'Gabriela Mistral antes del Nobel, con toda su fuerza. Poesía que se lee en voz alta.', FALSE, 5, 60)
) AS d (librero, libro, nota, destacada, orden, dias)
ON CONFLICT DO NOTHING;

INSERT INTO colecciones (id, librero_id, titulo, descripcion, publicada_en, libros)
SELECT ('dddddddd-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
       ('cccccccc-0000-4000-8000-' || lpad(librero::text, 12, '0'))::uuid,
       titulo, descripcion, fecha::date,
       ARRAY(SELECT ('00000000-0000-4000-8000-' || lpad(x::text, 12, '0'))::uuid FROM unnest(libros) AS x)
FROM (VALUES
  (1, 1, 'Para cuando todo te parece absurdo', '5 libros para una crisis existencial', '2026-08-24', '{32,33,36,5,37}'::int[]),
  (2, 1, 'Personajes difíciles de olvidar', 'Historias protagonizadas por personas bastante complicadas', '2026-03-03', '{36,26,33}'),
  (3, 1, 'No todo está bien', 'Distopías que se parecen demasiado a nosotros', '2026-01-09', '{5,4,30,31,34}'),
  (4, 1, 'Lecturas para noches largas', 'Libros que siguen contigo después de cerrar la última página', '2025-10-18', '{34,35,37}'),
  (5, 2, 'Amar también es complicarse la vida', 'Historias donde enamorarse es apenas el comienzo del problema.', '2026-08-24', '{73,25,26}'),
  (6, 2, 'La vida que pudo haber sido', 'Para pensar en todas las versiones de nosotros que quedaron atrás.', '2026-03-03', '{72,34}'),
  (7, 2, 'Después de leer esto, llama a alguien', 'Historias que te dejan emocionalmente poco presentable.', '2026-01-09', '{73,40,7}'),
  (8, 2, 'Cartas que nunca enviamos', 'Novelas sobre todo lo que no se dijo a tiempo.', '2025-10-18', '{26,72}'),
  (9, 3, 'Tu vida no cabe en un catálogo', 'Tienes demasiadas cosas y todavía sientes que te falta algo.', '2026-08-24', '{42,33,70}'),
  (10, 3, 'Manual para no encajar', 'Para los que nunca entendieron por qué había que seguir las reglas.', '2026-03-03', '{42,43,32}'),
  (11, 3, 'Todo está bajo control. Claro que sí.', 'Sociedades perfectas, ciudadanos obedientes y algo que huele bastante mal.', '2026-01-09', '{30,5,4}'),
  (12, 3, 'No leas esto un lunes', 'Libros que te van a quitar las ganas de volver a la oficina.', '2025-10-18', '{42,53}'),
  (13, 4, 'Las cosas que no se lleva el tiempo', 'Hay recuerdos que se niegan a quedarse en el pasado.', '2026-08-24', '{6,7,39}'),
  (14, 4, 'En esta casa pasan cosas', 'Casas con secretos, visitas inesperadas y algún que otro fantasma.', '2026-03-03', '{7,38,37}'),
  (15, 4, 'Las mujeres que vinieron antes', 'Algunas historias comienzan mucho antes de que nazcamos.', '2026-01-09', '{7,40,18}'),
  (16, 4, 'Historias de sobremesa', 'Relatos que se heredan de generación en generación.', '2025-10-18', '{6,40,20}')
) AS d (n, librero, titulo, descripcion, fecha, libros)
ON CONFLICT DO NOTHING;

-- Algunos lectores siguen a los libreros.
INSERT INTO librero_seguidores (librero_id, usuario_id)
SELECT ('cccccccc-0000-4000-8000-' || lpad(l::text, 12, '0'))::uuid, ('aaaaaaaa-0000-4000-8000-' || lpad(u::text, 12, '0'))::uuid
FROM (VALUES (1,1),(1,3),(1,5),(2,2),(2,4),(2,6),(3,1),(3,5),(4,2),(4,3),(4,4),(4,6),(5,6)) AS d (l, u)
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------- reseñas
-- Dos reseñas de lectores por libro (HU-005: "al menos 2 reseñas por libro",
-- marcadas como compra verificada). Cada libro n la reciben los lectores
-- ((n-1) mod 6)+1 y ((n+2) mod 6)+1.
WITH datos (n, c1, t1, c2, t2) AS (VALUES
  (1, 5, 'La psicohistoria es una idea brillante. Me leí la trilogía completa en un mes.', 4, 'Más ideas que personajes, pero qué ideas. Un clásico que envejeció muy bien.'),
  (2, 5, 'El mundo más completo que he leído en ciencia ficción. Arrakis se siente real.', 4, 'El comienzo cuesta, después no lo puedes soltar.'),
  (3, 4, 'Lo leí en el e-book y fue perfecto para el viaje. Muy adelantado a su época.', 4, 'Denso, pero entiendes de dónde salió todo el ciberpunk.'),
  (4, 5, 'Corto y demoledor. Debería ser lectura obligatoria en el colegio.', 4, 'Me hizo pensar en cuánto tiempo paso frente a pantallas.'),
  (5, 5, 'Cada vez que lo releo encuentro algo nuevo y más inquietante.', 5, 'Imprescindible. El final me dejó en silencio.'),
  (6, 5, 'Macondo me acompañó todo el verano. Una obra maestra.', 5, 'Hay que leerlo con calma, cada página tiene algo.'),
  (7, 5, 'Las mujeres de la familia Trueba son inolvidables.', 4, 'Hermosa y dura a la vez. La parte final me partió el corazón.'),
  (8, 4, 'Lo leí en el orden del tablero y fue una experiencia única.', 5, 'La Maga es uno de los personajes más bellos de la literatura.'),
  (9, 5, 'Bolaño escribe como nadie. El viaje a Sonora es épico.', 4, 'Largo pero muy entretenido, se siente como una aventura.'),
  (10, 5, 'La releí antes de ver las películas y la disfruté aún más.', 5, 'Tolkien inventó un mundo entero. Imprescindible.'),
  (11, 5, 'Se lo leí a mi hijo antes de dormir y quedamos los dos encantados.', 5, 'El mejor libro para empezar con la fantasía.'),
  (12, 5, 'Volví a sentirme de once años. Lo recomiendo a cualquier edad.', 5, 'Mi hija lo terminó en dos días y ya me pidió el segundo.'),
  (13, 5, 'Kvothe es un narrador fascinante. Necesito el tercer libro ya.', 4, 'Algo lento al inicio, pero la prosa es preciosa.'),
  (14, 5, 'El final es uno de los mejores giros que he leído.', 4, 'Poirot en su mejor momento. Se lee en una tarde.'),
  (15, 4, 'Diálogos afilados y un detective sin escrúpulos. Puro noir.', 4, 'Un clásico del género, se nota la influencia en todo lo que vino después.'),
  (16, 5, 'Lisbeth Salander es un personaje inolvidable.', 4, 'Tarda en arrancar pero después no pude parar.'),
  (17, 5, 'Los poemas que todos citamos alguna vez. Hermosa edición.', 5, 'Se lo regalé a mi pareja y fue un acierto.'),
  (18, 4, 'Poesía intensa, hay que leerla despacio y en voz alta.', 5, 'Gabriela Mistral merece que la lean más. Me emocionó.'),
  (19, 5, 'Lo leo cada cierto tiempo y siempre me dice algo distinto.', 5, 'El regalo perfecto. Lo esencial es invisible a los ojos.'),
  (20, 5, 'Me reí igual que cuando era niña. Papelucho es eterno.', 5, 'Mis hijos lo adoran, ahora quieren leer todos los de la serie.'),
  (21, 5, 'Te cambia la forma de ver la historia de la humanidad.', 4, 'Muy entretenido, aunque algunas ideas son discutibles.'),
  (22, 4, 'Escucharlo en audiolibro hizo fácil un tema complejo.', 5, 'Hawking explica los agujeros negros como si fuera simple.'),
  (23, 5, 'Un libro necesario para entender América Latina.', 4, 'Algunos datos están desactualizados, pero sigue siendo potente.'),
  (24, 5, 'Isabel Allende en su mejor forma. Llegó justo en la preventa.', 4, 'Dos historias paralelas muy bien entrelazadas.'),
  (25, 5, 'Elizabeth Bennet es la heroína más ingeniosa de los clásicos.', 4, 'Los diálogos son una delicia. Lo disfruté mucho.'),
  (26, 4, 'Emma Bovary me exasperó y me conmovió a partes iguales.', 4, 'Una prosa perfecta, aunque la historia es amarga.'),
  (27, 5, 'Contado en cartas y diarios, da mucho más miedo de lo que esperaba.', 4, 'Un clásico del terror que sigue funcionando.'),
  (28, 5, 'Nada que ver con las películas: la criatura es trágica y profunda.', 4, 'Me sorprendió lo actual que se siente.'),
  (29, 5, 'Largo, aterrador y sobre todo un libro sobre la amistad.', 4, 'Mil páginas que se pasan volando. No lo leas de noche.'),
  (30, 5, 'Da más miedo que 1984 porque aquí nadie se rebela.', 4, 'Un clásico que dialoga muy bien con el presente.'),
  (31, 5, 'Brutal y necesario. Saramago no da tregua.', 4, 'Cuesta acostumbrarse a su estilo, pero vale la pena.'),
  (32, 4, 'Absurdo y angustiante, tal como lo prometían.', 4, 'Hay que leerlo con paciencia. Muy kafkiano, claro.'),
  (33, 5, 'Corto e intenso. Meursault no se me va de la cabeza.', 4, 'Un libro para releer y discutir con amigos.'),
  (34, 5, 'Terminé llorando. Ishiguro construye una tristeza muy delicada.', 4, 'Lento pero con un impacto enorme al final.'),
  (35, 5, 'Klara es uno de los narradores más tiernos que he leído.', 4, 'Una reflexión preciosa sobre qué nos hace humanos.'),
  (36, 4, 'Extraño e inquietante. No es para todos, pero me atrapó.', 5, 'Han Kang merecía el Nobel. Un libro que incomoda.'),
  (37, 5, 'No se parece a nada que haya leído antes. Mágico.', 5, 'Lo empecé sin saber nada y fue la mejor decisión.'),
  (38, 5, 'Corto, misterioso y perfecto. Lo leí en una noche.', 4, 'Hay que prestar atención a las voces, pero es una joya.'),
  (39, 5, 'Una autora chilena que todos deberíamos conocer.', 4, 'Poética y extraña. Me dejó pensando varios días.'),
  (40, 4, 'Cada capítulo empieza con una receta, qué idea tan linda.', 5, 'Romántica y divertida. Me dio hambre todo el tiempo.'),
  (41, 5, 'Grenouille es un personaje fascinante y repulsivo.', 4, 'Los olores se sienten en cada página. Muy original.'),
  (42, 4, 'Mucho mejor que la película. El giro funciona igual.', 4, 'Una sátira feroz del consumismo. No es cómodo, y está bien.'),
  (43, 4, 'El lenguaje inventado cuesta al inicio, después es parte del encanto.', 5, 'Un clásico incómodo sobre el libre albedrío.'),
  (44, 5, 'Debería leerlo todo el mundo al menos una vez.', 5, 'Me ayudó en un momento difícil. Muy humano.'),
  (45, 5, 'Aprendí más filosofía con este libro que en el colegio.', 4, 'La trama es una excusa, pero las explicaciones son excelentes.'),
  (46, 5, 'Lo tengo en el velador y leo un par de páginas cada noche.', 4, 'Sorprende lo actuales que son estos consejos.'),
  (47, 5, 'Sagan contagia el asombro por el universo.', 4, 'Algunos datos envejecieron, pero el espíritu sigue intacto.'),
  (48, 4, 'Un libro que cambió la historia del ambientalismo.', 4, 'Denso, pero muy revelador.'),
  (49, 5, 'Periodismo en estado puro. Te deja sin palabras.', 4, 'Corto y estremecedor.'),
  (50, 4, 'Una biografía muy completa, sin endulzar al personaje.', 5, 'Imprescindible si te interesa la tecnología.'),
  (51, 5, 'Divertida y desgarradora a la vez. Las viñetas son increíbles.', 5, 'La mejor forma de entender la historia de Irán.'),
  (52, 5, 'Práctico y fácil de aplicar. Cambié varias rutinas.', 4, 'Repite algunas ideas, pero funcionan.'),
  (53, 4, 'Me hizo pensar distinto sobre el dinero.', 3, 'Interesante, aunque algunos consejos hay que tomarlos con cuidado.'),
  (54, 4, 'Muy útil para quien está empezando un emprendimiento.', 4, 'El concepto de producto mínimo viable me cambió el enfoque.'),
  (55, 4, 'Entretenido y lleno de datos curiosos.', 4, 'Ideal para conversar en una sobremesa.'),
  (56, 4, 'Corto y directo, ideal para equipos de marketing.', 3, 'La idea central es buena, el resto se alarga.'),
  (57, 5, 'Te hace dudar de cada decisión que tomas. Excelente.', 4, 'Exigente, pero vale cada página.'),
  (58, 5, 'Una edición preciosa y muy fácil de leer.', 5, 'El mejor regalo para alguien que empieza con el arte.'),
  (59, 4, 'Ensayos lúcidos que siguen vigentes con Instagram.', 4, 'Hay que leerlo con calma, pero abre la cabeza.'),
  (60, 5, 'Nunca volverás a ver una puerta igual.', 4, 'Básico para cualquiera que diseñe algo.'),
  (61, 5, 'Para quienes aman el cine más allá de las películas.', 4, 'Poético y exigente.'),
  (62, 5, 'Te dan ganas de escuchar cada obra que menciona.', 4, 'Largo, pero muy bien escrito.'),
  (63, 4, 'Un manifiesto que hay que leer para entender la arquitectura moderna.', 4, 'Algunas ideas envejecieron, pero es fundamental.'),
  (64, 5, 'El libro más completo sobre tarot que he leído.', 4, 'Muy extenso; lo uso como libro de consulta.'),
  (65, 5, 'Me cambió la forma de acompañar a mis hijos en sus pataletas.', 4, 'Claro y con ejemplos muy concretos.'),
  (66, 4, 'Mucha evidencia y muy bien explicada.', 4, 'Me motivó a cambiar algunos hábitos de alimentación.'),
  (67, 4, 'Me ayudó a bajar la ansiedad. Hay que leerlo sin prisa.', 3, 'Algunas partes se repiten, pero el mensaje es valioso.'),
  (68, 4, 'Una mirada inteligente a la moda y a la sociedad.', 4, 'Académico, pero accesible.'),
  (69, 4, 'Un clásico que sigue funcionando.', 4, 'Lo leí para el trabajo y terminé aplicándolo en mi vida.'),
  (70, 5, 'Inquietante y muy bien argumentado.', 4, 'Menos sorprendente que Sapiens, pero igual vale la pena.'),
  (71, 5, 'Un ensayo breve que todos deberían leer.', 4, 'Sigue siendo increíblemente actual.'),
  (72, 4, 'Woolf escribe como se piensa. Hay que dejarse llevar.', 4, 'No es fácil, pero es hermoso.'),
  (73, 5, 'Connell y Marianne me rompieron el corazón.', 4, 'Muy honesto sobre el amor joven.'),
  (74, 5, 'Me reí en voz alta en el metro. Don''t panic.', 5, 'Absurdo y genial. La respuesta es 42.'),
  (75, 5, 'Un libro sobre los libros que se lee como una novela.', 5, 'Lo regalé tres veces este año.')
)
INSERT INTO resenas (libro_id, usuario_id, tipo, calificacion, comentario, verificada, creado_en)
SELECT ('00000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
       ('aaaaaaaa-0000-4000-8000-' || lpad((((n - 1) % 6) + 1)::text, 12, '0'))::uuid,
       'LECTOR', c1, t1, TRUE, now() - ((n % 20 + 2) || ' days')::interval
FROM datos
UNION ALL
SELECT ('00000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
       ('aaaaaaaa-0000-4000-8000-' || lpad((((n + 2) % 6) + 1)::text, 12, '0'))::uuid,
       'LECTOR', c2, t2, TRUE, now() - ((n % 13 + 1) || ' days')::interval
FROM datos
ON CONFLICT DO NOTHING;

-- Reseñas de libreros (se muestran aparte en la ficha).
INSERT INTO resenas (libro_id, usuario_id, tipo, calificacion, titulo, comentario, verificada, creado_en)
SELECT ('00000000-0000-4000-8000-' || lpad(libro::text, 12, '0'))::uuid,
       -- El librero 5 es Lucía, la usuaria LIBRERO del Hito 2.
       CASE WHEN librero = 5 THEN '22222222-2222-4222-8222-222222222222'::uuid
            ELSE ('bbbbbbbb-0000-4000-8000-' || lpad(librero::text, 12, '0'))::uuid END,
       'LIBRERO', calificacion, titulo, comentario, FALSE, now() - (dias || ' days')::interval
FROM (VALUES
  (35, 1, 5, 'Ternura artificial', 'Ishiguro vuelve a hablar de lo que significa querer a alguien, esta vez desde los ojos de una máquina. Imprescindible.', 3),
  (5, 1, 5, 'Siempre vigente', 'La novela que más regalo. Cada década encuentra lectores nuevos y siempre parece escrita para su tiempo.', 20),
  (73, 2, 5, 'Amor joven sin filtros', 'Rooney retrata como pocas lo difícil que es decir lo que uno siente. Ideal para leer de una sentada.', 4),
  (25, 2, 5, 'El romance perfecto', 'Ingenio, ironía y un malentendido que dura trescientas páginas. Nunca falla.', 25),
  (42, 3, 4, 'Incómodo a propósito', 'Una sátira que sigue molestando treinta años después. Si te incomoda, está funcionando.', 2),
  (7, 4, 5, 'La casa de las mujeres', 'Una saga familiar que mezcla política, amor y fantasmas. La puerta de entrada perfecta a Allende.', 6),
  (6, 4, 5, 'Macondo para siempre', 'El realismo mágico en su forma más pura. Anoten los nombres de los Buendía, se van a confundir.', 30),
  (17, 5, 5, 'Para leer en voz alta', 'Los poemas de amor más leídos en español. Perfectos para regalar.', 10)
) AS d (libro, librero, calificacion, titulo, comentario, dias)
ON CONFLICT DO NOTHING;

-- Calificación y cantidad de opiniones calculadas desde las reseñas.
UPDATE libros l SET
  calificacion = COALESCE(r.promedio, 0),
  opiniones    = COALESCE(r.cantidad, 0)
FROM (SELECT libro_id, ROUND(AVG(calificacion), 1) AS promedio, COUNT(*)::int AS cantidad
        FROM resenas GROUP BY libro_id) r
WHERE l.id = r.libro_id;

-- ----------------------------------------------------------------- cupones
INSERT INTO cupones (codigo, descripcion, tipo, valor, monto_minimo, usos_maximos, un_uso_por_usuario, vigente_desde, vigente_hasta) VALUES
  ('BIENVENIDA10', '10% de descuento en tu primera compra', 'PORCENTAJE', 10, 0, NULL, TRUE, '2026-01-01', NULL),
  ('LIBRERO15', '15% en compras desde $30.000', 'PORCENTAJE', 15, 30000, NULL, FALSE, '2026-01-01', '2026-12-31 23:59:59-03'),
  ('DESCUENTO5000', '$5.000 de descuento en compras desde $20.000', 'MONTO_FIJO', 5000, 20000, 500, FALSE, '2026-01-01', NULL),
  ('VERANO2025', 'Campaña de verano (vencida, para probar CUPON_VENCIDO)', 'PORCENTAJE', 20, 0, NULL, FALSE, '2025-01-01', '2025-03-31 23:59:59-03')
ON CONFLICT DO NOTHING;

-- --------------------------------------------------------- club de lectura
INSERT INTO clubes_lectura (id, libro_id, creador_id, titulo, descripcion, fecha_inicio, fecha_fin) VALUES
  ('eeeeeeee-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000006', 'bbbbbbbb-0000-4000-8000-000000000004',
   'Club de lectura: Cien años de soledad', 'Leemos cuatro capítulos por semana y conversamos los jueves.', '2026-10-01', '2026-11-30')
ON CONFLICT DO NOTHING;

INSERT INTO club_participantes (club_id, usuario_id, pagina_actual, porcentaje)
SELECT 'eeeeeeee-0000-4000-8000-000000000001', usuario, pagina, porcentaje
FROM (VALUES
  ('bbbbbbbb-0000-4000-8000-000000000004'::uuid, 180, 36),
  ('aaaaaaaa-0000-4000-8000-000000000002'::uuid, 120, 24),
  ('aaaaaaaa-0000-4000-8000-000000000003'::uuid, 95, 19),
  ('33333333-3333-4333-8333-333333333333'::uuid, 60, 12)
) AS d (usuario, pagina, porcentaje)
ON CONFLICT DO NOTHING;

INSERT INTO club_hilos (id, club_id, usuario_id, titulo, contenido) VALUES
  ('ffffffff-0000-4000-8000-000000000001', 'eeeeeeee-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000004',
   '¿Qué les pareció la fundación de Macondo?', 'Me encanta cómo los primeros capítulos mezclan lo cotidiano con lo fantástico sin pedir permiso. ¿Con qué personaje se quedaron?')
ON CONFLICT DO NOTHING;

INSERT INTO club_comentarios (id, hilo_id, usuario_id, contenido) VALUES
  ('ffffffff-0000-4000-8000-000000000101', 'ffffffff-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000002',
   'Con Úrsula, sin duda. Ella sostiene a toda la familia.'),
  ('ffffffff-0000-4000-8000-000000000102', 'ffffffff-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000003',
   'Yo me quedo con Melquíades y sus inventos. ¡El hielo!')
ON CONFLICT DO NOTHING;
