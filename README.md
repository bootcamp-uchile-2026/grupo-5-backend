# LeeConNos — Backend API

API REST para **LeeConNos**, la tienda online de una librería independiente que traslada
al mundo digital la experiencia de recomendación personalizada de sus libreros.

> Entrega correspondiente al **Hito 1** del Bootcamp DCC — Universidad de Chile.

## 📖 Contexto del producto

LeeConNos permite a los libreros expresar su personalidad mediante secciones curadas de
recomendaciones y perfiles editoriales propios, ofrece un motor de recomendaciones básico
basado en géneros e historial de compras, y un club de lectura online con hilos de
discusión y progreso compartido. El catálogo se enriquece con metadatos obtenidos desde la
API gratuita de **Open Library**.

## 🧱 Stack técnico

- **NestJS 11** (TypeScript)
- **class-validator** / **class-transformer** para validación de DTOs
- **@nestjs/swagger** para documentación OpenAPI
- **@nestjs/config** para variables de entorno
- Persistencia en memoria durante el Hito 1 (se migrará a una base de datos real en
  hitos posteriores)

## 📂 Organización del proyecto

El proyecto está estructurado por **módulos de dominio**, siguiendo las funcionalidades
del producto y no una organización técnica genérica:

```
src/
├── main.ts                     # Bootstrap, Swagger, validación global, CORS
├── app.module.ts                # Módulo raíz
└── modules/
    ├── usuarios/                 # Registro/login de clientes y libreros
    ├── libros/                   # Catálogo + integración con Open Library
    ├── libreros/                 # Perfiles editoriales y secciones curadas
    ├── recomendaciones/          # Motor de recomendaciones (esfuerzo diferencial)
    ├── club-lectura/             # Clubes, hilos de discusión y progreso compartido
    ├── resenas/                  # Reseñas de clientes
    └── listas-deseos/            # Listas de deseos, incluyendo modo "para regalo"
```

Cada módulo contiene `*.module.ts`, `*.controller.ts`, `*.service.ts`, `dto/` y
`entities/`, siguiendo la convención estándar de NestJS.

## ▶️ Cómo ejecutar el proyecto

### Requisitos

- Node.js 18 o superior (se necesita `fetch` nativo para la integración con Open Library)
- npm

### Pasos

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar variables de entorno de ejemplo
cp .env.example .env

# 3. Levantar en modo desarrollo (hot-reload)
npm run start:dev

# Alternativa: modo normal
npm run start
```

La API quedará disponible en `http://localhost:3000` y la documentación interactiva
Swagger en **`http://localhost:3000/docs`**.

### Verificar que todo funciona

```bash
curl http://localhost:3000/libros
```

Debería responder `[]` (catálogo vacío al iniciar).

## 🔌 Servicios identificados (resumen)

La identificación completa de servicios y DTOs está documentada en
[`docs/servicios-identificados.md`](./docs/servicios-identificados.md) y también es
consultable de forma interactiva en Swagger (`/docs`). Resumen por módulo:

| Módulo | Servicios principales |
|---|---|
| Usuarios | Registro, login, CRUD de usuarios (clientes y libreros) |
| Libros | CRUD de catálogo, búsqueda por género/autor, importación de metadatos por ISBN (Open Library) |
| Libreros | Perfil editorial, seguir librero, sección curada de recomendaciones |
| Recomendaciones | Generación de recomendaciones por usuario, registro de compras (señal del motor) |
| Club de Lectura | Crear club, unirse, hilos de discusión, comentarios, progreso de lectura compartido |
| Reseñas | Crear/editar/eliminar reseñas por libro |
| Listas de deseos | CRUD de listas, agregar/quitar libros, modo "para regalo" |

## 🌿 Estrategia de ramas y contribución

El flujo de ramas, convención de commits y reglas de Pull Request están detallados en
[`CONTRIBUTING.md`](./CONTRIBUTING.md). Resumen rápido: `main` ← `develop` ← `feature/*`,
commits en formato Conventional Commits, PR con al menos 1 revisión antes del merge.

Para publicar el proyecto en el repositorio del equipo y etiquetar la entrega del hito,
ver [`docs/como-taguear-el-hito.md`](./docs/como-taguear-el-hito.md).

## 📌 Decisiones técnicas del Hito 1

- Se optó por **persistencia en memoria** para poder enfocar el hito en identificar
  correctamente los servicios, DTOs y la estructura por dominio, sin bloquear el avance
  por configuración de base de datos. La migración a una base real (PostgreSQL +
  TypeORM/Prisma) queda planificada para el siguiente hito.
- El **motor de recomendaciones** implementa una primera versión basada en reglas
  (coincidencia de género favorito + historial de compras), documentando el `motivo` de
  cada recomendación para mantener transparencia frente al usuario.
- La integración con **Open Library** se implementa mediante `fetch` nativo de Node.js,
  sin dependencias adicionales, ya que es una API pública y gratuita que no requiere
  API key.
- Se habilitó **ValidationPipe global** (`whitelist`, `forbidNonWhitelisted`, `transform`)
  para que todos los DTOs validen automáticamente la entrada de la API.

## 🚧 Trabajo planificado para el siguiente hito

- Migrar la persistencia en memoria a una base de datos real.
- Implementar autenticación con JWT real (actualmente el login devuelve un token simulado).
- Conectar el módulo de Recomendaciones con un módulo real de Pedidos/Compras.
- Ampliar el motor de recomendaciones hacia un enfoque colaborativo.
- Sumar tests unitarios y e2e por módulo.
