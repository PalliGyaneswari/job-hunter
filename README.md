# JobPulse 🚀

> **Personal AI/ML & Full Stack job aggregator dashboard** — built by a final-year CS student targeting AI Engineer, ML Engineer, and Full Stack Developer roles (fresher / 0–1 YOE). Pulls fresh listings every 24 hours from official job APIs, filters them against a target profile, and surfaces only what's new.

This is the single source-of-truth spec for the project. It supersedes two earlier, overlapping READMEs (`JobPulse` and `job-hunter`) — the scraping-based approach (LinkedIn/Naukri via Playwright) has been **dropped** in favor of the official-API approach below: it's more reliable, doesn't risk account bans or ToS violations, and doesn't depend on proxy infrastructure to stay working.

---

## 👤 Target Profile (drives all filtering)

- Final-year B.Tech CS student (graduating 2027), Raghu Engineering College — CGPA 9.15
- Target roles: **AI Engineer, ML Engineer, Full Stack Developer, SE Intern**
- Target locations: Bangalore, Hyderabad, Pune, Chennai, Vijayawada, Visakhapatnam, Dubai, USA, Remote
- Priority companies (surfaced first): Microsoft, Amazon, Google, TCS, Infosys, Wipro, Freshworks, Razorpay
- Experience level: fresher / 0–1 YOE — internships and entry-level/grad roles only
- Production projects to reference: Password K Vault (deployed, Node/React/MySQL/OpenRouter), Skill Synthex (XGBoost/RF/SVM/LogReg, ~99.67% accuracy)

---

## ✨ Features

| Feature | Detail |
|---|---|
| **Multi-source ingestion** | Adzuna, JSearch (RapidAPI), Jooble, Arbeitnow, RemoteOK — all official/ToS-compliant, no scraping |
| **24-hour auto-refresh** | Pipeline runs daily (node-cron in-app, or GitHub Actions as a free/redundant scheduler) and **must surface only newly-seen jobs** on each run |
| **Fuzzy deduplication** | Levenshtein similarity dedup across sources so the same posting from two APIs doesn't show twice |
| **Persistent seen-state** | Every ingested job ID is tracked so re-runs never re-show or lose track of a listing — this is what makes "different jobs every day" actually true instead of just re-fetching the same 15 |
| **Role + location filter** | Matches against the target profile above |
| **Priority + verified badges** | Priority companies surfaced first; gold ✓ badge for known company domains |
| **Stale detection** | ⚠️ flag for listings > 30 days old |
| **Application tracking** | Mark as Applied → persists even if the job later goes inactive |
| **JWT auth** | Single-user login — private dashboard, not public |
| **Ingestion log** | Collapsible table showing each run: source, count fetched, new vs duplicate, timestamp |

---

## �️ Project Structure

```
jobpulse/
├── backend/
│   ├── server.js
│   ├── .env.example
│   ├── package.json
│   └── src/
│       ├── config/
│       │   ├── db.js
│       │   └── auth.js
│       ├── db/
│       │   ├── schema.sql
│       │   ├── migrate.js
│       │   └── seed.js
│       ├── ingestion/
│       │   ├── pipeline.js          # orchestrator — runs every 24h
│       │   ├── normalizer.js        # source → canonical schema
│       │   ├── deduplicator.js      # fuzzy dedup (Levenshtein)
│       │   ├── filters.js           # role/location/priority/verified/stale
│       │   └── sources/
│       │       ├── adzuna.js
│       │       ├── jsearch.js
│       │       ├── jooble.js
│       │       ├── arbeitnow.js
│       │       └── remoteok.js
│       ├── routes/
│       │   ├── auth.js
│       │   ├── jobs.js
│       │   └── applications.js
│       └── scheduler/
│           └── cron.js              # node-cron, daily at 2 AM IST
├── .github/workflows/
│   └── refresh.yml                  # optional: GitHub Actions as a free/redundant 24h trigger
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    ├── package.json
    └── src/
        ├── main.jsx
        ├── index.css                # vault ledger design system
        ├── api/client.js
        ├── contexts/AuthContext.jsx
        ├── hooks/
        │   ├── useJobs.js
        │   └── useApplications.js
        ├── pages/
        │   ├── Login.jsx
        │   └── Dashboard.jsx
        └── components/
            ├── ProtectedRoute.jsx
            ├── StatsBar.jsx
            ├── TabNav.jsx
            ├── FilterBar.jsx
            ├── JobCard.jsx
            ├── Pagination.jsx
            └── IngestionLog.jsx
```

