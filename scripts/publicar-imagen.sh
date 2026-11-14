#!/bin/sh
# Alternativa manual a GitHub Actions: construye y publica la imagen de la
# versión de package.json (por ejemplo desde el servidor, que tiene Docker).
#   docker login
#   sh scripts/publicar-imagen.sh <usuario-docker-hub>
set -e
USUARIO="${1:?Uso: sh scripts/publicar-imagen.sh <usuario-docker-hub>}"
VERSION=$(node -p "require('./package.json').version" 2>/dev/null || sed -n 's/.*"version": "\(.*\)".*/\1/p' package.json | head -1)
IMAGEN="$USUARIO/leeconnos-backend"

echo "Construyendo $IMAGEN:$VERSION ..."
docker build -t "$IMAGEN:$VERSION" -t "$IMAGEN:latest" \
  --label "org.opencontainers.image.version=$VERSION" .
docker push "$IMAGEN:$VERSION"
docker push "$IMAGEN:latest"
echo "Publicada $IMAGEN:$VERSION"
