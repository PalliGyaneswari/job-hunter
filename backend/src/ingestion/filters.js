/**
 * Ingestion Filters
 * - Role classification (maps job title → role_category)
 * - Location whitelist (excludes jobs outside allowed locations)
 * - Priority company flagging
 * - Verified company badge logic
 * - Stale detection (> 30 days old)
 */

// ─── Role Classification ──────────────────────────────────────────────────────

const ROLE_PATTERNS = [
  {
    category: 'AI Engineer',
    keywords: ['ai engineer', 'artificial intelligence engineer', 'ai developer',
               'ai/ml engineer', 'genai', 'gen ai', 'llm engineer', 'nlp engineer',
               'computer vision engineer', 'deep learning engineer'],
  },
  {
    category: 'ML Engineer',
    keywords: ['ml engineer', 'machine learning engineer', 'machine learning developer',
               'data scientist', 'data science', 'ml developer', 'mlops engineer',
               'applied scientist', 'research engineer'],
  },
  {
    category: 'Full Stack Developer',
    keywords: ['full stack', 'fullstack', 'full-stack', 'mern', 'mean stack',
               'react developer', 'node developer', 'frontend developer',
               'frontend engineer', 'backend developer', 'backend engineer',
               'web developer', 'web engineer'],
  },
  {
    category: 'Software Engineer Intern',
    keywords: ['software engineer intern', 'software engineering intern',
               'sde intern', 'sde-intern', 'engineering intern', 'intern',
               'internship', 'trainee engineer', 'graduate trainee'],
  },
  {
    category: 'Software Engineer',
    keywords: ['software engineer', 'software developer', 'sde', 'sde-1', 'sde1',
               'application developer', 'systems engineer', 'platform engineer',
               'cloud engineer', 'devops engineer'],
  },
];

/**
 * Classify a job's role category from its title and description.
 * Returns the matched ENUM category or 'Other'.
 */
function classifyRole(title, description = '') {
  const haystack = `${title} ${description}`.toLowerCase();
  for (const { category, keywords } of ROLE_PATTERNS) {
    if (keywords.some(kw => haystack.includes(kw))) {
      return category;
    }
  }
  return 'Other';
}

// ─── Location Whitelist ───────────────────────────────────────────────────────

const ALLOWED_LOCATIONS = [
  'bangalore', 'bengaluru', 'blr',
  'hyderabad', 'hyd',
  'pune',
  'chennai',
  'vijayawada',
  'visakhapatnam', 'vizag',
  'dubai', 'uae', 'united arab emirates',
  'united states', 'usa', 'us',
  'remote', 'work from home', 'wfh', 'anywhere',
];

/**
 * Returns true if the location string matches the whitelist.
 * Case-insensitive substring matching.
 */
function isLocationAllowed(location) {
  if (!location) return false;
  const loc = location.toLowerCase();
  return ALLOWED_LOCATIONS.some(allowed => loc.includes(allowed));
}

// ─── Priority Companies ───────────────────────────────────────────────────────

const PRIORITY_COMPANIES = [
  'microsoft', 'amazon', 'google', 'tcs', 'tata consultancy',
  'infosys', 'wipro', 'freshworks', 'razorpay',
];

/**
 * Returns true if the company is in the priority list.
 */
function isPriorityCompany(company) {
  const co = (company || '').toLowerCase();
  return PRIORITY_COMPANIES.some(p => co.includes(p));
}

// ─── Verified Company Domains ─────────────────────────────────────────────────

const VERIFIED_COMPANY_DOMAINS = {
  'microsoft':    'microsoft.com',
  'amazon':       'amazon.com',
  'google':       'google.com',
  'tcs':          'tcs.com',
  'infosys':      'infosys.com',
  'wipro':        'wipro.com',
  'freshworks':   'freshworks.com',
  'razorpay':     'razorpay.com',
  'meta':         'meta.com',
  'apple':        'apple.com',
  'netflix':      'netflix.com',
  'uber':         'uber.com',
  'flipkart':     'flipkart.com',
  'paytm':        'paytm.com',
  'zomato':       'zomato.com',
  'swiggy':       'swiggy.com',
  'atlassian':    'atlassian.com',
};

/**
 * Returns true if the job URL or company name matches a known verified domain.
 */
function isVerifiedCompany(company, url) {
  const co = (company || '').toLowerCase();
  const jobUrl = (url || '').toLowerCase();

  for (const [name, domain] of Object.entries(VERIFIED_COMPANY_DOMAINS)) {
    if (co.includes(name) || jobUrl.includes(domain)) return true;
  }
  return false;
}

// ─── Stale Check ─────────────────────────────────────────────────────────────

const STALE_DAYS = 30;

/**
 * Returns true if the job's posted_date is older than STALE_DAYS.
 */
function isStale(postedDate) {
  if (!postedDate) return false;
  const posted = new Date(postedDate);
  const diffMs  = Date.now() - posted.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays > STALE_DAYS;
}

// ─── Main Filter Pipeline ─────────────────────────────────────────────────────

/**
 * Apply all filters to a normalized job object.
 * Returns { pass: boolean, job: enrichedJob }
 */
function applyFilters(job) {
  // 1. Role must not be 'Other'
  if (job.role_category === 'Other') {
    return { pass: false, job };
  }

  // 2. Location must be whitelisted
  if (!isLocationAllowed(job.location)) {
    return { pass: false, job };
  }

  // 3. Enrich with derived flags
  const enriched = {
    ...job,
    is_priority: isPriorityCompany(job.company) ? 1 : 0,
    is_verified: isVerifiedCompany(job.company, job.url) ? 1 : 0,
    is_stale:    isStale(job.posted_date) ? 1 : 0,
    is_active:   1,
  };

  return { pass: true, job: enriched };
}

module.exports = {
  classifyRole,
  isLocationAllowed,
  isPriorityCompany,
  isVerifiedCompany,
  isStale,
  applyFilters,
  PRIORITY_COMPANIES,
  ALLOWED_LOCATIONS,
};
