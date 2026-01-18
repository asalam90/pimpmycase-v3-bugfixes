#!/usr/bin/env python3
"""
Migration: Use Chinese Brand IDs as Primary Keys
- Migrates brand IDs from local ('iphone', 'samsung') to Chinese API IDs
- Updates foreign key references in phone_models and orders tables
- Removes duplicate APPLE brand
- Disables Google brand
"""

import os
from sqlalchemy import text
from database import engine, SessionLocal
from dotenv import load_dotenv

load_dotenv()

def run_migration():
    """Execute the migration"""
    db = SessionLocal()

    print("=" * 60)
    print("MIGRATION: Chinese Brand IDs as Primary Keys")
    print("=" * 60)

    try:
        # Step 1: Show current state
        print("\n📊 Current state:")
        result = db.execute(text("""
            SELECT id, name, chinese_brand_id, is_available
            FROM brands
            ORDER BY name
        """))
        for row in result:
            print(f"  - ID: {row.id}, Name: {row.name}, Chinese ID: {row.chinese_brand_id}, Available: {row.is_available}")

        # Step 2: Create new brands with Chinese IDs (copying from existing)
        print("\n🔄 Step 1: Creating brands with Chinese brand IDs...")

        # Get existing iPhone brand data
        iphone_brand = db.execute(text("""
            SELECT * FROM brands WHERE id = 'iphone'
        """)).first()

        if iphone_brand:
            # Check if Chinese ID brand already exists (might be the duplicate APPLE)
            existing_chinese_iphone = db.execute(text("""
                SELECT id FROM brands WHERE id = 'BR20250111000002'
            """)).first()

            if existing_chinese_iphone:
                print(f"  ℹ️  Brand BR20250111000002 already exists, updating it...")
                db.execute(text("""
                    UPDATE brands
                    SET name = 'iPhone',
                        display_name = 'IPHONE',
                        frame_color = :frame_color,
                        button_color = :button_color,
                        is_available = true,
                        display_order = 1,
                        subtitle = :subtitle
                    WHERE id = 'BR20250111000002'
                """), {
                    'frame_color': iphone_brand.frame_color,
                    'button_color': iphone_brand.button_color,
                    'subtitle': iphone_brand.subtitle or 'The most popular choice'
                })
            else:
                print(f"  ➕ Creating new iPhone brand with ID BR20250111000002...")
                db.execute(text("""
                    INSERT INTO brands (id, name, display_name, chinese_brand_id, frame_color, button_color, is_available, display_order, subtitle, created_at, updated_at)
                    VALUES ('BR20250111000002', 'iPhone', 'IPHONE', 'BR20250111000002', :frame_color, :button_color, true, 1, :subtitle, NOW(), NOW())
                """), {
                    'frame_color': iphone_brand.frame_color,
                    'button_color': iphone_brand.button_color,
                    'subtitle': iphone_brand.subtitle or 'The most popular choice'
                })

        # Get existing Samsung brand data
        samsung_brand = db.execute(text("""
            SELECT * FROM brands WHERE id = 'samsung'
        """)).first()

        if samsung_brand:
            existing_chinese_samsung = db.execute(text("""
                SELECT id FROM brands WHERE id = 'BR020250120000001'
            """)).first()

            if existing_chinese_samsung:
                print(f"  ℹ️  Brand BR020250120000001 already exists, updating it...")
                db.execute(text("""
                    UPDATE brands
                    SET name = 'Samsung',
                        display_name = 'SAMSUNG',
                        frame_color = :frame_color,
                        button_color = :button_color,
                        is_available = true,
                        display_order = 2,
                        subtitle = :subtitle
                    WHERE id = 'BR020250120000001'
                """), {
                    'frame_color': samsung_brand.frame_color,
                    'button_color': samsung_brand.button_color,
                    'subtitle': samsung_brand.subtitle or 'Galaxy series'
                })
            else:
                print(f"  ➕ Creating new Samsung brand with ID BR020250120000001...")
                db.execute(text("""
                    INSERT INTO brands (id, name, display_name, chinese_brand_id, frame_color, button_color, is_available, display_order, subtitle, created_at, updated_at)
                    VALUES ('BR020250120000001', 'Samsung', 'SAMSUNG', 'BR020250120000001', :frame_color, :button_color, true, 2, :subtitle, NOW(), NOW())
                """), {
                    'frame_color': samsung_brand.frame_color,
                    'button_color': samsung_brand.button_color,
                    'subtitle': samsung_brand.subtitle or 'Galaxy series'
                })

        db.commit()
        print(f"  ✅ Chinese brand IDs created/updated")

        # Step 3: Update phone_models foreign keys to point to new Chinese brand IDs
        print("\n🔄 Step 2: Updating phone_models.brand_id references...")

        # iPhone models
        result = db.execute(text("""
            UPDATE phone_models
            SET brand_id = 'BR20250111000002'
            WHERE brand_id = 'iphone'
        """))
        print(f"  ✅ Updated {result.rowcount} iPhone models")

        # Samsung models
        result = db.execute(text("""
            UPDATE phone_models
            SET brand_id = 'BR020250120000001'
            WHERE brand_id = 'samsung'
        """))
        print(f"  ✅ Updated {result.rowcount} Samsung models")

        db.commit()

        # Step 4: Update orders foreign keys
        print("\n🔄 Step 3: Updating orders.brand_id references...")

        result = db.execute(text("""
            UPDATE orders
            SET brand_id = 'BR20250111000002'
            WHERE brand_id = 'iphone'
        """))
        print(f"  ✅ Updated {result.rowcount} iPhone orders")

        result = db.execute(text("""
            UPDATE orders
            SET brand_id = 'BR020250120000001'
            WHERE brand_id = 'samsung'
        """))
        print(f"  ✅ Updated {result.rowcount} Samsung orders")

        db.commit()

        # Step 5: Delete old brand entries
        print("\n🔄 Step 4: Removing old brand entries...")

        # Delete old iPhone brand
        result = db.execute(text("""
            DELETE FROM brands WHERE id = 'iphone'
        """))
        print(f"  ✅ Deleted old iPhone brand: {result.rowcount} rows")

        # Delete old Samsung brand
        result = db.execute(text("""
            DELETE FROM brands WHERE id = 'samsung'
        """))
        print(f"  ✅ Deleted old Samsung brand: {result.rowcount} rows")

        db.commit()

        # Step 6: Disable Google brand
        print("\n⏸️  Step 5: Disabling Google brand...")
        result = db.execute(text("""
            UPDATE brands
            SET is_available = false
            WHERE id = 'google'
        """))
        print(f"  ✅ Disabled Google brand: {result.rowcount} rows")

        db.commit()

        # Step 7: Verify final state
        print("\n✅ Final state:")
        result = db.execute(text("""
            SELECT id, name, chinese_brand_id, is_available
            FROM brands
            ORDER BY is_available DESC, name
        """))
        for row in result:
            print(f"  - ID: {row.id}, Name: {row.name}, Chinese ID: {row.chinese_brand_id}, Available: {row.is_available}")

        # Verify model counts
        print("\n📊 Phone models per brand:")
        result = db.execute(text("""
            SELECT brand_id, COUNT(*) as count
            FROM phone_models
            GROUP BY brand_id
            ORDER BY count DESC
        """))
        for row in result:
            print(f"  - Brand {row.brand_id}: {row.count} models")

        print("\n" + "=" * 60)
        print("✅ MIGRATION COMPLETED SUCCESSFULLY")
        print("=" * 60)

    except Exception as e:
        print(f"\n❌ MIGRATION FAILED: {e}")
        print("Rolling back...")
        db.rollback()
        print("💡 Restore from backup if needed")
        raise
    finally:
        db.close()

