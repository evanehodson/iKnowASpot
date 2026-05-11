// ─────────────────────────────────────────────────────────────────────────────
// search/fuzzy.js
//
// Scores a text query against a spot's name and tags.
// Pure functions — no DOM, no state, no side effects.
//
// Keeping the scoring logic separate means you can tune it, replace it
// with a library (Fuse.js, uFuzzy), or add biome/ecosystem scoring later
// without touching the UI layer.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Scores a query string against a single target string.
 * Returns 0–100: higher = better match.
 *
 * Strategy (in order of quality):
 *   100 — exact match
 *    90 — target starts with query
 *    75 — target contains query as substring
 *    0–60 — fuzzy character-sequence match
 *
 * @param {string} query
 * @param {string} target
 * @returns {number}
 */
export function fuzzyScore(query, target) {
  query  = query.toLowerCase().trim();
  target = target.toLowerCase();
  if (!query)              return 0;
  if (target === query)    return 100;
  if (target.startsWith(query)) return 90;
  if (target.includes(query))   return 75;

  // Character-sequence fuzzy — how many consecutive query chars appear in order
  let qi    = 0;
  let score = 0;
  for (let i = 0; i < target.length && qi < query.length; i++) {
    if (target[i] === query[qi]) { score++; qi++; }
  }
  return qi === query.length ? Math.round((score / target.length) * 60) : 0;
}

/**
 * Scores a query against a full spot object (name + all tags).
 * Tags are weighted slightly lower than the name.
 *
 * @param {string} query
 * @param {Object} spot   - normalised spot object
 * @returns {number}      - best score across name + tags
 */
export function scoreSpot(query, spot) {
  const scores = [
    fuzzyScore(query, spot.name),
    ...(spot.tags || []).map(t => fuzzyScore(query, t) * 0.85),
  ];
  return Math.max(...scores);
}

/**
 * Filters and ranks a list of spots against a query.
 * Returns up to `limit` results with score > `threshold`.
 *
 * @param {string}   query
 * @param {Object[]} spots      - array of normalised spots
 * @param {number}   [limit]    - max results (default 5)
 * @param {number}   [threshold]- min score to include (default 20)
 * @returns {{ spot: Object, index: number, score: number }[]}
 */
export function rankSpots(query, spots, limit = 5, threshold = 20) {
  return spots
    .map((spot, index) => ({ spot, index, score: scoreSpot(query, spot) }))
    .filter(r => r.score > threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
