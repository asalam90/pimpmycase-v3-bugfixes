# Project Overview - PimpMyCase Webstore

## Executive Summary

**Project Name:** PimpMyCase Webstore
**Purpose:** Custom phone case design and ordering platform with AI-powered image generation
**Technology Stack:** React 18 + Vite (Frontend), FastAPI (Backend), PostgreSQL (Database)
**Deployment:** Render (API), Hostinger (Frontend)

## Business Context

PimpMyCase Webstore is a full-stack web application that allows users to create custom phone cases with personalized designs. The platform integrates with:

- **Vending Machines**: QR-code initiated sessions for on-site ordering
- **E-commerce**: Direct web purchases with home delivery
- **Chinese Manufacturing API**: Automated order fulfillment
- **Payment Processing**: Stripe integration for secure payments

## Key Features

### Design Templates
- **11 Total Templates**:
  - 5 AI-enhanced templates (Retro Remix, Cover Shoot, Funny Toon, Glitch Pro, Footy Fan)
  - 6 basic templates (Classic, 2-in-1, 3-in-1, 4-in-1, Film Strip, 5-in-1)

### AI Image Generation
- Powered by Google Gemini AI
- Style-based transformations
- Template-specific prompts

### Customization Options
- Photo upload and cropping
- Sticker placement (100+ stickers across 16 categories)
- Custom text with 16 fonts
- Background color selection
- Real-time phone case preview

### Supported Devices
- **Brands**: iPhone, Samsung, Google Pixel
- **Models**: 50+ phone models with accurate physical dimensions
- **Dynamic Mask System**: Model-specific camera cutouts

## User Flows

### E-Commerce Flow (Vanilla Entry)
```
Landing Screen → Brand/Model Selection → Template Selection →
Image Upload/Customization → Preview → Text Addition →
Stickers → Payment → Order Confirmation
```

### Vending Machine Flow (QR Entry)
```
QR Scan → Session Creation → Brand/Model Selection →
Template Selection → Image Upload/Customization → Preview →
Payment via Machine → Order Submission to Manufacturer
```

## Integration Partners

### Chinese Manufacturing API (inkele.net)
- **Purpose**: Phone case printing and fulfillment
- **Functions**:
  - Brand and model synchronization
  - Stock availability checking
  - Payment processing
  - Order submission
  - Queue management

### Stripe
- **Purpose**: Payment processing for e-commerce orders
- **Features**:
  - Secure checkout sessions
  - Webhook integration
  - Payment confirmation

### Cloudflare R2
- **Purpose**: Image storage
- **Features**:
  - Generated design storage
  - Secure authenticated URLs
  - CDN delivery

## Technology Stack

### Frontend
- **Framework**: React 18.2
- **Build Tool**: Vite 5.0
- **Styling**: Tailwind CSS 3.4
- **Routing**: React Router 6.21
- **State Management**: React Context + Reducer pattern
- **PWA**: Service Worker for offline capability

### Backend
- **Framework**: FastAPI 0.109
- **Language**: Python 3.10+
- **Database ORM**: SQLAlchemy 2.0
- **Authentication**: JWT tokens
- **API Documentation**: OpenAPI/Swagger (auto-generated)

### Database
- **Production**: PostgreSQL 14+
- **Development**: SQLite
- **Migrations**: Manual SQL scripts

### Development Tools
- **Linting**: ESLint
- **Python Linting**: Ruff
- **Version Control**: Git
- **Package Managers**: npm (frontend), pip (backend)

## Project Statistics

- **Total Source Files**: ~400 (excluding node_modules, venv)
- **Frontend Components**: 35 screens, 7 shared components
- **Backend Routes**: 10 modular route files
- **API Endpoints**: 30+ endpoints
- **Database Models**: 10 core models
- **Deployment Environments**: Production (Render + Hostinger)

## Current Status

- **Version**: Production-ready
- **Last Major Update**: December 2024
- **Active Features**: All features operational
- **Known Issues**: None critical

## Repository Structure

```
pimpmycase-webstore/
├── src/                    # Frontend React application
├── backend/                # Backend FastAPI application
├── public/                 # Static assets (fonts, images, masks)
├── admin-dashboard/        # Separate admin application
├── docs/                   # Documentation
├── mockups/                # Design files (CAD, SVG)
├── scripts/                # Utility scripts
├── api_server.py           # FastAPI entry point
├── database.py             # Database configuration
├── models.py               # SQLAlchemy models
└── requirements-api.txt    # Python dependencies
```

## Getting Help

- **Documentation**: `/docs/handover/` directory
- **Environment Setup**: See `03-SETUP-GUIDE.md`
- **API Reference**: See `05-API-REFERENCE.md`
- **Troubleshooting**: See `10-TROUBLESHOOTING.md`

---

**Next Steps**: Read `02-ARCHITECTURE.md` to understand the system design.
