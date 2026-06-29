# 🎯 Automated Daily Job Hunting Agent for Palli Gyaneswari

A fully automated Python pipeline that runs daily via GitHub Actions. It scrapes Indian tech hubs and global remote platforms for AI/ML, Full Stack, and Software Engineer roles matching my profile — then compiles everything into a live dashboard on GitHub Pages.

## 👤 My Profile

- **Final-year B.Tech CS student** (graduating 2027), Raghu Engineering College, India
- **Full-stack developer** (React, Node.js/Express, MySQL, JWT auth, Tailwind)
- **Production projects:**
  - Password K Vault — AI-powered password security platform (Node/React/MySQL, deployed on Vercel/Render/Railway, AI integration via OpenRouter API)
  - Skill Synthex — ML career-prediction system (XGBoost, Random Forest, SVM, Logistic Regression, 99.67% accuracy)
- **AI/ML internship experience** (classification modeling)
- **Certifications:** Python/C/Java (NPTEL), MySQL (HackerRank), DSA (SmartInterviews)
- **Experience level:** Fresher / 0-1 years (eligible for internships and entry-level/grad roles)
- **LinkedIn:** [www.linkedin.com/in/palli-gyaneswari-32a7a02a2](https://www.linkedin.com/in/palli-gyaneswari-32a7a02a2)

## ✨ Features

- **Multi-platform scraping** — LinkedIn, Naukri.com, and Remotive API
- **Target roles** — AI Engineer, ML Engineer, Full Stack Developer, Software Engineer Intern
- **Target locations (India)** — Visakhapatnam, Vijayawada, Hyderabad, Bengaluru, Chennai, Pune
- **Global freelance tracking** — Remote contracts from the Remotive API
- **Experience filtering** — Only fresher/0-1 years/intern/new grad roles
- **Deduplication** — Historical job IDs tracked in `jobs_state.json` to prevent duplicates
- **Anti-detection** — Human-like delays and user-agent rotation via Playwright
- **Auto-deployed dashboard** — Responsive HTML updated daily at `https://<username>.github.io/job-hunter/`

## 📁 Project Structure

```
job-hunter/
├── .github/workflows/
│   └── job_hunter.yml              # GitHub Actions cron workflow
├── data/
│   ├── fulltime_jobs.json          # India-based role listings
│   ├── freelance_jobs.json         # Global freelance listings
│   └── jobs_state.json             # Deduplication state tracker
├── src/
│   ├── __init__.py
│   ├── config.py                   # Centralized configuration
│   ├── scraper.py                  # Playwright + API scraping orchestration
│   └── generate_pages.py          # JSON → static HTML compiler
├── docs/
│   └── index.html                  # Auto-generated dashboard (GitHub Pages root)
├── gyane_fullstack_resume (2).pdf  # Resume
├── requirements.txt                # Python dependencies
└── README.md
```

## 🛠️ Setup

### Prerequisites

- Python 3.10+
- Git
- A GitHub account with a **private** repository

### 1. Clone & Install

```bash
git clone <your-private-repo-url>
cd job-hunter
pip install -r requirements.txt
playwright install
```

### 2. Configure GitHub Secrets

Go to your repo on GitHub → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:

| Secret Name      | Value                        |
|------------------|------------------------------|
| `LINKEDIN_USER`  | Your LinkedIn login email    |
| `LINKEDIN_PASS`  | Your LinkedIn login password |

> [!WARNING]
> Never hardcode credentials. The scraper reads them exclusively from environment variables.
> Use a secondary LinkedIn account — scraping may trigger account restrictions.

### 3. Enable GitHub Pages

1. Go to **Settings** → **Pages**.
2. Set **Source** to **Deploy from a branch**.
3. Choose branch `main`, folder `/docs`, and click **Save**.

The dashboard will auto-update every morning at **10:30 AM IST (05:00 UTC)** at:
```
https://<your-github-username>.github.io/job-hunter/
```

### 4. Run Manually (optional)

To trigger a scrape locally instead of waiting for the cron schedule:

```bash
export LINKEDIN_USER=""
export LINKEDIN_PASS="your-password"
python src/scraper.py
python src/generate_pages.py
```

You can also trigger the workflow manually from GitHub → **Actions** → **Daily Job Hunter** → **Run workflow**.

## 🧰 Tech Stack

| Component        | Technology                     |
|------------------|--------------------------------|
| Scraping engine  | Playwright (Python)            |
| Freelance API    | Remotive (public JSON API)     |
| Automation       | GitHub Actions (daily cron)    |
| Dashboard        | Static HTML / GitHub Pages     |
| State management | JSON flat-file deduplication   |

## 📄 License

This project is for personal use. Please respect the terms of service of all scraped platforms.
