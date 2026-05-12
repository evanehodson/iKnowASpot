// ─────────────────────────────────────────────────────────────────────────────
// globe/markers.js
//
// Creates and manages the glowing spot markers on the globe surface.
//
// Each marker is two meshes:
//   dot   — the solid green point
//   halo  — the larger transparent pulsing ring around it
//
// Both are added as children of the globe mesh so they rotate with it.
//
// spotMeshes is the array other modules (interaction, fly, search) use
// to find, filter, and target individual spots.
// ─────────────────────────────────────────────────────────────────────────────

import { latLngToVec3 } from './math.js';
import { on } from '../core/events.js';

// Exported so interaction.js and fly.js can read it
export let spotMeshes = [];

/**
 * Builds all spot markers and attaches them to the globe mesh.
 * Called once after spots are loaded and the globe is initialised.
 *
 * @param {THREE.Mesh}  globe  - the globe sphere mesh (markers become children)
 * @param {Object[]}    spots  - normalised spot objects from state.spots
 */
export function buildMarkers(globe, spots) {
  // Remove any existing markers (safe to call on re-init)
  spotMeshes.forEach(s => {
    globe.remove(s.mesh);
    globe.remove(s.haloMesh);
  });
  spotMeshes = [];

  spots.forEach((spot, i) => {
    const pos = latLngToVec3(spot.lat, spot.lng);

    // Solid dot
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.012, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0x90e8b0 })
    );
    dot.position.copy(pos);
    globe.add(dot);

    // Pulsing halo
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(0.022, 16, 16),
      new THREE.MeshBasicMaterial({
        color: 0x78c89a,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
      })
    );
    halo.position.copy(pos);
    globe.add(halo);

    spotMeshes.push({ mesh: dot, haloMesh: halo, spot, index: i });
  });

  // Listen for search events to show/hide markers
  on('search:results', (matchingIndices) => {
    spotMeshes.forEach(s => {
      const visible = matchingIndices.has(s.index);
      s.mesh.visible    = visible;
      s.haloMesh.visible = visible;
    });
  });

  on('search:cleared', () => {
    showAllMarkers();
  });
}

/**
 * Animates marker halos each frame — pulsing scale and opacity.
 * Call this from inside the render loop.
 *
 * @param {number}      t           - elapsed time in seconds (from timestamp / 1000)
 * @param {Object|null} hoveredSpot - the currently hovered spotMesh, or null
 */
export function animateMarkers(t, hoveredSpot) {
  spotMeshes.forEach(s => {
    const isHovered = s === hoveredSpot;
    const pulse = 1 + 0.18 * Math.sin(t * 2.5 + s.index * 1.3);

    const targetScale   = isHovered ? 2.2 : pulse;
    const targetOpacity = isHovered
      ? 0.7
      : 0.28 + 0.1 * Math.sin(t * 2.5 + s.index * 1.3);

    const currentScale   = s.haloMesh.scale.x;
    const currentOpacity = s.haloMesh.material.opacity;

    s.haloMesh.scale.setScalar(currentScale   + (targetScale   - currentScale)   * 0.12);
    s.haloMesh.material.opacity = currentOpacity + (targetOpacity - currentOpacity) * 0.12;
  });
}

/**
 * Makes all markers visible. Called when search is cleared or on return to globe.
 */
export function showAllMarkers() {
  spotMeshes.forEach(s => {
    s.mesh.visible    = true;
    s.haloMesh.visible = true;
  });
}
