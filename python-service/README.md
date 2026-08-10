# GTA 6 Hub - Analysis & Insights Microservice

A standalone Python microservice built using **FastAPI** to conduct semantic, statistical, and SEO audit operations on articles and guides fetched from the Supabase content management layer.

Designed to be deployed independently to free-tier cloud environments like **Render** or **Railway**.

## Project Structure

```text
/python-service
├── Dockerfile            # Container definition for independent cloud deployment
├── README.md             # Technical documentation and operations guide
├── config.py             # Customizable keywords, security lists, and variables
├── main.py               # Core FastAPI routing, heuristics, and analytical calculations
└── requirements.txt      # Bound library list with fixed versions
```

## Features & Endpoints

All endpoints are fully authenticated and require the shared secret security header `X-Internal-Key` with a valid secret token to return data.

### 1. GET `/api/content-stats`
- **Description**: Pulls all published articles and guides from Supabase, strips HTML/Markdown, and computes readability scores.
- **Formulas**: Readability is evaluated using the standardized **Flesch Reading Ease** algorithm via Python's `textstat` library. Word counts are grouped monthly in a `"YYYY-MM"` trend index.
- **Output**: Returns aggregate statistics only (averages and trends), safeguarding raw proprietary draft text.

### 2. GET `/api/seo-audit`
- **Description**: Flags articles and guides that fail to meet standard on-page SEO best practices.
- **Audited Criteria**:
  1. Missing meta descriptions (`seo_description` on articles).
  2. Missing image alternate (`alt_text`) labels on their assigned featured images.
  3. Word count falling below critical thresholds (Articles: under **1,200** words; Guides: under **2,500** words).
- **Output**: Returns a collection of flagged items with direct links, titles, and itemized warning strings.

### 3. GET `/api/topic-coverage`
- **Description**: Tokenizes combined published text and conducts a keyword count frequency analysis.
- **Vocabulary**: Checked against a custom GTA 6 dictionary (defined in `config.py`).
- **Output**: Splits keywords into `"well-covered"` (5+ mentions across the database) and `"under-covered"` (< 5 mentions) listings to help guide content creators.

---

## Local Development Setup

To run the FastAPI service locally on your sandbox computer:

1. **Navigate to directory**:
   ```bash
   cd python-service
   ```

2. **Initialize python virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install pinned dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Set environment variables**:
   ```bash
   export SUPABASE_URL="https://your-supabase-url.supabase.co"
   export SUPABASE_SERVICE_KEY="your-read-only-anon-or-service-role-key"
   export INTERNAL_SERVICE_SECRET="super-secret-gta6-key-1337"
   export PORT=8000
   ```

5. **Start live development server**:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

The local API documentation will be interactive and accessible at `http://localhost:8000/docs`.

---

## Deployment Instructions

### Deploy to Render or Railway (Free Tier)
1. Link your branch to a Render Web Service or Railway project.
2. Ensure you specify the environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `INTERNAL_SERVICE_SECRET`
3. Select **Docker** as the deployment builder. Render/Railway will automatically detect the `Dockerfile`, install system C-dependencies, compile the `textstat` packages, and expose uvicorn on the default mapped `$PORT`.
