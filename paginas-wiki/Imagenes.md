# Imágenes

Los libreros y administradores suben las portadas y las imágenes de la galería de cada libro. Los archivos se
guardan en disco (`UPLOADS_DIR`, un volumen Docker en el servidor) y se sirven como archivos estáticos en
`/uploads/<archivo>`. Sus datos (quién la subió, para qué libro, tamaño, tipo) quedan en la tabla `imagenes`.

| Método y ruta | Acceso | Qué hace |
|---|---|---|
| `POST /libros/:id/portada` | LIBRERO o ADMIN | Sube la imagen y la deja como portada del libro |
| `POST /libros/:id/galeria` | LIBRERO o ADMIN | Sube la imagen y la agrega a la galería |
| `POST /imagenes` | LIBRERO o ADMIN | Sube una imagen suelta y devuelve su URL |
| `GET /libros/:id/imagenes` | Público | Imágenes subidas para el libro |
| `DELETE /imagenes/:id` | LIBRERO o ADMIN | Borra el archivo y lo quita de la portada o galería |

## Reglas

- Formulario `multipart/form-data` con el archivo en el campo **`imagen`**.
- Formatos JPG, PNG y WEBP, hasta 2 MB (`IMAGEN_MAX_MB`).
- El formato se comprueba por el **contenido** del archivo, no por su nombre: un `.txt` renombrado a `.png`
  responde `415 TIPO_ARCHIVO_NO_PERMITIDO`.
- El archivo se guarda con un nombre aleatorio; el nombre original solo queda como dato.
- `LibroExistePipe` valida que el libro exista antes de recibir el archivo (`404 LIBRO_NO_ENCONTRADO`).

## Ejemplo desde la Web

```ts
const datos = new FormData();
datos.append('imagen', archivo); // File de un <input type="file" accept="image/*">
const respuesta = await fetch(`${API}/libros/${libroId}/portada`, {
  method: 'POST',
  body: datos,
  credentials: 'include',
});
const imagen = await respuesta.json(); // { id, url, mime, tamano, uso, libroId, ... }
```

En Swagger: autorizar como `librero@leeconnos.cl`, abrir `POST /libros/{id}/portada` y elegir un archivo.
