#!/bin/bash

set -e

host="$1"
shift
cmd="$@"

echo "Waiting for PostgreSQL at $host as user $DB_USERNAME"

export PGPASSWORD=$DB_PASSWORD

until psql -h "$host" -U "$DB_USERNAME" -d "$DB_DATABASE" -c '\q' > /dev/null 2>&1; do
  >&2 echo "Postgres is unavailable - sleeping"
  sleep 1
done

>&2 echo "Postgres is up - executing command"
exec "$@"
