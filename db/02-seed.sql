-- LeeConNos · Hito 2 · Datos de prueba
-- Idempotente: si los registros ya existen no los duplica ni los pisa.

-- Usuarios de prueba. Los tres usan la contraseña de desarrollo "LeeConNos2026"
-- (hash bcrypt). Cambiarla o eliminarlos antes de usar datos reales.
INSERT INTO usuarios (id, nombre, email, password_hash, rol, generos_favoritos) VALUES
  ('11111111-1111-4111-8111-111111111111', 'Admin LeeConNos', 'admin@leeconnos.cl',
   '$2b$10$4oSrcbZDf0NamZJRZvtjd.GB4lCrkNVBaJMZ3KWx8tm/D0H1IfISu', 'ADMIN', '{}'),
  ('22222222-2222-4222-8222-222222222222', 'Lucía Librera', 'librero@leeconnos.cl',
   '$2b$10$4oSrcbZDf0NamZJRZvtjd.GB4lCrkNVBaJMZ3KWx8tm/D0H1IfISu', 'LIBRERO', '{"Novela","Poesía"}'),
  ('33333333-3333-4333-8333-333333333333', 'Camila Rojas', 'cliente@leeconnos.cl',
   '$2b$10$4oSrcbZDf0NamZJRZvtjd.GB4lCrkNVBaJMZ3KWx8tm/D0H1IfISu', 'CLIENTE', '{"Ciencia ficción","Fantasía"}')
ON CONFLICT DO NOTHING;

-- Catálogo. Casos pensados para la demo:
--   · "El hobbit" tiene stock 0            -> STOCK_INSUFICIENTE al agregarlo al carrito
--   · "El nombre del viento" tiene stock 2 -> error al pedir 3 unidades
--   · "El viento conoce mi nombre" está en PREVENTA
--   · hay un EBOOK y un AUDIOLIBRO para probar el filtro por formato
INSERT INTO libros
  (id, isbn, titulo, autor, genero, editorial, anio_publicacion, formato, estado, precio, stock, descripcion, fecha_ingreso)
