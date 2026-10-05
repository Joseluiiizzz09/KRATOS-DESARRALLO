#!/usr/bin/env bash
# Corrige las fechas/horas guardadas ANTES del cambio de zona horaria.
# El servidor esta en horario de Madrid (+2) y KRATOS ahora trabaja en hora de Peru (-5):
# los registros viejos tienen 7 horas de mas. Este script les resta 7 horas.
#
# EJECUTAR UNA SOLA VEZ, en el servidor, como root:   bash /var/www/kratos/deploy/corregir-horas.sh
# Antes saca una copia de seguridad de la base y se detiene si falla.
set -euo pipefail

CNF=/root/.kratos-backup.cnf
BASE=kratos
TS=$(date +%Y%m%d-%H%M%S)
COPIA=/var/backups/kratos/kratos-antes-de-corregir-horas-$TS.sql.gz

echo "1) Copia de seguridad en $COPIA"
mysqldump --defaults-extra-file=$CNF --single-transaction --routines $BASE | gzip > "$COPIA"
test "$(stat -c%s "$COPIA")" -gt 10000
ls -l "$COPIA"

echo "2) Generando las sentencias (todas las columnas datetime/timestamp)"
mysql --defaults-extra-file=$CNF $BASE -N -e "
  SELECT CONCAT('UPDATE \`', TABLE_NAME, '\` SET ',
         GROUP_CONCAT(CONCAT('\`', COLUMN_NAME, '\` = DATE_SUB(\`', COLUMN_NAME, '\`, INTERVAL 7 HOUR)') SEPARATOR ', '), ';')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = '$BASE' AND DATA_TYPE IN ('datetime','timestamp')
  GROUP BY TABLE_NAME" > /tmp/restar-7-horas.sql
wc -l /tmp/restar-7-horas.sql

echo "3) Aplicando en una sola transaccion"
( echo "START TRANSACTION;"; cat /tmp/restar-7-horas.sql; echo "COMMIT;" ) | mysql --defaults-extra-file=$CNF $BASE

echo "4) Revision"
mysql --defaults-extra-file=$CNF $BASE -e "SELECT id, nombre, estado, created_at FROM ventas ORDER BY id DESC LIMIT 4"
echo "LISTO. Si algo sale mal, restaura con: gunzip -c $COPIA | mysql --defaults-extra-file=$CNF $BASE"
