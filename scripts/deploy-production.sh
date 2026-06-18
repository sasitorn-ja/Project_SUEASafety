#!/usr/bin/env bash
set -euo pipefail

REMOTE_HOST="${REMOTE_HOST:-root@192.168.1.142}"
REMOTE_DIR="${REMOTE_DIR:-/var/www/cpac-safety-plus}"
REMOTE_BRANCH="${REMOTE_BRANCH:-main}"

echo "Deploying ${REMOTE_BRANCH} to ${REMOTE_HOST}:${REMOTE_DIR}"

ssh "${REMOTE_HOST}" "set -euo pipefail
cd '${REMOTE_DIR}'
git fetch origin '${REMOTE_BRANCH}'
git reset --hard 'origin/${REMOTE_BRANCH}'
test -f .env.production
docker compose build
docker compose --profile tools run --rm migration
docker compose up -d --force-recreate
docker compose logs --tail=80 cpac-safety-plus
"

curl --fail --silent --show-error --retry 12 --retry-delay 5 \
  "https://safety.cipcloud.net/api/health"
echo
echo "Done: https://safety.cipcloud.net"
