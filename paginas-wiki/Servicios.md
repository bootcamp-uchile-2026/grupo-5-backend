# Servicios

La fuente oficial de los contratos (rutas, DTO de entrada y salida, validaciones y errores) es **Swagger**:
http://3.131.220.134:3000/docs. El detalle por servicio, las reglas de los dummy y los cambios de contrato
están en [`docs/servicios.md`](https://github.com/bootcamp-uchile-2026/grupo-5-backend/blob/main/docs/servicios.md).

## Resumen

| Módulo | Servicios | Acceso |
|---|---|---|
| Auth | Registro, login, refresh, logout, mi cuenta, verificación de correo, recuperación de contraseña, Google y Facebook | Público / sesión |
| Usuarios | Consultar, editar y eliminar la cuenta | Dueño o ADMIN |
| Libros | Explorar, buscar, filtrar, detalle, relacionados, géneros, categorías del menú, opciones de filtro | Público |
| Libros (gestión) | Crear, editar, retirar, importar por ISBN | LIBRERO o ADMIN |
| Imágenes | Subir portada, agregar a la galería, listar, eliminar | LIBRERO o ADMIN (listar: público) |
| Carrito | Ver, agregar, cambiar cantidad, quitar, vaciar | Sesión |
| Direcciones | Libreta de direcciones; usar o guardar una en el checkout | Sesión |
| Cupones | Validar un código; administrar cupones | Público / ADMIN |
| Pedidos | Checkout (con cuenta o invitado), historial, detalle, cancelación | Sesión / token del pedido |
| Pagos (dummy) | Pagar, listar intentos | Sesión / token del pedido |
| Envíos (dummy) | Cotizar costo y plazo | Público |
| Seguimiento (dummy) | Línea de tiempo del pedido | Sesión / token del pedido |
| Reseñas | Leer; escribir, editar y borrar la propia | Público / sesión |
| Libreros | Perfiles, seguir, recomendaciones, colecciones, preguntas | Público / sesión / librero dueño |
| Recomendaciones | Destacadas del Home, personalizadas | Público / sesión |
| Listas de deseos | Listas, "Favoritos", agregar y quitar libros | Sesión |
| Club de lectura | Clubes, participantes, hilos, comentarios, progreso | Público / sesión |
| Newsletter | Suscribirse y darse de baja | Público |
| Admin | Reponer el stock de prueba | ADMIN |

## Reglas de los servicios dummy

| Servicio | Éxito | Error para demostrar |
|---|---|---|
| Pago | Tarjeta `4111111111111111` | Terminada en `0002` (fondos), `0005` (bloqueada), vencida (402); `0009` pasarela caída (502) |
| Envío | RM $2.990, regiones $4.990, zonas extremas $7.990, gratis desde $40.000 | Comuna "Isla de Pascua" (422) |
| Seguimiento | Avanza un hito por minuto desde el pago | Calle con "S/N" termina en `ENTREGA_FALLIDA`; pedido sin pagar (409) |
| Correo | Queda en el log de la API con su enlace | — |

## Errores

Todos los errores tienen la misma forma; el campo `error` es un código estable para decidir qué mostrar:

```json
{
  "statusCode": 409,
  "error": "STOCK_INSUFICIENTE",
  "message": "No hay stock suficiente para uno o más libros",
  "detalles": ["\"El hobbit\": solicitado 1, disponible 0"],
  "timestamp": "2026-11-12T14:21:09.120Z",
  "path": "/carrito/items",
  "requestId": "b0f6f0a2-5f0e-4a36-9d0c-3f7c2b5a8f11"
}
```

El `requestId` es el mismo del header `x-request-id`: con él se encuentra la petición en los logs del servidor.
