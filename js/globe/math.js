// ─────────────────────────────────────────────────────────────────────────────
// globe/math.js
//
// Pure mathematical functions for globe coordinate conversions.
// No Three.js scene references, no state — just numbers in, numbers out.
// ─────────────────────────────────────────────────────────────────────────────

import { GLOBE_RADIUS } from '../core/constants.js';

/**
 * Converts a lat/lng coordinate to a Three.js Vector3 on the globe surface.
 *
 * The coordinate system used by Three.js:
 *   +Y is up, +Z is toward the viewer, +X is right.
 *   Longitude 0 (prime meridian) faces the viewer at rest.
 *
 * @param {number} lat   latitude  (-90 to 90)
 * @param {number} lng   longitude (-180 to 180)
 * @param {number} [r]   radius (defaults to GLOBE_RADIUS)
 * @returns {THREE.Vector3}
 */
export function latLngToVec3(lat, lng, r = GLOBE_RADIUS) {
  const phi   = (90 - lat)  * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta)
  );
}

/**
 * Derives the globe rotation (rotationY, rotationX) needed to centre
 * a given 3D position on the globe face-on to the camera.
 *
 * This is used by fly-to animations to compute target rotations from
 * either a spot marker position or a geocoded lat/lng.
 *
 * @param {THREE.Vector3} pos  - normalised position on the unit sphere
 * @returns {{ targetRotY: number, targetRotX: number }}
 */
export function rotationsForPosition(pos) {
  const targetRotY = Math.atan2(-pos.x, pos.z);
  const cosY = Math.cos(targetRotY);
  const sinY = Math.sin(targetRotY);
  const z1   = -pos.x * sinY + pos.z * cosY;
  const targetRotX = Math.atan2(pos.y, z1);
  return { targetRotY, targetRotX };
}

/**
 * Normalises an angle delta to the shortest arc (-π to π).
 * Prevents the globe from spinning the long way around during fly-to.
 *
 * @param {number} delta  - raw angle difference in radians
 * @returns {number}      - shortest equivalent delta
 */
export function shortestArc(delta) {
  while (delta >  Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  return delta;
}
