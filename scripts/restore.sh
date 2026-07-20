#!/bin/bash

# PawonOS Restore Script

set -e

BACKUP_FILE="$1"

if [ -z "$BACKUP_FILE" ]; then
    echo "❌ Error: Please provide backup file path"
    echo "Usage: ./scripts/restore.sh <backup_file.sql.gz>"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "🔄 PawonOS Restore"
echo "=================="
echo "Backup file: $BACKUP_FILE"

# Confirm
read -p "⚠️  This will overwrite the database. Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

# Decompress if needed
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo "📦 Decompressing..."
    gunzip -k "$BACKUP_FILE"
    BACKUP_FILE="${BACKUP_FILE%.gz}"
fi

# Restore
echo "🔄 Restoring database..."
PGPASSWORD="${POSTGRES_PASSWORD:-postgres}" pg_restore \
  -h "${DB_HOST:-localhost}" \
  -p "${DB_PORT:-5432}" \
  -U "${POSTGRES_USER:-postgres}" \
  -d "${POSTGRES_DB:-pawonos}" \
  --clean \
  --if-exists \
  "$BACKUP_FILE"

echo ""
echo "✅ Restore complete!"