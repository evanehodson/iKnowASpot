// ─────────────────────────────────────────────────────────────────────────────
// globe/interaction.js
//
// All user input on the globe canvas: drag-to-rotate, zoom, hover, click.
// ─────────────────────────────────────────────────────────────────────────────

import { state } from '../core/state.js';
import { emit } from '../core/events.js';
import { $canvas, $tooltip } from '../core/dom.js';
import { CAM_MIN, CAM_MAX } from '../core/constants.js';
import { spotMeshes } from './markers.js';

// These are set once by initInteraction() and used by the raycaster
let _camera = null;
const raycaster = new THREE.Raycaster();

/**
 * Finds the spot marker (if any) under screen coordinates (clientX, clientY).
 *
 * @param {number} clientX
 * @param {number} clientY
 * @returns {Object|null}  spotMesh entry, or null
 */
function hitTestSpots(clientX, clientY) {
  const ndc = new THREE.Vector2(
    (clientX  / window.innerWidth)  * 2 - 1,
    -(clientY / window.innerHeight) * 2 + 1,
  );
  raycaster.setFromCamera(ndc, _camera);
  const visible = spotMeshes.filter(s => s.mesh.visible).map(s => s.mesh);
  const hits    = raycaster.intersectObjects(visible);
  if (!hits.length) return null;
  return spotMeshes.find(s => s.mesh === hits[0].object) || null;
}

// ── Drag state (local to this module) ────────────────────────────────────────
let dragStartX    = 0;
let dragStartY    = 0;
let dragStartRotY = 0;
let dragStartRotX = 0;

// ── Touch pinch state ─────────────────────────────────────────────────────────
let lastPinchDist = null;

/**
 * Wires up all globe canvas event listeners.
 * Call once after Three.js is initialised.
 *
 * @param {THREE.Camera} camera
 */
export function initInteraction(camera) {
  _camera = camera;

  // ── Mouse drag (rotate) ───────────────────────────────────────────────────
  $canvas.addEventListener('mousedown', e => {
    state.isDragging  = false;
    dragStartX        = e.clientX;
    dragStartY        = e.clientY;
    dragStartRotY     = state.rotationY;
    dragStartRotX     = state.rotationX;
    $canvas.style.cursor = 'grabbing';
  });

  window.addEventListener('mousemove', e => {
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;

    if (e.buttons === 1 && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
      state.isDragging  = true;
      state.rotationY   = dragStartRotY + dx * 0.005;
      state.rotationX   = Math.max(-1.0, Math.min(1.0, dragStartRotX + dy * 0.005));
    }

    // Hover / tooltip
    const hit = hitTestSpots(e.clientX, e.clientY);
    if (hit) {
      $canvas.style.cursor   = 'pointer';
      state.hoveredSpot      = hit;
      $tooltip.textContent   = hit.spot.name;
      $tooltip.style.left    = e.clientX + 'px';
      $tooltip.style.top     = e.clientY + 'px';
      $tooltip.classList.add('visible');
    } else {
      if (!state.isDragging) $canvas.style.cursor = 'grab';
      state.hoveredSpot = null;
      $tooltip.classList.remove('visible');
    }
  });

  window.addEventListener('mouseup', () => {
    $canvas.style.cursor = state.hoveredSpot ? 'pointer' : 'grab';
  });

  // ── Click (enter spot) ────────────────────────────────────────────────────
  $canvas.addEventListener('click', e => {
    if (state.isDragging) { state.isDragging = false; return; }
    const hit = hitTestSpots(e.clientX, e.clientY);
    if (hit) emit('spot:enter', hit.index);
    state.isDragging = false;
  });

  // ── Scroll zoom ───────────────────────────────────────────────────────────
  $canvas.addEventListener('wheel', e => {
    e.preventDefault();
    state.cameraZ = Math.max(CAM_MIN, Math.min(CAM_MAX, state.cameraZ + e.deltaY * 0.002));
  }, { passive: false });

  // ── Touch drag (rotate) ───────────────────────────────────────────────────
  let touchStartX = 0, touchStartY = 0;

  $canvas.addEventListener('touchstart', e => {
    if (e.touches.length === 2) { lastPinchDist = null; return; }
    touchStartX   = e.touches[0].clientX;
    touchStartY   = e.touches[0].clientY;
    dragStartRotY = state.rotationY;
    dragStartRotX = state.rotationX;
    state.isDragging = false;
  }, { passive: true });

  $canvas.addEventListener('touchmove', e => {
    // Pinch zoom
    if (e.touches.length === 2) {
      const dx   = e.touches[0].clientX - e.touches[1].clientX;
      const dy   = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (lastPinchDist !== null) {
        state.cameraZ = Math.max(CAM_MIN, Math.min(CAM_MAX, state.cameraZ + (lastPinchDist - dist) * 0.008));
      }
      lastPinchDist = dist;
      return;
    }

    const dx = e.touches[0].clientX - touchStartX;
    const dy = e.touches[0].clientY - touchStartY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      state.isDragging = true;
      state.rotationY  = dragStartRotY + dx * 0.005;
      state.rotationX  = Math.max(-1.0, Math.min(1.0, dragStartRotX + dy * 0.005));
    }
  }, { passive: true });

  $canvas.addEventListener('touchend', e => {
    if (e.touches.length < 2) lastPinchDist = null;
    if (!state.isDragging) {
      const t   = e.changedTouches[0];
      const hit = hitTestSpots(t.clientX, t.clientY);
      if (hit) emit('spot:enter', hit.index);
    }
    state.isDragging = false;
  });
}
