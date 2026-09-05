# Decisiones Técnicas

Principales decisiones adoptadas durante el desarrollo del Hito 1, con su justificación.

| Decisión | Justificación |
|---|---|
| **Persistencia en memoria para este hito** | Prioriza definir bien servicios y contratos antes de comprometerse a un modelo de datos. Migración a base de datos real (PostgreSQL + TypeORM/Prisma) planificada para el Hito 2. |
| **Motor de recomendaciones basado en reglas** | `score = 0.6 × coincidencia de género favorito + 0.4 × coincidencia de historial de compras`, con campo `motivo` en la respuesta para hacer el resultado explicable. |
| **Integración con Open Library vía `fetch` nativo** | Es una API pública y gratuita que no requiere API key, por lo que no se agregaron dependencias adicionales. |
| **`ValidationPipe` global estricto** | `whitelist` + `forbidNonWhitelisted`: la API rechaza automáticamente cualquier campo no declarado en el DTO correspondiente. |
| **Esfuerzo diferencial como módulos independientes** | Recomendaciones y Club de Lectura se aislaron como módulos propios para poder profundizarlos con mayor detalle en los siguientes hitos. |
| **Flujo de ramas main/develop/feature con Conventional Commits** | Facilita el desarrollo colaborativo del equipo, con reglas claras de Pull Request (mínimo 1 revisión, build y tests pasando antes de solicitar revisión). |

## Detalle: motor de recomendaciones

```
score = 0.6 × coincide_genero_favorito + 0.4 × coincide_historial_compras
```

- Se excluyen del resultado los libros que el usuario ya compró.
- El resultado se ordena de mayor a menor score.
- El campo `motivo` se genera dinámicamente según qué señal(es) coincidieron, por ejemplo:
  - *"Coincide con tu género favorito 'Ciencia ficción'"*
  - *"Similar a compras anteriores en 'Ciencia ficción'"*
  - *"Coincide con tu género favorito 'Ciencia ficción' y tu historial de compras"*

## Detalle: por qué persistencia en memoria

En este hito se optó deliberadamente por **no** conectar una base de datos real, para poder enfocar el esfuerzo en:

1. Identificar correctamente los 17 sistemas del negocio (ver [Sistemas Identificados](Sistemas-Identificados)).
2. Definir los contratos (DTOs) de forma consistente entre Backend, Frontend y Mobile.
3. Evitar bloquear el avance por configuración de infraestructura de base de datos.

La migración real está planificada explícitamente en el [Roadmap — Hito 2](Roadmap-Hito-2).

## Detalle: autenticación simulada

El endpoint `POST /usuarios/login` hoy devuelve un token con el formato `fake-jwt-for-{usuarioId}`, marcado con un comentario `// TODO` en el código. Esta decisión permitió avanzar con los demás módulos sin bloquearse en la implementación de JWT real, que queda planificada para el Hito 2.

---
Ver también: [Sistemas Identificados](Sistemas-Identificados) · [Roadmap — Hito 2](Roadmap-Hito-2)
