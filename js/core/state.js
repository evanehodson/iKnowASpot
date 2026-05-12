// ─────────────────────────────────────────────────────────────────────────────
// state.js
//
// The single source of truth for all mutable runtime state.
//
// WHY THIS EXISTS:
// In the original file, state was scattered across ~30 global variables.
// Any function anywhere could silently mutate any of them. Bugs were
// hard to trace because there was no single place to look.
//
// NOW:
// All state lives in one exported object. You import `state` in any module
// and read or write `state.currentSpotIndex`, `state.dronePlaying`, etc.
// You always know where to look, and you can log the whole object at once.
//
// USAGE:
//   import { state } from '../core/state.js';
//   state.currentSpotIndex = 2;
//   console.log(state); // see everything at once
// ─────────────────────────────────────────────────────────────────────────────

export const state = {
  isAppStarted: false,

  // ── Data ─────────────────────────────────────────────────────────────────
  spots: [],            // Loaded from spots.json — array of spot objects
  spotsLoaded: false,   // True once spots.json has been fetched and parsed

  // ── YouTube / Audio ───────────────────────────────────────────────────────
  ytApiReady: false,    // True once window.onYouTubeIframeAPIReady fires
  dronePlayer: null,    // YT.Player instance for ambient globe audio
  scenePlayer: null,    // YT.Player instance for the active spot video
  droneReady: false,    // True once dronePlayer.onReady fires
  droneVolume: 100,     // Current drone volume (0–100)
  dronePlaying: false,  // True once drone enters PLAYING state
  droneRetryCount: 0,   // How many times we've retried drone init

  // ── Navigation ───────────────────────────────────────────────────────────
  currentSpotIndex: -1,     // Index into state.spots; -1 = globe view
  currentSpotUrl: '',       // Full YouTube URL for the active spot
  travelRetryCount: 0,      // How many times we've retried spot video load

  // ── Globe / Three.js ─────────────────────────────────────────────────────
  rotationY: 0,         // Current Y rotation of the globe (radians)
  rotationX: 0,         // Current X rotation (tilt) of the globe (radians)
  cameraZ: 2.8,         // Current camera Z distance
  isDragging: false,    // True while the user is click-dragging the globe
  isFlying: false,      // True during a programmatic fly-to animation
  globePaused: false,   // True when the scene view is active (stops render loop)
  globeAutoRotate: true,// False during fly animations and active search
  hoveredSpot: null,    // The spotMesh object currently under the cursor

  // ── Search ───────────────────────────────────────────────────────────────
  searchOpen: false,        // True when the search panel is expanded
  activeSearchQuery: '',    // The query string currently being resolved

  // ── Timers (stored so they can be cleared from any module) ───────────────
  idleTimer: null,          // setTimeout handle for HUD auto-hide
  travelTimeoutTimer: null, // setTimeout handle for spot video load timeout
  searchDebounceTimer: null,// setTimeout handle for search debounce
};
