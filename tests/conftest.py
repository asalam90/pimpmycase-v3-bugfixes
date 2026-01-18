"""Pytest configuration and fixtures"""
import os
import sys
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Add parent directory to path to import backend modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Set test environment variables BEFORE importing app
os.environ['TESTING'] = 'true'
os.environ['STRIPE_SECRET_KEY'] = 'sk_test_fake_key_for_testing'
os.environ['CHINESE_API_DEVICE_ID'] = 'JMSOOMSZRQO9'
os.environ['OPENAI_API_KEY'] = 'test-openai-key'
os.environ['AWS_ACCESS_KEY_ID'] = 'test-aws-key'
os.environ['AWS_SECRET_ACCESS_KEY'] = 'test-aws-secret'

from database import Base, get_db
from api_server import app
from models import Brand, PhoneModel, Template

# In-memory SQLite for testing
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture(scope="function")
def db_engine():
    """Create a fresh database for each test"""
    engine = create_engine(
        SQLALCHEMY_TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def db_session(db_engine):
    """Create a database session for testing"""
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=db_engine)
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

@pytest.fixture(scope="function")
def client(db_session):
    """Create a test client with overridden database"""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()

@pytest.fixture
def sample_brand(db_session):
    """Create a sample brand for testing"""
    brand = Brand(
        id="iphone",
        display_name="iPhone",
        chinese_brand_id="1"
    )
    db_session.add(brand)
    db_session.commit()
    db_session.refresh(brand)
    return brand

@pytest.fixture
def sample_model(db_session, sample_brand):
    """Create a sample phone model for testing"""
    model = PhoneModel(
        id="iphone-15",
        brand_id=sample_brand.id,
        display_name="iPhone 15",
        chinese_model_id="101"
    )
    db_session.add(model)
    db_session.commit()
    db_session.refresh(model)
    return model

@pytest.fixture
def sample_template(db_session):
    """Create a sample template for testing"""
    template = Template(
        id="classic",
        name="Classic",
        description="Classic phone case design",
        price=35.00,
        requires_image=True,
        requires_ai=False
    )
    db_session.add(template)
    db_session.commit()
    db_session.refresh(template)
    return template

@pytest.fixture
def mock_stripe(monkeypatch):
    """Mock Stripe API calls"""
    class MockSession:
        id = "cs_test_123"
        url = "https://checkout.stripe.com/test-session"
        payment_status = "paid"
        payment_intent = "pi_test_123"
        metadata = {}

    class MockCheckoutSession:
        @staticmethod
        def create(**kwargs):
            session = MockSession()
            session.metadata = kwargs.get('metadata', {})
            return session

        @staticmethod
        def retrieve(session_id):
            return MockSession()

    # Mock the stripe module
    import stripe
    monkeypatch.setattr(stripe.checkout, 'Session', MockCheckoutSession)
    return MockCheckoutSession

@pytest.fixture
def qr_entry_data():
    """Sample QR entry request data"""
    return {
        "amount_pence": 3500,
        "template_id": "classic",
        "brand": "iPhone",
        "model": "iPhone 15",
        "color": "Clear",
        "final_image_url": "https://example.com/qr-case-image.jpg",
        "entry_source": "qr",
        "machine_id": "TEST_MACHINE_123",
        "is_machine_collection": True
    }

@pytest.fixture
def vanilla_entry_data():
    """Sample vanilla entry request data"""
    return {
        "amount_pence": 3500,
        "template_id": "classic",
        "brand": "iPhone",
        "model": "iPhone 15",
        "color": "Clear",
        "final_image_url": "https://example.com/vanilla-case-image.jpg",
        "entry_source": "vanilla",
        "is_machine_collection": False,
        "customer_name": "John Doe",
        "customer_email": "john@example.com",
        "customer_phone": "07123456789",
        "shipping_address_line1": "123 Test Street",
        "shipping_city": "London",
        "shipping_postcode": "SW1A 1AA",
        "shipping_country": "United Kingdom"
    }
