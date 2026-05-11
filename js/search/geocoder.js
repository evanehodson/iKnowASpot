// ─────────────────────────────────────────────────────────────────────────────
// search/geocoder.js
//
// Wraps the Nominatim geocoding API (OpenStreetMap).
//
// WHY SEPARATE:
// If you ever switch geocoders (Google Places, Mapbox Geocoding, etc.)
// this is the only file that changes. The search UI just calls geocode()
// and gets back a { lat, lng, name } object — it doesn't care where it came from.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Geocodes a free-text query using Nominatim.
 * Returns the best result, or null if nothing was found or the request failed.
 *
 * @param {string} query
 * @returns {Promise<{ lat: number, lng: number, name: string } | null>}
 */
export async function geocode(query) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=0`;
    const res  = await fetch(url, {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'iKnowASpot/1.0',
      },
    });
    const data = await res.json();
    if (!data || !data.length) return null;
    return {
      lat:  parseFloat(data[0].lat),
      lng:  parseFloat(data[0].lon),
      name: data[0].display_name.split(',')[0],
    };
  } catch (err) {
    console.warn('[geocoder] Nominatim request failed:', err);
    return null;
  }
}
