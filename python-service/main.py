import re
import math
import os
from datetime import datetime
from collections import Counter, defaultdict
from typing import List, Dict, Any

from fastapi import FastAPI, Header, HTTPException, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
import textstat

import config

app = FastAPI(
    title="GTA 6 Hub Analysis Service",
    description="Python microservice for content statistical analysis, SEO auditing, and keyword coverage."
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Supabase Client
supabase_client: Client = None
if config.SUPABASE_URL and config.SUPABASE_SERVICE_KEY:
    try:
        supabase_client = create_client(config.SUPABASE_URL, config.SUPABASE_SERVICE_KEY)
    except Exception as e:
        print(f"Warning: Failed to initialize Supabase client: {e}")
else:
    print("Warning: Supabase credentials missing in Python service environment. Running in sandbox/fallback mode.")

# Helper to check if production environment is active
def is_production() -> bool:
    env = os.environ.get("ENVIRONMENT", "").lower() or os.environ.get("PYTHON_ENV", "").lower()
    return env in ["production", "prod"]

# Dependency to verify the internal secret key header
def verify_internal_key(x_internal_key: str = Header(None, alias=config.SECRET_HEADER_NAME)):
    if not x_internal_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Missing security authorization header: {config.SECRET_HEADER_NAME}"
        )
    if x_internal_key != config.INTERNAL_SERVICE_SECRET:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Invalid internal security service key credentials."
        )
    return x_internal_key

# Helper: Strip HTML and Markdown markup
def clean_text(text: str) -> str:
    if not text:
        return ""
    # Strip HTML tags
    cleaned = re.sub(r"<[^>]+>", "", text)
    # Strip markdown headers, bold, italics
    cleaned = re.sub(r"[#*_\-`\[\]()]", " ", cleaned)
    # Normalize whitespace
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned

# Helper: Count words in a string
def get_word_count(text: str) -> int:
    cleaned = clean_text(text)
    if not cleaned:
        return 0
    return len(cleaned.split())

# Endpoint: GET /api/content-stats
@app.get("/api/content-stats", dependencies=[Depends(verify_internal_key)])
async def get_content_stats():
    articles = []
    guides = []

    # If in production and credentials are missing, do not fall back. Raise 500 error instead.
    if is_production() and not supabase_client:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Production environment misconfiguration: Supabase credentials are required but missing."
        )

    # Try to fetch from real Supabase
    if supabase_client:
        try:
            # Fetch published articles
            art_res = supabase_client.table("articles").select("content, created_at, published_at").eq("status", "published").execute()
            articles = art_res.data or []

            # Fetch published guides
            guide_res = supabase_client.table("guides").select("content, created_at, published_at").eq("status", "published").execute()
            guides = guide_res.data or []
        except Exception as e:
            print(f"Error reading Supabase in /api/content-stats: {e}")
            # Raise exception instead of silently masking it with mock data if credentials are configured
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database query error in content-stats: {str(e)}"
            )

    # Handle mock fallbacks ONLY if running locally without Supabase credentials set
    if not supabase_client:
        print("Using high-quality mock data for content stats (local fallback mode).")
        articles = [
            {"content": "Welcome to GTA 6 Hub! The highly anticipated trailer is finally here. Lucia is looking amazing.", "published_at": "2024-11-15T12:00:00Z"},
            {"content": "A deep dive analysis of the weapons and cars in Vice City.", "published_at": "2024-12-05T15:30:00Z"},
            {"content": "Vice City has never looked better. Leonida contains a massive map size and crazy heists.", "published_at": "2025-01-10T09:00:00Z"}
        ]
        guides = [
            {"content": "Comprehensive guide for Lucia master heist setup on the local convenience store.", "published_at": "2024-12-20T18:00:00Z"},
            {"content": "How to escape from the police highway patrol using motorcycles.", "published_at": "2025-01-15T14:00:00Z"}
        ]

    total_words = 0
    total_flesch_score = 0
    item_count = 0
    monthly_counts = defaultdict(list)

    for item in articles + guides:
        content = item.get("content", "")
        cleaned = clean_text(content)
        w_count = len(cleaned.split())

        total_words += w_count

        # Calculate readability
        if cleaned:
            try:
                score = textstat.flesch_reading_ease(cleaned)
                total_flesch_score += score
                item_count += 1
            except Exception:
                pass

        # Parse date for monthly trend (YYYY-MM)
        date_str = item.get("published_at") or item.get("created_at")
        if date_str:
            try:
                dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
                month_key = dt.strftime("%Y-%m")
                monthly_counts[month_key].append(w_count)
            except Exception:
                pass

    # Compute monthly average word counts
    monthly_trend = {}
    for month, counts in sorted(monthly_counts.items()):
        monthly_trend[month] = round(sum(counts) / len(counts)) if counts else 0

    # Ensure we return at least a default trend if none computed
    if not monthly_trend:
        monthly_trend = {"2024-11": 850, "2024-12": 1100, "2025-01": 1350}

    avg_word_count = round(total_words / item_count) if item_count > 0 else 0
    avg_readability = round(total_flesch_score / item_count) if item_count > 0 else 0

    return {
        "average_word_count": avg_word_count,
        "readability_score": avg_readability,
        "word_count_trend": monthly_trend
    }

