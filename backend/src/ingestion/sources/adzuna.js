/**
 * Adzuna API Source Connector
 * Docs: https://developer.adzuna.com/
 * Free tier: 250 req/month, results per page up to 50
 */

const axios = require('axios');
const { normalizeAdzuna } = require('../normalizer');

const BASE_URL = 'https://api.adzuna.com/v1/api/jobs';

// India search locations (Adzuna uses "india" as country code)
const SEARCH_LOCATIONS = [
  'bangalore', 'hyderabad', 'pune', 'chennai', 'vijayawada', 'visakhapatnam',
];

// Role queries to search
const ROLE_QUERIES = [
  'AI Engineer',
  'Machine Learning Engineer',
  'Full Stack Developer',
  'Software Engineer fresher',
  'React Node.js Developer',
];

/**
 * Fetch jobs from Adzuna for a given role + location.
 */
async function fetchAdzunaPage(role, location, page = 1) {
  const appId  = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;

  if (!appId || !appKey) {
    console.warn('[Adzuna] Missing ADZUNA_APP_ID or ADZUNA_APP_KEY — skipping');
    return [];
  }

  try {
    const resp = await axios.get(`${BASE_URL}/in/${page}`, {
      params: {
        app_id:    appId,
        app_key:   appKey,
        what:      role,
        where:     location,
        results_per_page: 50,
        content_type: 'application/json',
        'what_and': 'junior OR fresher OR entry OR intern OR "0-1 years" OR "new grad"',
      },
      timeout: 15000,
    });

    return (resp.data?.results || []).map(normalizeAdzuna);
  } catch (err) {
    const status = err.response?.status;
    console.error(`[Adzuna] Error fetching "${role}" in "${location}" (page ${page}): ${status || err.message}`);
    return [];
  }
}

/**
 * Main Adzuna ingestion function — fetches all role × location combinations.
 * @returns {Promise<Object[]>} Normalized job objects
 */
async function fetchAdzuna() {
  console.log('[Adzuna] Starting ingestion...');
  const all = [];

  for (const role of ROLE_QUERIES) {
    for (const location of SEARCH_LOCATIONS) {
      const jobs = await fetchAdzunaPage(role, location);
      all.push(...jobs);
      // Polite delay between requests
      await new Promise(r => setTimeout(r, 500));
    }
  }

  // Also fetch remote roles (no location filter)
  for (const role of ['AI Engineer remote', 'Machine Learning remote', 'Full Stack remote']) {
    const jobs = await fetchAdzunaPage(role, '');
    all.push(...jobs);
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`[Adzuna] Fetched ${all.length} raw jobs`);
  return all;
}

module.exports = { fetchAdzuna };
