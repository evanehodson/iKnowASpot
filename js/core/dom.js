// ─────────────────────────────────────────────────────────────────────────────
// dom.js
//
// Every document.getElementById() call in one place.
//
// WHY THIS EXISTS:
// In the original file, element lookups were scattered across the entire
// script. If you renamed an HTML id, you had to grep the whole file.
// Now there's one place to update, and every module imports from here.
//
// USAGE:
//   import { $loading, $sceneView } from '../core/dom.js';
//   $loading.classList.add('hidden');
// ─────────────────────────────────────────────────────────────────────────────

// ── Loading screen ────────────────────────────────────────────────────────────
export const $loading      = document.getElementById('loading');
export const $loadingLabel = document.getElementById('loading-label');
export const $errorMsg     = document.getElementById('error-msg');
export const $btnEnter = document.getElementById('btn-enter');
export const $loadDots = document.getElementById('load-dots');

// ── Feedback ──────────────────────────────────────────────────────────────────
export const $feedbackTrigger = document.getElementById('feedback-trigger');
export const $feedbackModal   = document.getElementById('feedback-modal');
export const $feedbackClose   = document.getElementById('feedback-modal-close');
export const $feedbackInput   = document.getElementById('feedback-input');
export const $feedbackSubmit  = document.getElementById('feedback-submit');
export const $feedbackStatus  = document.getElementById('feedback-status');

// ── Globe canvas ──────────────────────────────────────────────────────────────
export const $canvas       = document.getElementById('globe-canvas');

// ── Overlay / transitions ─────────────────────────────────────────────────────
export const $transition   = document.getElementById('transition');
export const $traveling    = document.getElementById('traveling');
export const $travelingTip = document.getElementById('traveling-tip');

// ── Scene view ────────────────────────────────────────────────────────────────
export const $sceneView    = document.getElementById('scene-view');
export const $sceneHud     = document.getElementById('scene-hud');
export const $btnBack      = document.getElementById('btn-back');
export const $btnOpen      = document.getElementById('btn-open');

// ── Globe UI ──────────────────────────────────────────────────────────────────
export const $siteHeader   = document.getElementById('site-header');
export const $shuffleBtn   = document.getElementById('shuffle-btn');
export const $tooltip      = document.getElementById('spot-tooltip');

// ── Search ────────────────────────────────────────────────────────────────────
export const $searchWrap    = document.getElementById('search-wrap');
export const $searchToggle  = document.getElementById('search-toggle');
export const $searchPanel   = document.getElementById('search-panel');
export const $searchInput   = document.getElementById('search-input');
export const $searchClear   = document.getElementById('search-clear');
export const $searchResults = document.getElementById('search-results');
