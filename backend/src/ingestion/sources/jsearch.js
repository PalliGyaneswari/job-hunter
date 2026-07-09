/**
 * JSearch API Source Connector (via RapidAPI)
 * Docs: https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch
 * Aggregates LinkedIn, Indeed, Glassdoor, and other job boards.
 * Free tier: 200 req/month
 */

const axios = require('axios');
const { normalizeJSearch } = require('../normalizer');

const BASE_URL = 'https://jsearch.p.rapidapi.com/search';

const QUERIES = [
  { q: 'AI Engineer entry level India',           location: 'India' },
  { q: 'Machine Learning Engineer fresher India', location: 'India' },
  { q: 'Full Stack Developer junior India',       location: 'India' },
  { q: 'Software Engineer intern India',          location: 'India' },
  { q: 'React Node.js Developer India',           location: 'India' },
  { q: 'AI Engineer remote',                      location: '' },
  { q: 'Machine Learning Engineer remote',        location: '' },
  { q: 'Full Stack Developer remote entry level', location: '' },
];

async function fetchJSearchQuery(query) {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    console.warn('[JSearch] Missing RAPIDAPI_KEY — skipping');
    return [];
  }

  try {
    const resp = await axios.get(BASE_URL, {
      headers: {
        'X-RapidAPI-Key':  apiKey,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
      },
      params: {
        query:    query.q,
        page:     '1',
        num_pages:'1',
        date_posted: 'month',  // last 30 days
        remote_jobs_only: query.location === '' ? 'true' : 'false',
      },
      timeout: 20000,
    });

    return (resp.data?.data || []).map(normalizeJSearch);
  } catch (err) {
    const status = err.response?.status;
    if (status === 429) {
      console.warn('[JSearch] Rate limit hit — pausing 5s');
      await new Promise(r => setTimeout(r, 5000));
    } else {
      console.error(`[JSearch] Error for "${query.q}": ${status || err.message}`);
    }
    return [];
  }
}

/**
 * Main JSearch ingestion function.
 * @returns {Promise<Object[]>} Normalized job objects
 */
async function fetchJSearch() {
  console.log('[JSearch] Starting ingestion...');
  const all = [];

  for (const query of QUERIES) {
    const jobs = await fetchJSearchQuery(query);
    all.push(...jobs);
    await new Promise(r => setTimeout(r, 800));
  }

  console.log(`[JSearch] Fetched ${all.length} raw jobs`);
  return all;
}

module.exports = { fetchJSearch };
