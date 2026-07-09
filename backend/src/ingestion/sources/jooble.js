/**
 * Jooble API Source Connector
 * Docs: https://jooble.org/api/about
 * Free access — requires API key (email request to api@jooble.org)
 */

const axios = require('axios');
const { normalizeJooble } = require('../normalizer');

const BASE_URL = 'https://jooble.org/api';

const SEARCHES = [
  { keywords: 'AI Engineer',               location: 'India' },
  { keywords: 'Machine Learning Engineer', location: 'India' },
  { keywords: 'Full Stack Developer',      location: 'Bangalore' },
  { keywords: 'Full Stack Developer',      location: 'Hyderabad' },
  { keywords: 'Software Engineer intern',  location: 'India' },
  { keywords: 'React Node.js developer',   location: 'India' },
  { keywords: 'AI Engineer remote',        location: '' },
  { keywords: 'ML Engineer remote',        location: '' },
];

async function fetchJoobleSearch(search) {
  const apiKey = process.env.JOOBLE_API_KEY;
  if (!apiKey) {
    console.warn('[Jooble] Missing JOOBLE_API_KEY — skipping');
    return [];
  }

  try {
    const resp = await axios.post(
      `${BASE_URL}/${apiKey}`,
      {
        keywords:      search.keywords,
        location:      search.location || '',
        resultsOnPage: 50,
        // Filter fresher/junior roles
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      }
    );

    return (resp.data?.jobs || []).map(normalizeJooble);
  } catch (err) {
    console.error(`[Jooble] Error for "${search.keywords}": ${err.response?.status || err.message}`);
    return [];
  }
}

/**
 * Main Jooble ingestion function.
 * @returns {Promise<Object[]>} Normalized job objects
 */
async function fetchJooble() {
  console.log('[Jooble] Starting ingestion...');
  const all = [];

  for (const search of SEARCHES) {
    const jobs = await fetchJoobleSearch(search);
    all.push(...jobs);
    await new Promise(r => setTimeout(r, 600));
  }

  console.log(`[Jooble] Fetched ${all.length} raw jobs`);
  return all;
}

module.exports = { fetchJooble };
