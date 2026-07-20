#!/bin/bash

# PawonOS Backup Script

set -e

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="pawonos_backup_${TIMESTAMP}.sql"

echo "🔄 PawonOS Backup"
echo "================="

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Database backup
echo "📦 Backing up database..."
PGPASSWORD="${POSTGRES_PASSWORD:-postgres}" pg_dump \
  -h "${DB_HOST:-localhost}" \
  -p "${DB_PORT:-5432}" \
  -U "${POSTGRES_USER:-postgres}" \
  -d "${POSTGRES_DB:-pawonos}" \
  -F c \
  -f "${BACKUP_DIR}/${BACKUP_FILE}"

echo "✅ Database backup: ${BACKUP_DIR}/${BACKUP_FILE}"

# Compress
echo "🗜️ Compressing..."
gzip "${BACKUP_DIR}/${BACKUP_FILE}"
echo "✅ Compressed: ${BACKUP_DIR}/${BACKUP_FILE}.gz"

# Cleanup old backups (keep last 30)
echo "🧹 Cleaning old backups..."
ls -t "${BACKUP_DIR}"/pawonos_backup_*.sql.gz 2>/dev/null | tail -n +31 | xargs -r rm

echo ""
echo "✅ Backup complete!"
echo ""
echo "Files:"
ls -lh "${BACKUP_DIR}"/pawonos_backup_*.sql.gz 2>/dev/null | tail -5