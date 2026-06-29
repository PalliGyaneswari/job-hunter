"""
Job Hunter Scraper — Main orchestration module.

Scrapes job listings from:
  1. LinkedIn (Playwright + login)
  2. Naukri.com (Playwright, public listings)
  3. Remotive API (HTTP/JSON, remote/freelance)

Deduplicates results and persists to JSON data files.
"""

import asyncio
import hashlib
import json
import logging
import os
import sys
import time
from datetime import datetime, timezone
from typing import Optional

import requests
from bs4 import BeautifulSoup

# ─── Setup logging ──────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("job-hunter")

# ─── Add project root to path so we can import config ───────────────────────
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from src.config import (
    TARGET_ROLES,
    TARGET_LOCATIONS,
    ROLE_KEYWORDS,
    EXPERIENCE_KEYWORDS,
    REMOTIVE_API_URL,
    REMOTIVE_CATEGORIES,
    FULLTIME_JOBS_FILE,
    FREELANCE_JOBS_FILE,
    JOBS_STATE_FILE,
    DATA_DIR,
    get_random_user_agent,
    random_delay,
    random_keystroke_delay,
    linkedin_search_url,
    naukri_search_url,
    LINKEDIN_LOGIN_URL,
)


# ═══════════════════════════════════════════════════════════════════════════
# Utility helpers
# ═══════════════════════════════════════════════════════════════════════════

def generate_job_id(platform: str, title: str, company: str, link: str) -> str:
    """Create a deterministic hash ID for deduplication."""
    raw = f"{platform}|{title}|{company}|{link}".lower().strip()
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:16]


def matches_experience_level(description: str) -> bool:
    """Check if job description matches fresher/intern experience level."""
    if not description:
        return True  # Allow if no description available
    desc_lower = description.lower()
    # Check for experience level keywords
    has_fresher_keywords = any(kw in desc_lower for kw in EXPERIENCE_KEYWORDS)
    # Reject if it requires 2+ years experience
    requires_senior = any(kw in desc_lower for kw in ["2+ years", "2 years", "3+ years", "3 years", "4+ years", "5+ years", "senior", "lead"])
    return has_fresher_keywords or not requires_senior


def load_json(filepath: str) -> list | dict:
    """Load a JSON file, returning an empty list/dict on error."""
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        if filepath.endswith("jobs_state.json"):
            return {"seen_ids": []}
        return []


def save_json(filepath: str, data: list | dict) -> None:
    """Save data to a JSON file, creating directories if needed."""
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


class DeduplicationEngine:
    """Tracks seen job IDs to prevent duplicate entries."""

    def __init__(self):
        self.state = load_json(JOBS_STATE_FILE)
        if not isinstance(self.state, dict) or "seen_ids" not in self.state:
            self.state = {"seen_ids": []}
        self.seen = set(self.state["seen_ids"])
        logger.info(f"Dedup engine loaded with {len(self.seen)} known job IDs")

    def is_new(self, job_id: str) -> bool:
        return job_id not in self.seen

    def mark_seen(self, job_id: str) -> None:
        self.seen.add(job_id)

    def save(self) -> None:
        self.state["seen_ids"] = list(self.seen)
        save_json(JOBS_STATE_FILE, self.state)
        logger.info(f"Dedup state saved — {len(self.seen)} total IDs tracked")


# ═══════════════════════════════════════════════════════════════════════════
# 1. LinkedIn Scraper (Playwright)
# ═══════════════════════════════════════════════════════════════════════════

