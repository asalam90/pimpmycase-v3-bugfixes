"""Integration tests for vanilla entry complete flow"""
import pytest
from unittest.mock import patch, MagicMock

@pytest.mark.integration
@pytest.mark.stripe
@pytest.mark.chinese_api
class TestVanillaEntryFlow:
    """Test complete vanilla entry flow"""

    @patch('backend.routes.payment.send_order_data_to_chinese_api')
    @patch('backend.routes.payment.send_payment_status_to_chinese_api')
    @patch('backend.routes.payment.send_payment_to_chinese_api')
    def test_complete_vanilla_flow_to_delivery(
        self, mock_pay, mock_status, mock_order,
        client, sample_brand, sample_model, sample_template,
        vanilla_entry_data, mock_stripe
    ):
        """
        Test complete vanilla flow:
        1. User visits website directly
        2. Creates checkout with delivery address
        3. Pays via Stripe
        4. Backend uses default device_id (JMSOOMSZRQO9)
        5. Returns delivery confirmation
        """

        # Mock Chinese API
        mock_pay.return_value = {"code": 200, "data": {"id": "chinese_pay_vanilla_001"}, "msg": "success"}
        mock_status.return_value = {"code": 200, "msg": "success"}
        mock_order.return_value = {"code": 200, "data": {"id": "chinese_order_vanilla_001"}, "msg": "success"}

        # Create checkout
        checkout_response = client.post(
            "/api/payment/create-checkout-session",
            json=vanilla_entry_data
        )

        assert checkout_response.status_code == 200
        session_id = checkout_response.json()["session_id"]

        # Simulate payment
        with patch('stripe.checkout.Session.retrieve') as mock_retrieve:
            mock_session = MagicMock()
            mock_session.id = session_id
            mock_session.payment_status = "paid"
            mock_session.payment_intent = "pi_test_vanilla_123"
            mock_session.metadata = {
                "entry_source": "vanilla",
                "is_machine_collection": "false",
                "customer_name": "John Doe",
                "customer_email": "john@example.com",
                "shipping_address_line1": "123 Test Street",
                "template_id": "classic",
                "brand": "iPhone",
                "model": "iPhone 15",
                "color": "Clear"
            }
            mock_retrieve.return_value = mock_session

            success_response = client.post(
                "/api/payment/process-payment-success",
                json={
                    "session_id": session_id,
                    "order_data": {},
                    "final_image_url": "https://example.com/vanilla-case.jpg"
                }
            )

        assert success_response.status_code == 200
        success_data = success_response.json()

        # Verify delivery order
        assert success_data["entry_source"] == "vanilla"
        assert success_data["is_machine_collection"] is False
        assert success_data.get("collection_device_id") is None
        assert "order_id" in success_data

        # Verify default device_id used
        mock_pay.assert_called_once()
        pay_kwargs = mock_pay.call_args[1]
        assert pay_kwargs["device_id"] == "JMSOOMSZRQO9"
        assert pay_kwargs["pay_type"] == 12  # Stripe payment

        mock_order.assert_called_once()
        order_kwargs = mock_order.call_args[1]
        assert order_kwargs["device_id"] == "JMSOOMSZRQO9"

    @patch('backend.routes.payment.send_order_data_to_chinese_api')
    @patch('backend.routes.payment.send_payment_status_to_chinese_api')
    @patch('backend.routes.payment.send_payment_to_chinese_api')
    def test_vanilla_flow_with_delivery_details(
        self, mock_pay, mock_status, mock_order,
        client, sample_brand, sample_model, sample_template,
        vanilla_entry_data, mock_stripe
    ):
        """Test vanilla flow includes delivery details in metadata"""

        # Mock Chinese API
        mock_pay.return_value = {"code": 200, "data": {"id": "pay_002"}, "msg": "success"}
        mock_status.return_value = {"code": 200, "msg": "success"}
        mock_order.return_value = {"code": 200, "data": {"id": "order_002"}, "msg": "success"}

        # Create checkout with full delivery details
        checkout_response = client.post(
            "/api/payment/create-checkout-session",
            json=vanilla_entry_data
        )

        session_id = checkout_response.json()["session_id"]

        with patch('stripe.checkout.Session.retrieve') as mock_retrieve:
            mock_session = MagicMock()
            mock_session.payment_status = "paid"
            mock_session.metadata = {
                "entry_source": "vanilla",
                "is_machine_collection": "false",
                "customer_name": "John Doe",
                "customer_email": "john@example.com",
                "customer_phone": "07123456789",
                "shipping_address_line1": "123 Test Street",
                "shipping_city": "London",
                "shipping_postcode": "SW1A 1AA",
                "shipping_country": "United Kingdom",
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

        assert success_response.status_code == 200
        # Delivery details should be stored in Stripe metadata
        # and eventually in database

    @patch('backend.routes.payment.send_order_data_to_chinese_api')
    @patch('backend.routes.payment.send_payment_status_to_chinese_api')
    @patch('backend.routes.payment.send_payment_to_chinese_api')
    def test_multiple_vanilla_orders_use_same_default_device(
        self, mock_pay, mock_status, mock_order,
        client, sample_brand, sample_model, sample_template,
        vanilla_entry_data, mock_stripe
    ):
        """Test multiple vanilla orders all use default JMSOOMSZRQO9"""

        # Mock Chinese API
        mock_pay.return_value = {"code": 200, "data": {"id": "pay_003"}, "msg": "success"}
        mock_status.return_value = {"code": 200, "msg": "success"}
        mock_order.return_value = {"code": 200, "data": {"id": "order_003"}, "msg": "success"}

        # Create multiple vanilla orders
        for i in range(3):
            checkout_response = client.post(
                "/api/payment/create-checkout-session",
                json=vanilla_entry_data
            )
            session_id = checkout_response.json()["session_id"]

            with patch('stripe.checkout.Session.retrieve') as mock_retrieve:
                mock_session = MagicMock()
                mock_session.payment_status = "paid"
                mock_session.metadata = {
                    "entry_source": "vanilla",
                    "is_machine_collection": "false",
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
                        "final_image_url": f"https://example.com/order_{i}.jpg"
                    }
                )

            # All should use same default device_id
            last_call = mock_pay.call_args[1]
            assert last_call["device_id"] == "JMSOOMSZRQO9"
