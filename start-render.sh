#!/bin/bash
# Render Startup Script - Starts both Mock API and Main API servers

echo "=========================================="
echo "🚀 Starting PimpMyCase Servers on Render"
echo "=========================================="
echo "Environment: $ENVIRONMENT"
echo "Python version: $(python3 --version)"
echo "Port: $PORT"
echo ""

# Function to check if mock mode is enabled
is_mock_mode() {
    if [[ "$CHINESE_API_BASE_URL" == *"localhost"* ]]; then
        return 0
    fi
    return 1
}

# Start Mock Chinese API server if in mock mode
if is_mock_mode; then
    echo "🔧 MOCK MODE DETECTED"
    echo "Chinese API URL: $CHINESE_API_BASE_URL"
    echo ""
    echo "Starting Chinese API Mock Server on port 8001..."

    # Check if chinese-api-mock directory exists
    if [ ! -d "chinese-api-mock" ]; then
        echo "❌ ERROR: chinese-api-mock directory not found!"
        echo "Contents of current directory:"
        ls -la
        exit 1
    fi

    # Start mock server in background with output logging
    cd chinese-api-mock
    echo "📂 Changed to chinese-api-mock directory"
    echo "Starting Python mock server..."

    # Set environment variables for mock API
    # These make QR codes and webhooks work in production
    export BACKEND_URL="http://localhost:$PORT"
    # FRONTEND_URL should be set in Render dashboard to your service URL

    # Use nohup to ensure it keeps running, redirect output
    nohup python3 main.py > ../mock-api.log 2>&1 &
    MOCK_PID=$!
    cd ..

    echo "✅ Mock API started with PID: $MOCK_PID"
    echo "📝 Mock API logs: ./mock-api.log"

    # Wait for mock server to be ready
    echo "⏳ Waiting for mock API to be ready..."
    READY=false

    for i in {1..30}; do
        # Try to connect to the port (using Python since curl might not be available)
        if python3 -c "import urllib.request; urllib.request.urlopen('http://localhost:8001/health', timeout=1)" 2>/dev/null; then
            echo "✅ Mock API is healthy and ready!"
            READY=true
            break
        fi

        # Check if process is still running
        if ! kill -0 $MOCK_PID 2>/dev/null; then
            echo "❌ Mock API process died! Check logs:"
            tail -20 mock-api.log
            exit 1
        fi

        if [ $i -eq 30 ]; then
            echo "❌ Mock API failed to respond after 30 seconds"
            echo "Last 20 lines of mock-api.log:"
            tail -20 mock-api.log
            exit 1
        fi

        echo "   Attempt $i/30... (waiting 1s)"
        sleep 1
    done

    if [ "$READY" = true ]; then
        echo ""
        echo "✅ Mock API Status: Running"
        echo "   PID: $MOCK_PID"
        echo "   URL: http://localhost:8001"
        echo ""
    fi
else
    echo "🌐 PRODUCTION MODE"
    echo "Using real Chinese API at: $CHINESE_API_BASE_URL"
    echo ""
fi

# Start main FastAPI server
echo "🚀 Starting Main API Server..."
echo "   Host: 0.0.0.0"
echo "   Port: $PORT"
echo "=========================================="
echo ""

# Use exec to replace shell with uvicorn (so signals work properly)
exec uvicorn api_server:app --host 0.0.0.0 --port $PORT --log-level info
