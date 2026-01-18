"""
TEMPORARY: Promotional pricing configuration for specific vending machines
TODO: Remove this file when promotional period ends

Created: 2025-12-24
Purpose: Free cases for machine 16DCTRYUJSJH during promotional period

IMPORTANT: When promotional period ends:
1. Delete this file: backend/config/promotional_pricing.py
2. Remove import from backend/routes/payment.py (search for "promotional_pricing")
3. Remove import from backend/routes/vending.py (search for "promotional_pricing")
4. Remove frontend override from src/config/templatePricing.js (search for "FREE_MACHINES")
5. Remove frontend check from src/screens/PaymentScreen.jsx (search for "isFreePromoMachine")

For detailed removal instructions, see: docs/2025-12-24-promotional-pricing-removal-guide.md
"""

# ============================================
# PROMOTIONAL MACHINE CONFIGURATION
# ============================================
# These machines offer FREE cases (£0.00) during promotional period

FREE_MACHINE_IDS = [
    "16DCTRYUJSJH",  # Promotional vending machine - FREE CASES
]


def is_free_promotional_machine(machine_id: str) -> bool:
    """
    Check if a machine ID qualifies for free promotional pricing.

    Args:
        machine_id: The vending machine device ID

    Returns:
        True if this machine offers free cases, False otherwise
    """
    if not machine_id:
        return False

    return machine_id.upper().strip() in [mid.upper() for mid in FREE_MACHINE_IDS]


def get_promotional_price(machine_id: str, original_price_pence: int) -> int:
    """
    Get the promotional price for a given machine.

    Args:
        machine_id: The vending machine device ID
        original_price_pence: The original price in pence

    Returns:
        0 if promotional machine, otherwise original price
    """
    if is_free_promotional_machine(machine_id):
        return 0  # FREE

    return original_price_pence


def get_promotional_price_pounds(machine_id: str, original_price_pounds: float) -> float:
    """
    Get the promotional price in pounds for a given machine.

    Args:
        machine_id: The vending machine device ID
        original_price_pounds: The original price in pounds

    Returns:
        0.00 if promotional machine, otherwise original price
    """
    if is_free_promotional_machine(machine_id):
        return 0.00  # FREE

    return original_price_pounds
