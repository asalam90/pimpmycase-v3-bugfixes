"""Integration tests for QR entry complete flow"""
import pytest
from unittest.mock import patch, MagicMock

@pytest.mark.integration
@pytest.mark.stripe
@pytest.mark.chinese_api
class TestQREntryFlow:
    """Test complete QR entry flow from checkout to confirmation"""

    @patch('backend.routes.payment.send_order_data_to_chinese_api')
    @patch('backend.routes.payment.send_payment_status_to_chinese_api')
    @patch('backend.routes.payment.send_payment_to_chinese_api')
    def test_complete_qr_flow_to_collection(
        self, mock_pay, mock_status, mock_order,
        client, sample_brand, sample_model, sample_template,
        qr_entry_data, mock_stripe
    ):
        """
        Test complete QR flow:
        1. User scans QR (frontend detects entry_source='qr')
        2. Creates checkout session with machine_id
        3. Pays via Stripe
        4. Backend uses machine_id for Chinese API
        5. Returns collection confirmation
        """

        # Mock Chinese API responses
        mock_pay.return_value = {"code": 200, "data": {"id": "chinese_pay_qr_001"}, "msg": "success"}
        mock_status.return_value = {"code": 200, "msg": "success"}
        mock_order.return_value = {"code": 200, "data": {"id": "chinese_order_qr_001"}, "msg": "success"}

        # Step 1: Create checkout session (simulates frontend payment request)
        checkout_response = client.post(
            "/api/payment/create-checkout-session",
            json=qr_entry_data
        )

        assert checkout_response.status_code == 200
        checkout_data = checkout_response.json()
        session_id = checkout_data["session_id"]
        assert "checkout_url" in checkout_data

        # Step 2: Simulate Stripe payment completion
        with patch('stripe.checkout.Session.retrieve') as mock_retrieve:
            mock_session = MagicMock()
            mock_session.id = session_id
            mock_session.payment_status = "paid"
            mock_session.payment_intent = "pi_test_qr_flow_123"
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

            # Step 3: Process payment success
            success_response = client.post(
                "/api/payment/process-payment-success",
                json={
                    "session_id": session_id,
                    "order_data": {},
                    "final_image_url": "https://example.com/qr-case.jpg"
                }
            )

        # Assertions
        assert success_response.status_code == 200
        success_data = success_response.json()

        # Verify response indicates machine collection
        assert success_data["entry_source"] == "qr"
        assert success_data["is_machine_collection"] is True
        assert success_data["collection_device_id"] == "TEST_MACHINE_123"
        assert "order_id" in success_data
        assert "queue_no" in success_data

        # Verify Chinese API was called with correct device_id
        mock_pay.assert_called_once()
        pay_call_kwargs = mock_pay.call_args[1]
        assert pay_call_kwargs["device_id"] == "TEST_MACHINE_123"
        assert pay_call_kwargs["pay_type"] == 12  # Stripe payment

        mock_order.assert_called_once()
        order_call_kwargs = mock_order.call_args[1]
        assert order_call_kwargs["device_id"] == "TEST_MACHINE_123"

    @patch('backend.routes.payment.send_order_data_to_chinese_api')
    @patch('backend.routes.payment.send_payment_status_to_chinese_api')
    @patch('backend.routes.payment.send_payment_to_chinese_api')
    def test_qr_flow_with_different_machine_ids(
        self, mock_pay, mock_status, mock_order,
        client, sample_brand, sample_model, sample_template, mock_stripe
    ):
        """Test QR flow correctly uses different machine IDs"""

        # Mock Chinese API
        mock_pay.return_value = {"code": 200, "data": {"id": "pay_002"}, "msg": "success"}
        mock_status.return_value = {"code": 200, "msg": "success"}
        mock_order.return_value = {"code": 200, "data": {"id": "order_002"}, "msg": "success"}

        machine_ids = ["MACHINE_A", "MACHINE_B", "MACHINE_C"]

        for machine_id in machine_ids:
            qr_data = {
                "amount_pence": 3500,
                "template_id": "classic",
                "brand": "iPhone",
                "model": "iPhone 15",
                "color": "Clear",
                "final_image_url": f"https://example.com/{machine_id}.jpg",
                "entry_source": "qr",
                "machine_id": machine_id,
                "is_machine_collection": True
            }

            checkout_response = client.post(
                "/api/payment/create-checkout-session",
                json=qr_data
            )
            session_id = checkout_response.json()["session_id"]

            with patch('stripe.checkout.Session.retrieve') as mock_retrieve:
                mock_session = MagicMock()
                mock_session.payment_status = "paid"
                mock_session.metadata = {
                    "entry_source": "qr",
                    "machine_id": machine_id,
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
                        "final_image_url": f"https://example.com/{machine_id}.jpg"
                    }
                )

            # Verify correct machine_id used for this order
            assert success_response.status_code == 200
            data = success_response.json()
            assert data["collection_device_id"] == machine_id

            # Verify Chinese API called with this machine's device_id
            last_call_kwargs = mock_pay.call_args[1]
            assert last_call_kwargs["device_id"] == machine_id

    @patch('backend.routes.payment.send_order_data_to_chinese_api')
    @patch('backend.routes.payment.send_payment_status_to_chinese_api')
    @patch('backend.routes.payment.send_payment_to_chinese_api')
    def test_qr_flow_handles_chinese_api_error_gracefully(
        self, mock_pay, mock_status, mock_order,
        client, sample_brand, sample_model, sample_template,
        qr_entry_data, mock_stripe
    ):
        """Test QR flow handles Chinese API errors"""

        # Mock Chinese API to return error
        mock_pay.return_value = {"code": 400, "msg": "API Error"}

        checkout_response = client.post(
            "/api/payment/create-checkout-session",
            json=qr_entry_data
        )
        session_id = checkout_response.json()["session_id"]

        with patch('stripe.checkout.Session.retrieve') as mock_retrieve:
            mock_session = MagicMock()
            mock_session.payment_status = "paid"
            mock_session.metadata = {
                "entry_source": "qr",
                "machine_id": "TEST_MACHINE_123",
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

        # Should still return error appropriately
        assert success_response.status_code in [500, 400]  # Error handling
