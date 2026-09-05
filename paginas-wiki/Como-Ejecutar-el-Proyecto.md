# Cómo Ejecutar el Proyecto

## Requisitos previos

- **Node.js v18 o superior** (necesario por el uso de `fetch` nativo en la integración con Open Library)
- **npm** (incluido con la instalación de Node.js)

## Variables de entorno

El proyecto incluye un archivo `.env.example` con la configuración necesaria. Antes de ejecutar la aplicación, cópialo como `.env`:

```bash
cp .env.example .env
```

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `PORT` | Puerto en el que se levanta la API | `3000` |

> **Nota:** las variables de base de datos y JWT están comentadas en `.env.example`, ya que en este hito la persistencia es en memoria y la autenticación aún es simulada — se activarán en el [Roadmap — Hito 2](Roadmap-Hito-2).

## Comandos exactos

```bash
# 1. Instalar dependencias
npm install

# 2. Verificar que el proyecto compila sin errores
npm run build

# 3. Ejecutar los tests automáticos end-to-end
npm run test:e2e

# 4. Levantar el servidor en modo desarrollo
npm run start:dev
```

## Resultado esperado

- `npm install`: instala las dependencias sin errores críticos (las advertencias de vulnerabilidades y `allow-scripts` son normales).
- `npm run build`: termina sin mensajes de error.
- `npm run test:e2e`: **2/2 tests aprobados** (`PASS test/app.e2e-spec.ts`).
- `npm run start:dev`: inicializa los 7 módulos, mapea todas las rutas, y finaliza con:

```
🚀 LeeConNos API corriendo en http://localhost:3000
📚 Documentación Swagger en http://localhost:3000/docs
```

## Verificar que todo funciona

```bash
curl http://localhost:3000/libros
```

Debería responder `[]` (catálogo vacío al iniciar).

Luego abre en el navegador `http://localhost:3000/docs` para ver la documentación interactiva Swagger con los 7 módulos disponibles — ver [Documentación OpenAPI / Swagger](Documentacion-OpenAPI-Swagger).

## Probar un flujo real

```bash
# Crear un usuario con un género favorito
curl -X POST http://localhost:3000/usuarios \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Camila Rojas","email":"camila@correo.cl","password":"contraseña123","rol":"CLIENTE","generosFavoritos":["Ciencia ficción"]}'

# Crear un libro del mismo género
curl -X POST http://localhost:3000/libros \
  -H "Content-Type: application/json" \
  -d '{"isbn":"9780061120084","titulo":"Fundación","autor":"Isaac Asimov","genero":"Ciencia ficción","stock":5,"precio":12990}'

# Consultar recomendaciones (reemplaza {id} por el id devuelto al crear el usuario)
curl http://localhost:3000/recomendaciones/usuario/{id}
```

El resultado debería incluir el libro con un `score` y un `motivo` explicando la recomendación.

---
Ver también: [Organización del Proyecto](Organizacion-del-Proyecto) · [Flujo de Ramas y Contribución](Flujo-de-Ramas-y-Contribucion)
