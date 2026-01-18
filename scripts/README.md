# Utility Scripts

This directory contains utility scripts for database management, migrations, and maintenance tasks.

## Database Scripts

### populate_phones.py
Synchronizes phone models from the Chinese Manufacturing API.

**Usage**:
```bash
python scripts/populate_phones.py
```

**Purpose**:
- Fetches brands from Chinese API
- Fetches phone models for each brand
- Updates `brands` and `phone_models` tables
- Syncs Chinese API IDs and physical dimensions

**When to run**:
- Initial setup
- When new phone models are released
- Weekly maintenance to keep models up-to-date

### init_db.py
Initializes the database with schema and initial data.

**Usage**:
```bash
python scripts/init_db.py
```

**Purpose**:
- Creates database tables
- Populates initial templates
- Sets up admin users

**When to run**:
- First-time database setup
- After database reset

### backup_database.sh
Creates a backup of the PostgreSQL database.

**Usage**:
```bash
./scripts/backup_database.sh
```

**Purpose**:
- Creates timestamped database backup
- Saves to local directory

**When to run**:
- Before major migrations
- Daily/weekly backups (recommended)

### build.sh
General build script.

**Usage**:
```bash
./scripts/build.sh
```

### create_phone_overlay.py
Generates phone case overlay images with camera cutouts.

**Usage**:
```bash
python scripts/create_phone_overlay.py
```

**Purpose**:
- Creates SVG mask overlays for phone models
- Generates camera cutout positions

### generate_clip_path_from_png.py
Generates SVG clip paths from PNG mask images.

**Usage**:
```bash
python scripts/generate_clip_path_from_png.py <input.png>
```

**Purpose**:
- Converts PNG masks to SVG paths
- Used for creating phone case masks

## Migrations

Migration scripts are located in `scripts/migrations/`.

### SQL Migrations

- **init_database.sql** - Initial database schema
- **add_missing_tables.sql** - Additional table definitions
- **rollback_migration.sql** - Rollback script for migrations

**Usage**:
```bash
psql $DATABASE_URL -f scripts/migrations/init_database.sql
```

### Python Migrations

- **migrate_add_chinese_brand_id.py** - Adds Chinese brand ID column
- **migrate_orders_table.py** - Updates orders table schema
- **migrate_to_chinese_brand_ids.py** - Migrates to Chinese brand ID system

**Usage**:
```bash
python scripts/migrate_<name>.py
```

**Important**: Always backup database before running migrations!

## Notes

- Run scripts from the project root directory
- Ensure virtual environment is activated for Python scripts
- Check environment variables are set (`.env` file)
- Review migration scripts before running in production
