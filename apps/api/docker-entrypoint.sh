#!/bin/bash
set -e

# Ephemeral key so first `make up` works even with empty APP_KEY in .env.
if [ -z "$APP_KEY" ]; then
  export APP_KEY
  APP_KEY=$(php artisan key:generate --show)
  echo "APP_KEY was empty - generated an ephemeral key for this container."
fi

# Wait for Postgres (DB_HOST/DB_PORT/DB_USERNAME come from compose env).
DB_PORT="${DB_PORT:-5432}"
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" > /dev/null 2>&1; do
  echo "Waiting for Postgres at $DB_HOST:$DB_PORT..."
  sleep 2
done

# Idempotent: creates tables on first boot, no-op afterwards.
php artisan migrate --force

exec apache2-foreground
