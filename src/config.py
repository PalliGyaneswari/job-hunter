"""
Centralized configuration for the Job Hunter pipeline.
All target roles, locations, user-agents, and platform settings live here.
"""

import os
import random

# ─── Target Roles ────────────────────────────────────────────────────────────
TARGET_ROLES = [
    "AI Engineer",
    "Artificial Intelligence Engineer",
    "ML Engineer",
    "Machine Learning Engineer",
    "Full Stack Developer",
    "Full Stack Engineer",
    "Software Engineer Intern",
    "Software Engineer",
]

# ─── Target Locations (India full-time) ──────────────────────────────────────
TARGET_LOCATIONS = [
    "Visakhapatnam",
    "Vijayawada",
    "Hyderabad",
    "Bengaluru",
    "Chennai",
    "Pune",
]

# ─── Remotive API (replaces Upwork RSS & Remote.co) ─────────────────────────
REMOTIVE_API_URL = "https://remotive.com/api/remote-jobs"
REMOTIVE_CATEGORIES = ["software-dev", "data", "devops"]

# ─── Additional Job Sources ───────────────────────────────────────────────────
INDEED_API_URL = "https://indeed.com"
GLASSDOOR_API_URL = "https://glassdoor.com"

# ─── Role keywords for filtering API results ────────────────────────────────
ROLE_KEYWORDS = [
    "ai engineer",
    "artificial intelligence",
    "machine learning",
    "ml engineer",
    "full stack",
    "fullstack",
    "software engineer",
    "software engineer intern",
    "frontend",
    "backend",
    "deep learning",
]

# ─── Experience level keywords for filtering ───────────────────────────────
EXPERIENCE_KEYWORDS = [
    "fresher",
    "0-1 years",
    "0 to 1 years",
    "intern",
    "internship",
    "entry level",
    "entry-level",
    "new grad",
    "recent graduate",
]

# ─── Major Company Career Portals (for reference/manual application) ───────
COMPANY_CAREER_PORTALS = {
    "Microsoft": "https://jobs.careers.microsoft.com/global/en/job/1577325/Software-Engineering---Internship-Opportunities",
    "Amazon": "https://www.amazon.jobs/content/en/career-programs/university?country%5B%5D=IN",
    "Google": "https://careers.google.com/students/engineering-and-technical-internships/",
    "TCS": "https://www.tcs.com/careers/india/tcs-all-india-nqt-hiring",
    "TCS Internship": "https://www.tcs.com/careers/india/internship",
    "Infosys": "https://www.infosys.com/careers/apply/students.html",
    "Wipro": "https://careers.wipro.com/content/Early-Careers/",
    "Accenture": "https://www.accenture.com/in-en/careers/jobdetails?id=R00276795_en",
    "Atlassian": "https://www.atlassian.com/company/careers/earlycareers",
}

# ─── WhatsApp Notification Settings (Hidden from public view) ───────────────
# These will be loaded from environment variables/GitHub secrets
WHATSAPP_ENABLED = os.environ.get("WHATSAPP_ENABLED", "false").lower() == "true"
WHATSAPP_API_URL = os.environ.get("WHATSAPP_API_URL", "")
WHATSAPP_API_KEY = os.environ.get("WHATSAPP_API_KEY", "")
WHATSAPP_CHANNEL_ID = os.environ.get("WHATSAPP_CHANNEL_ID", "")  # Hidden channel ID

# ─── Application Tracking ─────────────────────────────────────────────────────
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
DOCS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "docs")
APPLICATION_STATUS_FILE = os.path.join(DATA_DIR, "application_status.json")

# ─── Naukri URL patterns ────────────────────────────────────────────────────
NAUKRI_BASE_URL = "https://www.naukri.com"

def naukri_search_url(role: str, location: str) -> str:
    """Build a Naukri.com search URL for a given role and location."""
    role_slug = role.lower().replace(" ", "-")
    location_slug = location.lower()
    return f"{NAUKRI_BASE_URL}/{role_slug}-jobs-in-{location_slug}"

# ─── LinkedIn URL patterns ──────────────────────────────────────────────────
LINKEDIN_LOGIN_URL = "https://www.linkedin.com/login"
LINKEDIN_JOBS_URL = "https://www.linkedin.com/jobs/search/"

def linkedin_search_url(role: str, location: str) -> str:
    """Build a LinkedIn jobs search URL."""
    from urllib.parse import quote_plus
    return (
        f"{LINKEDIN_JOBS_URL}?"
        f"keywords={quote_plus(role)}"
        f"&location={quote_plus(location + ', India')}"
        f"&f_TPR=r86400"  # Past 24 hours
    )

# ─── User-Agent Rotation Pool ───────────────────────────────────────────────
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14.5; rv:126.0) Gecko/20100101 Firefox/126.0",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64; rv:126.0) Gecko/20100101 Firefox/126.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 OPR/111.0.0.0",
]

def get_random_user_agent() -> str:
    """Return a random user-agent string from the pool."""
    return random.choice(USER_AGENTS)

# ─── Human-like delay ranges (in seconds) ───────────────────────────────────
DELAY_MIN = 2.0
DELAY_MAX = 6.0
KEYSTROKE_DELAY_MIN = 50   # milliseconds
KEYSTROKE_DELAY_MAX = 180  # milliseconds

def random_delay() -> float:
    """Return a random delay between DELAY_MIN and DELAY_MAX seconds."""
    return random.uniform(DELAY_MIN, DELAY_MAX)

def random_keystroke_delay() -> int:
    """Return a random keystroke delay in milliseconds."""
    return random.randint(KEYSTROKE_DELAY_MIN, KEYSTROKE_DELAY_MAX)

# ─── Data file paths ────────────────────────────────────────────────────────
FULLTIME_JOBS_FILE = os.path.join(DATA_DIR, "fulltime_jobs.json")
FREELANCE_JOBS_FILE = os.path.join(DATA_DIR, "freelance_jobs.json")
JOBS_STATE_FILE = os.path.join(DATA_DIR, "jobs_state.json")
DASHBOARD_FILE = os.path.join(DOCS_DIR, "index.html")