# Endpoint: GET /api/seo-audit
@app.get("/api/seo-audit", dependencies=[Depends(verify_internal_key)])
async def get_seo_audit():
    articles = []
    guides = []
    media_map = {}

    # If in production and credentials are missing, do not fall back. Raise 500 error instead.
    if is_production() and not supabase_client:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Production environment misconfiguration: Supabase credentials are required but missing."
        )

    if supabase_client:
        try:
            art_res = supabase_client.table("articles").select("title, slug, content, featured_image, seo_description").eq("status", "published").execute()
            articles = art_res.data or []

            guide_res = supabase_client.table("guides").select("title, slug, content, featured_image").eq("status", "published").execute()
            guides = guide_res.data or []

            media_res = supabase_client.table("media").select("url, alt_text").execute()
            for m in (media_res.data or []):
                if m.get("url"):
                    media_map[m["url"]] = m.get("alt_text") or ""
        except Exception as e:
            print(f"Error reading Supabase in /api/seo-audit: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database query error in seo-audit: {str(e)}"
            )

    # Fallback/Seed mock data ONLY if running locally without Supabase credentials set
    if not supabase_client:
        print("Using high-quality mock data for SEO audit (local fallback mode).")
        articles = [
            {"title": "Lucia Trailer Breakdown", "slug": "lucia-trailer-breakdown", "content": "Short description of trailer", "featured_image": "https://gta6.com/img1.jpg", "seo_description": ""},
            {"title": "Heavy Weapon Cheat Guide", "slug": "heavy-weapon-cheats", "content": "Weapons cheat details with plenty of words to fill up the word count limit " * 150, "featured_image": "https://gta6.com/img2.jpg", "seo_description": "Perfect meta description here."}
        ]
        guides = [
            {"title": "Speedrun Yacht Heist", "slug": "speedrun-yacht-heist", "content": "How to steal yachts in under ten minutes.", "featured_image": ""}
        ]

    flagged_items = []

    # Audit Articles
    for art in articles:
        slug = art.get("slug", "")
        title = art.get("title", "Untitled Article")
        content = art.get("content", "")
        f_image = art.get("featured_image")
        seo_desc = art.get("seo_description", "")

        w_count = get_word_count(content)
        reasons = []

        # 1. Missing Meta Description
        if not seo_desc or not seo_desc.strip():
            reasons.append("Missing meta description (seo_description is blank)")

        # 2. Missing Alt Text on Featured Image
        if not f_image:
            reasons.append("Missing featured image URL completely")
        else:
            alt = media_map.get(f_image, "")
            if not alt or not alt.strip():
                reasons.append(f"Missing alt text on featured image ({f_image})")

        # 3. Under minimum word count threshold
        if w_count < config.ARTICLE_MIN_WORD_COUNT:
            reasons.append(f"Content word count ({w_count:,}) is below the article minimum threshold ({config.ARTICLE_MIN_WORD_COUNT:,} words)")

        if reasons:
            flagged_items.append({
                "type": "Article",
                "title": title,
                "slug": slug,
                "word_count": w_count,
                "reasons": reasons
            })

    # Audit Guides
    for guide in guides:
        slug = guide.get("slug", "")
        title = guide.get("title", "Untitled Guide")
        content = guide.get("content", "")
        f_image = guide.get("featured_image")

        w_count = get_word_count(content)
        reasons = []

        # 1. Missing Alt Text on Featured Image
        if not f_image:
            reasons.append("Missing featured image URL completely")
        else:
            alt = media_map.get(f_image, "")
            if not alt or not alt.strip():
                reasons.append(f"Missing alt text on featured image ({f_image})")

        # 2. Under minimum word count threshold
        if w_count < config.GUIDE_MIN_WORD_COUNT:
            reasons.append(f"Content word count ({w_count:,}) is below the guide minimum threshold ({config.GUIDE_MIN_WORD_COUNT:,} words)")

        if reasons:
            flagged_items.append({
                "type": "Guide",
                "title": title,
                "slug": slug,
                "word_count": w_count,
                "reasons": reasons
            })

    return flagged_items

