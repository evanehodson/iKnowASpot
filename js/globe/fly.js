// ─────────────────────────────────────────────────────────────────────────────
// globe/fly.js
//
// Smooth, cinematic fly-to animations for the globe.
//
// Two entry points:
//   flyToSpot(spotMesh, duration, onComplete)  — fly to a marker
//   flyToLatLng(lat, lng, duration, onComplete) — fly to a raw coordinate
//
// Both derive target rotations the same way (via rotationsForPosition)
// so the globe always centres the target face-on to the camera.
// ─────────────────────────────────────────────────────────────────────────────

import { state } from '../core/state.js';
import { latLngToVec3, rotationsForPosition, shortestArc } from './math.js';
import { easeOutCubic } from '../utils/timing.js';

/**
 * Shared animation kernel — handles the requestAnimationFrame loop
 * and easing for both fly-to variants.
 *
 * @param {number}   targetRotY   - destination Y rotation (radians)
 * @param {number}   targetRotX   - destination X rotation (radians)
 * @param {number}   duration     - animation duration (ms)
 * @param {Function} [onComplete] - called when animation finishes
 */
function animateFly(targetRotY, targetRotX, duration, onComplete) {
  state.globeAutoRotate = false;

  const startRotY = state.rotationY;
  const startRotX = state.rotationX;
  const deltaY    = shortestArc(targetRotY - startRotY);
  const start     = performance.now();

  function step(now) {
    const t    = Math.min((now - start) / duration, 1);
    const ease = easeOutCubic(t);

    state.rotationY = startRotY + deltaY * ease;
    state.rotationX = startRotX + (targetRotX - startRotX) * ease;

    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      if (onComplete) onComplete();
    }
  }

  requestAnimationFrame(step);
}

/**
 * Fly the globe to centre a specific spot marker.
 *
 * @param {Object}   spotMesh     - entry from spotMeshes array
 * @param {number}   [duration]   - ms (default 2000)
 * @param {Function} [onComplete]
 */
export function flyToSpot(spotMesh, duration = 2000, onComplete) {
  const pos = spotMesh.mesh.position.clone().normalize();
  const { targetRotY, targetRotX } = rotationsForPosition(pos);
  animateFly(targetRotY, targetRotX, duration, onComplete);
}

/**
 * Fly the globe to centre a raw lat/lng coordinate.
 * Used after geocoding a search query that has no matching spot marker.
 *
 * @param {number}   lat
 * @param {number}   lng
 * @param {number}   [duration]   - ms (default 2000)
 * @param {Function} [onComplete]
 */
export function flyToLatLng(lat, lng, duration = 2000, onComplete) {
  const pos = latLngToVec3(lat, lng).normalize();
  const { targetRotY, targetRotX } = rotationsForPosition(pos);
  animateFly(targetRotY, targetRotX, duration, onComplete, true);
}

/**
 * Flies to a spot, flashes the tooltip, then calls onComplete.
 * Used by both shuffle and search result selection for consistent behaviour.
 *
 * @param {Object}   spotMesh
 * @param {THREE.Camera} camera
 * @param {Function} onComplete  — called after the tooltip flash
 */
export function flyToSpotWithTooltip(spotMesh, camera, onComplete) {
  flyToSpot(spotMesh, 2000, () => {
    const worldPos  = new THREE.Vector3();
    spotMesh.mesh.getWorldPosition(worldPos);
    const projected = worldPos.project(camera);
    const screenX   = ((projected.x + 1) / 2) * window.innerWidth;
    const screenY   = ((-projected.y + 1) / 2) * window.innerHeight;

    // Trigger hovered glow
    state.hoveredSpot = spotMesh;

    const $tooltip = document.getElementById('spot-tooltip');
    $tooltip.textContent = spotMesh.spot.name;
    $tooltip.style.left  = screenX + 'px';
    $tooltip.style.top   = screenY + 'px';
    $tooltip.classList.add('visible');

    setTimeout(() => {
      $tooltip.classList.remove('visible');
      if (onComplete) onComplete();
    }, 1500);
  });
}
