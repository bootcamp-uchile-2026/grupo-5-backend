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
COPY --from=build /app/dist ./dist
# Scripts SQL + utilitario para aplicarlos: docker compose exec api node scripts/db-setup.js
COPY db ./db
COPY scripts/db-setup.js ./scripts/db-setup.js

# No ejecutar como root
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT:-3000}/health" || exit 1
CMD ["node", "dist/main"]
