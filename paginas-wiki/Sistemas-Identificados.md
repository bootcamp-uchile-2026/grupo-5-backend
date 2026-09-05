# Sistemas Identificados

Las bases del Hito 1 son explícitas: *"No se espera que todos los servicios se encuentren implementados durante este hito. El foco estará en construir la base del proyecto, identificar correctamente los servicios que requerirá la API."*

Por eso esta página distingue entre sistemas **construidos** (con endpoints funcionando) y sistemas **identificados** (documentados para hitos siguientes). En total: **17 sistemas**.

## ✅ Sistemas con base construida (7)

### 1. Sistema de Usuarios
**Por qué se identificó:** todo e-commerce necesita distinguir clientes de libreros desde el registro — es la base de la que dependen recomendaciones, reseñas y club de lectura.

### 2. Sistema de Catálogo
**Por qué se identificó:** es el corazón del negocio — sin catálogo no hay nada que recomendar, reseñar o comprar. Se integró con Open Library porque las bases lo marcan como desafío específico del proyecto.

### 3. Sistema de Perfiles de Librero
**Por qué se identificó:** el contexto del negocio es explícito: "digitalizar la experiencia de recomendación personalizada del librero sin perder el factor humano". Necesita ser un sistema propio, separado de "usuarios", porque tiene su propia voz editorial y sección curada.

### 4. Sistema de Recomendaciones ★
**Por qué se identificó:** es uno de los dos ejes de esfuerzo diferencial marcados explícitamente en las bases del proyecto ("motor de recomendaciones básico basado en géneros e historial de compras").

### 5. Sistema de Club de Lectura ★
**Por qué se identificó:** segundo eje de esfuerzo diferencial ("componente comunitario: club de lectura online"). Requiere hilos de discusión y progreso compartido, no solo un CRUD simple.

### 6. Sistema de Reseñas
**Por qué se identificó:** el contexto del negocio menciona explícitamente "reseñas de clientes verificados" como parte del componente comunitario del producto.

### 7. Sistema de Listas de Deseos
**Por qué se identificó:** el contexto del negocio pide explícitamente "opción de armar listas de deseos para regalo" — señal directa de un caso de uso distinto a "comprar para mí mismo".

## 🕐 Sistemas identificados, pendientes para próximos hitos (10)

| Sistema | Por qué se identificó | Origen de la señal |
|---|---|---|
| **Pedidos / Compras** | Es la base real que hoy `recomendaciones` simula con `registrarCompra`; sin él no hay e-commerce funcional | Especificación del Producto + Site Map "Mi cuenta → Historial de compras" |
| **Pagos** | Todo e-commerce lo requiere, pero depende de una pasarela externa | Sentido común de negocio / Arquitectura Funcional |
| **Autenticación real (JWT + roles)** | Hoy `login()` devuelve un token simulado; falta emisión real y guards por rol | Decisión técnica documentada como TODO en el código |
| **Ofertas / Precios promocionales** | `Libro.precio` es fijo; falta modelar descuentos y vigencia | Site Map "Descubrir → Ofertas" |
| **Newsletter** | Requiere sistema de suscripción y envío de correo, fuera de alcance del hito | Site Map "Descubrir → Newsletter" |
| **Ranking / Top 5 del año** | Depende de datos reales de ventas, ligado al futuro sistema de Pedidos | Site Map "Descubrir → Top 5 libros del año" |
| **Novedades por fecha de ingreso** | `Libro` no registra cuándo entró al catálogo, solo su año de publicación | Site Map "Descubrir → Novedades" |
| **Discusiones generales** | Los hilos hoy viven solo dentro de un club de lectura activo; un foro general es otro sistema | Site Map "Comunidad → Discusiones" |
| **Podcast** | Contenido nuevo, no existe módulo relacionado | Site Map "Comunidad → Podcast" |
| **Favoritos y Libros leídos** | Distinto de lista de deseos ("quiero comprar" vs "ya leí y me gustó"); requiere entidad propia | Site Map + Card Sorting "Mi Biblioteca → Favoritos" |

## Cómo se validó esta lista

Estos 10 sistemas surgieron de cruzar tres fuentes distintas del equipo UX/UI:

1. La **Especificación del Producto**
2. El **Site Map** (Arquitectura de la Información, sección 4.2)
3. Una sesión de **Card Sorting** con usuarios reales — que además reveló dos señales nuevas (estado de ánimo como criterio de recomendación, y formato físico/ebook/audiolibro), pendientes de confirmar con UX/UI antes de modelarse en el backend.

---
Ver también: [Servicios Identificados](Servicios-Identificados) · [Roadmap — Hito 2](Roadmap-Hito-2)
