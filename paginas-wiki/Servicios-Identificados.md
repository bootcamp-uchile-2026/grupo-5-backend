# Servicios Identificados

Servicios necesarios para soportar los principales flujos del producto, identificados a partir de la Especificación del Producto, el Backlog, la Arquitectura Funcional y los flujos definidos por UX/UI (incluyendo el Site Map y una sesión de Card Sorting).

## Resumen por módulo

| Módulo | Endpoints | Función clave |
|---|---|---|
| Usuarios | 6 | Registro / login, CRUD de clientes y libreros |
| Libros | 6 | Catálogo + importación de metadatos vía Open Library (ISBN) |
| Libreros | 7 | Perfil editorial, sección curada, seguir librero |
| Recomendaciones ★ | 2 | Motor de recomendaciones — esfuerzo diferencial |
| Club de Lectura ★ | 10 | Hilos de discusión, comentarios, progreso compartido — esfuerzo diferencial |
| Reseñas | 5 | Alta, edición, borrado y consulta de reseñas por libro y por usuario |
| Listas de deseos | 7 | CRUD de listas, agregar/quitar libros, modo "para regalo" |

## Módulo: Usuarios (`/usuarios`)

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/usuarios` | Registrar cliente o librero |
| POST | `/usuarios/login` | Iniciar sesión |
| GET | `/usuarios` | Listar usuarios |
| GET | `/usuarios/:id` | Obtener usuario |
| PATCH | `/usuarios/:id` | Actualizar usuario |
| DELETE | `/usuarios/:id` | Eliminar usuario |

## Módulo: Libros (`/libros`)

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/libros` | Registrar libro en catálogo |
| POST | `/libros/importar-isbn` | Obtener metadatos desde Open Library |
| GET | `/libros?genero=&autor=` | Listar/filtrar catálogo |
| GET | `/libros/:id` | Obtener libro |
| PATCH | `/libros/:id` | Actualizar libro |
| DELETE | `/libros/:id` | Eliminar libro |

**Integración externa:** `GET https://openlibrary.org/api/books?bibkeys=ISBN:{isbn}&format=json&jscmd=data` (gratuita, sin API key).

## Módulo: Libreros (`/libreros`)

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/libreros` | Crear perfil editorial |
| GET | `/libreros` | Listar perfiles |
| GET | `/libreros/:id` | Obtener perfil |
| PATCH | `/libreros/:id` | Actualizar perfil |
| POST | `/libreros/:id/seguir/:usuarioId` | Seguir a un librero |
| POST | `/libreros/:id/seccion-curada` | Agregar libro a sección curada |
| GET | `/libreros/:id/seccion-curada` | Ver sección curada |

## Módulo: Recomendaciones (`/recomendaciones`) ★

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/recomendaciones/usuario/:usuarioId?limite=` | Generar recomendaciones personalizadas |
| POST | `/recomendaciones/usuario/:usuarioId/compras` | (Simulado) Registrar compra para el motor |

**Lógica del motor (v1):** `score = 0.6 × coincidencia de género favorito + 0.4 × coincidencia de historial de compras`, ordenado descendentemente, excluyendo libros ya comprados.

## Módulo: Club de Lectura (`/club-lectura`) ★

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/club-lectura` | Crear club de lectura |
| GET | `/club-lectura` | Listar clubes |
| GET | `/club-lectura/:id` | Obtener club |
| POST | `/club-lectura/:id/participantes/:usuarioId` | Unirse a un club |
| POST | `/club-lectura/:id/hilos` | Crear hilo de discusión |
| GET | `/club-lectura/:id/hilos` | Listar hilos |
| POST | `/club-lectura/hilos/:hiloId/comentarios` | Comentar un hilo |
| GET | `/club-lectura/hilos/:hiloId/comentarios` | Listar comentarios |
| PUT | `/club-lectura/:id/progreso/:usuarioId` | Actualizar progreso de lectura |
| GET | `/club-lectura/:id/progreso` | Ver progreso compartido |

## Módulo: Reseñas (`/resenas`)

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/resenas` | Crear reseña |
| GET | `/resenas/libro/:libroId` | Listar reseñas de un libro |
| GET | `/resenas/usuario/:usuarioId` | Listar reseñas de un usuario ("Mis reseñas") |
| PATCH | `/resenas/:id` | Actualizar reseña |
| DELETE | `/resenas/:id` | Eliminar reseña |

## Módulo: Listas de deseos (`/listas-deseos`)

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/listas-deseos` | Crear lista de deseos |
| GET | `/listas-deseos/usuario/:usuarioId` | Listar listas de un usuario |
| GET | `/listas-deseos/:id` | Obtener lista |
| PATCH | `/listas-deseos/:id` | Actualizar lista |
| POST | `/listas-deseos/:id/libros` | Agregar libro a la lista |
| DELETE | `/listas-deseos/:id/libros/:libroId` | Quitar libro de la lista |
| DELETE | `/listas-deseos/:id` | Eliminar lista |

---
Ver también: [DTOs de Entrada y Salida](DTOs-de-Entrada-y-Salida) · [Sistemas Identificados](Sistemas-Identificados) · [Documentación OpenAPI / Swagger](Documentacion-OpenAPI-Swagger)
