// ─────────────────────────────────────────────────────────────────────────────
// core/transitions.js
//
// All fade-to-black / fade-from-black logic lives here.
//
// WHY SEPARATE:
// In the original code, fadeToBlack() and fadeFromBlack() were defined at the
// bottom of the file but called from enterSpot(), returnToGlobe(), and the
// scene reveal. Separating them means transitions can evolve independently —
// e.g. adding a slow shimmer or a colour-wash — without touching nav logic.
// ─────────────────────────────────────────────────────────────────────────────

import { $transition } from './dom.js';
import { TRANSITION_DURATION_MS } from './constants.js';
import { wait } from '../utils/timing.js';

/**
 * Fades the screen to black, then calls the callback.
 * Returns a promise so callers can also `await fadeToBlack()` if preferred.
 *
 * @param {Function} [cb]  - optional callback fired after the fade completes
 * @returns {Promise<void>}
 */
export async function fadeToBlack(cb) {
  $transition.classList.add('visible');
  await wait(TRANSITION_DURATION_MS);
  if (cb) cb();
}

/**
 * Fades the screen back in from black.
 * The small delay before removing 'visible' gives the browser a frame
 * to paint whatever is now underneath before revealing it.
 *
 * @returns {Promise<void>}
 */
export async function fadeFromBlack() {
  await wait(60);
  $transition.classList.remove('visible');
}
