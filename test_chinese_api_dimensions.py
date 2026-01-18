#!/usr/bin/env python3
"""
Test script to verify width/height dimensions from Chinese API stock/list endpoint.

This script tests:
1. Whether Chinese API returns width/height in stock/list response
2. The format and units of the dimensions
3. Multiple phone models (iPhone 15 Pro, Pro Max, Samsung S25)
"""

import os
import sys
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from services.chinese_payment_service import ChinesePaymentAPIClient

def print_separator(title):
    """Print a formatted separator with title"""
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80)

def test_chinese_api_dimensions():
    """Test Chinese API stock/list endpoint for width/height dimensions"""

    print_separator("CHINESE API DIMENSIONS TEST")
    print("\nInitializing Chinese API client...")

    # Initialize client with longer timeout
    try:
        client = ChinesePaymentAPIClient()
        client.timeout = 90  # Increase timeout to 90 seconds
        print(f"✓ Client initialized")
        print(f"  Base URL: {client.base_url}")
        print(f"  Account: {os.getenv('CHINESE_API_ACCOUNT', 'Not set')}")
        print(f"  Device ID: {os.getenv('CHINESE_API_DEVICE_ID', 'Not set')}")
        print(f"  Timeout: {client.timeout}s")
    except Exception as e:
        print(f"✗ Failed to initialize client: {e}")
        return

    # Test authentication
    print_separator("AUTHENTICATION TEST")
    try:
        auth_success = client.login()
        if auth_success:
            print(f"✓ Authentication successful")
            print(f"  Token: {client.token[:50]}..." if client.token else "  No token")
        else:
            print(f"✗ Authentication failed")
            return
    except Exception as e:
        print(f"✗ Authentication error: {e}")
        import traceback
        traceback.print_exc()
        return

    # Test brands to get brand IDs
    print_separator("FETCHING BRANDS")
    try:
        brands_result = client.get_brand_list()
        if brands_result.get("success"):
            brands = brands_result.get("brands", [])
            print(f"✓ Retrieved {len(brands)} brands")
            for brand in brands:
                print(f"  - {brand.get('e_name', 'Unknown')}: {brand.get('id', 'No ID')}")
        else:
            print(f"✗ Failed to get brands: {brands_result.get('error')}")
            return
    except Exception as e:
        print(f"✗ Error fetching brands: {e}")
        import traceback
        traceback.print_exc()
        return

    # Find iPhone and Samsung brand IDs
    iphone_brand_id = None
    samsung_brand_id = None

    for brand in brands:
        if brand.get('e_name') == 'Apple':
            iphone_brand_id = brand.get('id')
        elif brand.get('e_name') == 'Samsung':
            samsung_brand_id = brand.get('id')

    # Test configurations
    test_configs = []
    device_id = os.getenv('CHINESE_API_DEVICE_ID', 'JMSOOMSZRQO9')

    if iphone_brand_id:
        test_configs.append({
            'name': 'Apple (iPhone)',
            'device_id': device_id,
            'brand_id': iphone_brand_id
        })

    if samsung_brand_id:
        test_configs.append({
            'name': 'Samsung',
            'device_id': device_id,
            'brand_id': samsung_brand_id
        })

    # If no brands found, try default IDs from documentation
    if not test_configs:
        print("\n⚠ Using default brand IDs from documentation")
        test_configs = [
            {
                'name': 'Apple (iPhone) - Default ID',
                'device_id': device_id,
                'brand_id': 'BR20250111000002'
            },
            {
                'name': 'Samsung - Default ID',
                'device_id': device_id,
                'brand_id': 'BR020250120000001'
            }
        ]

    # Test stock/list endpoint for each brand
    for config in test_configs:
        print_separator(f"TESTING STOCK/LIST: {config['name']}")
        print(f"Device ID: {config['device_id']}")
        print(f"Brand ID: {config['brand_id']}")

        try:
            stock_result = client.get_stock_list(
                device_id=config['device_id'],
                brand_id=config['brand_id']
            )

            if stock_result.get("success"):
                stock_items = stock_result.get("stock_items", [])
                print(f"\n✓ Retrieved {len(stock_items)} stock items")

                if not stock_items:
                    print("⚠ No stock items returned")
                    continue

                # Analyze first 3 items for dimensions
                print("\nAnalyzing stock items for width/height:")
                print("-" * 80)

                items_with_dimensions = 0
                items_without_dimensions = 0

                for i, item in enumerate(stock_items[:5], 1):  # Check first 5 items
                    model_name = item.get('mobile_model_name', 'Unknown')
                    model_id = item.get('mobile_model_id', 'Unknown')
                    width = item.get('width')
                    height = item.get('height')
                    stock = item.get('stock', 0)

                    print(f"\n[{i}] {model_name}")
                    print(f"    Model ID: {model_id}")
                    print(f"    Stock: {stock}")

                    if width is not None and height is not None:
                        items_with_dimensions += 1
                        print(f"    ✓ Width: {width} (type: {type(width).__name__})")
                        print(f"    ✓ Height: {height} (type: {type(height).__name__})")

                        # Try to parse as float to confirm it's numeric
                        try:
                            width_float = float(width)
                            height_float = float(height)
                            print(f"    ✓ Parsed: {width_float}mm × {height_float}mm")
                        except ValueError:
                            print(f"    ⚠ Warning: Cannot parse dimensions as numbers")
                    else:
                        items_without_dimensions += 1
                        print(f"    ✗ Width: {width}")
                        print(f"    ✗ Height: {height}")

                    # Check for nested dimensions object
                    if 'dimensions' in item:
                        print(f"    ℹ Found 'dimensions' object:")
                        print(f"      {json.dumps(item['dimensions'], indent=6)}")

                # Summary
                print("\n" + "-" * 80)
                print(f"SUMMARY for {config['name']}:")
                print(f"  Total items analyzed: {min(5, len(stock_items))}")
                print(f"  Items WITH width/height: {items_with_dimensions}")
                print(f"  Items WITHOUT width/height: {items_without_dimensions}")

                if items_with_dimensions > 0:
                    print(f"  ✓ Dimensions ARE being returned by Chinese API")
                else:
                    print(f"  ✗ Dimensions NOT found in response")

                # Show raw data sample for first item
                if stock_items:
                    print("\n" + "-" * 80)
                    print("RAW DATA SAMPLE (first item):")
                    print(json.dumps(stock_items[0], indent=2, ensure_ascii=False))

            else:
                error_msg = stock_result.get("error", "Unknown error")
                error_code = stock_result.get("code")
                print(f"\n✗ Stock list request failed")
                print(f"  Error: {error_msg}")
                print(f"  Code: {error_code}")

                if "permission" in error_msg.lower():
                    print(f"\n  ℹ This appears to be a permission issue.")
                    print(f"    Device ID '{config['device_id']}' may not be registered")
                    print(f"    with account '{os.getenv('CHINESE_API_ACCOUNT')}'")
                    print(f"    This is expected and can be resolved by registering the device.")

        except Exception as e:
            print(f"\n✗ Error testing stock list: {e}")
            import traceback
            print("\nTraceback:")
            traceback.print_exc()

    # Final summary
    print_separator("TEST COMPLETE")
    print("\nNext Steps:")
    print("1. Review the output above to confirm width/height presence")
    print("2. Check backend API endpoints to see if dimensions are extracted")
    print("3. Verify frontend receives the dimensions")
    print("4. Document findings in CHINESE_API_DIMENSIONS_TEST_REPORT.md")
    print("\n" + "=" * 80)

if __name__ == "__main__":
    test_chinese_api_dimensions()
