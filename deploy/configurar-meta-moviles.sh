#!/usr/bin/env bash
# Pone las credenciales de Meta (WhatsApp Business Cloud API) de la cuenta MOVILES de KRATOS.
# Uso (en el servidor, como root):
#   bash /var/www/kratos/deploy/configurar-meta-moviles.sh PHONE_NUMBER_ID WABA_ID TOKEN APP_SECRET [VERIFY_TOKEN]
# Si no pasas VERIFY_TOKEN se conserva el generado. Despues, en Meta (WhatsApp > Configuracion > Webhook) apunta a:
#   https://www.kratos.net.pe/webhook/whatsapp   con el VERIFY_TOKEN que imprime este script.
set -euo pipefail

PHONE_ID="${1:?Falta PHONE_NUMBER_ID}"
WABA="${2:?Falta WABA_ID}"
TOKEN="${3:?Falta TOKEN}"
SECRETO="${4:?Falta APP_SECRET}"
VERIFY="${5:-}"
BASE=kratos_moviles

# Se escapan las comillas simples para SQL
esc() { printf "%s" "$1" | sed "s/'/''/g"; }

if [ -n "$VERIFY" ]; then
  mysql "$BASE" -e "UPDATE cuentas_whatsapp SET phone_number_id='$(esc "$PHONE_ID")', waba_id='$(esc "$WABA")', token='$(esc "$TOKEN")', app_secret='$(esc "$SECRETO")', verify_token='$(esc "$VERIFY")' WHERE id=1"
else
  mysql "$BASE" -e "UPDATE cuentas_whatsapp SET phone_number_id='$(esc "$PHONE_ID")', waba_id='$(esc "$WABA")', token='$(esc "$TOKEN")', app_secret='$(esc "$SECRETO")' WHERE id=1"
fi
pm2 reload kratos-moviles --update-env
echo "Cuenta MOVILES actualizada. Verify token para Meta:"
mysql "$BASE" -N -e "SELECT verify_token FROM cuentas_whatsapp WHERE id=1"
