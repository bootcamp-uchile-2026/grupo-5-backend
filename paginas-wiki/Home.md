# LeeConNos — Wiki del Backend

API REST de **LeeConNos**, la tienda online de una librería independiente que traslada al mundo digital la
recomendación personalizada de sus libreros.

> Estado al cierre del **Hito 3** · versión **0.4.0** · Equipo 5 — Legión Atenea · Bootcamp DCC UChile.

| Recurso | Enlace |
|---|---|
| Swagger (contratos vigentes) | http://3.131.220.134:3000/docs |
| URL base de la API | http://3.131.220.134:3000 |
| Repositorio | https://github.com/bootcamp-uchile-2026/grupo-5-backend |
| Imagen Docker | `usuario/leeconnos-backend:0.4.0` en Docker Hub |

## Empezar aquí

| Si quieres... | Ve a |
|---|---|
| Levantar el proyecto en tu máquina | [Cómo ejecutar el proyecto](Como-Ejecutar-el-Proyecto) |
| Entender cómo está armada la API | [Arquitectura general](Arquitectura-General) |
| Ver qué servicios hay y su estado | [Servicios](Servicios) |
| Integrarte desde Web o Mobile (sesión, permisos) | [Autenticación y autorización](Autenticacion-y-Autorizacion) |
| Subir portadas o imágenes de la galería | [Imágenes](Imagenes) |
| Ver las tablas, el diagrama y las migraciones | [Modelo de datos y migraciones](Modelo-de-Datos-y-Migraciones) |
| Publicar una versión o actualizar el servidor | [Versionado y despliegue](Versionado-y-Despliegue) |
| Contribuir (ramas, commits, Pull Requests) | [Flujo de ramas y contribución](Flujo-de-Ramas-y-Contribucion) |
| Entender el porqué de las decisiones | [Decisiones técnicas](Decisiones-Tecnicas) |
| Saber qué falta para la entrega final | [Pendientes](Pendientes) |

## Estado en números

| Métrica | Valor |
|---|---|
| Versión | 0.4.0 (`package.json`, tag `v0.4.0`, imagen `0.4.0`) |
| Módulos de dominio | 19 |
| Operaciones en Swagger | 116 |
| Tablas | 24, creadas por 6 migraciones de TypeORM |
| Pruebas e2e | 59, contra PostgreSQL real, también en GitHub Actions |

## Qué es funcional y qué es dummy

| Estado | Módulos |
|---|---|
| **Funcional sobre PostgreSQL** | auth (JWT, cookies HttpOnly, refresh, logout, verificación de correo, recuperación de contraseña, Google y Facebook), usuarios, catálogo con filtros, imágenes, carrito, direcciones guardadas, cupones, pedidos (con cuenta o invitado), reseñas, libreros y preguntas al librero, recomendaciones, listas de deseos, club de lectura, newsletter |
| **Dummy con reglas predecibles** | costo de envío, pago, seguimiento y envío de correos |

Las reglas de los dummy (qué tarjeta aprueba, qué comuna no tiene cobertura, etc.) están en
[Servicios](Servicios).
