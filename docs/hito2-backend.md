# Backend · Estado frente a las bases del Hito 2

Entrega: 17 de octubre de 2026, 08:59. Este documento contrasta cada requisito de "Aplicación Backend"
de las bases con lo que existe en el repositorio, y sirve de guion para la presentación y el video.

## Cambio de foco respecto del Hito 1

En el Hito 1 se construyeron los módulos diferenciales (recomendaciones, club de lectura, libreros) sobre
datos en memoria. La Arquitectura Funcional del Hito 2 pide soportar los recorridos básicos de compra, así
que el esfuerzo se movió a los flujos core:

| Flujo de la Arquitectura Funcional | Servicio | Estado |
|---|---|---|
| Explorar, buscar y filtrar productos | `GET /libros`, `GET /libros/generos` | Funcional (PostgreSQL) |
| Consultar el detalle de un producto | `GET /libros/:id` | Funcional |
| Agregar al carrito / modificar el carrito | `/carrito/*` | Funcional |
| Checkout | `POST /envios/cotizar` → `POST /pedidos` → `POST /pagos` | Pedido funcional; envío y pago dummy |
| Registrarse o iniciar sesión | `/auth/registro`, `/auth/login` | Funcional (JWT real) |
| Gestionar la cuenta | `/auth/me`, `PATCH /usuarios/:id` | Funcional |
| Consultar o seguir una compra | `GET /pedidos`, `GET /pedidos/:id/seguimiento` | Historial funcional; seguimiento dummy |

Reseñas, listas de deseos, libreros y club de lectura no cambian: es el mismo código del Hito 1, en memoria.

## Checklist de las bases

| Requisito | Cómo se resolvió | Estado |
|---|---|---|
| Principales servicios para los flujos priorizados | 58 operaciones en 13 módulos (`docs/servicios.md`) | Listo |
| Servicios dummy donde falta lógica definitiva | Envío, pago y seguimiento, con reglas documentadas | Listo |
| DTO de entrada y salida | Un DTO por request y por response en cada módulo (`dto/`) | Listo |
| Validaciones de entrada (pipes) | `ValidationPipe` global estricto + `UuidPipe` en parámetros de ruta | Listo |
| Id único de request en el header `x-request-id` | `RequestLoggerMiddleware` | Listo |
| Log con id, fecha y hora, method, path y body | Línea `-->` por petición; oculta contraseñas y tarjetas | Listo |
| Tiempo de ejecución (flujo ok o de error) | Se mide al terminar de enviar la respuesta | Listo |
| Log con id, tiempo de ejecución y código de respuesta | Línea `<--` por petición | Listo |
| Errores personalizados + filtro | `AppException` y 20 subclases; `AllExceptionsFilter` global | Listo |
| Respuestas coherentes con los contratos | Mapeo explícito entidad → DTO de respuesta; pruebas e2e | Listo |
| OpenAPI/Swagger con validaciones y estructuras | `/docs`: 58 operaciones, 48 schemas, errores por endpoint | Listo |
| Variables de entorno identificadas y documentadas | `.env.example`, README, validación al arrancar | Listo |
| README.md | Actualizado | Listo |
| Primera versión del modelo de datos + ER | `docs/modelo-datos.md` (6 tablas) | Listo |
| Scripts de estructura y datos de prueba | `db/01-schema.sql`, `db/02-seed.sql`, `npm run db:setup` | Listo |
| Preparada para un ambiente de servidor | Config por entorno, `/health`, apagado ordenado, CORS configurable | Listo |
| Imagen Docker | `Dockerfile` multi-etapa y `docker-compose.yml` escritos | **Falta construirla y probarla** |
| Contenedor de base de datos | Servicio `db` en `docker-compose.yml` | **Falta levantarlo en el servidor** |
| Aplicación desplegada en la nube | Pasos en `docs/despliegue.md` | **Pendiente** |
| Revisar contratos con Frontend y Mobile | Cambios listados en `docs/servicios.md` §5 | **Pendiente (reunión)** |
| Backlog actualizado | `docs/backlog-backend-leeconnos-hito2.xlsx` (88 tareas) | Falta pasarlo al tablero y asignar responsables |

## Cómo se verificó

- `npm run build` sin errores.
- `npm run test:e2e`: 23 de 23 pruebas aprobadas contra un PostgreSQL real con los scripts de `db/`.
  Cubren trazabilidad, auth y roles, búsqueda y filtros, reglas de envío, carrito, checkout con descuento de
  stock, pagos aprobados y rechazados, seguimiento, cancelación y aislamiento entre usuarios.
- API compilada levantada y recorrida a mano: Swagger en `/docs`, alta y baja de libros como LIBRERO,
  importación desde Open Library, entrega fallida por dirección sin número, sin cobertura en el checkout.
- **No verificado:** construcción de la imagen Docker, `docker compose up` y el despliegue en la nube.

## Guion sugerido para el video (parte Backend)

1. `docker compose ps` y `GET /health` en el servidor: API y base arriba.
2. Swagger: recorrer los tags y mostrar un DTO con sus validaciones.
3. Validación: `POST /auth/registro` con datos malos → `400` con `detalles` por campo.
4. Login y botón **Authorize**. Una ruta privada sin token → `401 TOKEN_REQUERIDO`.
5. Catálogo: `GET /libros?q=asimov`, luego `genero=Fantasía&precioMax=13000&enStock=true`.
6. Carrito: agregar "Fundación"; agregar "El hobbit" → `409 STOCK_INSUFICIENTE`.
7. Envío: cotizar RM ($2.990) y comuna "Isla de Pascua" → `422`.
8. Checkout: `POST /pedidos`; mostrar en la base que el stock bajó.
9. Pago: tarjeta terminada en `0002` → `402`; luego `4111111111111111` → aprobado.
10. Seguimiento: consultar dos veces con un minuto de diferencia para ver avanzar el estado.
11. Logs: `docker compose logs api` y seguir una petición por su `x-request-id`, con tiempo y código.
12. Base de datos: `SELECT` de `pedidos` y `pagos`, y el diagrama ER.

## Para el Hito 3

1. Pasar reseñas, listas de deseos, libreros y club de lectura a PostgreSQL y protegerlos con token.
2. "Reseña de cliente verificado": validar contra pedidos pagados (T-B09-4).
3. Reemplazar los dummy de pago y envío por integraciones reales o de sandbox.
4. Ranking y top ventas a partir de `pedido_items` (T-B15-3).
5. HTTPS, respaldo de la base e integración continua.
6. Pruebas unitarias por módulo, además de las e2e.
