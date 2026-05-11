// ─────────────────────────────────────────────────────────────────────────────
// events.js
//
// A tiny event emitter (pub/sub) so modules can communicate without
// directly importing each other.
//
// WHY THIS EXISTS:
// Without this, you get "import loops" — module A imports module B which
// imports module A, causing errors. You also get tight coupling: the globe
// module shouldn't need to know search exists just to filter markers.
//
// WITH THIS:
// The search module emits 'search:results' with matching indices.
// The globe module listens for 'search:results' and filters markers.
// Neither module imports the other. They just both import `events`.
//
// USAGE:
//   import { on, emit } from '../core/events.js';
//
//   // In globe.js — listen for an event
//   on('search:results', (indices) => filterMarkers(indices));
//
//   // In search.js — fire an event
//   emit('search:results', matchingIndices);
//
// AVAILABLE EVENTS (document new ones here as you add them):
//   'app:ready'           — spots loaded + drone playing, loading screen hides
//   'spot:enter'          — user has clicked a spot; payload: spotIndex (number)
//   'spot:exit'           — user returned to globe
//   'drone:playing'       — drone audio entered PLAYING state
//   'search:results'      — fuzzy search ran; payload: Set of matching indices
//   'search:cleared'      — search was reset; all markers should show
//   'scene:revealed'      — spot video is playing and transition is done
// ─────────────────────────────────────────────────────────────────────────────

// Internal registry: eventName → array of listener functions
const _listeners = {};

/**
 * Subscribe to an event.
 * @param {string} event
 * @param {Function} fn  - called with whatever payload emit() passes
 * @returns {Function}   - call this to unsubscribe (useful for cleanup)
 */
export function on(event, fn) {
  if (!_listeners[event]) _listeners[event] = [];
  _listeners[event].push(fn);
  return () => off(event, fn);
}

/**
 * Unsubscribe a specific listener.
 * @param {string} event
 * @param {Function} fn
 */
export function off(event, fn) {
  if (!_listeners[event]) return;
  _listeners[event] = _listeners[event].filter(l => l !== fn);
}

/**
 * Fire an event, calling all current listeners.
 * @param {string} event
 * @param {*} payload  - anything you want to pass to listeners
 */
export function emit(event, payload) {
  if (!_listeners[event]) return;
  // Shallow copy so listeners added during emit don't run this cycle
  [..._listeners[event]].forEach(fn => fn(payload));
}
