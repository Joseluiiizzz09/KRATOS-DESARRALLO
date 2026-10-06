#!/usr/bin/env bash
# Instala en el servidor de KRATOS su propia copia del servicio de la cuenta MOVILES
# (WhatsApp Business Cloud API), separada del CRM de NetContact, y la conecta a KRATOS.
# Ejecutar en el servidor como root:   bash /var/www/kratos/deploy/instalar-moviles.sh
# Es repetible. NO toca el CRM de NetContact ni su base de datos.
#
# Queda con una cuenta "MOVILES" SIN credenciales de Meta (valores PENDIENTE). Cuando las tengas:
#   bash /var/www/kratos/deploy/configurar-meta-moviles.sh PHONE_NUMBER_ID WABA_ID TOKEN APP_SECRET VERIFY_TOKEN
set -euo pipefail

SERV=/var/www/kratos/moviles-service
ENV_API=/var/www/kratos/backend/.env
BASE=kratos_moviles
USUARIO_DB=kratos_moviles_app
PUERTO=4020
PANEL_USER=kratos

echo "1) Dependencias (Node $(node -v))"
cd "$SERV"
npm install --omit=dev --no-audit --no-fund

echo "2) Base de datos propia ($BASE)"
if [ ! -f "$SERV/.env" ] || ! grep -q '^DB_PASSWORD=' "$SERV/.env"; then
  CLAVE_DB=$(openssl rand -hex 16)
else
  CLAVE_DB=$(grep '^DB_PASSWORD=' "$SERV/.env" | cut -d= -f2-)
fi
mysql -e "CREATE DATABASE IF NOT EXISTS \`$BASE\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$USUARIO_DB'@'localhost' IDENTIFIED BY '$CLAVE_DB';
ALTER USER '$USUARIO_DB'@'localhost' IDENTIFIED BY '$CLAVE_DB';
GRANT ALL PRIVILEGES ON \`$BASE\`.* TO '$USUARIO_DB'@'localhost';
FLUSH PRIVILEGES;"

echo "3) Tablas (schema + migraciones, solo lo de MOVILES)"
ORDEN="schema.sql sql/migration.sql sql/migration_multicuenta.sql sql/migration_estados_whatsapp.sql sql/migration_campanas_pausadas.sql sql/migration_grupos_cuenta.sql sql/migration_bsuid.sql sql/migration_indices_leads.sql sql/migration_respuestas_rapidas.sql sql/migration_respuestas_rapidas_cuenta.sql sql/migration_no_leidos.sql"
for f in $ORDEN; do
  echo "   - $f"
  sed "s/leads_whatsapp_db/$BASE/g" "$SERV/$f" | mysql --force "$BASE" 2>&1 | grep -i 'error' || true
done
mysql "$BASE" -N -e "SHOW TABLES" | tr '\n' ' '; echo

echo "4) Configuracion (.env) del servicio"
JWT=$(grep '^JWT_SECRET=' "$SERV/.env" 2>/dev/null | cut -d= -f2- || true)
[ -n "$JWT" ] || JWT=$(openssl rand -hex 32)
cat > "$SERV/.env" <<EOF
NODE_ENV=production
HOST=127.0.0.1
PORT=$PUERTO
DB_HOST=localhost
DB_USER=$USUARIO_DB
DB_PASSWORD=$CLAVE_DB
DB_NAME=$BASE
JWT_SECRET=$JWT
EOF
chmod 600 "$SERV/.env"

echo "5) Cuenta MOVILES (sin credenciales de Meta) y usuario de panel para KRATOS"
CLAVE_PANEL=$(grep '^MOVILES_CRM_PASSWORD=' "$ENV_API" 2>/dev/null | cut -d= -f2- || true)
[ -n "$CLAVE_PANEL" ] || CLAVE_PANEL=$(openssl rand -hex 12)
HASH=$(cd "$SERV" && node -e "require('bcrypt').hash(process.argv[1],12).then(h=>console.log(h))" "$CLAVE_PANEL")
mysql "$BASE" -e "
INSERT INTO cuentas_whatsapp (id, nombre, phone_number_id, waba_id, token, app_secret, verify_token, activo, etiqueta)
  VALUES (1, 'MOVILES', 'PENDIENTE', 'PENDIENTE', 'PENDIENTE', 'PENDIENTE', '$(openssl rand -hex 16)', 1, 'MOVILES')
  ON DUPLICATE KEY UPDATE nombre = 'MOVILES';
INSERT INTO usuarios_panel (usuario, password_hash, rol, cuenta_whatsapp_id)
  VALUES ('$PANEL_USER', '$HASH', 'agente', 1)
  ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), rol = 'agente', cuenta_whatsapp_id = 1;"

echo "6) Conectar KRATOS con este servicio"
cp "$ENV_API" "$ENV_API.bak-antes-de-moviles-$(date +%Y%m%d-%H%M%S)"
sed -i '/^MOVILES_CRM_URL=/d;/^MOVILES_CRM_USER=/d;/^MOVILES_CRM_PASSWORD=/d;/^MOVILES_CUENTA_ID=/d' "$ENV_API"
{
  echo "MOVILES_CRM_URL=http://127.0.0.1:$PUERTO"
  echo "MOVILES_CRM_USER=$PANEL_USER"
  echo "MOVILES_CRM_PASSWORD=$CLAVE_PANEL"
} >> "$ENV_API"

echo "6b) Nginx: /webhook/ (Meta) hacia el servicio"
NGINX_SITIO=/etc/nginx/sites-available/kratos
if ! grep -q 'location /webhook/' "$NGINX_SITIO"; then
  cp "$NGINX_SITIO" "$NGINX_SITIO.bak-antes-de-webhook-$(date +%Y%m%d-%H%M%S)"
  python3 - "$NGINX_SITIO" "$PUERTO" <<'PY'
import sys
ruta, puerto = sys.argv[1], sys.argv[2]
s = open(ruta).read()
bloque = """    # Webhooks de Meta (WhatsApp / Lead Ads) hacia el servicio de MOVILES
    location /webhook/ {
        proxy_pass http://127.0.0.1:%s;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }

""" % puerto
marca = "    # Archivos estaticos con nombre unico"
assert marca in s
open(ruta, "w").write(s.replace(marca, bloque + marca, 1))
PY
fi
nginx -t
systemctl reload nginx

echo "7) Arrancar"
if pm2 describe kratos-moviles >/dev/null 2>&1; then
  pm2 reload kratos-moviles --update-env
else
  pm2 start "$SERV/server.js" --name kratos-moviles --cwd "$SERV" --max-memory-restart 400M
fi
pm2 reload kratos-api --update-env
pm2 save
sleep 3
curl -s -o /dev/null -w "Servicio MOVILES (puerto $PUERTO): HTTP %{http_code}\n" "http://127.0.0.1:$PUERTO/api/leads/resumen" || true
echo "LISTO. Abre KRATOS > WhatsApp MOVILES: debe verse la bandeja (vacia) sin el aviso de 'no conectado'."
