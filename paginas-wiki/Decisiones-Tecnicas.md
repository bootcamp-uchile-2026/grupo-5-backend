# Decisiones técnicas

Las decisiones más relevantes de cada hito, con su motivo. Las del modelo de datos están en
[Modelo de datos y migraciones](Modelo-de-Datos-y-Migraciones).

## Hito 3

| Decisión | Motivo |
|---|---|
| **Migraciones de TypeORM que se aplican al arrancar** | Desplegar una versión nueva deja la base al día sin entrar al servidor; cada cambio de estructura queda versionado con el código |
| **Las migraciones de los hitos anteriores son idempotentes** | Se aplicaron sin perder datos sobre la base del servidor, que se había creado con scripts SQL |
| **Imagen versionada en Docker Hub; el servidor no compila** | Desplegar o volver atrás es cambiar `API_VERSION`; lo que corre en el servidor es exactamente lo que se probó |
| **El tag de Git, `package.json` y la imagen comparten número** | GitHub Actions se niega a publicar si no coinciden |
| **Cookies HttpOnly para la Web, Bearer para Mobile** | El navegador no expone el token al JavaScript; Mobile no tiene cookies de navegador. El guard acepta ambos |
| **Control de origen con sesión por cookie** | Evita que otro sitio aproveche la cookie del usuario para modificar datos (CSRF) |
| **Cerrar sesión con un contador por usuario** | Invalida todos los refresh sin guardar cada token |
| **Pipes que consultan la base** (`LibroExistePipe`, `LibreroExistePipe`) | El 404 se resuelve antes del service y el controller recibe la entidad ya cargada |
| **Imágenes validadas por contenido y guardadas con nombre aleatorio** | Un archivo renombrado no pasa como imagen y no se puede adivinar ni pisar otro archivo |
| **Imágenes en disco con un volumen Docker** | Simple y suficiente para el alcance; los metadatos en la base permiten migrar a un almacenamiento externo sin cambiar el contrato |
| **Correos dummy detrás de `MailService`** | Los flujos de verificación y recuperación funcionan en la demo; un proveedor real reemplaza un solo método |

## Hito 2

| Decisión | Motivo |
|---|---|
| **Foco en los flujos core del e-commerce** | Explorar, comprar y seguir un pedido debían funcionar de verdad antes de profundizar lo diferencial |
| **Pago, envío y seguimiento dummy con reglas predecibles** | Permiten demostrar casos de éxito y error sin depender de proveedores externos |
| **Checkout en una transacción con bloqueo de filas** | Validar y descontar stock, aplicar el cupón y vaciar el carrito ocurre todo o nada, aun con compras simultáneas |
| **Guard de autenticación global con `@Public()`** | Olvidar proteger un endpoint nuevo no lo deja abierto |
| **Errores con código estable y `x-request-id`** | Web y Mobile deciden qué mostrar por el código; cualquier error se rastrea en los logs |

## Hito 1

| Decisión | Motivo |
|---|---|
| **Motor de recomendaciones basado en reglas** | `score = 0.6 × género favorito + 0.4 × historial de compras`, con un `motivo` que explica cada recomendación |
| **Open Library con `fetch` nativo** | API pública sin clave; no agrega dependencias |
| **`ValidationPipe` global estricto** | `whitelist` + `forbidNonWhitelisted`: se rechaza cualquier campo no declarado en el DTO |
| **Ramas `main`/`develop`/`feature` y Conventional Commits** | Revisión obligatoria antes de integrar y un historial legible |
