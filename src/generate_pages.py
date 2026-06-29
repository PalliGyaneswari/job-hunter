"""
Dashboard Generator — Compiles JSON job data into a responsive HTML dashboard.

Reads fulltime_jobs.json and freelance_jobs.json, then generates a single
self-contained HTML file at docs/index.html with:
  - Dark glassmorphism design
  - Stats bar with job counts
  - Filterable/searchable job cards grid
  - Responsive mobile-first layout
"""

import json
import os
import sys
from datetime import datetime, timezone

# ─── Add project root to path ───────────────────────────────────────────────
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from src.config import (
    FULLTIME_JOBS_FILE,
    FREELANCE_JOBS_FILE,
    DASHBOARD_FILE,
    DOCS_DIR,
)


def load_json(filepath: str) -> list:
    """Load a JSON file, returning an empty list on error."""
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data if isinstance(data, list) else []
    except (FileNotFoundError, json.JSONDecodeError):
        return []


def generate_dashboard():
    """Generate the HTML dashboard from job data files."""
    fulltime_jobs = load_json(FULLTIME_JOBS_FILE)
    freelance_jobs = load_json(FREELANCE_JOBS_FILE)
    all_jobs = fulltime_jobs + freelance_jobs

    # Extract unique values for filters
    platforms = sorted(set(j.get("platform", "unknown") for j in all_jobs)) if all_jobs else []
    locations = sorted(set(j.get("location", "").split(",")[0].strip() for j in all_jobs if j.get("location"))) if all_jobs else []

    # Count stats
    total_jobs = len(all_jobs)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    new_today = sum(1 for j in all_jobs if j.get("posted_date", "") == today or j.get("scraped_at", "").startswith(today))
    active_platforms = len(platforms)
    last_updated = datetime.now(timezone.utc).strftime("%B %d, %Y at %H:%M UTC")

    # Serialize jobs for JS
    jobs_json = json.dumps(all_jobs, ensure_ascii=False)

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Automated daily job aggregator dashboard — full-time roles in India and remote freelance opportunities worldwide.">
    <title>🎯 Job Hunter Dashboard</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        /* ─── CSS Reset & Base ─────────────────────────────────────── */
        *, *::before, *::after {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}

        :root {{
            --bg-primary: #ffffff;
            --bg-secondary: #f8f9fa;
            --bg-card: #ffffff;
            --bg-card-hover: #f0f2f5;
            --bg-glass: rgba(255, 255, 255, 0.95);
            --border-glass: #e1e4e8;
            --border-glass-hover: #0078d4;
            --text-primary: #1f2937;
            --text-secondary: #4b5563;
            --text-muted: #9ca3af;
            --accent-blue: #0078d4;
            --accent-purple: #6b46c1;
            --accent-emerald: #10b981;
            --accent-amber: #f59e0b;
            --accent-rose: #ef4444;
            --gradient-primary: linear-gradient(135deg, #0078d4, #106ebe);
            --gradient-warm: linear-gradient(135deg, #f59e0b, #d97706);
            --shadow-glow: 0 4px 20px rgba(0, 120, 212, 0.15);
            --shadow-card: 0 2px 8px rgba(0, 0, 0, 0.08);
            --shadow-card-hover: 0 8px 24px rgba(0, 120, 212, 0.2);
            --radius-sm: 6px;
            --radius-md: 8px;
            --radius-lg: 12px;
            --radius-xl: 16px;
            --transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }}

        body {{
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: var(--bg-primary);
            color: var(--text-primary);
            min-height: 100vh;
            overflow-x: hidden;
            line-height: 1.6;
        }}

        /* ─── Background Effects ──────────────────────────────────── */
        body::before {{
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%);
            z-index: -1;
        }}

        /* ─── Cursor Highlight Effect ─────────────────────────────── */
        .cursor-highlight {{
            position: fixed;
            width: 300px;
            height: 300px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(0, 120, 212, 0.08) 0%, transparent 70%);
            pointer-events: none;
            transform: translate(-50%, -50%);
            z-index: 0;
            transition: opacity 0.3s ease;
            opacity: 0;
        }}

        .cursor-highlight.active {{
            opacity: 1;
        }}

        /* ─── Container ───────────────────────────────────────────── */
        .container {{
            max-width: 1400px;
            margin: 0 auto;
            padding: 0 24px;
        }}

        /* ─── Header ──────────────────────────────────────────────── */
        .header {{
            padding: 48px 0 32px;
            text-align: center;
            position: relative;
        }}

        .header__badge {{
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 16px;
            background: var(--bg-glass);
            border: 1px solid var(--border-glass);
            border-radius: 100px;
            font-size: 12px;
            font-weight: 500;
            color: var(--accent-emerald);
            text-transform: uppercase;
            letter-spacing: 1.5px;
            margin-bottom: 20px;
            backdrop-filter: blur(10px);
        }}

        .header__badge::before {{
            content: '';
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: var(--accent-emerald);
            animation: pulse 2s ease-in-out infinite;
        }}

        @keyframes pulse {{
            0%, 100% {{ opacity: 1; transform: scale(1); }}
            50% {{ opacity: 0.5; transform: scale(0.8); }}
        }}

        .header h1 {{
            font-size: clamp(28px, 5vw, 48px);
            font-weight: 800;
            background: var(--gradient-primary);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 12px;
            letter-spacing: -0.02em;
        }}

        .header__subtitle {{
            font-size: 16px;
            color: var(--text-secondary);
            font-weight: 400;
            max-width: 600px;
            margin: 0 auto;
        }}

        /* ─── Stats Bar ───────────────────────────────────────────── */
        .stats {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-bottom: 32px;
        }}

        .stat-card {{
            background: var(--bg-card);
            border: 1px solid var(--border-glass);
            border-radius: var(--radius-lg);
            padding: 24px;
            text-align: center;
            transition: var(--transition);
            position: relative;
            overflow: hidden;
            box-shadow: var(--shadow-card);
        }}

        .stat-card::before {{
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: var(--gradient-primary);
            opacity: 0;
            transition: var(--transition);
        }}

        .stat-card:hover {{
            border-color: var(--border-glass-hover);
            transform: translateY(-4px);
            box-shadow: var(--shadow-card-hover);
        }}

        .stat-card:hover::before {{
            opacity: 1;
        }}

        .stat-card__number {{
            font-size: 36px;
            font-weight: 800;
            background: var(--gradient-primary);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }}

        .stat-card__label {{
            font-size: 13px;
            color: var(--text-secondary);
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-top: 4px;
        }}

        /* ─── Controls Bar ────────────────────────────────────────── */
        .controls {{
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            margin-bottom: 32px;
            align-items: center;
        }}

        .search-box {{
            flex: 1;
            min-width: 280px;
            position: relative;
        }}

        .search-box__icon {{
            position: absolute;
            left: 16px;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-muted);
            font-size: 16px;
        }}

        .search-box input {{
            width: 100%;
            padding: 14px 16px 14px 44px;
            background: var(--bg-card);
            border: 1px solid var(--border-glass);
            border-radius: var(--radius-md);
            color: var(--text-primary);
            font-family: inherit;
            font-size: 14px;
            font-weight: 400;
            outline: none;
            transition: var(--transition);
            box-shadow: var(--shadow-card);
        }}

        .search-box input::placeholder {{
            color: var(--text-muted);
        }}

        .search-box input:focus {{
            border-color: var(--accent-blue);
            box-shadow: 0 0 0 3px rgba(0, 120, 212, 0.1);
        }}

        .filter-select {{
            padding: 14px 36px 14px 16px;
            background: var(--bg-card);
            border: 1px solid var(--border-glass);
            border-radius: var(--radius-md);
            color: var(--text-primary);
            font-family: inherit;
            font-size: 14px;
            outline: none;
            cursor: pointer;
            appearance: none;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%234b5563' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 14px center;
            transition: var(--transition);
            min-width: 150px;
            box-shadow: var(--shadow-card);
        }}

        .filter-select option {{
            background: var(--bg-primary);
            color: var(--text-primary);
        }}

        .filter-select:focus {{
            border-color: var(--accent-blue);
            box-shadow: 0 0 0 3px rgba(0, 120, 212, 0.1);
        }}

        /* ─── Job Cards Grid ──────────────────────────────────────── */
        .jobs-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
            gap: 16px;
            margin-bottom: 48px;
        }}

        .job-card {{
            background: var(--bg-card);
            border: 1px solid var(--border-glass);
            border-radius: var(--radius-lg);
            padding: 24px;
            transition: var(--transition);
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            gap: 12px;
            box-shadow: var(--shadow-card);
            cursor: pointer;
        }}

        .job-card:hover {{
            background: var(--bg-card-hover);
            border-color: var(--border-glass-hover);
            transform: translateY(-4px);
            box-shadow: var(--shadow-card-hover);
        }}

        .job-card__header {{
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 12px;
        }}

        .job-card__title {{
            font-size: 16px;
            font-weight: 600;
            color: var(--text-primary);
            line-height: 1.4;
            flex: 1;
        }}

        .job-card__badge {{
            display: inline-flex;
            align-items: center;
            padding: 4px 10px;
            border-radius: 100px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            white-space: nowrap;
            flex-shrink: 0;
        }}

        .badge--linkedin {{
            background: rgba(0, 119, 181, 0.1);
            color: #0077b5;
            border: 1px solid rgba(0, 119, 181, 0.2);
        }}

        .badge--naukri {{
            background: rgba(79, 70, 229, 0.1);
            color: #4f46e5;
            border: 1px solid rgba(79, 70, 229, 0.2);
        }}

        .badge--remotive {{
            background: rgba(16, 185, 129, 0.1);
            color: #10b981;
            border: 1px solid rgba(16, 185, 129, 0.2);
        }}

        .badge--unknown {{
            background: rgba(107, 114, 128, 0.1);
            color: var(--text-secondary);
            border: 1px solid var(--border-glass);
        }}

        .job-card__company {{
            font-size: 14px;
            font-weight: 500;
            color: var(--accent-blue);
        }}

        .job-card__meta {{
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            font-size: 13px;
            color: var(--text-secondary);
        }}

        .job-card__meta-item {{
            display: flex;
            align-items: center;
            gap: 5px;
        }}

        .job-card__actions {{
            margin-top: auto;
            padding-top: 12px;
            border-top: 1px solid var(--border-glass);
        }}

        .job-card__apply {{
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 10px 20px;
            background: var(--gradient-primary);
            color: white;
            text-decoration: none;
            border-radius: var(--radius-sm);
            font-size: 13px;
            font-weight: 600;
            transition: var(--transition);
            width: 100%;
            justify-content: center;
        }}

        .job-card__apply:hover {{
            transform: scale(1.02);
            box-shadow: 0 4px 20px rgba(0, 120, 212, 0.3);
        }}

        /* ─── Empty State ─────────────────────────────────────────── */
        .empty-state {{
            text-align: center;
            padding: 80px 24px;
            color: var(--text-secondary);
        }}

        .empty-state__icon {{
            font-size: 64px;
            margin-bottom: 16px;
            opacity: 0.5;
        }}

        .empty-state__title {{
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 8px;
            color: var(--text-primary);
        }}

        .empty-state__text {{
            font-size: 14px;
            max-width: 400px;
            margin: 0 auto;
        }}

        /* ─── Results Count ───────────────────────────────────────── */
        .results-count {{
            font-size: 13px;
            color: var(--text-muted);
            margin-bottom: 16px;
            font-weight: 500;
        }}

        .results-count strong {{
            color: var(--text-secondary);
        }}

        /* ─── Footer ──────────────────────────────────────────────── */
        .footer {{
            text-align: center;
            padding: 32px 0;
            border-top: 1px solid var(--border-glass);
            margin-top: 48px;
        }}

        .footer__text {{
            font-size: 13px;
            color: var(--text-muted);
        }}

        .footer__text a {{
            color: var(--accent-blue);
            text-decoration: none;
        }}

        /* ─── Animations ──────────────────────────────────────────── */
        @keyframes fadeInUp {{
            from {{
                opacity: 0;
                transform: translateY(20px);
            }}
            to {{
                opacity: 1;
                transform: translateY(0);
            }}
        }}

        .animate-in {{
            animation: fadeInUp 0.5s ease-out forwards;
            opacity: 0;
        }}

        /* ─── Responsive ──────────────────────────────────────────── */
        @media (max-width: 768px) {{
            .container {{
                padding: 0 16px;
            }}

            .header {{
                padding: 32px 0 24px;
            }}

            .stats {{
                grid-template-columns: repeat(2, 1fr);
            }}

            .controls {{
                flex-direction: column;
            }}

            .search-box {{
                min-width: 100%;
            }}

            .filter-select {{
                width: 100%;
            }}

            .jobs-grid {{
                grid-template-columns: 1fr;
            }}
        }}

        @media (max-width: 480px) {{
            .stats {{
                grid-template-columns: 1fr;
            }}
        }}
    </style>
