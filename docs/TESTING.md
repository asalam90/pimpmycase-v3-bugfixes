# Testing Guide for PimpMyCase

This document describes the testing infrastructure and how to write and run tests for the PimpMyCase website.

## Overview

The project uses a comprehensive testing approach with:

- **Frontend:** Vitest + React Testing Library + MSW (Mock Service Worker)
- **Backend:** Pytest + FastAPI TestClient + pytest-cov
- **Test Types:** Unit tests, Integration tests, and Edge case tests

## Quick Start

### Run All Tests

```bash
# Frontend tests
npm run test

# Backend tests
pytest

# Both with coverage
npm run test:coverage
pytest --cov
```

### Run Specific Tests

```bash
# Frontend - watch mode
npm run test:watch

# Frontend - with UI
npm run test:ui

# Backend - specific file
pytest tests/unit/test_payment_schemas.py

# Backend - specific marker
pytest -m unit
pytest -m integration
```

## Frontend Testing

### Technology Stack

- **Vitest:** Fast Vite-native test runner
- **React Testing Library:** User-centric testing utilities
- **MSW:** API mocking for HTTP requests
- **jsdom:** Browser environment simulation

### Test File Locations

Tests are colocated with source files in `__tests__` directories:

```
src/
├── contexts/
│   ├── AppStateContext.jsx
│   └── __tests__/
│       └── AppStateContext.test.jsx
├── screens/
│   ├── LandingScreen.jsx
│   ├── PaymentScreen.jsx
│   └── __tests__/
│       ├── LandingScreen.test.jsx
│       ├── PaymentScreen.test.jsx
│       └── OrderConfirmedScreen.test.jsx
└── test/
    ├── setup.js               # Global test setup
    ├── testUtils.jsx          # Custom render utilities
    └── mocks/
        ├── handlers.js        # MSW request handlers
        └── server.js          # MSW server setup
```

### Writing Frontend Tests

#### Basic Component Test

```javascript
import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../test/testUtils'
import MyComponent from '../MyComponent'

describe('MyComponent', () => {
  it('should render correctly', () => {
    renderWithProviders(<MyComponent />)
    expect(screen.getByText(/hello/i)).toBeInTheDocument()
  })
})
```

#### Testing with Initial State

```javascript
it('should use initial state', () => {
  const initialState = {
    entrySource: 'qr',
    vendingMachineSession: {
      isVendingMachine: true,
      machineId: 'TEST123'
    }
  }

  renderWithProviders(<MyComponent />, { initialState })

  expect(screen.getByText(/machine: TEST123/i)).toBeInTheDocument()
})
```

#### Testing with URL Parameters

```javascript
it('should detect QR entry from URL', () => {
  const route = '/?qr=true&machine_id=TEST123'

  renderWithProviders(<LandingScreen />, { route })

  // Assertions...
})
```

#### Testing User Interactions

```javascript
import { userEvent } from '@testing-library/user-event'

it('should handle button click', async () => {
  renderWithProviders(<MyComponent />)

  const user = userEvent.setup()
  const button = screen.getByRole('button', { name: /submit/i })

  await user.click(button)

  expect(screen.getByText(/success/i)).toBeInTheDocument()
})
```

### Mocking API Requests

API requests are automatically mocked using MSW. Define handlers in `src/test/mocks/handlers.js`:

```javascript
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.post('/api/payment/create-checkout-session', async ({ request }) => {
    const body = await request.json()

    return HttpResponse.json({
      checkout_url: 'https://checkout.stripe.com/test',
      session_id: 'cs_test_123'
    })
  })
]
```

## Backend Testing

### Technology Stack

- **Pytest:** Python test framework
- **FastAPI TestClient:** HTTP client for FastAPI
- **pytest-cov:** Coverage reporting
- **pytest-mock:** Mocking utilities
- **pytest-asyncio:** Async test support

### Test File Locations

