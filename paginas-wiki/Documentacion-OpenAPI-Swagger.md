# Documentación OpenAPI / Swagger

La documentación de la API se genera automáticamente a partir del propio código, usando `@nestjs/swagger`.

## Cómo acceder

Con el servidor corriendo (ver [Cómo Ejecutar el Proyecto](Como-Ejecutar-el-Proyecto)):

```
http://localhost:3000/docs
```

También se expone la especificación OpenAPI cruda en JSON, útil para importar en Postman o Insomnia:

```
http://localhost:3000/docs-json
```

```bash
curl http://localhost:3000/docs-json -o openapi-spec.json
```

## Cómo está anotado el código

Cada controller usa `@ApiTags` para agrupar sus endpoints bajo un módulo:

```typescript
@ApiTags('Libros')
@Controller('libros')
export class LibrosController { ... }
```

Cada endpoint documenta su propósito con `@ApiOperation`:

```typescript
@Post('importar-isbn')
@ApiOperation({ summary: 'Obtener metadatos de un libro desde Open Library por ISBN' })
importarPorIsbn(@Body() dto: ImportarLibroPorIsbnDto) { ... }
```

Y cada DTO documenta sus campos con `@ApiProperty` (ver [DTOs de Entrada y Salida](DTOs-de-Entrada-y-Salida)), lo que hace que Swagger muestre automáticamente tipo, ejemplo y restricciones de validación de cada campo — sin mantener documentación separada del código.

## Los 7 tags disponibles

| Tag | Módulo |
|---|---|
| Usuarios | `usuarios` |
| Libros | `libros` |
| Libreros | `libreros` |
| Recomendaciones | `recomendaciones` |
| Club de Lectura | `club-lectura` |
| Reseñas | `resenas` |
| Listas de deseos | `listas-deseos` |

## Por qué importa

Esta documentación es la **interfaz de integración principal** entre Backend y los equipos de Frontend y Mobile: les permite conocer exactamente qué endpoints existen, qué esperan recibir y qué devuelven, sin tener que leer el código fuente del backend directamente.

## Ejemplo de endpoint documentado

**`POST /libros/importar-isbn`**

Request body (`ImportarLibroPorIsbnDto`):
```json
{
  "isbn": "9788433979107"
}
```

Validaciones automáticas vía `class-validator`:
- `isbn`: string, requerido
- `whitelist` + `forbidNonWhitelisted` activos
- `400 Bad Request` si el campo falta o sobra

---
Ver también: [Servicios Identificados](Servicios-Identificados) · [Cómo Ejecutar el Proyecto](Como-Ejecutar-el-Proyecto)
