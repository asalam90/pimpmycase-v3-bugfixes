#!/bin/bash
BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
echo "Creating database backup: $BACKUP_FILE"
pg_dump $DATABASE_URL > $BACKUP_FILE
echo "✅ Backup created: $BACKUP_FILE"
