#!/usr/bin/env bash
# Conecta KRATOS con la cuenta MOVILES del CRM de WhatsApp.
# Uso (en el servidor, como root):
#   bash /var/www/kratos/deploy/conectar-moviles.sh https://leads.netcontactbpo.com USUARIO_DEL_CRM 'CONTRASENA' [ID_CUENTA_MOVILES]
# El ID de cuenta solo hace falta si el usuario es admin del CRM (los agentes ya quedan fijos a su cuenta).
set -euo pipefail

URL="${1:?Falta la URL del CRM}"
USUARIO="${2:?Falta el usuario del CRM}"
CLAVE="${3:?Falta la contrasena del CRM}"
CUENTA="${4:-}"
ENV_API=/var/www/kratos/backend/.env

echo "1) Probando el inicio de sesion en el CRM..."
RESP=$(curl -s -m 20 -X POST "${URL%/}/api/auth/login" -H 'Content-Type: application/json' \
  -d "$(printf '{"usuario":"%s","password":"%s"}' "$USUARIO" "$CLAVE")")
echo "$RESP" | grep -q '"token"' || { echo "El CRM no acepto el usuario: $RESP"; exit 1; }
echo "   Acceso correcto."

echo "2) Guardando en backend/.env"
cp "$ENV_API" "$ENV_API.bak-antes-de-moviles-$(date +%Y%m%d-%H%M%S)"
sed -i '/^MOVILES_CRM_URL=/d;/^MOVILES_CRM_USER=/d;/^MOVILES_CRM_PASSWORD=/d;/^MOVILES_CUENTA_ID=/d' "$ENV_API"
{
  echo "MOVILES_CRM_URL=${URL%/}"
  echo "MOVILES_CRM_USER=$USUARIO"
  echo "MOVILES_CRM_PASSWORD=$CLAVE"
  [ -n "$CUENTA" ] && echo "MOVILES_CUENTA_ID=$CUENTA"
} >> "$ENV_API"

echo "3) Recargando KRATOS"
pm2 reload kratos-api --update-env
sleep 3
pm2 status kratos-api | grep -o online
echo "LISTO. Abre KRATOS > WhatsApp MOVILES. Los interesados pasan a la Base cada minuto."
