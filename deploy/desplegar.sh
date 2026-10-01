#!/usr/bin/env bash
# Actualiza KRATOS en el servidor: trae el codigo, instala dependencias, compila el frontend
# y recarga el backend. No toca otras aplicaciones del servidor.
# Uso (desde cualquier carpeta):  bash /var/www/kratos/deploy/desplegar.sh [rama]
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/kratos}"
RAMA="${1:-main}"

cd "$APP_DIR"
[ -f backend/.env ] || { echo "Falta backend/.env (copiar deploy/.env.production.example y completarlo)."; exit 1; }

echo "==> Codigo (rama $RAMA)"
git fetch origin
git checkout "$RAMA"
git pull --ff-only origin "$RAMA"

echo "==> Backend"
(cd backend && npm ci --omit=dev)

echo "==> Frontend"
(cd frontend && npm ci && npm run build)

echo "==> Reiniciando kratos-api"
if pm2 describe kratos-api >/dev/null 2>&1; then
  pm2 reload backend/ecosystem.config.cjs --update-env
else
  pm2 start backend/ecosystem.config.cjs
  pm2 save
fi

echo "==> Listo. Estado:"
pm2 status kratos-api
