// ─────────────────────────────────────────────────────────────────────────────
// main.js
//
// The entry point. Boots the app in sequence, then wires events.
//
// This file is intentionally thin — it coordinates modules but contains
// no logic of its own. If you want to understand what the app does at a
// high level, this file is where to look. If you want to change HOW
// something works, you look at the relevant module.
//
// Boot sequence:
//   1. Show loading screen with a seasonal message
//   2. Fetch spots.json → populate state.spots
//   3. Init Three.js globe + markers + interaction
//   4. Init search
//   5. Load drone audio buffer
//   6. Once spots are ready → show Enter button
//
// Event wiring (after boot):
//   'spot:enter'      → clear tooltip → fade to black → show traveling tip → launch video
//   'scene:revealed'  → fade transition away → show HUD
//   'spot:exit'       → destroy player → return to globe
//   'drone:playing'   → check if app is fully ready to show
// ─────────────────────────────────────────────────────────────────────────────

import { state }                    from './core/state.js';
import { on, emit }                 from './core/events.js';
import { fadeToBlack, fadeFromBlack } from './core/transitions.js';
import { LOADING_MESSAGES, CAM_DEFAULT }         from './core/constants.js';
import {
  $loading, $loadingLabel, $errorMsg, $btnEnter, $loadDots,
  $sceneView, $sceneHud, $btnBack, $btnOpen, $tooltip,
  $siteHeader, $shuffleBtn, $searchWrap, $travelingTip, $traveling,
} from './core/dom.js';

import { loadSpots }                from './spots/loader.js';
import { initGlobe, pauseGlobe, resumeGlobe, getCamera } from './globe/globe.js';
import { spotMeshes, showAllMarkers } from './globe/markers.js';
import { flyToSpot, flyToSpotWithTooltip } from './globe/fly.js';
import { initSearch }               from './search/search.js';
import { initDrone, startDronePlayback, fadeDrone, resumeDrone } from './scene/drone.js';
import { launchSpotVideo, destroyScenePlayer } from './scene/player.js';
import { startHud, stopHud }        from './scene/hud.js';
import { logEvent } from './core/analytics.js';

// ── Globe UI helpers ──────────────────────────────────────────────────────────

function showGlobeUI() {
  $siteHeader.classList.remove('hidden');
  $shuffleBtn.classList.remove('hidden');
  $searchWrap.classList.remove('hidden');
}

function hideGlobeUI() {
  $siteHeader.classList.add('hidden');
  $shuffleBtn.classList.add('hidden');
  $searchWrap.classList.add('hidden');
}

// ── App ready check ───────────────────────────────────────────────────────────

function checkAppReady() {
  if (state.spotsLoaded) {
    $loadDots.classList.add('hidden'); // Dots out
    $btnEnter.classList.remove('hidden'); // Button in
  }
}

// ── The Start Action ─────────────────────────────────────────────────────────

// In main.js

async function handleAppStart() {
  // 1. Snap globe to North Gulf of Mexico, clear any drag state
  state.rotationY = 0;  // ~-89° longitude (Gulf of Mexico)
  state.rotationX = 0.35;   // ~20° latitude (northern Gulf)
  state.cameraZ   = CAM_DEFAULT;
  state.isDragging = false;
  state.globeAutoRotate = true;

  // 2. Unlock the globe
  state.isAppStarted = true;
  const $canvas = document.querySelector('#globe-canvas');
  if ($canvas) $canvas.style.pointerEvents = 'all';

  // 3. Kick off audio
  await initDrone();
  startDronePlayback();

  // 4. Fade UI
  $loading.classList.add('hidden');
  showGlobeUI();
}

$btnEnter.addEventListener('click', handleAppStart);

// ── Spot navigation ───────────────────────────────────────────────────────────

function enterSpot(index, log = true) {
  const spot = state.spots[index];
  if (log) logEvent('spot:enter', spot.name, index);
  state.currentSpotIndex = index;
  state.currentSpotUrl   = spot.url;
  state.travelRetryCount = 0;

  state.hoveredSpot = null;
  $tooltip.classList.remove('visible');

  hideGlobeUI();
  fadeDrone(0, 1200);

  setTimeout(() => {
    fadeToBlack(() => {
      pauseGlobe();
      $sceneView.classList.add('active');
      const tips = spot.tips || [];
      $travelingTip.textContent = tips.length
        ? tips[Math.floor(Math.random() * tips.length)]
        : spot.name;
      $traveling.classList.add('visible');
      fadeFromBlack();
      launchSpotVideo(spot);
    });
  }, 350);
}

function exitToGlobe() {
  clearTimeout(state.travelTimeoutTimer);
  fadeToBlack(() => {
    destroyScenePlayer();
    $sceneView.classList.remove('active');
    $traveling.classList.remove('visible');
    stopHud();
    resumeGlobe();
    showAllMarkers();
    showGlobeUI();
    resumeDrone();
    fadeFromBlack();
  });
}

// ── Shuffle ───────────────────────────────────────────────────────────────────

function shuffleToSpot() {
  const visible = spotMeshes.filter(s => s.mesh.visible);
  if (!visible.length) return;
  const target = visible[Math.floor(Math.random() * visible.length)];

  $shuffleBtn.style.pointerEvents = 'none';
  state.globeAutoRotate = false;

  flyToSpotWithTooltip(target, getCamera(), () => {
    $shuffleBtn.style.pointerEvents = 'all';
    enterSpot(target.index, false); // don't log shuffle
  });
}

// ── Event wiring ──────────────────────────────────────────────────────────────

on('spot:enter',     enterSpot);
on('spot:exit',      exitToGlobe);
on('scene:revealed', () => {
  fadeToBlack(() => {
    $traveling.classList.remove('visible');
    fadeFromBlack();
    setTimeout(startHud, 600);
  });
});
on('drone:playing', checkAppReady);

$btnBack.addEventListener('click', exitToGlobe);
$btnOpen.addEventListener('click', () => {
  if (state.currentSpotUrl) window.open(state.currentSpotUrl, '_blank', 'noopener');
});
$shuffleBtn.addEventListener('click', shuffleToSpot);

// ── YouTube API bridge ────────────────────────────────────────────────────────
// Instead of waiting for YT API to start the drone, 
// just start the drone immediately during boot.
window.onYouTubeIframeAPIReady = () => {
  state.ytApiReady = true;
  // Note: We don't call initDrone() here anymore
};

// ── Boot ──────────────────────────────────────────────────────────────────────

async function boot() {
  $loadingLabel.textContent = LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)];

  try {
    state.spots = await loadSpots();
    state.spotsLoaded = true;
    
    initGlobe(state.spots);
    initSearch();
    
    // Start the local drone immediately
    initDrone(); 
    
    checkAppReady();
  } catch (err) {
    console.error('[iKnowASpot] Boot failed:', err);
    $loadingLabel.textContent       = 'something went wrong';
    $errorMsg.style.display         = 'block';
    $errorMsg.textContent           = err.message;
    document.querySelector('#loading .load-dots').style.display = 'none';
  }
}

boot();
