#!/bin/bash
# Render.com Backend-Only Build Script
# For use when frontend is hosted separately on Hostinger

set -e  # Exit on any error

echo "=========================================="
echo "Building Backend API for Render"
echo "=========================================="

echo ""
echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements-api.txt

echo ""
echo "=========================================="
echo "Backend Build Complete!"
echo "=========================================="
echo "Backend: Python packages installed"
echo "Frontend: Will be hosted on Hostinger"
echo ""
