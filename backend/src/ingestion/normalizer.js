/**
 * Ingestion Normalizer
 * Converts raw API responses from each source into the canonical JobPulse schema:
 * {
 *   job_id, title, company, location, role_category,
 *   source, url, posted_date, description_snippet
 * }
 */

const { classifyRole } = require('./filters');

/**
 * Adzuna raw job → canonical schema
 */
function normalizeAdzuna(raw) {
  return {
    job_id:              String(raw.id),
    title:               (raw.title || '').trim(),
    company:             (raw.company?.display_name || raw.company || 'Unknown').trim(),
    location:            (raw.location?.display_name || raw.location?.area?.join(', ') || '').trim(),
    source:              'adzuna',
    url:                 raw.redirect_url || raw.url || '',
    posted_date:         raw.created ? raw.created.split('T')[0] : null,
    description_snippet: (raw.description || '').substring(0, 500),
    role_category:       classifyRole(raw.title || '', raw.description || ''),
  };
}

/**
 * JSearch (RapidAPI) raw job → canonical schema
 */
function normalizeJSearch(raw) {
  return {
    job_id:              String(raw.job_id || raw.id),
    title:               (raw.job_title || '').trim(),
    company:             (raw.employer_name || '').trim(),
    location:            buildJSearchLocation(raw),
    source:              'jsearch',
    url:                 raw.job_apply_link || raw.job_url || '',
    posted_date:         raw.job_posted_at_datetime_utc
                           ? raw.job_posted_at_datetime_utc.split('T')[0]
                           : null,
    description_snippet: (raw.job_description || '').substring(0, 500),
    role_category:       classifyRole(raw.job_title || '', raw.job_description || ''),
  };
}

function buildJSearchLocation(raw) {
  const parts = [raw.job_city, raw.job_state, raw.job_country].filter(Boolean);
  if (raw.job_is_remote) parts.unshift('Remote');
  return parts.join(', ');
}

/**
 * Jooble raw job → canonical schema
 */
function normalizeJooble(raw) {
  return {
    job_id:              String(raw.id),
    title:               (raw.title || '').trim(),
    company:             (raw.company || '').trim(),
    location:            (raw.location || '').trim(),
    source:              'jooble',
    url:                 raw.link || '',
    posted_date:         raw.updated ? raw.updated.split('T')[0] : null,
    description_snippet: (raw.snippet || raw.description || '').substring(0, 500),
    role_category:       classifyRole(raw.title || '', raw.snippet || ''),
  };
}

/**
 * Arbeitnow raw job → canonical schema
 */
function normalizeArbeitnow(raw) {
  return {
    job_id:              String(raw.slug || raw.id),
    title:               (raw.title || '').trim(),
    company:             (raw.company_name || '').trim(),
    location:            raw.remote ? 'Remote' : (raw.location || '').trim(),
    source:              'arbeitnow',
    url:                 raw.url || `https://www.arbeitnow.com/jobs/${raw.slug}`,
    posted_date:         raw.created_at ? new Date(raw.created_at * 1000).toISOString().split('T')[0] : null,
    description_snippet: (raw.description || '').replace(/<[^>]+>/g, '').substring(0, 500),
    role_category:       classifyRole(raw.title || '', raw.description || ''),
  };
}

/**
 * RemoteOK raw job → canonical schema
 */
function normalizeRemoteOK(raw) {
  return {
    job_id:              String(raw.id),
    title:               (raw.position || raw.title || '').trim(),
    company:             (raw.company || '').trim(),
    location:            'Remote',
    source:              'remoteok',
    url:                 raw.url || `https://remoteok.com/l/${raw.id}`,
    posted_date:         raw.date ? new Date(raw.date).toISOString().split('T')[0] : null,
    description_snippet: (raw.description || '').replace(/<[^>]+>/g, '').substring(0, 500),
    role_category:       classifyRole(raw.position || raw.title || '', raw.description || ''),
  };
}

module.exports = {
  normalizeAdzuna,
  normalizeJSearch,
  normalizeJooble,
  normalizeArbeitnow,
  normalizeRemoteOK,
};
