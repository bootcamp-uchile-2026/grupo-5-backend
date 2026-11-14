# Modelo de datos y migraciones

PostgreSQL 16 con TypeORM. **La estructura y los datos de prueba se crean solo con migraciones de TypeORM**
(`src/database/migrations`); no hay scripts SQL que ejecutar a mano y el ORM nunca sincroniza el esquema
por su cuenta (`synchronize: false`).

El diagrama entidad-relación completo (24 tablas) y las decisiones de modelado están en
[`docs/modelo-datos.md`](https://github.com/bootcamp-uchile-2026/grupo-5-backend/blob/main/docs/modelo-datos.md).

## Migraciones

| # | Migración | Qué hace |
|---|---|---|
| 1 | `EsquemaInicial` | Hito 2: usuarios, libros, carrito, pedidos y pagos |
| 2 | `DatosPruebaIniciales` | Hito 2: 3 cuentas (una por rol) y 24 libros |
| 3 | `EsquemaHito3` | Cuenta, ficha ampliada, categorías, reseñas, libreros, listas, club, cupones, newsletter, invitados |
| 4 | `DatosPruebaHito3` | Categorías del menú, 51 libros más, libreros, reseñas, cupones y un club |
| 5 | `CierreHito3` | Imágenes, direcciones guardadas, preguntas al librero, datos del despacho, versión de sesión |
| 6 | `DatosPruebaCierreHito3` | Subgénero de todos los libros, galería y video para la demo |

## Cómo se usan

| Cuándo | Qué pasa |
|---|---|
| Al arrancar la API | Aplica sola las migraciones pendientes (`DB_MIGRAR_AL_INICIAR=true`) |
| Ver el estado | `npm run migration:show` (en el servidor: `docker compose exec api npm run typeorm -- migration:show`) |
| Revertir la última | `npm run migration:revert` |
| Crear una nueva desde las entidades | `npm run migration:generate -- src/database/migrations/NombreDelCambio` |
| Empezar de cero en local | `npm run db:reset` |

Cada migración tiene su `down`. Las ejecutadas quedan registradas en la tabla `migraciones_typeorm`.

## Datos de prueba

75 libros (todas las categorías del menú, con reseñas), 5 libreros, cupones, un club de lectura y cuentas de
ejemplo: `cliente@`, `librero@` y `admin@leeconnos.cl`, más los libreros de los wireframes. La contraseña de
desarrollo está en la migración `DatosPruebaIniciales`.
