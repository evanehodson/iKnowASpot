// ─────────────────────────────────────────────────────────────────────────────
// constants.js
// ─────────────────────────────────────────────────────────────────────────────

// Globe camera distance limits (how far you can zoom in/out)
export const CAM_MIN = 2;
export const CAM_MAX = 4.5;
export const CAM_DEFAULT = 2.8;

// How fast the globe auto-rotates when idle (radians per frame)
export const AUTO_ROTATE_SPEED = 0.0001;

// Globe sphere radius in Three.js units (don't change this)
export const GLOBE_RADIUS = 1.0;

// How long to wait (ms) for a spot video to start before retrying
export const TRAVEL_TIMEOUT_MS = 5000;

// How long (ms) of no mouse movement before the HUD fades out in a scene
export const IDLE_TIMEOUT_MS = 3000;

// Duration (ms) of the fade-to-black transition overlay
export const TRANSITION_DURATION_MS = 850;

// How long (ms) the "traveling" tip screen shows before the scene reveals
export const TRAVEL_TIP_DELAY_MS = 3000;

// Shown on the loading screen while spots + drone audio initialise
export const LOADING_MESSAGES = [
  'The cherry blossoms are peaking somewhere in Japan right now',
  "Yosemite's waterfalls are roaring with snowmelt this time of year",
  'English woodland floors are carpeted in bluebells right now',
];
