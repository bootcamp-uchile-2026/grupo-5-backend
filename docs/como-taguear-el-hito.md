# Cómo publicar y taguear la entrega del Hito 1

Este documento cubre lo último que falta para cumplir el checklist del hito:
**publicar el proyecto en el repositorio del equipo** y **etiquetar la versión entregada**.

## 1. Publicar el proyecto en el repositorio asignado

Si el repositorio ya existe (creado por el equipo o el bootcamp):

```bash
cd leeconnos-backend
git init                                   # si aún no es un repo git
git remote add origin <URL_DEL_REPO_BACKEND>
git add .
git commit -m "feat: base del proyecto backend LeeConNos - Hito 1"
git branch -M main
git push -u origin main
```

Luego crea `develop` a partir de `main`:

```bash
git checkout -b develop
git push -u origin develop
```

A partir de aquí, todo el trabajo nuevo se hace en ramas `feature/*` desde `develop`
(ver `CONTRIBUTING.md`).

## 2. Etiquetar la versión del Hito 1

La entrega pide un **tag de Git** (`hito-1`) y el **hash del commit** asociado, para que
el equipo docente pueda evaluar exactamente esa versión aunque el proyecto siga
avanzando después.

```bash
# Sobre el commit final que se va a entregar:
git tag -a hito-1 -m "Entrega Hito 1 - Backend LeeConNos"
git push origin hito-1

# Obtener el hash del commit para copiarlo en la presentación PDF:
git rev-parse hito-1
```

Copia el resultado de `git rev-parse hito-1` (el hash) en la presentación, junto al
enlace del repositorio y del tag:
`https://github.com/<org>/<repo>/releases/tag/hito-1`

## 3. Qué debe reflejar el tag `hito-1`

Antes de crear el tag, verifica que el commit incluya:

- [ ] Proyecto NestJS completo (`src/`, `package.json`, etc.)
- [ ] `README.md` actualizado
- [ ] `CONTRIBUTING.md` con el flujo de ramas
- [ ] `docs/servicios-identificados.md` actualizado
- [ ] `npm run build` funcionando sin errores sobre ese commit

## 4. Qué enlaces poner en la presentación PDF del hito

Según la sección "Información de la Entrega" de las bases:

- Enlace al repositorio Backend → URL del repo en GitHub
- Tag de Git → `hito-1`
- Hash del commit → resultado de `git rev-parse hito-1`
- Enlace a la documentación OpenAPI/Swagger → captura o URL si se despliega, o instrucción
  `npm run start:dev` + `http://localhost:3000/docs` si se corre localmente