---

## 🛠️ Setup

### Prerequisites
- Node.js 18+
- MySQL 8+ (local or hosted on Railway)
- API keys: Adzuna, JSearch (RapidAPI), Jooble (Arbeitnow + RemoteOK need no key)

### 1. Install
```bash
git clone https://github.com/<your-username>/jobpulse.git
cd jobpulse/backend && npm install
cd ../frontend && npm install
```

### 2. Configure `.env` 
```bash
cd jobpulse/backend
cp .env.example .env
```

| Variable | Where to get it |
|---|---|
| `DB_*` | Local MySQL or Railway credentials |
| `JWT_SECRET` | `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD_HASH` | `node -e "const b=require('bcryptjs');console.log(b.hashSync('YOUR_PASSWORD',12))"` |
| `ADZUNA_APP_ID` / `ADZUNA_APP_KEY` | https://developer.adzuna.com/ |
| `RAPIDAPI_KEY` | https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch |
| `JOOBLE_API_KEY` | Email api@jooble.org |

### 3. Database
```bash
node src/db/migrate.js
node src/db/seed.js   # 15 demo jobs so the dashboard isn't empty on first run
```

### 4. Run
```bash
# Terminal 1
cd jobpulse/backend && npm run dev     # http://localhost:3001
# Terminal 2
cd jobpulse/frontend && npm run dev    # http://localhost:5173
```

---

## ⏱️ 24-Hour Refresh — Requirements (non-negotiable for this project)

1. `scheduler/cron.js` triggers `ingestion/pipeline.js` every 24h (`0 2 * * *`, IST).
2. `pipeline.js` fetches from all 5 sources → `normalizer.js` → `deduplicator.js` → `filters.js`.
3. The database UNIQUE constraint on (job_id, source) prevents duplicate job IDs from being inserted; already-seen jobs are updated (e.g. stale flag) but not re-flagged as new.
4. Only genuinely new job IDs are inserted and marked "new" in the dashboard; already-seen jobs are updated (e.g. stale flag) but not re-flagged as new.
5. `IngestionLog.jsx` shows fetched / new / duplicate counts per run so it's verifiable that each cycle actually surfaces different jobs, not a re-fetch of the same set.
6. Optional redundancy: `.github/workflows/refresh.yml` can hit `POST /api/jobs/refresh` on the same schedule as a free backup trigger if the server sleeps (e.g. free-tier Render).

---

## 🌐 Deployment
- **Frontend** → Vercel (`VITE_API_URL` env var pointing at backend)
- **Backend** → Render or Railway
- **MySQL** → Railway

---

## 📄 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Login → JWT |
| `GET` | `/api/auth/me` | Verify token |
| `GET` | `/api/jobs` | Paginated jobs (tab, category, location, search, page, limit) |
| `GET` | `/api/jobs/stats` | Count per tab + breakdown |
| `POST` | `/api/jobs/:id/apply` | Mark applied |
| `DELETE` | `/api/jobs/:id/apply` | Un-apply |
| `POST` | `/api/jobs/refresh` | Trigger pipeline manually |
| `GET` | `/api/applications` | All applied jobs |
| `GET` | `/api/applications/ingestion-log` | Recent ingestion runs |
| `GET` | `/api/health` | Health check |

---

## 📄 License / Compliance Note
Personal use. All job data is fetched via official, ToS-compliant APIs (Adzuna, JSearch, Jooble, Arbeitnow, RemoteOK). No LinkedIn or Naukri scraping — dropped intentionally to avoid account-ban risk and to avoid depending on proxy/rotation infrastructure to keep working.
