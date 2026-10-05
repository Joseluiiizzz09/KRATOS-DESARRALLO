#!/usr/bin/env bash
# Instala/actualiza el servicio de WhatsApp (bandeja de conversaciones) de KRATOS en el servidor.
# Ejecutar en el servidor como root:   bash /var/www/kratos/deploy/instalar-whatsapp.sh
# Es repetible: si ya esta instalado, solo actualiza dependencias y vuelve a cargar.
#
# NO copia sesiones de WhatsApp de KRONO. Las lineas de KRATOS se vinculan desde cero (QR) en
# Jefatura > Comunicacion > WhatsApp. Si se usara el mismo numero en KRONO y en KRATOS a la vez,
# WhatsApp desconectaria uno de los dos.
set -euo pipefail

RAIZ=/var/www/kratos
SERV=$RAIZ/whatsapp-service
ENV_API=$RAIZ/backend/.env
NGINX_SITIO=/etc/nginx/sites-available/kratos
PRIZMA_CONF=/root/prizma-desarrollo/nginx/production.conf

echo "1) Dependencias del servicio (Node $(node -v))"
cd "$SERV"
npm ci --omit=dev --no-audit --no-fund
mkdir -p data

echo "2) Configuracion (.env) del servicio"
if ! grep -q '^INTERNAL_PRIZMA_KEY=' "$ENV_API"; then
  echo "INTERNAL_PRIZMA_KEY=$(openssl rand -hex 24)" >> "$ENV_API"
  echo "   Se genero INTERNAL_PRIZMA_KEY en backend/.env (hay que recargar kratos-api)"
fi
JWT=$(grep '^JWT_SECRET=' "$ENV_API" | head -1 | cut -d= -f2-)
CLAVE=$(grep '^INTERNAL_PRIZMA_KEY=' "$ENV_API" | head -1 | cut -d= -f2-)
cat > "$SERV/.env" <<EOF
NODE_ENV=production
HOST=127.0.0.1
PORT=4010
PUBLIC_ORIGINS=https://kratos.net.pe,https://www.kratos.net.pe
KRATOS_JWT_SECRET=$JWT
KRATOS_INTERNAL_KEY=$CLAVE
KRATOS_API_URL=http://127.0.0.1:4100
EOF
chmod 600 "$SERV/.env"

echo "3) Nginx del servidor (puerto 8081): /wa/ hacia el servicio, con websocket"
if ! grep -q 'location /wa/' "$NGINX_SITIO"; then
  cp "$NGINX_SITIO" "$NGINX_SITIO.bak-antes-de-whatsapp-$(date +%Y%m%d-%H%M%S)"
  python3 - "$NGINX_SITIO" <<'PY'
import sys
ruta = sys.argv[1]
s = open(ruta).read()
bloque = """    # Servicio de WhatsApp (bandeja de conversaciones), con websocket
    location /wa/ {
        proxy_pass http://127.0.0.1:4010/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
        client_max_body_size 64m;
    }

"""
marca = "    # Archivos estaticos con nombre unico"
assert marca in s
s = s.replace(marca, bloque + marca, 1)
if "connection_upgrade" not in s.split("server {")[0]:
    s = "map $http_upgrade $connection_upgrade {\n    default upgrade;\n    ''      close;\n}\n\n" + s
open(ruta, "w").write(s)
PY
fi
nginx -t
systemctl reload nginx

echo "4) Nginx de PRIZMA (kratos.net.pe): permitir websocket en /wa/"
if ! grep -q 'location /wa/' "$PRIZMA_CONF"; then
  cp "$PRIZMA_CONF" "$PRIZMA_CONF.bak-antes-de-whatsapp-$(date +%Y%m%d-%H%M%S)"
  python3 - "$PRIZMA_CONF" <<'PY'
import sys
ruta = sys.argv[1]
s = open(ruta).read()
corte = s.index("server_name kratos.net.pe www.kratos.net.pe;")
resto = s[corte:]
marca = "    location / {\n        proxy_pass http://172.18.0.1:8081;"
assert marca in resto
bloque = """    location /wa/ {
        proxy_pass http://172.18.0.1:8081;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
        client_max_body_size 64m;
    }

"""
resto = resto.replace(marca, bloque + marca, 1)
open(ruta, "w").write(s[:corte] + resto)
PY
fi
docker exec prizma-nginx nginx -t
docker exec prizma-nginx nginx -s reload

echo "5) Arrancar los procesos"
pm2 reload kratos-api --update-env
if pm2 describe kratos-whatsapp >/dev/null 2>&1; then
  pm2 reload kratos-whatsapp --update-env
else
  pm2 start "$SERV/backend/headless-main.js" --name kratos-whatsapp --cwd "$SERV" --max-memory-restart 1200M
fi
pm2 save
sleep 3
pm2 status kratos-whatsapp | grep -o online || true
curl -s -o /dev/null -w "Servicio WhatsApp (4010): HTTP %{http_code}\n" http://127.0.0.1:4010/ || true
echo "LISTO. Entra a https://www.kratos.net.pe como Jefatura > WhatsApp para vincular las lineas (QR)."
