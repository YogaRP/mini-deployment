#!/usr/bin/env bash
set -Eeuo pipefail

BUCKET="mini-deployment-backup-yogarp"
REGION="ap-southeast-1"
CONTAINER="$(docker ps --filter name=postgres --format '{{.Names}}' | head -n1)"
[ -n "$CONTAINER" ] || { echo "container postgres tidak ditemukan"; exit 1; }

FILE="/tmp/backup-$(date +%F-%H%M).sql.gz"

docker exec "$CONTAINER" sh -c \
  'PGPASSWORD="$POSTGRES_PASSWORD" pg_dump -U "$POSTGRES_USER" --no-owner' \
  | gzip > "$FILE"

# validasi: dump harus berisi tabel dan ukuran masuk akal
gunzip -c "$FILE" | grep -q "CREATE TABLE" || { echo "dump tidak berisi tabel, gagal"; rm -f "$FILE"; exit 1; }
[ "$(stat -c%s "$FILE")" -gt 1000 ] || { echo "dump terlalu kecil, gagal"; rm -f "$FILE"; exit 1; }

aws s3 cp "$FILE" "s3://$BUCKET/postgres/" --region "$REGION"
rm -f "$FILE"
echo "backup OK"