async def scrape_linkedin(dedup: DeduplicationEngine) -> list[dict]:
    """
    Scrapes LinkedIn job listings using Playwright with stealth measures.
    Requires LINKEDIN_USER and LINKEDIN_PASS environment variables.
    """
    username = os.environ.get("LINKEDIN_USER", "")
    password = os.environ.get("LINKEDIN_PASS", "")

    if not username or not password:
        logger.warning("LINKEDIN_USER / LINKEDIN_PASS not set — skipping LinkedIn scraper")
        return []

    jobs = []

    try:
        from playwright.async_api import async_playwright

        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=[
                    "--disable-blink-features=AutomationControlled",
                    "--no-sandbox",
                    "--disable-dev-shm-usage",
                ],
            )

            context = await browser.new_context(
                user_agent=get_random_user_agent(),
                viewport={"width": 1920, "height": 1080},
                locale="en-US",
            )

            # Mask navigator.webdriver
            await context.add_init_script("""
                Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
            """)

            page = await context.new_page()

            # ── Login ────────────────────────────────────────────────────
            logger.info("LinkedIn: Navigating to login page...")
            await page.goto(LINKEDIN_LOGIN_URL, wait_until="networkidle")
            await asyncio.sleep(random_delay())

            await page.fill("#username", "")
            for char in username:
                await page.type("#username", char, delay=random_keystroke_delay())
            await asyncio.sleep(random_delay() / 2)

            await page.fill("#password", "")
            for char in password:
                await page.type("#password", char, delay=random_keystroke_delay())
            await asyncio.sleep(random_delay() / 2)

            await page.click('button[type="submit"]')
            await page.wait_for_load_state("networkidle")
            await asyncio.sleep(random_delay())

            # Check if login succeeded
            if "challenge" in page.url or "checkpoint" in page.url:
                logger.warning("LinkedIn: Hit security challenge — skipping (CAPTCHA/2FA required)")
                await browser.close()
                return []

            logger.info("LinkedIn: Login successful")

            # ── Scrape jobs for each role × location ─────────────────────
            # Limit to first 3 roles and 3 locations per run to stay under rate limits
            roles_to_scrape = TARGET_ROLES[:3]
            locations_to_scrape = TARGET_LOCATIONS[:3]

            for role in roles_to_scrape:
                for location in locations_to_scrape:
                    try:
                        url = linkedin_search_url(role, location)
                        logger.info(f"LinkedIn: Searching '{role}' in '{location}'...")
                        await page.goto(url, wait_until="networkidle")
                        await asyncio.sleep(random_delay())

                        # Scroll to load more results
                        for _ in range(3):
                            await page.evaluate("window.scrollBy(0, 800)")
                            await asyncio.sleep(random_delay() / 3)

                        # Extract job cards
                        cards = await page.query_selector_all(
                            ".job-card-container, .jobs-search-results__list-item, "
                            "[data-job-id], .job-card-list__entity-lockup"
                        )

                        for card in cards[:10]:  # Cap at 10 per combo
                            try:
                                title_el = await card.query_selector(
                                    ".job-card-list__title, .job-card-container__link, "
                                    "a.job-card-list__title--link"
                                )
                                company_el = await card.query_selector(
                                    ".job-card-container__primary-description, "
                                    ".artdeco-entity-lockup__subtitle"
                                )
                                location_el = await card.query_selector(
                                    ".job-card-container__metadata-wrapper li, "
                                    ".artdeco-entity-lockup__caption"
                                )
                                link_el = await card.query_selector("a[href*='/jobs/view/']")

                                title_text = (await title_el.inner_text()).strip() if title_el else ""
                                company_text = (await company_el.inner_text()).strip() if company_el else ""
                                location_text = (await location_el.inner_text()).strip() if location_el else location
                                link_href = await link_el.get_attribute("href") if link_el else ""

                                if not title_text or not link_href:
                                    continue

                                # Normalize link
                                if link_href.startswith("/"):
                                    link_href = f"https://www.linkedin.com{link_href}"

                                # Check experience level from title
                                if not matches_experience_level(title_text):
                                    continue

                                job_id = generate_job_id("linkedin", title_text, company_text, link_href)

                                if dedup.is_new(job_id):
                                    jobs.append({
                                        "id": job_id,
                                        "title": title_text,
                                        "company": company_text,
                                        "location": location_text,
                                        "link": link_href.split("?")[0],
                                        "platform": "linkedin",
                                        "posted_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                                        "scraped_at": datetime.now(timezone.utc).isoformat(),
                                    })
                                    dedup.mark_seen(job_id)

                            except Exception as e:
                                logger.debug(f"LinkedIn: Error parsing card — {e}")
                                continue

                        await asyncio.sleep(random_delay())

                    except Exception as e:
                        logger.warning(f"LinkedIn: Error scraping '{role}' in '{location}' — {e}")
                        continue

            await browser.close()

    except ImportError:
        logger.error("Playwright not installed — run: pip install playwright && playwright install")
    except Exception as e:
        logger.error(f"LinkedIn scraper error: {e}")

    logger.info(f"LinkedIn: Collected {len(jobs)} new jobs")
    return jobs


# ═══════════════════════════════════════════════════════════════════════════
# 2. Naukri.com Scraper (Playwright, public — no login)
# ═══════════════════════════════════════════════════════════════════════════

