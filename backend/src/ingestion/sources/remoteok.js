/**
 * RemoteOK API Source Connector
 * Docs: https://remoteok.com/api
 * Fully public JSON endpoint — no API key required.
 * First element is metadata, skip it.
 */

const axios = require('axios');
const { normalizeRemoteOK } = require('../normalizer');

const BASE_URL = 'https://remoteok.com/api';

const RELEVANT_TAGS = [
  'software engineer', 'machine learning', 'artificial intelligence',
  'ai', 'ml', 'full stack', 'fullstack', 'react', 'node', 'python',
  'data science', 'nlp', 'deep learning', 'backend', 'frontend',
];

/**
 * Main RemoteOK ingestion function.
 * @returns {Promise<Object[]>} Normalized job objects
 */
async function fetchRemoteOK() {
  console.log('[RemoteOK] Starting ingestion...');

  try {
    const resp = await axios.get(BASE_URL, {
      headers: {
        'User-Agent': 'JobPulse Personal Dashboard (github.com/user/job-hunter)',
      },
      timeout: 20000,
    });

    // First element is metadata legal notice — skip it
    const jobs = (resp.data || []).slice(1);

    const relevant = jobs.filter(job => {
      const tags = (job.tags || []).map(t => (t || '').toLowerCase());
      const position = (job.position || job.title || '').toLowerCase();
      return (
        RELEVANT_TAGS.some(t => tags.some(tag => tag.includes(t))) ||
        RELEVANT_TAGS.some(t => position.includes(t))
      );
    });

    const normalized = relevant.map(normalizeRemoteOK);
    console.log(`[RemoteOK] Fetched ${normalized.length} relevant jobs from ${jobs.length} total`);
    return normalized;
  } catch (err) {
    console.error(`[RemoteOK] Error: ${err.message}`);
    return [];
  }
}

module.exports = { fetchRemoteOK };
