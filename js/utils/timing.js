// ─────────────────────────────────────────────────────────────────────────────
// utils/timing.js
//
// Tiny timing helpers used in transitions, audio fades, and debouncing.
// Keeping these here means you never write the same setTimeout pattern twice.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns a promise that resolves after `ms` milliseconds.
 * Lets you write `await wait(800)` instead of nested setTimeout callbacks.
 *
 * @param {number} ms
 * @returns {Promise<void>}
 */
export function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Returns a debounced version of `fn` — calling it repeatedly only
 * fires the real function after `delay` ms of silence.
 * Used by the search input to avoid firing on every keystroke.
 *
 * @param {Function} fn
 * @param {number} delay  ms
 * @returns {Function}
 */
export function debounce(fn, delay) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Linearly interpolates a numeric value toward a target each frame.
 * Used for smooth camera zoom.
 *
 * @param {number} current
 * @param {number} target
 * @param {number} factor  0–1; higher = snappier
 * @returns {number}
 */
export function lerp(current, target, factor) {
  return current + (target - current) * factor;
}

/**
 * Cubic ease-out: fast start, slow finish.
 * Used in fly-to animations for a cinematic feel.
 *
 * @param {number} t  progress 0–1
 * @returns {number}  eased value 0–1
 */
export function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}
