import os

# Security and CORS
CORS_ORIGINS = [
    "https://gta6-hub-liard.vercel.app",
    "https://gta6-hub.vercel.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Internal shared secret header key & expected value
SECRET_HEADER_NAME = "X-Internal-Key"
INTERNAL_SERVICE_SECRET = os.environ.get("INTERNAL_SERVICE_SECRET", "super-secret-gta6-key-1337")

# Supabase Credentials
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")

# Topic coverage keyword list (customizable)
GTA_KEYWORDS = [
    "Lucia",
    "Jason",
    "Vice City",
    "Leonida",
    "heist",
    "trailer",
    "leak",
    "mission",
    "online",
    "cars",
    "motorcycle",
    "map",
    "release date",
    "gameplay",
    "weapons",
    "protagonist"
]

# Word count thresholds
ARTICLE_MIN_WORD_COUNT = 1200
GUIDE_MIN_WORD_COUNT = 2500

# Topic coverage thresholds
TOPIC_WELL_COVERED_THRESHOLD = 5
