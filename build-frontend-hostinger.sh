#!/bin/bash
# Build Frontend for Hostinger Deployment
# This builds the frontend with production API URL pointing to Render backend

set -e  # Exit on any error

echo "=========================================="
echo "Building Frontend for Hostinger"
echo "=========================================="

# Create production environment file
echo ""
echo "Creating production environment file..."
cat > .env.production << EOF
# Production Frontend Configuration for Hostinger
# Backend API hosted on Render
VITE_API_BASE_URL=https://pimpmycase-webstore.onrender.com
VITE_APP_ENV=production

# R2 Public URL (for direct sticker loading - 90% faster!)
VITE_R2_PUBLIC_URL=https://pub-26048a9211ea4e8087ee30617c0ba88f.r2.dev
EOF

echo "Production environment file created:"
cat .env.production

# Install dependencies
echo ""
echo "Installing Node.js dependencies..."
npm ci --prefer-offline --no-audit

# Build frontend
echo ""
echo "Building frontend with Vite..."
npm run build

# Verify build
echo ""
echo "Verifying frontend build..."
if [ ! -d "dist" ]; then
    echo "ERROR: dist directory not found after build!"
    exit 1
fi

if [ ! -f "dist/index.html" ]; then
    echo "ERROR: index.html not found in dist directory!"
    exit 1
fi

echo ""
echo "=========================================="
echo "Frontend Build Complete!"
echo "=========================================="
echo "Build output: ./dist/"
echo "Backend API: https://pimpmycase-webstore.onrender.com"
echo "Deploy target: pimpmycase.co.uk (Hostinger)"
echo ""
echo "Upload the contents of ./dist/ folder to Hostinger:"
echo "  1. Log in to Hostinger File Manager"
echo "  2. Navigate to public_html/"
echo "  3. Upload all files from ./dist/"
echo "  4. Make sure .htaccess is included for React Router"
echo ""
