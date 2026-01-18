"""
Database Population Script - Phone Models from Chinese Mock API
Populates the database with brands and phone models for e-commerce website
Data source: archived/chinese-api-mock/fixtures/
"""

import json
import os
from decimal import Decimal
from database import SessionLocal, create_tables
from models import Brand, PhoneModel
from db_services import BrandService, PhoneModelService

def load_json_fixture(filename):
    """Load JSON fixture from archived Chinese API mock"""
    filepath = os.path.join("archived", "chinese-api-mock", "fixtures", filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def populate_brands(db):
    """Populate brands table from brands.json"""
    print("\n🔄 Populating brands...")

    brands_data = load_json_fixture("brands.json")

    # Brand mappings: Chinese API → E-Commerce
    brand_mappings = {
        "BR20250111000002": {
            "id": "iphone",
            "name": "iPhone",
            "display_name": "iPhone",
            "frame_color": "#007AFF",
            "button_color": "#007AFF",
            "subtitle": "Apple Phone Cases"
        },
        "BR20250111000003": {
            "id": "samsung",
            "name": "Samsung",
            "display_name": "Samsung",
            "frame_color": "#1428A0",
            "button_color": "#1428A0",
            "subtitle": "Samsung Galaxy Cases"
        }
    }

    brands_created = 0

    for chinese_brand in brands_data.get("data", []):
        chinese_brand_id = chinese_brand.get("id")

        if chinese_brand_id in brand_mappings:
            mapping = brand_mappings[chinese_brand_id]

            # Check if brand already exists
            existing = BrandService.get_brand_by_id(db, mapping["id"])
            if existing:
                print(f"  ℹ️  Brand '{mapping['name']}' already exists, skipping...")
                continue

            # Create brand
            brand_data = {
                "id": mapping["id"],
                "name": mapping["name"],
                "display_name": mapping["display_name"],
                "chinese_brand_id": chinese_brand_id,
                "frame_color": mapping["frame_color"],
                "button_color": mapping["button_color"],
                "subtitle": mapping["subtitle"],
                "is_available": True,
                "display_order": chinese_brand.get("sort_order", 0)
            }

            brand = BrandService.create_brand(db, brand_data)
            brands_created += 1
            print(f"  ✅ Created brand: {brand.display_name} (ID: {brand.id})")

    print(f"\n✅ Brands populated: {brands_created} new brands created")
    return brands_created

def populate_phone_models(db):
    """Populate phone_models table from device_models.json"""
    print("\n🔄 Populating phone models...")

    models_data = load_json_fixture("device_models.json")

    # Brand ID mapping: Chinese → E-Commerce
    brand_id_map = {
        "BR20250111000002": "iphone",
        "BR20250111000003": "samsung"
    }

    models_created = 0
    models_skipped = 0
    seen_models = set()  # Track unique models to avoid duplicates

    for chinese_model in models_data.get("data", []):
        chinese_brand_id = chinese_model.get("brand_id")
        mobile_model_name = chinese_model.get("mobile_model_name")

        # Skip if brand not mapped or model name is missing
        if chinese_brand_id not in brand_id_map or not mobile_model_name:
            models_skipped += 1
            continue

        brand_id = brand_id_map[chinese_brand_id]

        # Create unique key to avoid duplicate models
        # (Some models appear multiple times for different devices in mock data)
        unique_key = f"{brand_id}_{mobile_model_name}"
        if unique_key in seen_models:
            models_skipped += 1
            continue

        seen_models.add(unique_key)

        # Check if model already exists
        existing = PhoneModelService.get_model_by_name(db, mobile_model_name, brand_id)
        if existing:
            models_skipped += 1
            continue

        # Create phone model
        model_data = {
            "name": mobile_model_name,
            "display_name": chinese_model.get("model_display_name", mobile_model_name.upper()),
            "brand_id": brand_id,
            "chinese_model_id": chinese_model.get("mobile_model_id"),
            "price": Decimal(str(chinese_model.get("price", 35.00))),
            "stock": 999999,  # Unlimited stock for e-commerce
            "is_available": chinese_model.get("status") == "active",
            "display_order": chinese_model.get("sort_order", 999)
        }

        model = PhoneModelService.create_model(db, model_data)
        models_created += 1
        print(f"  ✅ Created model: {model.display_name} (£{model.price}) - Stock: Unlimited")

    print(f"\n✅ Phone models populated: {models_created} new models created, {models_skipped} duplicates skipped")
    return models_created

def main():
    """Main population function"""
    print("=" * 80)
    print("📱 PimpMyCase Database Population Script")
    print("=" * 80)
    print("\nSource: archived/chinese-api-mock/fixtures/")
    print("Target: Local PostgreSQL database")

    # Create database tables if they don't exist
    print("\n🔧 Creating database tables...")
    create_tables()
    print("✅ Database tables ready")

    # Create database session
    db = SessionLocal()

    try:
        # Populate brands
        brands_count = populate_brands(db)

        # Populate phone models
        models_count = populate_phone_models(db)

        # Summary
        print("\n" + "=" * 80)
        print("✅ DATABASE POPULATION COMPLETE")
        print("=" * 80)
        print(f"\n📊 Summary:")
        print(f"  • Brands created: {brands_count}")
        print(f"  • Phone models created: {models_count}")
        print(f"  • All stock set to: UNLIMITED (999999)")
        print(f"  • All models available: YES (unless manually disabled)")

        # Show created brands
        all_brands = BrandService.get_all_brands(db)
        print(f"\n📱 Available Brands ({len(all_brands)}):")
        for brand in all_brands:
            model_count = len(PhoneModelService.get_models_by_brand(db, brand.id))
            print(f"  • {brand.display_name}: {model_count} models")

        print("\n✅ Database is ready for e-commerce!")
        print("=" * 80)

    except Exception as e:
        print(f"\n❌ Error during population: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()
