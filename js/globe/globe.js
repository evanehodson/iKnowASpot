// ─────────────────────────────────────────────────────────────────────────────
// globe/globe.js
//
// Three.js scene setup and the render loop.
//
// Responsibilities:
//   - Create scene, camera, renderer
//   - Build the globe sphere + texture
//   - Add stars, lighting, atmosphere meshes
//   - Run the render loop (updating rotation from state each frame)
//   - Expose pauseGlobe() / resumeGlobe() for the scene system
//
// What it does NOT do:
//   - Handle user input (→ interaction.js)
//   - Create spot markers (→ markers.js)
//   - Fly animations (→ fly.js)
// ─────────────────────────────────────────────────────────────────────────────

import { state } from '../core/state.js';
import { $canvas } from '../core/dom.js';
import { GLOBE_RADIUS, CAM_DEFAULT, AUTO_ROTATE_SPEED } from '../core/constants.js';
import { lerp } from '../utils/timing.js';
import { createAtmosphere, createInnerAtmosphere, createNightShadow } from './atmosphere.js';
import { buildMarkers, animateMarkers } from './markers.js';
import { initInteraction } from './interaction.js';

// Module-private Three.js objects
let scene, camera, renderer, globe, atmosphere;

/**
 * Initialises the Three.js scene, globe, lighting, stars, and interaction.
 * Call once after spots are loaded.
 *
 * @param {Object[]} spots  - normalised spot objects (from state.spots)
 */
export function initGlobe(spots) {
  // ── Scene + Camera ────────────────────────────────────────────────────────
  scene  = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 100);
  camera.position.set(0, 0, CAM_DEFAULT);

  // ── Renderer ──────────────────────────────────────────────────────────────
  renderer = new THREE.WebGLRenderer({ canvas: $canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  // ── Stars ─────────────────────────────────────────────────────────────────
  const starGeo   = new THREE.BufferGeometry();
  const starCount = 2800;
  const starPos   = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount * 3; i++) starPos[i] = (Math.random() - 0.5) * 80;
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  scene.add(new THREE.Points(
    starGeo,
    new THREE.PointsMaterial({ color: 0xffffff, size: 0.06, sizeAttenuation: true })
  ));

  // ── Globe sphere ──────────────────────────────────────────────────────────
  const loader   = new THREE.TextureLoader();
  const earthTex = loader.load(
    'https://www.shadedrelief.com/natural3/ne3_lr.jpg',
    undefined,
    undefined,
    // Fallback if primary texture fails
    () => {
      globe.material.map = loader.load('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg');
      globe.material.needsUpdate = true;
    }
  );

  globe = new THREE.Mesh(
    new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64),
    new THREE.MeshPhongMaterial({
      map: earthTex,
      specular: new THREE.Color(0x111122),
      shininess: 8,
    })
  );
  scene.add(globe);

  // ── Atmosphere ────────────────────────────────────────────────────────────
  atmosphere = createAtmosphere();
  scene.add(atmosphere);
  scene.add(createInnerAtmosphere());
  scene.add(createNightShadow());

  // ── Lighting ──────────────────────────────────────────────────────────────
  scene.add(new THREE.AmbientLight(0x112244, 0.6));

  const sun = new THREE.DirectionalLight(0xfff5e0, 2.2);
  sun.position.set(5, 2, 3);
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0x1a3060, 0.3);
  fill.position.set(-5, -1, -2);
  scene.add(fill);

  // ── Spot markers ─────────────────────────────────────────────────────────
  buildMarkers(globe, spots);

  // ── Interaction ───────────────────────────────────────────────────────────
  initInteraction(camera);

  // ── Resize handler ────────────────────────────────────────────────────────
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // ── Start render loop ─────────────────────────────────────────────────────
  renderLoop();
}

/**
 * The render loop — runs every frame via requestAnimationFrame.
 * Reads rotation from state (written by interaction + fly modules)
 * so this file never needs to import those directly.
 */
function renderLoop(ts = 0) {
  requestAnimationFrame(renderLoop);
  if (state.globePaused) return;

  // Smooth camera zoom
  camera.position.z = lerp(camera.position.z, state.cameraZ, 0.08);

  // Auto-rotate when idle
  if (!state.isDragging && state.globeAutoRotate) {
    state.rotationY += AUTO_ROTATE_SPEED;
  }

  // Apply rotation from state
  globe.rotation.y     = state.rotationY;
  globe.rotation.x     = state.rotationX;
  atmosphere.rotation.x = state.rotationX;

  // Animate markers
  animateMarkers(ts / 1000, state.hoveredSpot);

  renderer.render(scene, camera);
}

/**
 * Pauses the render loop (called when entering a scene).
 */
export function pauseGlobe() {
  state.globePaused = true;
}

/**
 * Resumes the render loop (called when returning to the globe).
 */
export function resumeGlobe() {
  state.globePaused    = false;
  state.globeAutoRotate = true;
}

/**
 * Returns the Three.js camera — needed by fly.js and shuffle for
 * projecting 3D positions to screen coordinates.
 *
 * @returns {THREE.Camera}
 */
export function getCamera() {
  return camera;
}
