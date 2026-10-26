#!/bin/sh
# Respaldo de la base de datos y de los archivos subidos.
# Retención: 7 respaldos diarios y 4 semanales (los domingos).
# Uso:   RESPALDO_DIR=/mnt/respaldos ./scripts/respaldo.sh    (desde deploy/)
# Cron:  0 2 * * * cd /ruta/al/repo/deploy && RESPALDO_DIR=/mnt/respaldos ./scripts/respaldo.sh >> respaldo.log 2>&1
set -eu

RESPALDO_DIR="${RESPALDO_DIR:?Definir RESPALDO_DIR (almacenamiento distinto al disco principal)}"
COMPOSE="docker compose -f docker-compose.prod.yml --env-file .env"
FECHA=$(date +%Y%m%d)
. ./.env

mkdir -p "$RESPALDO_DIR/diario" "$RESPALDO_DIR/semanal"

$COMPOSE exec -T db pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner \
  | gzip > "$RESPALDO_DIR/diario/bd_$FECHA.sql.gz"
$COMPOSE exec -T backend tar czf - -C /app media > "$RESPALDO_DIR/diario/media_$FECHA.tar.gz"

# Los domingos se guarda una copia semanal.
if [ "$(date +%u)" = "7" ]; then
  cp "$RESPALDO_DIR/diario/bd_$FECHA.sql.gz" "$RESPALDO_DIR/diario/media_$FECHA.tar.gz" "$RESPALDO_DIR/semanal/"
fi

# Rotación: conserva los 7 diarios y los 4 semanales más recientes.
for tipo in bd media; do
  ls -1t "$RESPALDO_DIR/diario/${tipo}_"* 2>/dev/null | tail -n +8 | xargs -r rm -f
  ls -1t "$RESPALDO_DIR/semanal/${tipo}_"* 2>/dev/null | tail -n +5 | xargs -r rm -f
done

echo "$(date '+%F %T') respaldo completo: bd_$FECHA.sql.gz media_$FECHA.tar.gz"
