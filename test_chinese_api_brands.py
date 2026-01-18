#!/usr/bin/env python3
"""Test script to check Chinese API brands and models"""

import sys
import os
import json

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from services.chinese_api_service import get_chinese_api_service

def main():
    print("=" * 60)
    print("CHINESE API BRANDS AND MODELS CHECK")
    print("=" * 60)

    service = get_chinese_api_service()

    # Login first
    print("\n1. Logging in to Chinese API...")
    login_result = service.login()

    if not login_result.get("success"):
        print(f"❌ Login failed: {login_result.get('error')}")
        return

    print("✅ Login successful")

    # Get brands
    print("\n2. Fetching brands list...")
    brands_result = service.get_brands()

    if not brands_result.get("success"):
        print(f"❌ Failed to get brands: {brands_result.get('error')}")
        return

    print("✅ Brands fetched successfully\n")

    # Parse and display brands
    brands_data = brands_result.get("data", {}).get("data", [])

    if not brands_data:
        print("⚠️  No brands found in response")
        print(f"Full response: {json.dumps(brands_result, indent=2)}")
        return

    print(f"📱 Found {len(brands_data)} brands:\n")

    for brand in brands_data:
        brand_id = brand.get("id")
        brand_name = brand.get("brand_name")
        print(f"  • ID: {brand_id:3} | Name: {brand_name}")

    # Get stock models for each brand (using default device ID)
    device_id = service.config.device_id or "JMSOOMSZRQO9"
    print(f"\n3. Fetching stock models for device: {device_id}\n")

    total_models = 0
    for brand in brands_data[:5]:  # Limit to first 5 brands to avoid too many requests
        brand_id = str(brand.get("id"))
        brand_name = brand.get("brand_name")

        print(f"\n   Brand: {brand_name} (ID: {brand_id})")
        print("   " + "-" * 50)

        stock_result = service.get_stock_models(device_id, brand_id)

        if not stock_result.get("success"):
            print(f"   ❌ Failed: {stock_result.get('error')}")
            continue

        models_data = stock_result.get("data", {}).get("data", [])

        if not models_data:
            print("   ⚠️  No models found")
            continue

        print(f"   ✅ Found {len(models_data)} models:")

        for model in models_data[:3]:  # Show first 3 models per brand
            model_id = model.get("id")
            model_name = model.get("mobile_model_name")
            shell_id = model.get("mobile_shell_id")
            print(f"      - ID: {model_id} | Model: {model_name} | Shell ID: {shell_id}")

        if len(models_data) > 3:
            print(f"      ... and {len(models_data) - 3} more models")

        total_models += len(models_data)

    print("\n" + "=" * 60)
    print(f"SUMMARY: {len(brands_data)} brands, {total_models}+ models checked")
    print("=" * 60)

if __name__ == "__main__":
    main()
