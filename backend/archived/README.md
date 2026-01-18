# Backend Archived Files

This directory contains archived backend code for Chinese API integration.

## Archived on: 2025-01-16

## Contents

### Routes
- `chinese_api.py` - API endpoints for Chinese manufacturer integration
- `vending.py` - Vending machine and QR code session management

### Services
- `chinese_api_service.py` - Chinese API client and authentication
- `chinese_payment_service.py` - Payment processing with Chinese partners

### Schemas
- `chinese_api.py` - Pydantic request/response schemas

## Restoration

To restore these files, copy them back to their original locations:
```bash
cp routes/* ../routes/
cp services/* ../services/
cp schemas/* ../schemas/
```

Then re-enable in `api_server.py` and restore environment variables.

See main archive README in `archived/README.md` for complete restoration instructions.
