# Imagen de la API. La versión de la imagen es la de package.json:
#   docker build -t <usuario>/leeconnos-backend:0.4.0 .
# Normalmente la construye y publica GitHub Actions al crear el tag v0.4.0
# (ver .github/workflows/docker-publish.yml y docs/despliegue.md).

# ---------- Etapa 1: compilar ----------
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN npm run build

# ---------- Etapa 2: imagen final, solo con lo necesario para ejecutar ----------
FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
# Incluye las migraciones compiladas (dist/database/migrations): se aplican
# solas al arrancar, o a mano con: npm run typeorm -- migration:show
COPY --from=build /app/dist ./dist
# Reposición de stock antes de una demo (POST /admin/reiniciar-stock)
COPY scripts/reset-stock.sql scripts/reset-stock.js ./scripts/
# Carpeta de las imágenes subidas; en docker compose es un volumen.
RUN mkdir -p /app/uploads && chown node:node /app/uploads

# No ejecutar como root
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT:-3000}/health" || exit 1
CMD ["node", "dist/main"]
