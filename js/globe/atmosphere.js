// ─────────────────────────────────────────────────────────────────────────────
// globe/atmosphere.js
//
// Creates the atmospheric glow and night-shadow meshes that wrap the globe.
// Pure Three.js — no state, no side effects beyond returning meshes.
// ─────────────────────────────────────────────────────────────────────────────

import { GLOBE_RADIUS } from '../core/constants.js';

/**
 * Creates the outer blue atmospheric rim visible at the globe edge.
 * Uses additive blending so it glows without occluding the globe texture.
 *
 * @returns {THREE.Mesh}
 */
export function createAtmosphere() {
  return new THREE.Mesh(
    new THREE.SphereGeometry(GLOBE_RADIUS * 1.12, 64, 64),
    new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float i = pow(0.65 - dot(vNormal, vec3(0, 0, 1)), 3.0);
          gl_FragColor = vec4(0.15, 0.45, 1.0, 1.0) * i * 1.6;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    })
  );
}

/**
 * Creates the inner atmospheric haze layer (tighter, softer).
 *
 * @returns {THREE.Mesh}
 */
export function createInnerAtmosphere() {
  return new THREE.Mesh(
    new THREE.SphereGeometry(GLOBE_RADIUS * 1.04, 64, 64),
    new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float i = pow(0.72 - dot(vNormal, vec3(0, 0, 1)), 4.5);
          gl_FragColor = vec4(0.2, 0.55, 1.0, 0.5) * i;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    })
  );
}

/**
 * Creates the terminator shadow that darkens the night-side of the globe.
 * The sunDir uniform should match the directional light position.
 *
 * @returns {THREE.Mesh}
 */
export function createNightShadow() {
  return new THREE.Mesh(
    new THREE.SphereGeometry(GLOBE_RADIUS + 0.002, 64, 64),
    new THREE.ShaderMaterial({
      uniforms: {
        sunDir: { value: new THREE.Vector3(5, 2, 3).normalize() },
      },
      vertexShader: `
        varying vec3 vWorldNormal;
        void main() {
          vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 sunDir;
        varying vec3 vWorldNormal;
        void main() {
          float ndotl = dot(vWorldNormal, sunDir);
          float dark = smoothstep(0.1, -0.25, ndotl);
          gl_FragColor = vec4(0.01, 0.02, 0.05, dark * 0.72);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.FrontSide,
    })
  );
}