def create_rollback_script():
    """Create a rollback script in case migration needs to be reverted"""
    rollback_script = """
-- ROLLBACK SCRIPT
-- Run this if you need to revert the migration

-- Revert brand IDs
UPDATE brands SET id = 'iphone' WHERE id = 'BR20250111000002';
UPDATE brands SET id = 'samsung' WHERE id = 'BR020250120000001';

-- Revert phone_models foreign keys
UPDATE phone_models SET brand_id = 'iphone' WHERE brand_id = 'BR20250111000002';
UPDATE phone_models SET brand_id = 'samsung' WHERE brand_id = 'BR020250120000001';

-- Revert orders foreign keys
UPDATE orders SET brand_id = 'iphone' WHERE brand_id = 'BR20250111000002';
UPDATE orders SET brand_id = 'samsung' WHERE brand_id = 'BR020250120000001';

-- Re-enable Google
UPDATE brands SET is_available = true WHERE id = 'google';
"""

    with open('rollback_migration.sql', 'w') as f:
        f.write(rollback_script)

    print("📝 Created rollback script: rollback_migration.sql")

if __name__ == "__main__":
    import sys

    # Check for --yes flag for non-interactive mode
    non_interactive = '--yes' in sys.argv or '-y' in sys.argv

    if not non_interactive:
        print("\n⚠️  WARNING: This will modify your database!")
        print("Make sure you have created a backup first.")
        response = input("\nContinue with migration? (yes/no): ")

        if response.lower() != 'yes':
            print("Migration cancelled.")
            sys.exit(0)

    create_rollback_script()
    run_migration()
