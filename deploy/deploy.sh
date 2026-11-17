#!/usr/bin/env bash
set -Eeuo pipefail

SERVICE="${1:?usage: deploy.sh <service> <tag>}"
TAG="${2:?usage: deploy.sh <service> <tag>}"
APP_DIR="${APP_DIR:-/home/ubuntu/app}"
REGION="${AWS_REGION:-ap-southeast-1}"

[[ "$SERVICE" =~ ^(gateway|products|orders|web)$ ]] || { echo "service tidak valid"; exit 1; }
[[ "$TAG" =~ ^[A-Za-z0-9._-]+$ ]] || { echo "tag tidak valid"; exit 1; }

cd "$APP_DIR"
VAR="${SERVICE^^}_TAG"
grep -q "^${VAR}=" .env || { echo "${VAR} tidak ada di .env"; exit 1; }
REGISTRY="$(grep '^REGISTRY=' .env | cut -d= -f2)"

cp .env .env.bak
[ -f docker-compose.yml ] && cp docker-compose.yml docker-compose.yml.bak

rollback() {
  trap - ERR
  echo "DEPLOY GAGAL, rollback"
  cp .env.bak .env
  [ -f docker-compose.yml.bak ] && cp docker-compose.yml.bak docker-compose.yml
  rm -f docker-compose.yml.new
  chown ubuntu:ubuntu .env docker-compose.yml
  chmod 600 .env
  docker compose up -d "$SERVICE" || true
  exit 1
}
trap rollback ERR

# sinkronkan compose dari Git (jika dikirim pipeline), validasi dulu
if [ -f docker-compose.yml.new ]; then
  mv docker-compose.yml.new docker-compose.yml
  docker compose config -q
fi

aws ecr get-login-password --region "$REGION" \
  | docker login --username AWS --password-stdin "$REGISTRY"

sed -i "s/^${VAR}=.*/${VAR}=${TAG}/" .env
chown ubuntu:ubuntu .env docker-compose.yml
chmod 600 .env

docker compose pull "$SERVICE"
docker compose up -d --wait --wait-timeout 90 "$SERVICE"
docker compose ps "$SERVICE"
echo "OK: ${SERVICE} -> ${TAG}"