async def scrape_naukri(dedup: DeduplicationEngine) -> list[dict]:
    """
    Scrapes Naukri.com public job listings using Playwright.
    No login required — scrapes publicly visible search results.
    """
    jobs = []

    try:
        from playwright.async_api import async_playwright

        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=[
                    "--disable-blink-features=AutomationControlled",
                    "--no-sandbox",
                    "--disable-dev-shm-usage",
                ],
            )

            context = await browser.new_context(
                user_agent=get_random_user_agent(),
                viewport={"width": 1920, "height": 1080},
                locale="en-IN",
            )

            await context.add_init_script("""
                Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
            """)

            page = await context.new_page()

            # Simplified role list for Naukri URL slugs
            naukri_roles = [
                "full-stack-developer",
                "data-analyst",
                "machine-learning-engineer",
                "ai-engineer",
            ]

            for role_slug in naukri_roles:
                for location in TARGET_LOCATIONS:
                    try:
                        url = f"https://www.naukri.com/{role_slug}-jobs-in-{location.lower()}"
                        logger.info(f"Naukri: Searching '{role_slug}' in '{location}'...")
                        await page.goto(url, wait_until="domcontentloaded", timeout=30000)
                        await asyncio.sleep(random_delay())

                        # Wait for job cards to render
                        try:
                            await page.wait_for_selector(
                                ".srp-jobtuple-wrapper, .jobTuple, article.jobTuple",
                                timeout=10000,
                            )
                        except Exception:
                            logger.debug(f"Naukri: No results for '{role_slug}' in '{location}'")
                            continue

                        # Scroll to load lazy content
                        for _ in range(2):
                            await page.evaluate("window.scrollBy(0, 600)")
                            await asyncio.sleep(random_delay() / 3)

                        # Extract job cards
                        cards = await page.query_selector_all(
                            ".srp-jobtuple-wrapper, .jobTuple, article.jobTuple, "
                            "[data-job-id], .cust-job-tuple"
                        )

                        for card in cards[:10]:  # Cap at 10 per combo
                            try:
                                title_el = await card.query_selector(
                                    "a.title, .row1 a, .info h2 a, a[class*='title']"
                                )
                                company_el = await card.query_selector(
                                    "a.comp-name, .row2 .comp-name, .info .comp-dtls a, "
                                    "a[class*='comp-name'], .subTitle a"
                                )
                                location_el = await card.query_selector(
                                    ".loc, .locWdth, .row3 .loc-wrap .loc, span.loc-wrap .loc, "
                                    "span[class*='loc']"
                                )

                                title_text = (await title_el.inner_text()).strip() if title_el else ""
                                company_text = (await company_el.inner_text()).strip() if company_el else ""
                                location_text = (await location_el.inner_text()).strip() if location_el else location
                                link_href = await title_el.get_attribute("href") if title_el else ""

                                if not title_text or not link_href:
                                    continue

                                # Check experience level from title
                                if not matches_experience_level(title_text):
                                    continue

                                job_id = generate_job_id("naukri", title_text, company_text, link_href)

                                if dedup.is_new(job_id):
                                    jobs.append({
                                        "id": job_id,
                                        "title": title_text,
                                        "company": company_text,
                                        "location": location_text,
                                        "link": link_href,
                                        "platform": "naukri",
                                        "posted_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                                        "scraped_at": datetime.now(timezone.utc).isoformat(),
                                    })
                                    dedup.mark_seen(job_id)

                            except Exception as e:
                                logger.debug(f"Naukri: Error parsing card — {e}")
                                continue

                        await asyncio.sleep(random_delay())

                    except Exception as e:
                        logger.warning(f"Naukri: Error scraping '{role_slug}' in '{location}' — {e}")
                        continue

            await browser.close()

    except ImportError:
        logger.error("Playwright not installed — run: pip install playwright && playwright install")
    except Exception as e:
        logger.error(f"Naukri scraper error: {e}")

    logger.info(f"Naukri: Collected {len(jobs)} new jobs")
    return jobs


# ═══════════════════════════════════════════════════════════════════════════
# 3. Remotive API Scraper (HTTP/JSON — no browser needed)
# ═══════════════════════════════════════════════════════════════════════════

