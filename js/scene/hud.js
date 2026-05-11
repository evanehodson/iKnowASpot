// ─────────────────────────────────────────────────────────────────────────────
// scene/hud.js
//
// Controls the scene HUD (back button, YouTube link button).
// Handles the idle timer that hides the HUD after inactivity.
// ─────────────────────────────────────────────────────────────────────────────

import { state } from '../core/state.js';
import { $sceneHud } from '../core/dom.js';
import { IDLE_TIMEOUT_MS } from '../core/constants.js';

function onActivity() { resetIdleTimer(); }

/**
 * Shows the HUD and resets the idle countdown.
 */
export function resetIdleTimer() {
  $sceneHud.classList.remove('hidden');
  clearTimeout(state.idleTimer);
  state.idleTimer = setTimeout(() => $sceneHud.classList.add('hidden'), IDLE_TIMEOUT_MS);
}

/**
 * Attaches activity listeners and shows the HUD.
 * Call when a scene is fully revealed.
 */
export function startHud() {
  $sceneHud.classList.remove('hidden');
  document.addEventListener('mousemove',  onActivity);
  document.addEventListener('touchstart', onActivity);
  resetIdleTimer();
}

/**
 * Hides the HUD and removes activity listeners.
 * Call when leaving a scene.
 */
export function stopHud() {
  $sceneHud.classList.add('hidden');
  clearTimeout(state.idleTimer);
  document.removeEventListener('mousemove',  onActivity);
  document.removeEventListener('touchstart', onActivity);
}