</head>
<body>
    <!-- Cursor Highlight Effect -->
    <div class="cursor-highlight" id="cursor-highlight"></div>
    
    <div class="container">
        <!-- Header -->
        <header class="header animate-in">
            <div class="header__badge">
                <span>Automated Daily Updates</span>
            </div>
            <h1>Job Hunter Dashboard</h1>
            <p class="header__subtitle">
                Full-time roles across India's top tech hubs and remote freelance opportunities worldwide
            </p>
        </header>

        <!-- Stats -->
        <div class="stats animate-in" style="animation-delay: 0.1s">
            <div class="stat-card">
                <div class="stat-card__number" id="stat-total">{total_jobs}</div>
                <div class="stat-card__label">Total Jobs</div>
            </div>
            <div class="stat-card">
                <div class="stat-card__number" id="stat-new">{new_today}</div>
                <div class="stat-card__label">New Today</div>
            </div>
            <div class="stat-card">
                <div class="stat-card__number" id="stat-fulltime">{len(fulltime_jobs)}</div>
                <div class="stat-card__label">Full-time</div>
            </div>
            <div class="stat-card">
                <div class="stat-card__number" id="stat-freelance">{len(freelance_jobs)}</div>
                <div class="stat-card__label">Freelance / Remote</div>
            </div>
        </div>

        <!-- Controls -->
        <div class="controls animate-in" style="animation-delay: 0.2s">
            <div class="search-box">
                <span class="search-box__icon">🔍</span>
                <input type="text" id="search-input" placeholder="Search jobs by title, company, or location..." autocomplete="off">
            </div>
            <select class="filter-select" id="filter-platform">
                <option value="">All Platforms</option>
                {"".join(f'<option value="{p}">{p.title()}</option>' for p in platforms)}
            </select>
            <select class="filter-select" id="filter-type">
                <option value="">All Types</option>
                <option value="fulltime">Full-time</option>
                <option value="freelance">Freelance / Remote</option>
            </select>
        </div>

        <!-- Results Count -->
        <div class="results-count animate-in" style="animation-delay: 0.25s">
            <span id="results-text">Showing <strong>{total_jobs}</strong> jobs</span>
        </div>

        <!-- Jobs Grid -->
        <div class="jobs-grid" id="jobs-grid">
            <!-- Cards rendered by JavaScript -->
        </div>

        <!-- Empty State -->
        <div class="empty-state" id="empty-state" style="display: none;">
            <div class="empty-state__icon">🔍</div>
            <div class="empty-state__title">No jobs found</div>
            <div class="empty-state__text">Try adjusting your search or filters to find what you're looking for.</div>
        </div>

        <!-- Footer -->
        <footer class="footer">
            <p class="footer__text">
                Last updated: {last_updated} · Powered by 
                <a href="https://github.com" target="_blank">GitHub Actions</a>
            </p>
        </footer>
    </div>

    <script>
        // ─── Cursor Highlight Effect ─────────────────────────────────
        const cursorHighlight = document.getElementById('cursor-highlight');
        
        document.addEventListener('mousemove', (e) => {{
            cursorHighlight.style.left = e.clientX + 'px';
            cursorHighlight.style.top = e.clientY + 'px';
            cursorHighlight.classList.add('active');
        }});
        
        document.addEventListener('mouseleave', () => {{
            cursorHighlight.classList.remove('active');
        }});

        // ─── Job Data ─────────────────────────────────────────────────
        const ALL_JOBS = {jobs_json};

        // Track which jobs are fulltime vs freelance
        const FULLTIME_IDS = new Set({json.dumps([j.get("id", "") for j in fulltime_jobs])});
        const FREELANCE_IDS = new Set({json.dumps([j.get("id", "") for j in freelance_jobs])});

        // ─── DOM References ───────────────────────────────────────────
        const grid = document.getElementById('jobs-grid');
        const searchInput = document.getElementById('search-input');
        const platformFilter = document.getElementById('filter-platform');
        const typeFilter = document.getElementById('filter-type');
        const resultsText = document.getElementById('results-text');
        const emptyState = document.getElementById('empty-state');

        // ─── Platform badge class ─────────────────────────────────────
        function badgeClass(platform) {{
            const map = {{ linkedin: 'badge--linkedin', naukri: 'badge--naukri', remotive: 'badge--remotive' }};
            return map[platform] || 'badge--unknown';
        }}

        // ─── Render job cards ─────────────────────────────────────────
        function renderJobs(jobs) {{
            if (jobs.length === 0) {{
                grid.innerHTML = '';
                grid.style.display = 'none';
                emptyState.style.display = 'block';
                resultsText.innerHTML = 'No jobs match your criteria';
                return;
            }}

            grid.style.display = 'grid';
            emptyState.style.display = 'none';
            resultsText.innerHTML = `Showing <strong>${{jobs.length}}</strong> job${{jobs.length !== 1 ? 's' : ''}}`;

            grid.innerHTML = jobs.map((job, i) => `
                <div class="job-card animate-in" style="animation-delay: ${{Math.min(i * 0.05, 0.5)}}s">
                    <div class="job-card__header">
                        <div class="job-card__title">${{escapeHtml(job.title)}}</div>
                        <span class="job-card__badge ${{badgeClass(job.platform)}}">${{job.platform}}</span>
                    </div>
                    <div class="job-card__company">${{escapeHtml(job.company || 'Company not listed')}}</div>
                    <div class="job-card__meta">
                        <span class="job-card__meta-item">📍 ${{escapeHtml(job.location || 'Remote')}}</span>
                        <span class="job-card__meta-item">📅 ${{escapeHtml(job.posted_date || 'N/A')}}</span>
                    </div>
                    <div class="job-card__actions">
                        <a href="${{escapeHtml(job.link)}}" target="_blank" rel="noopener noreferrer" class="job-card__apply">
                            Apply Now →
                        </a>
                    </div>
                </div>
            `).join('');
        }}

        // ─── HTML escape ──────────────────────────────────────────────
        function escapeHtml(str) {{
            if (!str) return '';
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        }}

        // ─── Filter logic ─────────────────────────────────────────────
        function applyFilters() {{
            const query = searchInput.value.toLowerCase().trim();
            const platform = platformFilter.value;
            const type = typeFilter.value;

            let filtered = ALL_JOBS.filter(job => {{
                // Search
                if (query) {{
                    const haystack = [job.title, job.company, job.location].join(' ').toLowerCase();
                    if (!haystack.includes(query)) return false;
                }}

                // Platform
                if (platform && job.platform !== platform) return false;

                // Type
                if (type === 'fulltime' && !FULLTIME_IDS.has(job.id)) return false;
                if (type === 'freelance' && !FREELANCE_IDS.has(job.id)) return false;

                return true;
            }});

            // Sort by date (newest first)
            filtered.sort((a, b) => {{
                const da = a.scraped_at || a.posted_date || '';
                const db = b.scraped_at || b.posted_date || '';
                return db.localeCompare(da);
            }});

            renderJobs(filtered);
        }}

        // ─── Event listeners ──────────────────────────────────────────
        searchInput.addEventListener('input', applyFilters);
        platformFilter.addEventListener('change', applyFilters);
        typeFilter.addEventListener('change', applyFilters);

        // ─── Initial render ───────────────────────────────────────────
        applyFilters();
    </script>
</body>
</html>"""

    # Ensure docs directory exists
    os.makedirs(DOCS_DIR, exist_ok=True)

    # Write dashboard
    with open(DASHBOARD_FILE, "w", encoding="utf-8") as f:
        f.write(html)

    print(f"[OK] Dashboard generated: {DASHBOARD_FILE}")
    print(f"     Total jobs: {total_jobs}")
    print(f"     Full-time: {len(fulltime_jobs)}")
    print(f"     Freelance: {len(freelance_jobs)}")
    print(f"     Last updated: {last_updated}")


if __name__ == "__main__":
    generate_dashboard()
