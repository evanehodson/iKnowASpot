// ─────────────────────────────────────────────────────────────────────────────
// scene/player.js
//
// Manages the spot video player (the fullscreen YouTube embed in scene view).
//
// Responsibilities:
//   - Create and destroy the YT.Player for a given spot
//   - Fade audio in once playing
//   - Handle load timeouts and retry once
//   - Emit 'scene:revealed' once the video is playing and stable
//
// Emits:
//   'scene:revealed'  — video is playing, transition to full experience
// ─────────────────────────────────────────────────────────────────────────────

import { state } from '../core/state.js';
import { emit } from '../core/events.js';
import { $sceneView } from '../core/dom.js';
import { TRAVEL_TIMEOUT_MS, TRAVEL_TIP_DELAY_MS } from '../core/constants.js';

// ── Audio fade-in ─────────────────────────────────────────────────────────────

function fadeInAudio() {
  if (!state.scenePlayer) return;
  const durationMs = 5000, steps = 50, stepTime = durationMs / steps;
  let step = 0;
  const iv = setInterval(() => {
    if (!state.scenePlayer) { clearInterval(iv); return; }
    step++;
    try { state.scenePlayer.setVolume(Math.min(100, Math.round((step / steps) * 100))); } catch (e) {}
    if (step >= steps) clearInterval(iv);
  }, stepTime);
}

// ── Player sizing ─────────────────────────────────────────────────────────────

// Polls until the YT div becomes an iframe, then applies letterbox-fill styles
function applyIframeStyles() {
  const iv = setInterval(() => {
    const el = document.getElementById('yt-target');
    if (el && el.tagName === 'IFRAME') {
      el.style.cssText = `
        position: absolute; top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        width: max(177.78vh, 100vw);
        height: max(100vh, 56.25vw);
        border: none; z-index: 1; pointer-events: none;
        opacity: 0; transition: opacity 1.2s ease;
      `;
      setTimeout(() => {
        const iframe = document.getElementById('yt-target');
        if (iframe) iframe.style.opacity = '1';
      }, 100);
      clearInterval(iv);
    }
  }, 30);
}

// ── Player lifecycle ──────────────────────────────────────────────────────────

/**
 * Destroys the current scene player and removes its DOM element.
 */
export function destroyScenePlayer() {
  if (state.scenePlayer) {
    try { state.scenePlayer.destroy(); } catch (e) {}
    state.scenePlayer = null;
  }
  const old = document.getElementById('yt-target');
  if (old) old.remove();
}

/**
 * Launches a YouTube player for the given spot.
 * On play: fades audio in and emits 'scene:revealed' after a short delay.
 * On timeout: retries once, then emits 'spot:exit' to return to the globe.
 *
 * @param {Object}  spot      - normalised spot object
 * @param {boolean} [isRetry] - true on the second attempt
 */
export function launchSpotVideo(spot, isRetry = false) {
  destroyScenePlayer();

  const target = document.createElement('div');
  target.id = 'yt-target';
  $sceneView.insertBefore(target, document.getElementById('yt-blocker'));

  let revealed         = false;
  let audioFadeStarted = false;

  clearTimeout(state.travelTimeoutTimer);
  state.travelTimeoutTimer = setTimeout(() => {
    if (!revealed) {
      if (!isRetry) {
        launchSpotVideo(spot, true);
      } else {
        emit('spot:exit');
      }
    }
  }, TRAVEL_TIMEOUT_MS);

  function reveal() {
    if (revealed) return;
    revealed = true;
    clearTimeout(state.travelTimeoutTimer);
    setTimeout(() => emit('scene:revealed'), TRAVEL_TIP_DELAY_MS);
  }

  state.scenePlayer = new YT.Player('yt-target', {
    videoId: spot.videoId,
    playerVars: {
      autoplay: 1, mute: 0, loop: 1, playlist: spot.videoId,
      controls: 0, disablekb: 1, modestbranding: 1, playsinline: 1,
      rel: 0, iv_load_policy: 3, fs: 0, cc_load_policy: 0,
    },
    events: {
      onReady(e) {
        try {
          e.target.setVolume(0);
          e.target.seekTo(45, true);
          e.target.playVideo();
        } catch (err) {}

        // Safari iOS sometimes needs a nudge — retry once after a short delay
        // This stays within the gesture window if the tap was recent
        setTimeout(() => {
          try {
            if (e.target.getPlayerState() !== YT.PlayerState.PLAYING) {
              e.target.playVideo();
            }
          } catch (err) {}
        }, 800);
      },
      onStateChange(e) {
        if (e.data === YT.PlayerState.PLAYING) {
          if (!audioFadeStarted) { audioFadeStarted = true; fadeInAudio(); }
          reveal();
        }
        if (e.data === YT.PlayerState.ENDED && state.scenePlayer) {
          state.scenePlayer.seekTo(45, true);
          state.scenePlayer.playVideo();
        }
      },
      onError() {
        clearTimeout(state.travelTimeoutTimer);
        if (!isRetry) launchSpotVideo(spot, true);
        else emit('spot:exit');
      },
    },
  });

  applyIframeStyles();
}
