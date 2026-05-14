// ─────────────────────────────────────────────────────────────────────────────
// globe/interaction.js
// ─────────────────────────────────────────────────────────────────────────────

import { state } from '../core/state.js';
import { emit } from '../core/events.js';
import { $canvas, $tooltip } from '../core/dom.js';
import { CAM_MIN, CAM_MAX } from '../core/constants.js';
import { spotMeshes } from './markers.js';

let _camera = null;
const raycaster = new THREE.Raycaster();

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

let dragStartX    = 0;
let dragStartY    = 0;
let dragStartRotY = 0;
let dragStartRotX = 0;

export function initInteraction(camera) {
  _camera = camera;

  // ── Mouse drag ────────────────────────────────────────────────────────────
  $canvas.addEventListener('mousedown', e => {
    state.isDragging  = false;
    dragStartX        = e.clientX;
    dragStartY        = e.clientY;
    dragStartRotY     = state.rotationY;
    dragStartRotX     = state.rotationX;
    $canvas.style.cursor = 'grabbing';
  });

  window.addEventListener('mousemove', e => {
    if (e.pointerType === 'touch') return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;

    if (e.buttons === 1 && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
      state.isDragging  = true;
      state.rotationY   = dragStartRotY + dx * 0.005;
      state.rotationX   = Math.max(-1.0, Math.min(1.0, dragStartRotX + dy * 0.005));
    }

    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
    const hit = hitTestSpots(e.clientX, e.clientY);
    if (hit && !isTouchDevice) {
      $canvas.style.cursor = 'pointer';
      state.hoveredSpot = hit;
      const multiLineQuote = hit.spot.tagline.split('/').map(s => s.trim()).join('\n');
      $tooltip.innerHTML = `
        <div class="tooltip-card">
          <div class="tooltip-name">${hit.spot.name}</div>
          <div class="tooltip-quote"></div>
          ${hit.spot.attribution ? `<div class="tooltip-attribution">— ${hit.spot.attribution}</div>` : ''}
        </div>
      `;
      $tooltip.querySelector('.tooltip-quote').textContent = multiLineQuote;
      $tooltip.style.left = e.clientX + 'px';
      $tooltip.style.top  = e.clientY + 'px';
      $tooltip.classList.add('visible');
    } else {
      if (!state.isDragging) $canvas.style.cursor = 'grab';
      state.hoveredSpot = null;
      if (!isTouchDevice) $tooltip.classList.remove('visible');
    }
  });

  window.addEventListener('mouseup', () => {
    $canvas.style.cursor = state.hoveredSpot ? 'pointer' : 'grab';
  });

  $canvas.addEventListener('click', e => {
    if (state.isDragging) { state.isDragging = false; return; }
    if (e.pointerType === 'touch') return;
    const hit = hitTestSpots(e.clientX, e.clientY);
    if (hit) emit('spot:enter', hit.index);
    state.isDragging = false;
  });

  // ── Scroll zoom ───────────────────────────────────────────────────────────
  $canvas.addEventListener('wheel', e => {
    e.preventDefault();
    state.cameraZ = Math.max(CAM_MIN, Math.min(CAM_MAX, state.cameraZ + e.deltaY * 0.002));
  }, { passive: false });

  // ── Touch drag ────────────────────────────────────────────────────────────
  let touchStartX = 0, touchStartY = 0;
  let lastPinchDist = null;

  $canvas.addEventListener('touchstart', e => {
    if (e.touches.length === 2) { lastPinchDist = null; return; }
    touchStartX   = e.touches[0].clientX;
    touchStartY   = e.touches[0].clientY;
    dragStartRotY = state.rotationY;
    dragStartRotX = state.rotationX;
    state.isDragging = false;
  }, { passive: true });

  $canvas.addEventListener('touchmove', e => {
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

  // ── Mobile sidebar ────────────────────────────────────────────────────────
  const $sidebar       = document.getElementById('spot-sidebar');
  const $sidebarName   = document.getElementById('sidebar-name');
  const $sidebarQuote  = document.getElementById('sidebar-quote');
  const $sidebarAttrib = document.getElementById('sidebar-attribution');
  const $sidebarEnter  = document.getElementById('sidebar-enter');
  const $sidebarClose  = document.getElementById('sidebar-close');

  let pendingSpotEntry = null;

  function openSidebar(hit) {
    pendingSpotEntry = hit.index;
    const multiLineQuote = hit.spot.tagline.split('/').map(s => s.trim()).join('\n');
    $sidebarName.textContent   = hit.spot.name;
    $sidebarQuote.textContent  = multiLineQuote;
    $sidebarAttrib.textContent = hit.spot.attribution ? `— ${hit.spot.attribution}` : '';
    $sidebar.classList.add('open');
  }

  function closeSidebar() {
    $sidebar.classList.remove('open');
    pendingSpotEntry = null;
  }

  $sidebarClose.addEventListener('click', closeSidebar);

  $sidebarEnter.addEventListener('click', () => {
    if (pendingSpotEntry === null) return;
    const index = pendingSpotEntry;
    closeSidebar();
    emit('spot:enter', index);
  });

  $canvas.addEventListener('touchend', e => {
    if (e.touches.length < 2) lastPinchDist = null;
    if (!state.isDragging) {
      const t   = e.changedTouches[0];
      const hit = hitTestSpots(t.clientX, t.clientY);
      if (hit) {
        openSidebar(hit);
      } else {
        closeSidebar();
      }
    }
    state.isDragging = false;
  });
}