```
tests/
├── __init__.py
├── conftest.py              # Pytest fixtures
├── unit/
│   ├── __init__.py
│   ├── test_payment_schemas.py
│   └── test_payment_routes.py
└── integration/
    ├── __init__.py
    ├── test_qr_entry_flow.py
    ├── test_vanilla_entry_flow.py
    └── test_edge_cases.py
```

### Writing Backend Tests

#### Basic Schema Test

```python
import pytest
from backend.schemas.payment import CheckoutSessionRequest

def test_schema_validation():
    """Test schema validates correctly"""
    data = {
        "amount_pence": 3500,
        "template_id": "classic",
        "brand": "iPhone",
        "model": "iPhone 15",
        "color": "Clear"
    }

    request = CheckoutSessionRequest(**data)

    assert request.amount_pence == 3500
    assert request.template_id == "classic"
```

#### Testing API Endpoints

```python
def test_create_checkout(client, sample_brand, sample_model, qr_entry_data):
    """Test checkout session creation"""
    response = client.post(
        "/api/payment/create-checkout-session",
        json=qr_entry_data
    )

    assert response.status_code == 200
    data = response.json()
    assert "session_id" in data
```

#### Mocking External Services

```python
from unittest.mock import patch

@patch('backend.routes.payment.send_payment_to_chinese_api')
def test_with_mocked_api(mock_api, client):
    """Test with mocked Chinese API"""
    mock_api.return_value = {"code": 200, "data": {"id": "123"}}

    # Test implementation...

    mock_api.assert_called_once()
```

### Available Fixtures

Fixtures are defined in `tests/conftest.py`:

- **`client`** - FastAPI TestClient with test database
- **`db_session`** - SQLAlchemy session for database operations
- **`sample_brand`** - Test brand data
- **`sample_model`** - Test phone model data
- **`sample_template`** - Test template data
- **`mock_stripe`** - Mocked Stripe API
- **`qr_entry_data`** - Sample QR entry request data
- **`vanilla_entry_data`** - Sample vanilla entry request data

## Test Coverage for QR vs E-commerce Entry Points

### What We Test

The test suite covers the complete QR vs E-commerce entry points feature:

#### Frontend Tests (34+ test cases)

**AppStateContext Tests (7 tests):**
- Entry source initialization
- Setting entry source ('qr' vs 'vanilla')
- Vending machine session management
- localStorage persistence

**LandingScreen Tests (7 tests):**
- QR URL detection (`?qr=true&machine_id=XXX`)
- Vanilla entry detection
- Parameter validation
- Location parameter handling

**PaymentScreen Tests (10 tests):**
- QR entry: collection notice, "Pay at Machine" button visibility
- Vanilla entry: delivery form display, address validation
- Conditional UI based on entry source

**OrderConfirmedScreen Tests (10 tests):**
- Machine collection messaging
- Delivery messaging
- Machine ID display
- Edge case handling

#### Backend Tests (25+ test cases)

**Payment Schema Tests (10 tests):**
- QR entry validation (entry_source, machine_id, is_machine_collection)
- Vanilla entry validation (customer details)
- Optional field handling
- Default values

**Payment Route Tests (8 tests):**
- QR entry uses machine_id as device_id
- Vanilla entry uses default JMSOOMSZRQO9
- Missing entry_source defaults to vanilla
- Error handling

**Integration Tests (7 tests):**
- Complete QR flow (checkout → payment → collection)
- Complete vanilla flow (checkout → payment → delivery)
- Edge cases (missing machine_id, invalid data)

## Test Markers

Backend tests use pytest markers for selective test running:

```python
@pytest.mark.unit           # Unit tests
@pytest.mark.integration    # Integration tests
@pytest.mark.stripe         # Tests requiring Stripe mock
@pytest.mark.chinese_api    # Tests requiring Chinese API mock
```

Run specific markers:

