# DTOs de Entrada y Salida

Cada endpoint de la API define explícitamente qué datos puede recibir y qué forma tiene su respuesta, mediante **DTOs (Data Transfer Objects)** validados con `class-validator` y documentados con decoradores de Swagger (`@ApiProperty`).

## Convención

Cada módulo define al menos:

- **`create-*.dto.ts`** — datos de entrada al crear un recurso.
- **`update-*.dto.ts`** — reutiliza el DTO de creación con `PartialType`, haciendo todos los campos opcionales.

## Ejemplo real: `CreateLibroDto`

```typescript
export class CreateLibroDto {
  @ApiProperty({ example: '9788433979107' })
  @IsString()
  isbn: string;

  @ApiProperty({ example: 'Cien años de soledad' })
  @IsString()
  titulo: string;

  @ApiProperty({ example: 'Ciencia ficción' })
  @IsString()
  genero: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(EstadoLibro)
  estado?: EstadoLibro;

  @ApiProperty({ example: 15990 })
  @IsNumber()
  @Min(0)
  precio: number;
}
```

## DTOs de entrada y salida por servicio

| Servicio | DTO de entrada | DTO de salida |
|---|---|---|
| Catálogo de Libros | `CreateLibroDto`: isbn, titulo, autor, genero, editorial?, anioPublicacion?, sinopsis?, stock, precio, estado? | `Libro`: id + todos los campos, con estado obligatorio |
| Motor de Recomendaciones | Query `limite`?; body de compra: libroId, genero | `ResultadoRecomendacion[]`: libroId, titulo, genero, score (0–1), motivo |
| Perfiles de Librero | `CreatePerfilLibreroDto`: usuarioId, alias, bio, estiloEditorial?, especialidades[], fotoUrl? | `PerfilLibrero`: id + campos + seguidores[] |
| Club de Lectura | `CreateClubLecturaDto`: libroId, titulo, descripcion?, fechaInicio, fechaFin? | `ClubLectura`: id + campos + participantes[] |
| Reseñas | `CreateResenaDto`: usuarioId, libroId, calificacion (1–5), comentario | `Resena`: id + campos + verificada, fecha |
| Registro y Perfil de Usuario | `CreateUsuarioDto`: nombre, email, password, rol, generosFavoritos[]?, avatarUrl? | `Usuario`: id + campos (sin password) + fechaRegistro |
| Listas de Deseos | `CreateListaDeseosDto`: usuarioId, nombre, esParaRegalo? | `ListaDeseos`: id + campos + libros[], fechaCreacion |

> **Nota:** en el Motor de Recomendaciones, el "DTO de entrada" del endpoint principal (`GET /recomendaciones/usuario/:id`) va casi vacío porque el dato clave (`usuarioId`) viaja en la URL, no en el body — es intencional, no un descuido.

## Validación global

Todos los DTOs se validan automáticamente gracias a un `ValidationPipe` global configurado en `main.ts`:

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
);
```

Esto significa que **cualquier campo faltante, inválido, o no declarado en el DTO se rechaza automáticamente con un error 400**, sin necesidad de validarlo manualmente en cada controller.

---
Ver también: [Servicios Identificados](Servicios-Identificados) · [Documentación OpenAPI / Swagger](Documentacion-OpenAPI-Swagger)
