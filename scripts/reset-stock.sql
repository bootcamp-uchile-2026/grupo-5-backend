-- Repone el stock de los libros de prueba a los valores de db/02-seed.sql y
-- db/04-hito3-seed.sql. Cada pedido de prueba descuenta stock real, compartido
-- por Web, Mobile y docentes: conviene ejecutarlo antes de una revisión.
--   npm run db:reset-stock
-- No borra pedidos, usuarios ni reseñas. Los pedidos que siguen pendientes de
-- pago se cancelan, porque su stock reservado queda repuesto aquí.
BEGIN;

UPDATE pedidos SET estado = 'CANCELADO', cancelado_en = now()
 WHERE estado = 'PENDIENTE_PAGO';

UPDATE libros l SET stock = s.stock, activo = TRUE
FROM (VALUES
  (1, 8), (2, 5), (3, 99), (4, 10), (5, 12), (6, 7), (7, 6), (8, 4), (9, 3), (10, 9),
  (11, 0), (12, 15), (13, 2), (14, 6), (15, 4), (16, 5), (17, 20), (18, 8), (19, 14), (20, 9),
  (21, 6), (22, 99), (23, 5), (24, 25), (25, 10), (26, 6), (27, 7), (28, 8), (29, 5), (30, 9),
  (31, 6), (32, 7), (33, 8), (34, 5), (35, 6), (36, 4), (37, 6), (38, 7), (39, 5), (40, 6),
  (41, 8), (42, 5), (43, 7), (44, 10), (45, 6), (46, 9), (47, 5), (48, 4), (49, 6), (50, 6),
  (51, 4), (52, 12), (53, 9), (54, 5), (55, 6), (56, 4), (57, 5), (58, 3), (59, 4), (60, 4),
  (61, 3), (62, 3), (63, 3), (64, 4), (65, 6), (66, 5), (67, 8), (68, 3), (69, 7), (70, 6),
  (71, 7), (72, 5), (73, 6), (74, 8), (75, 8)
) AS s (n, stock)
WHERE l.id = ('00000000-0000-4000-8000-' || lpad(s.n::text, 12, '0'))::uuid;

COMMIT;
