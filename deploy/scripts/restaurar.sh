#!/bin/sh
# Restaura un respaldo (base de datos y archivos). REEMPLAZA los datos actuales.
# Uso (desde deploy/):  ./scripts/restaurar.sh /mnt/respaldos/diario/bd_20261101.sql.gz /mnt/respaldos/diario/media_20261101.tar.gz
set -eu

BD="${1:?Indicar el archivo bd_AAAAMMDD.sql.gz}"
MEDIA="${2:?Indicar el archivo media_AAAAMMDD.tar.gz}"
COMPOSE="docker compose -f docker-compose.prod.yml --env-file .env"
. ./.env

# Antes de tocar nada se verifica que los dos respaldos estén sanos.
gunzip -t "$BD" || { echo "El respaldo de la base de datos está dañado. No se cambió nada."; exit 1; }
tar tzf "$MEDIA" > /dev/null || { echo "El respaldo de archivos está dañado. No se cambió nada."; exit 1; }

printf 'Se reemplazarán la base de datos y los archivos actuales. Escriba RESTAURAR para continuar: '
read -r confirmacion
[ "$confirmacion" = "RESTAURAR" ] || { echo "Cancelado."; exit 1; }

$COMPOSE stop backend
$COMPOSE exec -T db psql -U "$POSTGRES_USER" -d postgres -c "DROP DATABASE IF EXISTS \"$POSTGRES_DB\";"
$COMPOSE exec -T db psql -U "$POSTGRES_USER" -d postgres -c "CREATE DATABASE \"$POSTGRES_DB\";"
gunzip -c "$BD" | $COMPOSE exec -T db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -q

# Los archivos se extraen primero en una carpeta temporal y solo después reemplazan a los actuales.
$COMPOSE run --rm --no-deps -T --entrypoint sh backend -c \
  "mkdir -p /tmp/restauracion && tar xzf - -C /tmp/restauracion && \
   find /app/media -mindepth 1 -delete && cp -a /tmp/restauracion/media/. /app/media/" < "$MEDIA"
$COMPOSE start backend
echo "Restauración completa."
