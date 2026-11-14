# Autenticación y autorización

## Sesión

| Paso | Web | Mobile y Swagger |
|---|---|---|
| Iniciar sesión | `POST /auth/login`: la API deja las cookies HttpOnly `lcn_access` y `lcn_refresh` | El body trae `accessToken` y `refreshToken` |
| Llamar rutas privadas | Enviar con credenciales: `credentials: 'include'` (fetch) o `withCredentials: true` (axios) | Header `Authorization: Bearer <accessToken>` |
| Renovar (cada 2 h) | `POST /auth/refresh` sin body: usa la cookie | `POST /auth/refresh` con `{ refreshToken }` |
| Cerrar sesión | `POST /auth/logout`: borra las cookies | `POST /auth/logout` con `{ refreshToken }` |

- Las contraseñas se guardan con **bcrypt**.
- Los tokens son **JWT** firmados con `JWT_SECRET`: acceso de 2 h y refresh de 7 días.
- Las cookies son **HttpOnly**: el JavaScript del navegador no puede leerlas, así que un XSS no puede robar la sesión.
- **Cerrar sesión invalida todos los refresh** del usuario (en todos sus dispositivos).
- **CSRF**: con sesión por cookie, las peticiones que modifican datos solo se aceptan desde los orígenes de
  `CORS_ORIGIN`; si no, `403 ORIGEN_NO_PERMITIDO`.
- Para que el navegador envíe las cookies entre dominios distintos (Web en un dominio, API en otro) hace falta
  HTTPS y `COOKIE_SAMESITE=none`. Ver [Versionado y despliegue](Versionado-y-Despliegue).

## Perfiles

| Perfil | Puede |
|---|---|
| Visitante | Ver catálogo, libreros, reseñas y clubes; cotizar envío; comprar como invitado; preguntar a un librero |
| CLIENTE | Todo lo anterior, más carrito, direcciones, pedidos, pagos, reseñas, listas, clubes y su cuenta |
| LIBRERO | Todo lo de CLIENTE, más administrar libros e imágenes, su perfil, recomendaciones y preguntas |
| ADMIN | Todo, más usuarios, cupones y reposición de stock |

El registro público solo crea cuentas CLIENTE: enviar `rol: "ADMIN"` responde `403`.

## Respuestas de error

| Caso | HTTP | `error` |
|---|---|---|
| Email o contraseña incorrectos | 401 | `CREDENCIALES_INVALIDAS` |
| Ruta privada sin sesión | 401 | `TOKEN_REQUERIDO` |
| Token vencido, inválido o de una sesión cerrada | 401 | `TOKEN_INVALIDO` |
| Perfil sin permiso, o recurso de otro usuario | 403 | `PERMISO_DENEGADO` |
| Cookie usada desde un origen no permitido | 403 | `ORIGEN_NO_PERMITIDO` |

Ante `TOKEN_INVALIDO`, la app debe llamar una vez a `POST /auth/refresh`; si también falla, volver al login.
