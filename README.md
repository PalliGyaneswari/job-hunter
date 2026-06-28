# 🎯 Automated Daily Job Hunting & Freelance Aggregator Agent

A fully automated python pipeline running on an independent daily cron scheduled architecture. It scans regional Indian technical clusters for full-time paths while indexing international remote contracts.

## 🛠️ Step-by-Step Installation Instructions

### 1. Repository Instantiation
Create a private GitHub repository, and clone down your repository locally:
```bash
git clone <your-private-repo-url>
cd job-hunter-agent
```

### 2. File Placement
- Drop your primary resume asset at the root of the file system named exactly as `resume.pdf`.
- Replicate the folder layout outlined above with the provided `src/` files and python scripts.

### 3. Setup Secret Infrastructure in GitHub
To securely input credentials for the automation sequence:
1. Navigate to your online repository: **Settings** &rarr; **Secrets and variables** &rarr; **Actions**.
2. Click **New repository secret** and configure:
   - `LINKEDIN_USER`: Enter your primary registration email address.
   - `LINKEDIN_PASS`: Enter your registration password.

### 4. Enable GitHub Pages Hosting Environment
1. Navigate to **Settings** &rarr; **Pages**.
2. Under **Build and deployment** &rarr; **Source**, set selection to **Deploy from a branch**.
3. Choose the branch containing your code (`main`), select folder change from `/root` to `/docs`, and click **Save**.

The dashboard will be updated automatically every morning at 10:30 AM IST, and will instantly reflect live web updates on your public GitHub Pages domain link.



You are a senior Python automation engineer specializing in robust web-scraping pipelines, Playwright, and GitHub Actions.

Objective: Implement a self-sustaining job search and global freelance aggregation agent tailored to the following requirements:
1. Target Profiles: Full Stack Engineer, Data Analyst, ML Engineer, AI Engineer.
2. Target Locations (India full-time): Visakhapatnam, Hyderabad, Bengaluru, Chennai, Pune, Mumbai, Gurgaon.
3. Target Platforms: LinkedIn (via secure username/password login workflow), Naukri.com, and Upwork RSS/Remote.co for global freelance gigs.
4. Daily Automation: Runs at 05:00 UTC every day via GitHub Actions, tracks state in a local JSON file to prevent duplication, and compiles a single-page responsive HTML dashboard deployed directly to GitHub Pages.

Strict Engineering Constraints:
- Use Playwright (Python) with realistic human-like delays and user-agent string rotations to mitigate anti-scraping flags.
- Do not hardcode login credentials. Fetch `LINKEDIN_USER` and `LINKEDIN_PASS` via environment variables.
- Maintain a deduplication state dictionary (`jobs_state.json`) containing historical Job IDs.


job-hunter-agent/
│
├── .github/
│   └── workflows/
│       └── job_hunter.yml     # GitHub Actions workflow configuration
│
├── data/
│   ├── fulltime_jobs.json     # Local database for India-based roles
│   └── freelance_jobs.json    # Local database for global freelance roles
│
├── src/
│   ├── __init__.py
│   ├── scraper.py             # Main Playwright scraping orchestration logic
│   └── generate_pages.py      # Script compiling JSON to a static HTML site
│
├── docs/
│   └── index.html             # The auto-generated web UI (GitHub Pages root)
│
├── requirements.txt           # Python application dependencies
└── README.md                  # Setup guidelines & documentation
