"""CORS configuration for the API"""

# CORS allowed origins
ALLOWED_ORIGINS = [
    "http://localhost:5173",  # Mobile app (Vite dev server)
    "http://localhost:8000",  # Frontend served by FastAPI
    "http://localhost:3000",   # Admin dashboard
    "http://localhost:3001",   # Admin dashboard alternate
    "http://192.168.100.4:5173",  # Your IP address
    "http://10.209.194.19:5173",  # Old local network IP
    "http://10.209.194.145:5173",  # Old IP
    "http://10.209.194.125:5173",  # Current local network IP for mobile testing
    "http://172.18.0.1:5173",  # Docker network IP
    "http://172.26.150.223:5173",  # Previous local network IP
    "http://172.26.150.82:5173",  # Current local network IP
    "http://10.107.150.193:5173",  # Previous network IP
    "http://10.107.150.46:5173",   # Current network IP (updated)
    "http://10.198.164.203:5173",  # Mobile device IP
    "http://10.24.144.8:5173",     # Current network IP
    "http://127.0.0.1:5173",
    "http://127.0.0.1:8000",   # FastAPI served frontend
    "https://pimp-my-case.vercel.app",  # Production frontend
    "https://pimp-my-case.vercel.app/",  # With trailing slash
    "https://pimp-my-case-arshads-projects-c0bbf026.vercel.app",  # Main deployment
    "https://pimp-my-case-arshads-projects-c0bbf026.vercel.app/",  # With trailing slash
    "https://pimp-my-case-git-main-arshads-projects-c0bbf026.vercel.app",  # Git branch domain
    "https://pimp-my-case-git-main-arshads-projects-c0bbf026.vercel.app/",  # With trailing slash
    "https://pimp-my-case-nh7bek7vb-arshads-projects-c0bbf026.vercel.app",  # Preview domain
    "https://pimp-my-case-nh7bek7vb-arshads-projects-c0bbf026.vercel.app/",  # With trailing slash
    # Hostinger domains
    "https://pimpmycase.co.uk",  # Main domain
    "https://pimpmycase.co.uk/",  # With trailing slash
    "https://www.pimpmycase.co.uk",  # WWW version
    "https://www.pimpmycase.co.uk/",  # With trailing slash
    "https://admin.pimpmycase.co.uk",  # Admin dashboard
    "https://admin.pimpmycase.co.uk/",  # With trailing slash
    # Render deployment
    "https://pimpmycase-webstore.onrender.com",  # Backend API on Render
    "https://pimpmycase-webstore.onrender.com/",  # With trailing slash
]

# CORS origin regex pattern
ALLOW_ORIGIN_REGEX = r"https://.*\.(vercel\.app|onrender\.com)"  # Allow all Vercel and Render deployments

# CORS allowed methods
ALLOWED_METHODS = ["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"]

# CORS allowed headers
ALLOWED_HEADERS = [
    "Accept",
    "Accept-Language",
    "Content-Language",
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Origin",
    "Access-Control-Request-Method",
    "Access-Control-Request-Headers",
    "X-Correlation-ID",
    "req_source",
    "sign",
]

# CORS configuration dictionary for easy use
CORS_CONFIG = {
    "allow_origins": ALLOWED_ORIGINS,
    "allow_origin_regex": ALLOW_ORIGIN_REGEX,
    "allow_credentials": True,
    "allow_methods": ALLOWED_METHODS,
    "allow_headers": ALLOWED_HEADERS,
}