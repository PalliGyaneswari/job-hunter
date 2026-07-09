/**
 * Deduplicator
 * Prevents duplicate jobs from being inserted when they come from different
 * sources or have slight title/company/location variations.
 *
 * Strategy:
 * 1. Exact match: same job_id + source → skip (handled by DB UNIQUE constraint)
 * 2. Fuzzy match: Levenshtein distance on (title + company) normalized strings
 *    If similarity > DUPLICATE_THRESHOLD → skip as duplicate
 */

/**
 * Levenshtein distance between two strings (O(m*n) classic DP).
 */
function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/**
 * Normalized similarity [0..1]. 1 = identical, 0 = completely different.
 */
function similarity(a, b) {
  if (!a && !b) return 1;
  if (!a || !b) return 0;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

/**
 * Build a dedup key from a normalized job.
 * Lowercased, stripped of punctuation and extra whitespace.
 */
function dedupKey(job) {
  const normalize = str => (str || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
  return `${normalize(job.title)} | ${normalize(job.company)}`;
}

const DUPLICATE_THRESHOLD = 0.85; // similarity must be < this to be considered unique

/**
 * Filter an array of normalized jobs, removing fuzzy duplicates.
 * Preserves the first occurrence of each duplicate group.
 *
 * @param {Object[]} jobs - Array of normalized job objects
 * @returns {Object[]} - Deduplicated array
 */
function deduplicate(jobs) {
  const seen = [];
  const unique = [];

  for (const job of jobs) {
    const key = dedupKey(job);
    const isDuplicate = seen.some(seenKey => similarity(key, seenKey) >= DUPLICATE_THRESHOLD);

    if (!isDuplicate) {
      seen.push(key);
      unique.push(job);
    }
  }

  return unique;
}

module.exports = { deduplicate, similarity, dedupKey, DUPLICATE_THRESHOLD };
