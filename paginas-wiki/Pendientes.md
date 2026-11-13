# Pendientes para la entrega final

Estado al cierre del Hito 3 (versión 0.4.0). Las tareas se siguen en el tablero de GitHub Projects del equipo.

## Para cerrar el Hito 3

- [ ] Configurar los secrets `DOCKERHUB_USERNAME` y `DOCKERHUB_TOKEN` en GitHub.
- [ ] Integrar a `main`, crear los tags `v0.4.0` y `hito-3`, y comprobar la imagen en Docker Hub.
- [ ] Desplegar `0.4.0` en el servidor con la imagen y demostrar el cambio a `0.4.1`.
- [ ] Activar HTTPS (Caddy + sslip.io) para que la sesión por cookie funcione con la Web en otro dominio.
- [ ] Revisar con Web y Mobile la integración de las cookies, el registro y los endpoints nuevos.

## Para la entrega final

- Reemplazar los dummy de pago, envío y correo por integraciones de prueba (sandbox) de proveedores reales.
- Ranking y top de ventas a partir de los pedidos pagados.
- Pantallas de administración (gestión de libros, cupones y usuarios) junto con UX/UI y Frontend.
- Respaldo automático de la base y monitoreo del servidor.
- Pruebas unitarias por módulo, además de las e2e.
- Publicar Web y API bajo un mismo dominio, para no depender de cookies entre sitios.
