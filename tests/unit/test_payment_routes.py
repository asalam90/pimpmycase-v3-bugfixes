"""Unit tests for payment routes - device_id logic"""
import pytest
import os
from unittest.mock import patch, MagicMock

@pytest.mark.unit
class TestCreateCheckoutSession:
    """Test /create-checkout-session endpoint"""

    def test_qr_entry_creates_session(
        self, client, sample_brand, sample_model, sample_template,
        qr_entry_data, mock_stripe
    ):
        """Test QR entry successfully creates checkout session"""
        response = client.post(
            "/api/payment/create-checkout-session",
            json=qr_entry_data
        )

        assert response.status_code == 200
        data = response.json()
        assert "checkout_url" in data
        assert "session_id" in data

    def test_vanilla_entry_creates_session(
        self, client, sample_brand, sample_model, sample_template,
        vanilla_entry_data, mock_stripe
    ):
        """Test vanilla entry successfully creates checkout session"""
        response = client.post(
            "/api/payment/create-checkout-session",
            json=vanilla_entry_data
        )

        assert response.status_code == 200
        data = response.json()
        assert "checkout_url" in data
        assert "session_id" in data

    def test_missing_brand_returns_404(self, client, mock_stripe):
        """Test missing brand returns proper error"""
        invalid_data = {
            "amount_pence": 3500,
            "template_id": "classic",
            "brand": "NonExistentBrand",
            "model": "Test Model",
            "color": "Clear"
        }

        response = client.post(
            "/api/payment/create-checkout-session",
            json=invalid_data
        )

        assert response.status_code == 404
        assert "Brand not found" in response.json()["detail"]

    def test_missing_model_returns_404(
        self, client, sample_brand, mock_stripe
    ):
        """Test missing model returns proper error"""
        invalid_data = {
            "amount_pence": 3500,
            "template_id": "classic",
            "brand": "iPhone",
            "model": "NonExistentModel",
            "color": "Clear"
        }

        response = client.post(
            "/api/payment/create-checkout-session",
            json=invalid_data
        )

        assert response.status_code == 404
        assert "Model not found" in response.json()["detail"]


