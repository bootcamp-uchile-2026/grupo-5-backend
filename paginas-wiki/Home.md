# LeeConNos — Wiki del Backend

Bienvenido a la documentación técnica del **Backend de LeeConNos**, la tienda online de una librería independiente que traslada al mundo digital la experiencia de recomendación personalizada de sus libreros.

> 📌 Esta wiki corresponde a la entrega del **Hito 1** del Bootcamp DCC — Universidad de Chile (Equipo 5 · Legión Atenea).

## 🚀 Empezar aquí

| Si quieres... | Ve a |
|---|---|
| Levantar el proyecto en tu máquina | [Cómo Ejecutar el Proyecto](Como-Ejecutar-el-Proyecto) |
| Entender cómo está armada la API | [Arquitectura General](Arquitectura-General) |
| Ver cómo se organiza el código | [Organización del Proyecto](Organizacion-del-Proyecto) |
| Ver qué endpoints existen | [Servicios Identificados](Servicios-Identificados) |
| Ver los contratos de datos (DTOs) | [DTOs de Entrada y Salida](DTOs-de-Entrada-y-Salida) |
| Probar la API sin leer código | [Documentación OpenAPI / Swagger](Documentacion-OpenAPI-Swagger) |
| Entender el "por qué" de cada sistema | [Sistemas Identificados](Sistemas-Identificados) |
| Contribuir con código (ramas, commits, PRs) | [Flujo de Ramas y Contribución](Flujo-de-Ramas-y-Contribucion) |
| Ver las decisiones técnicas y sus razones | [Decisiones Técnicas](Decisiones-Tecnicas) |
| Saber qué viene en el próximo hito | [Roadmap — Hito 2](Roadmap-Hito-2) |

## 📊 Estado actual en números

| Métrica | Valor |
|---|---|
| Framework | NestJS 11 |
| Módulos de dominio | 7 |
| Endpoints documentados | 40+ |
| Sistemas identificados en total | 17 (7 construidos + 10 en backlog) |
| Tests e2e | 2/2 aprobados |
| Documentación | Swagger/OpenAPI en `/docs` |

## 🧩 Los 7 módulos de dominio

- **Usuarios** — registro, login y perfil de clientes y libreros
- **Libros** — catálogo, búsqueda e integración con Open Library
- **Libreros** — perfiles editoriales y secciones curadas
- **Recomendaciones** ★ — motor de recomendaciones (esfuerzo diferencial)
- **Club de Lectura** ★ — hilos de discusión y progreso compartido (esfuerzo diferencial)
- **Reseñas** — opiniones de clientes por libro y por usuario
- **Listas de Deseos** — listas personales, incluyendo modo "para regalo"

★ = eje de esfuerzo diferencial marcado explícitamente en la especificación del proyecto.

## 🔗 Enlaces útiles

- Repositorio: `github.com/bootcamp-uchile-2026/grupo-5-backend`
- Documentación interactiva: `http://localhost:3000/docs` (al levantar el proyecto localmente)
- Tag de la entrega del Hito 1: `hito-1`

---
*Última actualización: Hito 1 — ver [Roadmap — Hito 2](Roadmap-Hito-2) para el trabajo planificado.*
