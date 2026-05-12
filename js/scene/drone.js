// ─────────────────────────────────────────────────────────────────────────────
// scene/drone.js
// ─────────────────────────────────────────────────────────────────────────────
import { state } from '../core/state.js';
import { emit } from '../core/events.js';

const DRONE_SRC = './assets/music/drone.mp3';
const DRONE_MAX_VOL = 0.4;

let audioCtx;
let mainGain;

export async function initDrone() {
    // Create Audio Context on demand to satisfy browsers
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Master volume control
    mainGain = audioCtx.createGain();
    mainGain.connect(audioCtx.destination);
    mainGain.gain.value = 0; // Start silent

    // Pre-fetch the audio data
    const response = await fetch(DRONE_SRC);
    const arrayBuffer = await response.arrayBuffer();
    state.droneBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    state.droneReady = true;
}

function playLoop(time) {
    if (!state.dronePlaying) return;

    const source = audioCtx.createBufferSource();
    source.buffer = state.droneBuffer;
    
    const gainNode = audioCtx.createGain();
    source.connect(gainNode);
    gainNode.connect(mainGain);

    const duration = state.droneBuffer.duration;
    const xfade = 3 + Math.random() * 5; // random 3–8s crossfade each loop

    const startFadeOut = time + duration - xfade;

    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(1, time + xfade);
    gainNode.gain.setValueAtTime(1, startFadeOut);
    gainNode.gain.linearRampToValueAtTime(0, time + duration);

    source.start(time);
    
    state.nextLoopTimer = setTimeout(() => {
        playLoop(startFadeOut);
    }, (duration - xfade) * 1000);
}

export function startDronePlayback() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    state.dronePlaying = true;
    playLoop(audioCtx.currentTime);
    
    // Nice slow initial fade in for the master volume
    mainGain.gain.setTargetAtTime(DRONE_MAX_VOL, audioCtx.currentTime, 2.0);
    emit('drone:playing');
}

export function fadeDrone(targetVol, durationMs = 1500) {
    if (!mainGain) return;
    const target = targetVol / 100;
    mainGain.gain.setTargetAtTime(target, audioCtx.currentTime, durationMs / 1000);
}

export function resumeDrone() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    fadeDrone(DRONE_MAX_VOL * 100, 2000);
}