#!/bin/sh
set -e

echo "[entrypoint] Waiting for PostgreSQL at ${DB_HOST}:${DB_PORT}..."
until pg_isready -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USERNAME}" >/dev/null 2>&1; do
  sleep 1
done
echo "[entrypoint] PostgreSQL is ready."

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "[entrypoint] Running migrations..."
  npm run typeorm:run-migration
fi

if [ "${RUN_SEED:-true}" = "true" ]; then
  echo "[entrypoint] Running seed (skips if demo data already exists)..."
  npm run seed || echo "[entrypoint] Seed skipped or already applied."
fi

echo "[entrypoint] Starting application..."
exec "$@"
