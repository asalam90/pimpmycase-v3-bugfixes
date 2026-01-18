"""Integration tests for edge cases"""
import pytest
from unittest.mock import patch, MagicMock

@pytest.mark.integration
class TestEdgeCases:
    """Test edge cases and error scenarios"""

    @patch('backend.routes.payment.send_order_data_to_chinese_api')
    @patch('backend.routes.payment.send_payment_status_to_chinese_api')
    @patch('backend.routes.payment.send_payment_to_chinese_api')
    def test_missing_machine_id_falls_back_to_default(
        self, mock_pay, mock_status, mock_order,
        client, sample_brand, sample_model, sample_template, mock_stripe
    ):
        """Test QR entry without machine_id falls back to vanilla behavior"""

        # Mock Chinese API
        mock_pay.return_value = {"code": 200, "data": {"id": "pay_edge_001"}, "msg": "success"}
        mock_status.return_value = {"code": 200, "msg": "success"}
        mock_order.return_value = {"code": 200, "data": {"id": "order_edge_001"}, "msg": "success"}

        invalid_qr_data = {
            "amount_pence": 3500,
            "template_id": "classic",
            "brand": "iPhone",
            "model": "iPhone 15",
            "color": "Clear",
            "entry_source": "qr",  # Says QR but...
            # No machine_id!
            "is_machine_collection": True,
            "final_image_url": "https://example.com/edge-case.jpg"
        }

        checkout_response = client.post(
            "/api/payment/create-checkout-session",
            json=invalid_qr_data
        )

        assert checkout_response.status_code == 200
        session_id = checkout_response.json()["session_id"]

        # When processing payment, should fall back to default device
        with patch('stripe.checkout.Session.retrieve') as mock_retrieve:
            mock_session = MagicMock()
            mock_session.payment_status = "paid"
            mock_session.metadata = {
                "entry_source": "qr",
                "is_machine_collection": "true",
                "template_id": "classic",
                "brand": "iPhone",
                "model": "iPhone 15"
                # No machine_id in metadata
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

        # Should use default device_id
        mock_pay.assert_called_once()
        call_kwargs = mock_pay.call_args[1]
        assert call_kwargs["device_id"] == "JMSOOMSZRQO9"

    @patch('backend.routes.payment.send_order_data_to_chinese_api')
    @patch('backend.routes.payment.send_payment_status_to_chinese_api')
    @patch('backend.routes.payment.send_payment_to_chinese_api')
    def test_empty_entry_source_defaults_vanilla(
        self, mock_pay, mock_status, mock_order,
        client, sample_brand, sample_model, sample_template, mock_stripe
    ):
        """Test empty/null entry_source defaults to vanilla"""

        # Mock Chinese API
        mock_pay.return_value = {"code": 200, "data": {"id": "pay_edge_002"}, "msg": "success"}
        mock_status.return_value = {"code": 200, "msg": "success"}
        mock_order.return_value = {"code": 200, "data": {"id": "order_edge_002"}, "msg": "success"}

        data = {
            "amount_pence": 3500,
            "template_id": "classic",
            "brand": "iPhone",
            "model": "iPhone 15",
            "color": "Clear",
            "entry_source": None,  # Explicitly null
            "final_image_url": "https://example.com/null-entry.jpg"
        }

        checkout_response = client.post(
            "/api/payment/create-checkout-session",
            json=data
        )

        assert checkout_response.status_code == 200
        session_id = checkout_response.json()["session_id"]

        with patch('stripe.checkout.Session.retrieve') as mock_retrieve:
            mock_session = MagicMock()
            mock_session.payment_status = "paid"
            mock_session.metadata = {
                "template_id": "classic",
                "brand": "iPhone",
                "model": "iPhone 15"
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

        # Should behave like vanilla entry (default device_id)
        assert success_response.status_code == 200
        data = success_response.json()
        assert data.get("entry_source") == "vanilla"

        mock_pay.assert_called_once()
        call_kwargs = mock_pay.call_args[1]
        assert call_kwargs["device_id"] == "JMSOOMSZRQO9"

    @patch('backend.routes.payment.send_order_data_to_chinese_api')
    @patch('backend.routes.payment.send_payment_status_to_chinese_api')
    @patch('backend.routes.payment.send_payment_to_chinese_api')
    def test_qr_entry_without_registered_session_still_processes(
        self, mock_pay, mock_status, mock_order,
        client, sample_brand, sample_model, sample_template, mock_stripe
    ):
        """Test QR entry with unregistered session still processes payment"""

        # Mock Chinese API
        mock_pay.return_value = {"code": 200, "data": {"id": "pay_edge_003"}, "msg": "success"}
        mock_status.return_value = {"code": 200, "msg": "success"}
        mock_order.return_value = {"code": 200, "data": {"id": "order_edge_003"}, "msg": "success"}

        # Backend should still accept the payment even if frontend
        # wouldn't show "Pay at Machine" button (session not registered)
        qr_unregistered = {
            "amount_pence": 3500,
            "template_id": "classic",
            "brand": "iPhone",
            "model": "iPhone 15",
            "color": "Clear",
            "entry_source": "qr",
            "machine_id": "UNREGISTERED_MACHINE",
            "is_machine_collection": True,
            "final_image_url": "https://example.com/unregistered.jpg"
        }

        response = client.post(
            "/api/payment/create-checkout-session",
            json=qr_unregistered
        )

        assert response.status_code == 200
        session_id = response.json()["session_id"]

        with patch('stripe.checkout.Session.retrieve') as mock_retrieve:
            mock_session = MagicMock()
            mock_session.payment_status = "paid"
            mock_session.metadata = {
                "entry_source": "qr",
                "machine_id": "UNREGISTERED_MACHINE",
                "is_machine_collection": "true",
                "template_id": "classic",
                "brand": "iPhone",
                "model": "iPhone 15"
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

        # Payment processing should work regardless of registration status
        assert success_response.status_code == 200
        data = success_response.json()
        assert data["collection_device_id"] == "UNREGISTERED_MACHINE"

    def test_invalid_brand_returns_404(self, client, mock_stripe):
        """Test invalid brand ID returns 404"""
        invalid_data = {
            "amount_pence": 3500,
            "template_id": "classic",
            "brand": "NonExistentBrand",
            "model": "Test Model",
            "color": "Clear",
            "entry_source": "vanilla"
        }

        response = client.post(
            "/api/payment/create-checkout-session",
            json=invalid_data
        )

        assert response.status_code == 404
        assert "Brand not found" in response.json()["detail"]

    def test_invalid_model_returns_404(self, client, sample_brand, mock_stripe):
        """Test invalid model ID returns 404"""
        invalid_data = {
            "amount_pence": 3500,
            "template_id": "classic",
            "brand": "iPhone",
            "model": "NonExistentModel",
            "color": "Clear",
            "entry_source": "vanilla"
        }

        response = client.post(
            "/api/payment/create-checkout-session",
            json=invalid_data
        )

        assert response.status_code == 404
        assert "Model not found" in response.json()["detail"]
