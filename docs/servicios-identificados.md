# Servicios identificados — Backend LeeConNos (Hito 1)

Este documento resume los servicios de la API identificados a partir de la
Especificación del Producto, el Backlog, la Arquitectura Funcional y los flujos
definidos por UX/UI. La documentación interactiva y siempre actualizada está
disponible en `/docs` (Swagger) al levantar el proyecto.

## Módulo: Usuarios (`/usuarios`)

| Método | Ruta | Descripción | DTO entrada | DTO salida |
|---|---|---|---|---|
| POST | `/usuarios` | Registrar cliente o librero | `CreateUsuarioDto` | `Usuario` |
| POST | `/usuarios/login` | Iniciar sesión | `LoginUsuarioDto` | `{ accessToken, usuario }` |
| GET | `/usuarios` | Listar usuarios | — | `Usuario[]` |
| GET | `/usuarios/:id` | Obtener usuario | — | `Usuario` |
| PATCH | `/usuarios/:id` | Actualizar usuario | `UpdateUsuarioDto` | `Usuario` |
| DELETE | `/usuarios/:id` | Eliminar usuario | — | — |

## Módulo: Libros (`/libros`)

| Método | Ruta | Descripción | DTO entrada | DTO salida |
|---|---|---|---|---|
| POST | `/libros` | Registrar libro en catálogo | `CreateLibroDto` | `Libro` |
| POST | `/libros/importar-isbn` | Obtener metadatos desde Open Library | `ImportarLibroPorIsbnDto` | `Partial<CreateLibroDto>` |
| GET | `/libros?genero=&autor=` | Listar/filtrar catálogo | — | `Libro[]` |
| GET | `/libros/:id` | Obtener libro | — | `Libro` |
| PATCH | `/libros/:id` | Actualizar libro | `UpdateLibroDto` | `Libro` |
| DELETE | `/libros/:id` | Eliminar libro | — | — |

**Integración externa:** `GET https://openlibrary.org/api/books?bibkeys=ISBN:{isbn}&format=json&jscmd=data` (gratuita, sin API key).

## Módulo: Libreros (`/libreros`)

| Método | Ruta | Descripción | DTO entrada | DTO salida |
|---|---|---|---|---|
| POST | `/libreros` | Crear perfil editorial | `CreatePerfilLibreroDto` | `PerfilLibrero` |
| GET | `/libreros` | Listar perfiles | — | `PerfilLibrero[]` |
| GET | `/libreros/:id` | Obtener perfil | — | `PerfilLibrero` |
| PATCH | `/libreros/:id` | Actualizar perfil | `UpdatePerfilLibreroDto` | `PerfilLibrero` |
| POST | `/libreros/:id/seguir/:usuarioId` | Seguir a un librero | — | `PerfilLibrero` |
| POST | `/libreros/:id/seccion-curada` | Agregar libro a sección curada | `CreateSeccionCuradaDto` | `SeccionCurada` |
| GET | `/libreros/:id/seccion-curada` | Ver sección curada | — | `SeccionCurada[]` |

## Módulo: Recomendaciones (`/recomendaciones`)

| Método | Ruta | Descripción | DTO entrada | DTO salida |
|---|---|---|---|---|
| GET | `/recomendaciones/usuario/:usuarioId?limite=` | Generar recomendaciones personalizadas | — (query `GenerarRecomendacionesQueryDto`) | `ResultadoRecomendacion[]` |
| POST | `/recomendaciones/usuario/:usuarioId/compras` | (Simulado) Registrar compra para el motor | `{ libroId, genero }` | `{ mensaje }` |

**Lógica del motor (v1):** `score = 0.6 × coincidenciaGeneroFavorito + 0.4 × coincidenciaHistorialCompras`, ordenado descendentemente, excluyendo libros ya comprados.

## Módulo: Club de Lectura (`/club-lectura`)

| Método | Ruta | Descripción | DTO entrada |
|---|---|---|---|
| POST | `/club-lectura` | Crear club de lectura | `CreateClubLecturaDto` |
| GET | `/club-lectura` | Listar clubes | — |
| GET | `/club-lectura/:id` | Obtener club | — |
| POST | `/club-lectura/:id/participantes/:usuarioId` | Unirse a un club | — |
| POST | `/club-lectura/:id/hilos` | Crear hilo de discusión | `CreateHiloDiscusionDto` |
| GET | `/club-lectura/:id/hilos` | Listar hilos | — |
| POST | `/club-lectura/hilos/:hiloId/comentarios` | Comentar un hilo | `CreateComentarioDto` |
| GET | `/club-lectura/hilos/:hiloId/comentarios` | Listar comentarios | — |
| PUT | `/club-lectura/:id/progreso/:usuarioId` | Actualizar progreso de lectura | `ActualizarProgresoDto` |
| GET | `/club-lectura/:id/progreso` | Ver progreso compartido | — |

## Módulo: Reseñas (`/resenas`)

| Método | Ruta | Descripción | DTO entrada |
|---|---|---|---|
| POST | `/resenas` | Crear reseña | `CreateResenaDto` |
| GET | `/resenas/libro/:libroId` | Listar reseñas de un libro | — |
| PATCH | `/resenas/:id` | Actualizar reseña | `UpdateResenaDto` |
| DELETE | `/resenas/:id` | Eliminar reseña | — |

## Módulo: Listas de deseos (`/listas-deseos`)

| Método | Ruta | Descripción | DTO entrada |
|---|---|---|---|
| POST | `/listas-deseos` | Crear lista de deseos | `CreateListaDeseosDto` |
| GET | `/listas-deseos/usuario/:usuarioId` | Listar listas de un usuario | — |
| GET | `/listas-deseos/:id` | Obtener lista | — |
| PATCH | `/listas-deseos/:id` | Actualizar lista | `UpdateListaDeseosDto` |
| POST | `/listas-deseos/:id/libros` | Agregar libro a la lista | `AgregarLibroListaDto` |
| DELETE | `/listas-deseos/:id/libros/:libroId` | Quitar libro de la lista | — |
| DELETE | `/listas-deseos/:id` | Eliminar lista | — |

## Pendiente para siguientes hitos

- Servicio de **Pedidos/Compras** (hoy simulado dentro de Recomendaciones).
- Autenticación JWT real y guards por rol (`CLIENTE`, `LIBRERO`, `ADMIN`).
- Persistencia en base de datos real con relaciones entre entidades.