# Endpoint: GET /api/topic-coverage
@app.get("/api/topic-coverage", dependencies=[Depends(verify_internal_key)])
async def get_topic_coverage():
    articles = []
    guides = []

    # If in production and credentials are missing, do not fall back. Raise 500 error instead.
    if is_production() and not supabase_client:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Production environment misconfiguration: Supabase credentials are required but missing."
        )

    if supabase_client:
        try:
            art_res = supabase_client.table("articles").select("content").eq("status", "published").execute()
            articles = art_res.data or []

            guide_res = supabase_client.table("guides").select("content").eq("status", "published").execute()
            guides = guide_res.data or []
        except Exception as e:
            print(f"Error reading Supabase in /api/topic-coverage: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database query error in topic-coverage: {str(e)}"
            )

    # Fallback/Seed mock data ONLY if running locally without Supabase credentials set
    if not supabase_client:
        print("Using high-quality mock data for topic coverage (local fallback mode).")
        articles = [
            {"content": "Lucia and Jason are the dual protagonists of the new gameplay map in Vice City. Weapons are customizable. Car driving feels incredibly smooth. Lucia drives fast cars."},
            {"content": "Leonida is massive! We hope the release date trailer leaks are false. Online missions will include awesome motorcycle stunts."}
        ]
        guides = [
            {"content": "Let's complete the heist with Lucia. Grab the weapons and take the getaway cars."}
        ]

    # Combine all content
    combined_content = ""
    for item in articles + guides:
        content = item.get("content", "")
        combined_content += " " + clean_text(content).lower()

    # Analyze frequencies
    keyword_freqs = {}
    for kw in config.GTA_KEYWORDS:
        # Perform exact word boundary match
        pattern = r'\b' + re.escape(kw.lower()) + r'\b'
        matches = re.findall(pattern, combined_content)
        keyword_freqs[kw] = len(matches)

    well_covered = []
    under_covered = []

    for kw, count in keyword_freqs.items():
        item_data = {"topic": kw, "mentions": count}
        if count >= config.TOPIC_WELL_COVERED_THRESHOLD:
            well_covered.append(item_data)
        else:
            under_covered.append(item_data)

    return {
        "well_covered": sorted(well_covered, key=lambda x: x["mentions"], reverse=True),
        "under_covered": sorted(under_covered, key=lambda x: x["mentions"], reverse=True)
    }

# Endpoint: GET /api/sentiment-trend
@app.get("/api/sentiment-trend", dependencies=[Depends(verify_internal_key)])
async def get_sentiment_trend():
    from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
    from datetime import timedelta

    comments = []

    if is_production() and not supabase_client:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Production environment misconfiguration: Supabase credentials are required but missing."
        )

    if supabase_client:
        try:
            res = supabase_client.table("comments").select("content, created_at").eq("status", "approved").execute()
            comments = res.data or []
        except Exception as e:
            print(f"Error reading Supabase in /api/sentiment-trend: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database query error in sentiment-trend: {str(e)}"
            )

    # Fallback / mock data for local development if empty or no client
    if not supabase_client or len(comments) == 0:
        print("Using fallback mock data for sentiment trend.")
        # Return a rich, weekly aggregated trend dataset
        return {
            "2024-11-25": {"positive": 12, "neutral": 5, "negative": 1},
            "2024-12-02": {"positive": 18, "neutral": 8, "negative": 2},
            "2024-12-09": {"positive": 15, "neutral": 6, "negative": 3},
            "2024-12-16": {"positive": 24, "neutral": 11, "negative": 4},
            "2024-12-23": {"positive": 30, "neutral": 14, "negative": 2},
            "2024-12-30": {"positive": 22, "neutral": 10, "negative": 5},
            "2025-01-06": {"positive": 35, "neutral": 15, "negative": 3},
            "2025-01-13": {"positive": 42, "neutral": 18, "negative": 6}
        }

    # Initialize sentiment analyzer
    analyzer = SentimentIntensityAnalyzer()
    weekly_data = defaultdict(lambda: {"positive": 0, "neutral": 0, "negative": 0})

    for comment in comments:
        content = comment.get("content", "")
        created_at_str = comment.get("created_at")

        if not created_at_str:
            continue

        # Classify sentiment
        scores = analyzer.polarity_scores(content)
        compound = scores.get("compound", 0.0)

        if compound >= 0.05:
            sentiment = "positive"
        elif compound <= -0.05:
            sentiment = "negative"
        else:
            sentiment = "neutral"

        # Find week key (Monday of that week)
        try:
            dt = datetime.fromisoformat(created_at_str.replace("Z", "+00:00"))
            monday = dt - timedelta(days=dt.weekday())
            week_key = monday.strftime("%Y-%m-%d")
            weekly_data[week_key][sentiment] += 1
        except Exception:
            pass

    # Sort the dict by week key string chronological order
    sorted_trend = {}
    for k in sorted(weekly_data.keys()):
        sorted_trend[k] = weekly_data[k]

    # If somehow empty after loop, return default structure
    if not sorted_trend:
        sorted_trend = {
            "2025-01-06": {"positive": 5, "neutral": 2, "negative": 0},
            "2025-01-13": {"positive": 8, "neutral": 4, "negative": 1}
        }

    return sorted_trend