def scrape_remotive(dedup: DeduplicationEngine) -> list[dict]:
    """
    Fetches remote/freelance job listings from the Remotive API.
    No authentication required — public JSON endpoint.
    Respects rate limit: 1 call per category per run.
    """
    jobs = []

    for category in REMOTIVE_CATEGORIES:
        try:
            logger.info(f"Remotive: Fetching category '{category}'...")
            response = requests.get(
                REMOTIVE_API_URL,
                params={"category": category},
                headers={"User-Agent": get_random_user_agent()},
                timeout=30,
            )
            response.raise_for_status()

            data = response.json()
            listings = data.get("jobs", [])
            logger.info(f"Remotive: Got {len(listings)} raw listings for '{category}'")

            for item in listings:
                title = item.get("title", "")
                company = item.get("company_name", "")
                location_text = item.get("candidate_required_location", "Remote")
                link = item.get("url", "")
                pub_date = item.get("publication_date", "")

                # Filter by role keywords
                title_lower = title.lower()
                if not any(kw in title_lower for kw in ROLE_KEYWORDS):
                    continue

                # Filter by experience level
                if not matches_experience_level(title):
                    continue

                if not title or not link:
                    continue

                job_id = generate_job_id("remotive", title, company, link)

                if dedup.is_new(job_id):
                    # Format date
                    posted = pub_date[:10] if pub_date else datetime.now(timezone.utc).strftime("%Y-%m-%d")

                    jobs.append({
                        "id": job_id,
                        "title": title,
                        "company": company,
                        "location": location_text if location_text else "Remote",
                        "link": link,
                        "platform": "remotive",
                        "posted_date": posted,
                        "scraped_at": datetime.now(timezone.utc).isoformat(),
                    })
                    dedup.mark_seen(job_id)

            # Respect rate limit — wait between category requests
            time.sleep(2)

        except requests.RequestException as e:
            logger.warning(f"Remotive: API error for '{category}' — {e}")
        except Exception as e:
            logger.error(f"Remotive: Unexpected error — {e}")

    logger.info(f"Remotive: Collected {len(jobs)} new jobs")
    return jobs


# ═══════════════════════════════════════════════════════════════════════════
# Main orchestrator
# ═══════════════════════════════════════════════════════════════════════════

async def main():
    """Run all scrapers, deduplicate, and save results."""
    logger.info("=" * 60)
    logger.info("Job Hunter Pipeline — Starting")
    logger.info(f"Timestamp: {datetime.now(timezone.utc).isoformat()}")
    logger.info("=" * 60)

    # Ensure data directory exists
    os.makedirs(DATA_DIR, exist_ok=True)

    # Initialize dedup engine
    dedup = DeduplicationEngine()

    # Load existing jobs
    fulltime_jobs = load_json(FULLTIME_JOBS_FILE)
    if not isinstance(fulltime_jobs, list):
        fulltime_jobs = []
    freelance_jobs = load_json(FREELANCE_JOBS_FILE)
    if not isinstance(freelance_jobs, list):
        freelance_jobs = []

    # ── Run scrapers ─────────────────────────────────────────────────────
    new_fulltime = []
    new_freelance = []

    # 1. LinkedIn
    try:
        linkedin_jobs = await scrape_linkedin(dedup)
        new_fulltime.extend(linkedin_jobs)
    except Exception as e:
        logger.error(f"LinkedIn scraper failed: {e}")

    # 2. Naukri
    try:
        naukri_jobs = await scrape_naukri(dedup)
        new_fulltime.extend(naukri_jobs)
    except Exception as e:
        logger.error(f"Naukri scraper failed: {e}")

    # 3. Remotive (freelance/remote)
    try:
        remotive_jobs = scrape_remotive(dedup)
        new_freelance.extend(remotive_jobs)
    except Exception as e:
        logger.error(f"Remotive scraper failed: {e}")

    # ── Merge and save ───────────────────────────────────────────────────
    fulltime_jobs.extend(new_fulltime)
    freelance_jobs.extend(new_freelance)

    save_json(FULLTIME_JOBS_FILE, fulltime_jobs)
    save_json(FREELANCE_JOBS_FILE, freelance_jobs)
    dedup.save()

    # ── Summary ──────────────────────────────────────────────────────────
    logger.info("=" * 60)
    logger.info("Pipeline Complete")
    logger.info(f"  New full-time jobs: {len(new_fulltime)}")
    logger.info(f"  New freelance jobs: {len(new_freelance)}")
    logger.info(f"  Total full-time:    {len(fulltime_jobs)}")
    logger.info(f"  Total freelance:    {len(freelance_jobs)}")
    logger.info("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
