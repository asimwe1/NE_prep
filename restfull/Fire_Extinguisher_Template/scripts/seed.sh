#!/bin/bash

echo "========================================"
echo "FireShield Database Setup"
echo "========================================"
echo

# Load environment variables from .env
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Default values if not set
DB_USER=${DB_USER:-postgres}
DB_NAME=${DB_NAME:-fire_ext_db}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_PASSWORD=${DB_PASSWORD:-}

echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo "Host: $DB_HOST:$DB_PORT"
echo

# Set password for psql (avoids prompt)
export PGPASSWORD="$DB_PASSWORD"

echo "Step 1: Running migrations..."
psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" \
  -f database/migrations/001_initial_schema.sql

if [ $? -ne 0 ]; then
  echo "ERROR: Migration failed!"
  exit 1
fi

echo "✓ Migrations completed successfully"
echo

echo "Step 2: Seeding admin users..."
psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" \
  -f database/seeds/001_seed_admin.sql

if [ $? -ne 0 ]; then
  echo "ERROR: Seeding failed!"
  exit 1
fi

echo "✓ Seeding completed successfully"
echo

echo "========================================"
echo "Database setup complete!"
echo "========================================"
echo

echo "Default accounts created:"
echo
echo "ADMIN:"
echo "  Email: admin@fireshield.com"
echo "  Password: Admin@2024"
echo
echo "STAFF:"
echo "  Email: staff@fireshield.com"
echo "  Password: Staff@2024"
echo
echo "CUSTOMER (Test):"
echo "  Email: customer@example.com"
echo "  Password: Customer@2024"
echo
echo "⚠️ IMPORTANT: Change these passwords in production!"
echo
echo "See ADMIN_CREDENTIALS.md for more details."
echo

read -p "Press Enter to continue..."