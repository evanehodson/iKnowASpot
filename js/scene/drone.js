// ─────────────────────────────────────────────────────────────────────────────
// scene/drone.js
//
// Manages the ambient drone audio that plays on the globe.
//
// The drone is a hidden YouTube player (1x1px, off-screen) that loops
// a single ambient video. It starts muted, then unmutes once playing.
//
// Emits:
//   'drone:playing' — once the drone enters PLAYING state for the first time
// ─────────────────────────────────────────────────────────────────────────────

import { state } from '../core/state.js';
import { emit } from '../core/events.js';
import { DRONE_VIDEO_ID, MAX_DRONE_RETRIES } from '../core/constants.js';

/**
 * Fades drone volume to a target level over `durationMs`.
 * Pauses the player if fading to 0.
 *
 * @param {number} targetVol   0–100
 * @param {number} [durationMs]
 */
export function fadeDrone(targetVol, durationMs = 1000) {
  if (!state.droneReady || !state.dronePlayer) return;
  const startVol = state.droneVolume;
  const steps    = 30;
  const stepTime = durationMs / steps;
  const delta    = (targetVol - startVol) / steps;
  let step = 0;

  const iv = setInterval(() => {
    step++;
    state.droneVolume = Math.max(0, Math.min(100, Math.round(startVol + delta * step)));
    try { state.dronePlayer.setVolume(state.droneVolume); } catch (e) {}
    if (step >= steps) {
      clearInterval(iv);
      state.droneVolume = targetVol;
      if (targetVol === 0) { try { state.dronePlayer.pauseVideo(); } catch (e) {} }
    }
  }, stepTime);
}

/**
 * Resumes and fades drone back to full volume.
 * Call when returning to the globe from a scene.
 */
export function resumeDrone() {
  if (!state.droneReady || !state.dronePlayer) return;
  try { state.dronePlayer.playVideo(); } catch (e) {}
  fadeDrone(100, 1500);
}

function tryPlayDrone() {
  if (!state.dronePlayer) return;
  try { state.dronePlayer.playVideo(); } catch (e) { retryDrone(); return; }
  setTimeout(() => { if (!state.dronePlaying) retryDrone(); }, 1500);
}

function retryDrone() {
  if (state.droneRetryCount >= MAX_DRONE_RETRIES) {
    // Give up and let the app load without audio
    emit('drone:playing');
    return;
  }
  state.droneRetryCount++;
  try { state.dronePlayer.destroy(); } catch (e) {}
  state.dronePlayer  = null;
  state.droneReady   = false;
  state.dronePlaying = false;
  setTimeout(initDrone, 800);
}

/**
 * Creates the hidden YT.Player for drone audio.
 * Requires the YouTube IFrame API to already be ready (state.ytApiReady).
 */
export function initDrone() {
  state.dronePlayer = new YT.Player('drone-yt-target', {
    width: '1', height: '1',
    videoId: DRONE_VIDEO_ID,
    playerVars: {
      autoplay: 1, loop: 1, playlist: DRONE_VIDEO_ID,
      controls: 0, mute: 1, playsinline: 1,
    },
    events: {
      onReady(e) {
        state.droneReady = true;
        e.target.setVolume(100);
        tryPlayDrone();
      },
      onStateChange(e) {
        if (e.data === YT.PlayerState.PLAYING) {
          state.dronePlaying    = true;
          state.droneRetryCount = 0;
          try { e.target.unMute(); e.target.setVolume(100); } catch (err) {}
          emit('drone:playing');
        }
        if (e.data === YT.PlayerState.ENDED) {
          state.dronePlayer.playVideo();
        }
      },
      onError() { retryDrone(); }
    },
  });
}
