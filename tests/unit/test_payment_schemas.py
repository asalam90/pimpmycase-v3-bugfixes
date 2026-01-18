"""Unit tests for payment schemas"""
import pytest
from pydantic import ValidationError
from backend.schemas.payment import CheckoutSessionRequest

class TestCheckoutSessionRequest:
    """Test CheckoutSessionRequest schema validation"""

    def test_qr_entry_schema_valid(self, qr_entry_data):
        """Test QR entry with all required fields"""
        request = CheckoutSessionRequest(**qr_entry_data)

        assert request.entry_source == "qr"
        assert request.machine_id == "TEST_MACHINE_123"
        assert request.is_machine_collection is True
        assert request.customer_name is None  # Not required for QR
        assert request.template_id == "classic"
        assert request.brand == "iPhone"
        assert request.model == "iPhone 15"

    def test_vanilla_entry_schema_valid(self, vanilla_entry_data):
        """Test vanilla entry with delivery details"""
        request = CheckoutSessionRequest(**vanilla_entry_data)

        assert request.entry_source == "vanilla"
        assert request.is_machine_collection is False
        assert request.customer_name == "John Doe"
        assert request.customer_email == "john@example.com"
        assert request.shipping_address_line1 == "123 Test Street"
        assert request.shipping_city == "London"
        assert request.shipping_postcode == "SW1A 1AA"
        assert request.template_id == "classic"

    def test_entry_source_defaults_none(self):
        """Test entry_source defaults to None if not provided"""
        minimal_data = {
            "amount_pence": 3500,
            "template_id": "classic",
            "brand": "iPhone",
            "model": "iPhone 15",
            "color": "Clear"
        }
        request = CheckoutSessionRequest(**minimal_data)

        assert request.entry_source is None
        assert request.is_machine_collection is False
        assert request.machine_id is None

    def test_machine_id_optional(self):
        """Test machine_id is optional"""
        data = {
            "amount_pence": 3500,
            "template_id": "classic",
            "brand": "iPhone",
            "model": "iPhone 15",
            "color": "Clear",
            "entry_source": "qr"
            # No machine_id
        }
        request = CheckoutSessionRequest(**data)
        assert request.machine_id is None
        assert request.entry_source == "qr"

    def test_customer_details_optional(self):
        """Test customer details are optional (for QR entry)"""
        qr_data = {
            "amount_pence": 3500,
            "template_id": "classic",
            "brand": "iPhone",
            "model": "iPhone 15",
            "color": "Clear",
            "entry_source": "qr",
            "machine_id": "TEST123"
            # No customer details
        }
        request = CheckoutSessionRequest(**qr_data)
        assert request.customer_name is None
        assert request.shipping_address_line1 is None
        assert request.customer_email is None

    def test_amount_pence_field_exists(self):
        """Test amount_pence is the primary amount field"""
        data = {
            "amount_pence": 4500,
            "template_id": "classic",
            "brand": "iPhone",
            "model": "iPhone 15",
            "color": "Clear"
        }
        request = CheckoutSessionRequest(**data)
        assert request.amount_pence == 4500

    def test_is_machine_collection_defaults_false(self):
        """Test is_machine_collection defaults to False"""
        data = {
            "amount_pence": 3500,
            "template_id": "classic",
            "brand": "iPhone",
            "model": "iPhone 15",
            "color": "Clear"
        }
        request = CheckoutSessionRequest(**data)
        assert request.is_machine_collection is False

    def test_all_required_fields_present(self):
        """Test that all required fields must be provided"""
        # Missing template_id should raise validation error
        with pytest.raises(ValidationError):
            CheckoutSessionRequest(
                amount_pence=3500,
                brand="iPhone",
                model="iPhone 15",
                color="Clear"
                # Missing template_id
            )

    def test_shipping_country_defaults_to_uk(self):
        """Test shipping_country defaults to United Kingdom"""
        data = {
            "amount_pence": 3500,
            "template_id": "classic",
            "brand": "iPhone",
            "model": "iPhone 15",
            "color": "Clear",
            "entry_source": "vanilla"
        }
        request = CheckoutSessionRequest(**data)
        assert request.shipping_country == "United Kingdom"

    def test_qr_and_vanilla_fields_coexist(self):
        """Test that QR and vanilla fields can coexist in schema"""
        # This shouldn't happen in practice, but schema should allow it
        data = {
            "amount_pence": 3500,
            "template_id": "classic",
            "brand": "iPhone",
            "model": "iPhone 15",
            "color": "Clear",
            "entry_source": "qr",
            "machine_id": "TEST123",
            "is_machine_collection": True,
            "customer_name": "John Doe",  # Also has vanilla fields
            "customer_email": "john@example.com"
        }
        request = CheckoutSessionRequest(**data)
        assert request.entry_source == "qr"
        assert request.machine_id == "TEST123"
        assert request.customer_name == "John Doe"
