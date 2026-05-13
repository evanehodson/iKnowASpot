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

    const hit = hitTestSpots(e.clientX, e.clientY);
    if (hit) {
      $canvas.style.cursor = 'pointer';
      state.hoveredSpot = hit;

      // 1. Prepare the multiline text (Replace / with newlines)
      const multiLineQuote = hit.spot.tagline.split('/').map(s => s.trim()).join('\n');

      // 2. Build the structure
      // Note: We use textContent for the quote inside the div later to keep it safe
      $tooltip.innerHTML = `
        <div class="tooltip-card">
          <div class="tooltip-name">${hit.spot.name}</div>
          <div class="tooltip-quote"></div>
          ${hit.spot.attribution ? `<div class="tooltip-attribution">— ${hit.spot.attribution}</div>` : ''}
        </div>
      `;

      // 3. Inject the text safely into the empty div we just made
      $tooltip.querySelector('.tooltip-quote').textContent = multiLineQuote;

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

  $canvas.addEventListener('click', e => {
    if (state.isDragging) { state.isDragging = false; return; }
    const hit = hitTestSpots(e.clientX, e.clientY);
    if (hit) emit('spot:enter', hit.index);
    state.isDragging = false;
  });

  $canvas.addEventListener('wheel', e => {
    e.preventDefault();
    state.cameraZ = Math.max(CAM_MIN, Math.min(CAM_MAX, state.cameraZ + e.deltaY * 0.002));
  }, { passive: false });
}