@pytest.mark.unit
class TestProcessPaymentSuccess:
    """Test /process-payment-success endpoint - device_id extraction"""

    @patch('backend.routes.payment.send_order_data_to_chinese_api')
    @patch('backend.routes.payment.send_payment_status_to_chinese_api')
    @patch('backend.routes.payment.send_payment_to_chinese_api')
    def test_qr_entry_uses_machine_device_id(
        self, mock_pay, mock_status, mock_order,
        client, sample_brand, sample_model, sample_template,
        qr_entry_data, mock_stripe
    ):
        """Test QR entry uses machine_id as device_id for Chinese API"""

        # Mock Chinese API responses
        mock_pay.return_value = {"code": 200, "data": {"id": "pay123"}, "msg": "success"}
        mock_status.return_value = {"code": 200, "msg": "success"}
        mock_order.return_value = {"code": 200, "data": {"id": "order123"}, "msg": "success"}

        # First create checkout session
        checkout_response = client.post(
            "/api/payment/create-checkout-session",
            json=qr_entry_data
        )
        session_id = checkout_response.json()["session_id"]

        # Mock Stripe session with QR metadata
        with patch('stripe.checkout.Session.retrieve') as mock_retrieve:
            mock_session = MagicMock()
            mock_session.id = session_id
            mock_session.payment_status = "paid"
            mock_session.payment_intent = "pi_test_123"
            mock_session.metadata = {
                "entry_source": "qr",
                "machine_id": "TEST_MACHINE_123",
                "is_machine_collection": "true",
                "template_id": "classic",
                "brand": "iPhone",
                "model": "iPhone 15",
                "color": "Clear"
            }
            mock_retrieve.return_value = mock_session

            # Process payment success
            success_response = client.post(
                "/api/payment/process-payment-success",
                json={
                    "session_id": session_id,
                    "order_data": {},
                    "final_image_url": "https://example.com/image.jpg"
                }
            )

        assert success_response.status_code == 200
        success_data = success_response.json()

        # Verify response indicates QR entry
        assert success_data["entry_source"] == "qr"
        assert success_data["is_machine_collection"] is True
        assert success_data["collection_device_id"] == "TEST_MACHINE_123"

        # Verify Chinese API was called with QR machine's device_id
        mock_pay.assert_called_once()
        call_kwargs = mock_pay.call_args[1]
        assert call_kwargs['device_id'] == "TEST_MACHINE_123"

    @patch('backend.routes.payment.send_order_data_to_chinese_api')
    @patch('backend.routes.payment.send_payment_status_to_chinese_api')
    @patch('backend.routes.payment.send_payment_to_chinese_api')
    def test_vanilla_entry_uses_default_device_id(
        self, mock_pay, mock_status, mock_order,
        client, sample_brand, sample_model, sample_template,
        vanilla_entry_data, mock_stripe
    ):
        """Test vanilla entry uses default JMSOOMSZRQO9 device_id"""

        # Mock Chinese API responses
        mock_pay.return_value = {"code": 200, "data": {"id": "pay456"}, "msg": "success"}
        mock_status.return_value = {"code": 200, "msg": "success"}
        mock_order.return_value = {"code": 200, "data": {"id": "order456"}, "msg": "success"}

        # Create checkout session
        checkout_response = client.post(
            "/api/payment/create-checkout-session",
            json=vanilla_entry_data
        )
        session_id = checkout_response.json()["session_id"]

        # Mock Stripe session with vanilla metadata
        with patch('stripe.checkout.Session.retrieve') as mock_retrieve:
            mock_session = MagicMock()
            mock_session.id = session_id
            mock_session.payment_status = "paid"
            mock_session.payment_intent = "pi_test_456"
            mock_session.metadata = {
                "entry_source": "vanilla",
                "is_machine_collection": "false",
                "template_id": "classic",
                "brand": "iPhone",
                "model": "iPhone 15",
                "color": "Clear",
                "customer_name": "John Doe"
            }
            mock_retrieve.return_value = mock_session

            # Process payment
            success_response = client.post(
                "/api/payment/process-payment-success",
                json={
                    "session_id": session_id,
                    "order_data": {},
                    "final_image_url": "https://example.com/image.jpg"
                }
            )

        assert success_response.status_code == 200
        success_data = success_response.json()

        # Verify response indicates vanilla entry
        assert success_data["entry_source"] == "vanilla"
        assert success_data["is_machine_collection"] is False

        # Verify default device_id was used
        mock_pay.assert_called_once()
        call_kwargs = mock_pay.call_args[1]
        assert call_kwargs['device_id'] == "JMSOOMSZRQO9"

    @patch('backend.routes.payment.send_order_data_to_chinese_api')
    @patch('backend.routes.payment.send_payment_status_to_chinese_api')
    @patch('backend.routes.payment.send_payment_to_chinese_api')
    def test_missing_entry_source_defaults_vanilla(
        self, mock_pay, mock_status, mock_order,
        client, sample_brand, sample_model, sample_template, mock_stripe
    ):
        """Test missing entry_source defaults to 'vanilla' behavior"""

        # Mock Chinese API
        mock_pay.return_value = {"code": 200, "data": {"id": "pay789"}, "msg": "success"}
        mock_status.return_value = {"code": 200, "msg": "success"}
        mock_order.return_value = {"code": 200, "data": {"id": "order789"}, "msg": "success"}

        # Create session without entry_source
        minimal_data = {
            "amount_pence": 3500,
            "template_id": "classic",
            "brand": "iPhone",
            "model": "iPhone 15",
            "color": "Clear",
            "final_image_url": "https://example.com/img.jpg"
        }

        checkout_response = client.post(
            "/api/payment/create-checkout-session",
            json=minimal_data
        )
        session_id = checkout_response.json()["session_id"]

        with patch('stripe.checkout.Session.retrieve') as mock_retrieve:
            mock_session = MagicMock()
            mock_session.id = session_id
            mock_session.payment_status = "paid"
            mock_session.payment_intent = "pi_test_789"
            mock_session.metadata = {
                "template_id": "classic",
                "brand": "iPhone",
                "model": "iPhone 15"
                # No entry_source in metadata
            }
            mock_retrieve.return_value = mock_session

            success_response = client.post(
                "/api/payment/process-payment-success",
                json={
                    "session_id": session_id,
                    "order_data": {},
                    "final_image_url": "https://example.com/image.jpg"
                }
            )

        # Should use vanilla behavior (default device_id)
        data = success_response.json()
        assert data.get("entry_source") == "vanilla"

        # Verify default device_id was used
        mock_pay.assert_called_once()
        call_kwargs = mock_pay.call_args[1]
        assert call_kwargs['device_id'] == "JMSOOMSZRQO9"
