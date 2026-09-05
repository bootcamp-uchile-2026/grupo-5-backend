# Cómo publicar esta wiki en GitHub

> ⚠️ **Este archivo (`LEEME-COMO-PUBLICAR.md`) es solo para ti — no lo copies dentro
> del repositorio de la wiki.** Las páginas reales están en la carpeta `paginas-wiki/`.

La Wiki de GitHub es un **repositorio Git aparte** del repositorio normal del proyecto,
con la URL `https://github.com/<org>/<repo>.wiki.git`. Los archivos `.md` dentro de
`paginas-wiki/` son las páginas de esa wiki, listas para subir.

## Opción A — Ya existe al menos 1 página creada desde la web de GitHub

GitHub solo habilita el repo `.wiki.git` después de que exista al menos una página
(normalmente basta con abrir la pestaña "Wiki" del repo y guardar la página Home una vez,
aunque sea con contenido de prueba).

```bash
# 1. Clonar el repo de la wiki (nota el sufijo .wiki.git)
git clone https://github.com/bootcamp-uchile-2026/grupo-5-backend.wiki.git

# 2. Copiar todos los archivos .md de la carpeta paginas-wiki/ de esta entrega
#    dentro de esa carpeta clonada, reemplazando lo que exista
cp /ruta/a/esta/entrega/paginas-wiki/*.md grupo-5-backend.wiki/

# 3. Commitear y subir
cd grupo-5-backend.wiki
git add .
git commit -m "docs: wiki completa del backend - Hito 1"
git push origin master   # o "main", según lo que use tu repo
```

## Opción B — La wiki del repo aún no existe

1. Ve a tu repositorio en GitHub → pestaña **Wiki**.
2. Click en **Create the first page**.
3. Pega cualquier contenido y guarda (esto inicializa el repo `.wiki.git`).
4. Sigue los pasos de la **Opción A** para reemplazar el contenido con estos archivos.

## Verificar que quedó bien

Una vez subido, en GitHub deberías ver:

- La página **Home** como portada, con la tabla de navegación.
- Una **barra lateral** (generada automáticamente desde `_Sidebar.md`) con enlaces a
  todas las páginas, agrupados por categoría.
- Un **pie de página** (generado desde `_Footer.md`) en todas las páginas.
- Los diagramas dentro de bloques ```` ```mermaid ```` renderizados visualmente
  (GitHub soporta Mermaid nativamente en wikis desde 2022).

## Estructura de archivos incluida

| Archivo | Página en GitHub |
|---|---|
| `Home.md` | Portada de la wiki |
| `_Sidebar.md` | Barra lateral de navegación (especial, no es una página) |
| `_Footer.md` | Pie de página (especial, no es una página) |
| `Arquitectura-General.md` | Arquitectura General |
| `Organizacion-del-Proyecto.md` | Organización del Proyecto |
| `Como-Ejecutar-el-Proyecto.md` | Cómo Ejecutar el Proyecto |
| `Servicios-Identificados.md` | Servicios Identificados |
| `DTOs-de-Entrada-y-Salida.md` | DTOs de Entrada y Salida |
| `Documentacion-OpenAPI-Swagger.md` | Documentación OpenAPI / Swagger |
| `Sistemas-Identificados.md` | Sistemas Identificados |
| `Decisiones-Tecnicas.md` | Decisiones Técnicas |
| `Flujo-de-Ramas-y-Contribucion.md` | Flujo de Ramas y Contribución |
| `Roadmap-Hito-2.md` | Roadmap — Hito 2 |

## Mantenerla actualizada

Cada vez que agreguen un sistema nuevo o cambien una decisión técnica importante,
actualicen la página correspondiente y hagan commit — igual que con código. La wiki
vive en su propio historial de git, independiente del repo principal.
