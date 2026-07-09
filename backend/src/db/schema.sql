-- ═══════════════════════════════════════════════════════════════════════════
-- JobPulse Database Schema
-- Run: mysql -u root -p < src/db/schema.sql
-- ═══════════════════════════════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS jobpulse_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE jobpulse_db;

-- ─── Jobs Table ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS jobs (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  job_id          VARCHAR(255) NOT NULL,          -- source-specific unique ID
  title           VARCHAR(512) NOT NULL,
  company         VARCHAR(255) NOT NULL,
  location        VARCHAR(255) NOT NULL,
  role_category   ENUM(
                    'AI Engineer',
                    'ML Engineer',
                    'Full Stack Developer',
                    'Software Engineer',
                    'Software Engineer Intern',
                    'Other'
                  ) NOT NULL DEFAULT 'Other',
  source          ENUM(
                    'adzuna',
                    'jsearch',
                    'jooble',
                    'arbeitnow',
                    'remoteok',
                    'seed'
                  ) NOT NULL,
  url             TEXT NOT NULL,
  posted_date     DATE,
  description_snippet TEXT,
  is_active       TINYINT(1) NOT NULL DEFAULT 1,
  is_priority     TINYINT(1) NOT NULL DEFAULT 0,  -- Microsoft, Amazon, Google, etc.
  is_verified     TINYINT(1) NOT NULL DEFAULT 0,  -- domain-verified company
  is_stale        TINYINT(1) NOT NULL DEFAULT 0,  -- posted > 30 days ago
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uq_job_source (job_id, source),
  INDEX idx_is_active   (is_active),
  INDEX idx_is_priority (is_priority),
  INDEX idx_role_category (role_category),
  INDEX idx_posted_date  (posted_date),
  INDEX idx_company      (company),
  FULLTEXT idx_search    (title, company, description_snippet)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Applications Table ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS applications (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  job_id          INT UNSIGNED NOT NULL,          -- FK → jobs.id
  applied_date    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes           TEXT,
  closed_by_employer TINYINT(1) NOT NULL DEFAULT 0,

  UNIQUE KEY uq_application (job_id),
  FOREIGN KEY fk_app_job (job_id) REFERENCES jobs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Ingestion Log Table ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ingestion_log (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  run_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  source          VARCHAR(64) NOT NULL,
  jobs_fetched    INT NOT NULL DEFAULT 0,
  jobs_new        INT NOT NULL DEFAULT 0,
  jobs_updated    INT NOT NULL DEFAULT 0,
  jobs_filtered   INT NOT NULL DEFAULT 0,
  error_message   TEXT,
  duration_ms     INT,

  INDEX idx_run_at (run_at),
  INDEX idx_source (source)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
