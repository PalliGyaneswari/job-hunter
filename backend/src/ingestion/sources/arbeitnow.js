/**
 * Arbeitnow API Source Connector
 * Docs: https://www.arbeitnow.com/api
 * Fully public — no API key required.
 * Focused on tech roles, many remote-friendly.
 */

const axios = require('axios');
const { normalizeArbeitnow } = require('../normalizer');

const BASE_URL = 'https://www.arbeitnow.com/api/job-board-api';

const RELEVANT_TAGS = [
  'software-engineer', 'machine-learning', 'artificial-intelligence',
  'full-stack', 'frontend', 'backend', 'react', 'node', 'python',
  'data-science', 'nlp', 'deep-learning',
];

/**
 * Fetch one page of Arbeitnow results.
 */
async function fetchArbeitnowPage(page = 1) {
  try {
    const resp = await axios.get(BASE_URL, {
      params: { page },
      timeout: 15000,
    });
    return resp.data?.data || [];
  } catch (err) {
    console.error(`[Arbeitnow] Error fetching page ${page}: ${err.message}`);
    return [];
  }
}

/**
 * Main Arbeitnow ingestion function.
 * Fetches first 3 pages (~150 jobs) and filters by relevant tags.
 * @returns {Promise<Object[]>} Normalized job objects
 */
async function fetchArbeitnow() {
  console.log('[Arbeitnow] Starting ingestion...');
  const all = [];

  for (let page = 1; page <= 3; page++) {
    const raw = await fetchArbeitnowPage(page);
    if (raw.length === 0) break;

    // Filter jobs with relevant tags
    const relevant = raw.filter(job => {
      const tags = (job.tags || []).map(t => t.toLowerCase());
      const title = (job.title || '').toLowerCase();
      return (
        RELEVANT_TAGS.some(t => tags.includes(t)) ||
        RELEVANT_TAGS.some(t => title.includes(t.replace(/-/g, ' ')))
      );
    });

    all.push(...relevant.map(normalizeArbeitnow));
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`[Arbeitnow] Fetched ${all.length} relevant jobs`);
  return all;
}

module.exports = { fetchArbeitnow };
