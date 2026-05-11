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
//   5. Init YouTube API → drone audio
//   6. Once spots + drone are ready → hide loading screen
//
// Event wiring (after boot):
//   'spot:enter'      → fade to black → show traveling tip → launch video
//   'scene:revealed'  → fade transition away → show HUD
//   'spot:exit'       → destroy player → return to globe
//   'drone:playing'   → check if app is fully ready to show
// ─────────────────────────────────────────────────────────────────────────────

import { state }                    from './core/state.js';
import { on, emit }                 from './core/events.js';
import { fadeToBlack, fadeFromBlack } from './core/transitions.js';
import { LOADING_MESSAGES }         from './core/constants.js';
import {
  $loading, $loadingLabel, $errorMsg,
  $sceneView, $sceneHud, $btnBack, $btnOpen,
  $siteHeader, $shuffleBtn, $searchWrap, $travelingTip, $traveling,
} from './core/dom.js';

import { loadSpots }                from './spots/loader.js';
import { initGlobe, pauseGlobe, resumeGlobe, getCamera } from './globe/globe.js';
import { spotMeshes, showAllMarkers } from './globe/markers.js';
import { flyToSpot, flyToSpotWithTooltip } from './globe/fly.js';
import { initSearch }               from './search/search.js';
import { initDrone, fadeDrone, resumeDrone } from './scene/drone.js';
import { launchSpotVideo, destroyScenePlayer } from './scene/player.js';
import { startHud, stopHud }        from './scene/hud.js';

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
  if (state.spotsLoaded && state.dronePlaying) {
    $loading.classList.add('hidden');
  }
}

// ── Spot navigation ───────────────────────────────────────────────────────────

function enterSpot(index) {
  const spot = state.spots[index];
  state.currentSpotIndex = index;
  state.currentSpotUrl   = spot.url;
  state.travelRetryCount = 0;

  hideGlobeUI();
  fadeDrone(0, 1200);

  // Highlight marker
  const s = spotMeshes[index];
  if (s) { s.haloMesh.scale.setScalar(3.5); s.haloMesh.material.opacity = 1; }

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
    enterSpot(target.index);
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
// The YT API calls window.onYouTubeIframeAPIReady when ready.
// We bridge that global callback into our module system here.

window.onYouTubeIframeAPIReady = () => {
  state.ytApiReady = true;
  initDrone();
};

// ── Boot ──────────────────────────────────────────────────────────────────────

async function boot() {
  $loadingLabel.textContent = LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)];

  try {
    state.spots       = await loadSpots();
    state.spotsLoaded = true;
    initGlobe(state.spots);
    initSearch();
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
