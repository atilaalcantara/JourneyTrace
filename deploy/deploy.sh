#!/usr/bin/env sh
set -eu

: "${JOURNEYTRACE_IMAGE:?JOURNEYTRACE_IMAGE is required}"

export JOURNEYTRACE_IMAGE
docker compose -f docker-compose.prod.yml pull journeytrace
docker compose -f docker-compose.prod.yml up -d --remove-orphans journeytrace
docker image prune -f
