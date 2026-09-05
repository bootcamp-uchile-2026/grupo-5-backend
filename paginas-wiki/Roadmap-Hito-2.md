# Roadmap — Hito 2

Trabajo planificado para el siguiente hito, a partir de lo identificado durante el Hito 1.

## Prioridad alta

- [ ] **Migrar la persistencia en memoria a base de datos real** (PostgreSQL + TypeORM/Prisma).
- [ ] **Implementar autenticación JWT real** y guards por rol (`CLIENTE`, `LIBRERO`, `ADMIN`).
- [ ] **Construir el sistema de Pedidos/Compras**, base real para Recomendaciones y Ranking (ver [Sistemas Identificados](Sistemas-Identificados)).

## Prioridad media

- [ ] Confirmar con UX/UI las señales del Card Sorting (estado de ánimo como criterio de recomendación, formato físico/ebook/audiolibro) antes de modelarlas en el backend.
- [ ] Modelar el sistema de **Ofertas / Precios promocionales**.
- [ ] Modelar **Favoritos** como entidad separada de Listas de Deseos.
- [ ] Agregar `fechaIngresoCatalogo` a `Libro` para soportar el sistema de **Novedades**.

## Prioridad baja / exploratoria

- [ ] Sistema de **Newsletter** (suscripción).
- [ ] Sistema de **Ranking / Top 5 del año** (depende de Pedidos).
- [ ] Sistema de **Discusiones generales** (foro no ligado a un club).
- [ ] Sistema de **Podcast**.
- [ ] Evaluar pasarela de **Pagos** a integrar.

## Mejoras técnicas transversales

- [ ] Sumar tests unitarios por módulo, además de los e2e ya existentes.
- [ ] Evaluar ampliar el motor de recomendaciones hacia un enfoque colaborativo (usuarios similares).
- [ ] Documentar en esta wiki cada sistema nuevo apenas se identifique, no solo al implementarse.

## Cómo se prioriza

El orden de esta lista sigue tres criterios:

1. **Dependencia técnica** — por ejemplo, Pedidos/Compras habilita datos reales para Recomendaciones y Ranking.
2. **Esfuerzo diferencial** — lo que el proyecto marca explícitamente como diferenciador (ver [Decisiones Técnicas](Decisiones-Tecnicas)) tiene prioridad sobre funcionalidades genéricas de e-commerce.
3. **Señal de UX/UI** — sistemas confirmados en el Site Map tienen más prioridad que señales exploratorias de Card Sorting aún sin confirmar.

---
Ver también: [Sistemas Identificados](Sistemas-Identificados) · [Decisiones Técnicas](Decisiones-Tecnicas)
