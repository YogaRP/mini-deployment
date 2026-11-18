#!/usr/bin/env bash
set -Eeuo pipefail
cd /home/ubuntu/app
R=ap-southeast-1
BUCKET=mini-deployment-backup-yogarp
P() { aws ssm get-parameter --name "/mini/prod/$1" --with-decryption --query Parameter.Value --output text --region $R; }
POSTGRES_USER=$(P POSTGRES_USER); POSTGRES_PASSWORD=$(P POSTGRES_PASSWORD)
F="/tmp/${POSTGRES_USER}-$(date +%F-%H%M).sql.gz"
docker compose exec -T -e PGPASSWORD="$POSTGRES_PASSWORD" postgres \
  pg_dump -U "$POSTGRES_USER" "$DB_NAME" | gzip > "$F"
aws s3 cp "$F" "s3://$BUCKET/postgres/" --region $R
rm -f "$F"