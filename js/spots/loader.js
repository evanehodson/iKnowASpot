// ─────────────────────────────────────────────────────────────────────────────
// spots/loader.js
//
// Responsible for one thing: fetching spots.json and returning clean objects.
//
// WHY SEPARATE:
// When you add new fields to spots.json (biome, season, photographer credit,
// playlist, etc.) this is the only file that needs to change. Every other
// module just uses the spot object as-is.
//
// The `normalise` function is the contract between your data file and your app.
// If spots.json evolves, update normalise() — nothing else breaks.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Takes a raw object from spots.json and returns a clean, typed spot.
 * Provides defaults for every field so missing data never causes crashes.
 *
 * @param {Object} raw  - raw JSON object
 * @returns {Object}    - normalised spot
 */
function normalise(raw) {
  return {
    name:    raw.name    || 'Unnamed Spot',
    lat:     parseFloat(raw.lat)  || 0,
    lng:     parseFloat(raw.lng)  || 0,
    videoId: raw.videoId || '',
    url:     `https://www.youtube.com/watch?v=${raw.videoId || ''}`,
    tags:    Array.isArray(raw.tags)    ? raw.tags    : [],
    tips:    Array.isArray(raw.tips)    ? raw.tips    : [],
    country: raw.country || '',
    region:  raw.region  || '',
    aliases: Array.isArray(raw.aliases) ? raw.aliases : [],
  };
}

/**
 * Fetches and parses spots.json.
 * Throws a descriptive error if the fetch fails or the file is empty.
 *
 * @returns {Promise<Object[]>}  array of normalised spot objects
 */
export async function loadSpots() {
  const res = await fetch('./data/spots.json');
  if (!res.ok) throw new Error(`Could not load spots.json (HTTP ${res.status})`);

  const raw = await res.json();
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error('spots.json is empty or not an array');
  }

  return raw.map(normalise);
}
