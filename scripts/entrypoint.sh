#!/bin/bash

set -e

# Wait for the database to be ready
bash ./scripts/wait-for.sh "$DB_HOST"

# Run seeds if needed
if [ "$RUN_SEED" = "true" ]; then
  npm run seed
fi

# Start the application
nodemon --watch 'src/**/*.ts' --exec 'ts-node' src/index.ts
