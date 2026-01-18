#!/bin/bash
# Render.com Build Script for PimpMyCase
# Builds both frontend and backend for deployment

set -e  # Exit on any error

echo "=========================================="
echo "Starting PimpMyCase Build Process"
echo "=========================================="

# Step 1: Build Frontend
echo ""
echo "Step 1: Installing Node.js dependencies..."
npm ci --prefer-offline --no-audit

echo ""
echo "Step 2: Building frontend with Vite..."
npm run build

echo ""
echo "Step 3: Verifying frontend build..."
if [ ! -d "dist" ]; then
    echo "ERROR: dist directory not found after build!"
    exit 1
fi

if [ ! -f "dist/index.html" ]; then
    echo "ERROR: index.html not found in dist directory!"
    exit 1
fi

echo "Frontend build successful!"
ls -lh dist/

# Step 2: Install Backend Dependencies
echo ""
echo "Step 4: Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements-api.txt

echo ""
echo "=========================================="
echo "Build Complete!"
echo "=========================================="
echo "Frontend: Built to ./dist/"
echo "Backend: Python packages installed"
echo ""