```bash
pytest -m unit              # Only unit tests
pytest -m integration       # Only integration tests
pytest -m "stripe and chinese_api"  # Combined markers
```

## Coverage Goals

Target coverage for entry point feature:

- **AppStateContext:** 95%+
- **LandingScreen:** 90%+
- **PaymentScreen:** 85%+
- **OrderConfirmedScreen:** 85%+
- **Payment schemas:** 100%
- **Payment routes:** 90%+

**Overall Target:** 85%+ for entry point feature code

### Viewing Coverage Reports

```bash
# Frontend coverage
npm run test:coverage
open coverage/index.html

# Backend coverage
pytest --cov --cov-report=html
open htmlcov/index.html
```

## Continuous Integration

### GitHub Actions (Recommended)

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:coverage

  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - run: pip install -r requirements-api.txt -r requirements-test.txt
      - run: pytest --cov
```

## Best Practices

### General

1. **Write tests first:** Consider TDD for new features
2. **Test behavior, not implementation:** Focus on user-facing functionality
3. **Keep tests isolated:** Each test should be independent
4. **Use descriptive names:** Test names should explain what they test
5. **Mock external dependencies:** Use fixtures and mocks for APIs, databases

### Frontend

1. **Use `renderWithProviders`:** Always wrap components with providers
2. **Query by accessibility:** Use `getByRole`, `getByLabelText` when possible
3. **Avoid implementation details:** Don't test internal state or methods
4. **Wait for async updates:** Use `waitFor` for async state changes

### Backend

1. **Use in-memory database:** Tests use SQLite in-memory for speed
2. **Clean up after tests:** Pytest automatically cleans up fixtures
3. **Test edge cases:** Include tests for error scenarios
4. **Mock expensive operations:** Mock external APIs, file operations

## Debugging Tests

### Frontend

```bash
# Run tests in watch mode with verbose output
npm run test:watch

# Open UI for interactive debugging
npm run test:ui

# Run specific test file
npm run test -- src/contexts/__tests__/AppStateContext.test.jsx
```

### Backend

```bash
# Run with verbose output and show print statements
pytest -v -s

# Run specific test
pytest tests/unit/test_payment_schemas.py::TestCheckoutSessionRequest::test_qr_entry_schema_valid

# Drop into debugger on failure
pytest --pdb
```

## Common Issues

### Frontend

**Issue:** `Cannot find module` errors
- **Fix:** Check import paths and ensure files exist

**Issue:** `element is not in the document`
- **Fix:** Use `waitFor` for async rendering or check component logic

**Issue:** MSW handlers not working
- **Fix:** Verify handlers are defined in `src/test/mocks/handlers.js`

### Backend

**Issue:** `ModuleNotFoundError` for backend modules
- **Fix:** Ensure `sys.path` is set correctly in `conftest.py`

**Issue:** Database connection errors
- **Fix:** Tests use in-memory SQLite, check `conftest.py` setup

**Issue:** Stripe/Chinese API not mocked
- **Fix:** Use `@patch` decorator or fixture from `conftest.py`

## Adding New Tests

### Frontend

1. Create test file in `__tests__` directory next to component
2. Import component and testing utilities
3. Write test cases using `describe` and `it`
4. Use `renderWithProviders` for rendering
5. Run tests to verify

### Backend

1. Add test file to `tests/unit/` or `tests/integration/`
2. Import modules and fixtures
3. Write test classes and methods
4. Use fixtures for database, API mocking
5. Mark tests with appropriate markers

## Related Documentation

- [QR vs E-commerce Entry Points](./2025-12-23-qr-vs-ecommerce-entry-points.md)
- [React Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro/)
- [Vitest Documentation](https://vitest.dev/)
- [Pytest Documentation](https://docs.pytest.org/)

---

**Testing infrastructure implemented:** 2025-12-24
**Comprehensive test coverage for QR vs E-commerce entry points feature**