VALUES
  ('00000000-0000-4000-8000-000000000001', '9780553293357', 'Fundación', 'Isaac Asimov', 'Ciencia ficción', 'Bantam', 1951, 'FISICO', 'DISPONIBLE', 12990, 8,
   'El matemático Hari Seldon predice la caída del Imperio Galáctico y crea la Fundación para acortar la era de barbarie.', now() - interval '60 days'),
  ('00000000-0000-4000-8000-000000000002', '9780441172719', 'Dune', 'Frank Herbert', 'Ciencia ficción', 'Ace', 1965, 'FISICO', 'DISPONIBLE', 15990, 5,
   'Paul Atreides llega a Arrakis, el único planeta donde existe la especia, el recurso más valioso del universo.', now() - interval '55 days'),
  ('00000000-0000-4000-8000-000000000003', '9780441569595', 'Neuromante', 'William Gibson', 'Ciencia ficción', 'Ace', 1984, 'EBOOK', 'DISPONIBLE', 7990, 99,
   'La novela que definió el ciberpunk: un hacker caído en desgracia recibe un último encargo.', now() - interval '50 days'),
  ('00000000-0000-4000-8000-000000000004', '9781451673319', 'Fahrenheit 451', 'Ray Bradbury', 'Ciencia ficción', 'Simon & Schuster', 1953, 'FISICO', 'DISPONIBLE', 9990, 10,
   'En un futuro donde los libros están prohibidos, un bombero empieza a dudar de su oficio: quemarlos.', now() - interval '45 days'),
  ('00000000-0000-4000-8000-000000000005', '9780451524935', '1984', 'George Orwell', 'Ciencia ficción', 'Signet', 1949, 'FISICO', 'DISPONIBLE', 8990, 12,
   'Winston Smith intenta conservar su humanidad bajo la vigilancia permanente del Gran Hermano.', now() - interval '40 days'),
  ('00000000-0000-4000-8000-000000000006', '9780307474728', 'Cien años de soledad', 'Gabriel García Márquez', 'Novela', 'Vintage Español', 1967, 'FISICO', 'DISPONIBLE', 13990, 7,
   'La historia de la familia Buendía a lo largo de siete generaciones en el pueblo de Macondo.', now() - interval '38 days'),
  ('00000000-0000-4000-8000-000000000007', '9781501117015', 'La casa de los espíritus', 'Isabel Allende', 'Novela', 'Atria', 1982, 'FISICO', 'DISPONIBLE', 12990, 6,
   'La saga de la familia Trueba, entre el amor, la política y lo sobrenatural.', now() - interval '36 days'),
  ('00000000-0000-4000-8000-000000000008', '9788437604572', 'Rayuela', 'Julio Cortázar', 'Novela', 'Cátedra', 1963, 'FISICO', 'DISPONIBLE', 14990, 4,
   'Una novela que se puede leer en más de un orden, entre París y Buenos Aires.', now() - interval '34 days'),
  ('00000000-0000-4000-8000-000000000009', '9788433920836', 'Los detectives salvajes', 'Roberto Bolaño', 'Novela', 'Anagrama', 1998, 'FISICO', 'DISPONIBLE', 16990, 3,
   'Arturo Belano y Ulises Lima buscan a una poeta desaparecida en el desierto de Sonora.', now() - interval '32 days'),
  ('00000000-0000-4000-8000-000000000010', '9780547928210', 'La comunidad del anillo', 'J. R. R. Tolkien', 'Fantasía', 'Mariner', 1954, 'FISICO', 'DISPONIBLE', 16990, 9,
   'Frodo Bolsón hereda un anillo y debe emprender un viaje para destruirlo.', now() - interval '30 days'),
  ('00000000-0000-4000-8000-000000000011', '9780547928227', 'El hobbit', 'J. R. R. Tolkien', 'Fantasía', 'Mariner', 1937, 'FISICO', 'DISPONIBLE', 11990, 0,
   'Bilbo Bolsón sale de su cómoda casa para acompañar a trece enanos en busca de un tesoro.', now() - interval '28 days'),
  ('00000000-0000-4000-8000-000000000012', '9788478884452', 'Harry Potter y la piedra filosofal', 'J. K. Rowling', 'Fantasía', 'Salamandra', 1997, 'FISICO', 'DISPONIBLE', 12990, 15,
   'Harry descubre a los once años que es mago y entra al colegio Hogwarts.', now() - interval '26 days'),
  ('00000000-0000-4000-8000-000000000013', '9780756404741', 'El nombre del viento', 'Patrick Rothfuss', 'Fantasía', 'DAW', 2007, 'FISICO', 'DISPONIBLE', 17990, 2,
   'Kvothe, posadero de un pueblo perdido, relata cómo se convirtió en leyenda.', now() - interval '24 days'),
  ('00000000-0000-4000-8000-000000000014', '9780062073501', 'Asesinato en el Orient Express', 'Agatha Christie', 'Policial', 'Harper', 1934, 'FISICO', 'DISPONIBLE', 8990, 6,
   'Hércules Poirot investiga un crimen en un tren detenido por la nieve.', now() - interval '22 days'),
  ('00000000-0000-4000-8000-000000000015', '9780679722649', 'El halcón maltés', 'Dashiell Hammett', 'Policial', 'Vintage', 1930, 'FISICO', 'DISPONIBLE', 9490, 4,
   'El detective Sam Spade se ve envuelto en la búsqueda de una estatuilla de valor incalculable.', now() - interval '20 days'),
  ('00000000-0000-4000-8000-000000000016', '9780307454546', 'Los hombres que no amaban a las mujeres', 'Stieg Larsson', 'Policial', 'Vintage', 2005, 'FISICO', 'DISPONIBLE', 11490, 5,
   'Un periodista y una hacker investigan una desaparición ocurrida cuarenta años atrás.', now() - interval '18 days'),
  ('00000000-0000-4000-8000-000000000017', '9780143039969', 'Veinte poemas de amor y una canción desesperada', 'Pablo Neruda', 'Poesía', 'Penguin', 1924, 'FISICO', 'DISPONIBLE', 6990, 20,
   'El poemario más leído de Neruda, publicado cuando tenía diecinueve años.', now() - interval '16 days'),
  ('00000000-0000-4000-8000-000000000018', '9789561100015', 'Desolación', 'Gabriela Mistral', 'Poesía', 'Andrés Bello', 1922, 'FISICO', 'DISPONIBLE', 7490, 8,
   'Primer libro de Gabriela Mistral, premio Nobel de Literatura 1945.', now() - interval '14 days'),
  ('00000000-0000-4000-8000-000000000019', '9780156013925', 'El principito', 'Antoine de Saint-Exupéry', 'Infantil', 'Harcourt', 1943, 'FISICO', 'DISPONIBLE', 7990, 14,
   'Un piloto perdido en el desierto conoce a un pequeño príncipe llegado de otro planeta.', now() - interval '12 days'),
  ('00000000-0000-4000-8000-000000000020', '9789561200012', 'Papelucho', 'Marcela Paz', 'Infantil', 'SM', 1947, 'FISICO', 'DISPONIBLE', 5990, 9,
   'El diario de un niño chileno de ocho años con una imaginación sin límites.', now() - interval '10 days'),
  ('00000000-0000-4000-8000-000000000021', '9780062316097', 'Sapiens: de animales a dioses', 'Yuval Noah Harari', 'No ficción', 'Harper', 2011, 'FISICO', 'DISPONIBLE', 18990, 6,
   'Una breve historia de la humanidad, desde los primeros homínidos hasta hoy.', now() - interval '8 days'),
  ('00000000-0000-4000-8000-000000000022', '9780553380163', 'Breve historia del tiempo', 'Stephen Hawking', 'No ficción', 'Bantam', 1988, 'AUDIOLIBRO', 'DISPONIBLE', 9990, 99,
   'Del Big Bang a los agujeros negros, explicado para lectores no especialistas.', now() - interval '6 days'),
  ('00000000-0000-4000-8000-000000000023', '9780853459910', 'Las venas abiertas de América Latina', 'Eduardo Galeano', 'Historia', 'Monthly Review', 1971, 'FISICO', 'DISPONIBLE', 12490, 5,
   'Cinco siglos de historia económica del continente contados como un relato.', now() - interval '4 days'),
  ('00000000-0000-4000-8000-000000000024', '9780593598108', 'El viento conoce mi nombre', 'Isabel Allende', 'Novela', 'Ballantine', 2023, 'FISICO', 'PREVENTA', 19990, 25,
   'Dos niños separados de sus familias, en Viena en 1938 y en Arizona en 2019.', now() - interval '1 day')
ON CONFLICT DO NOTHING;

UPDATE libros SET portada_url = 'https://covers.openlibrary.org/b/isbn/' || isbn || '-L.jpg' WHERE portada_url IS NULL;
