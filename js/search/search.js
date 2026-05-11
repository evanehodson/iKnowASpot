// ─────────────────────────────────────────────────────────────────────────────
// search/search.js
//
// Wires the search input, fuzzy scoring, geocoding, and results UI together.
//
// Emits:
//   'search:results'  → Set of matching spot indices (markers filter themselves)
//   'search:cleared'  → all markers should show
//   'spot:enter'      → user clicked a spot result (index: number)
//
// Listens to nothing — it is driven purely by user input.
// ─────────────────────────────────────────────────────────────────────────────

import { state } from '../core/state.js';
import { emit } from '../core/events.js';
import { debounce } from '../utils/timing.js';
import { rankSpots } from './fuzzy.js';
import { geocode } from './geocoder.js';
import { flyToSpot, flyToLatLng, flyToSpotWithTooltip } from '../globe/fly.js';
import { spotMeshes } from '../globe/markers.js';
import { getCamera } from '../globe/globe.js';
import {
  $searchToggle, $searchPanel, $searchInput,
  $searchClear, $searchResults,
} from '../core/dom.js';

// ── Internal helpers ──────────────────────────────────────────────────────────

function showStatus(text, spinner = false) {
  $searchResults.innerHTML = '';
  if (spinner) {
    const el = document.createElement('div');
    el.className = 'search-spinner';
    el.innerHTML = '<span></span><span></span><span></span>';
    $searchResults.appendChild(el);
  } else {
    const el = document.createElement('div');
    el.className = 'search-status';
    el.textContent = text;
    $searchResults.appendChild(el);
  }
}

function closePanel() {
  $searchPanel.classList.remove('open');
  $searchToggle.classList.remove('active');
  state.searchOpen = false;
  $searchResults.innerHTML = '';
}

function clearSearch(resetMarkers = true) {
  $searchInput.value = '';
  $searchClear.classList.remove('visible');
  $searchResults.innerHTML = '';
  state.activeSearchQuery = '';
  if (resetMarkers) {
    emit('search:cleared');
    state.globeAutoRotate = true;
  }
}

function renderResults(spotResults, geoResult) {
  $searchResults.innerHTML = '';

  const hasSpots = spotResults.length > 0;
  const hasGeo   = geoResult !== null;

  if (!hasSpots && !hasGeo) {
    showStatus('no results found');
    emit('search:cleared');
    return;
  }

  // Spot results
  if (hasSpots) {
    spotResults.forEach(({ spot, index }) => {
      const item = document.createElement('div');
      item.className = 'search-result-item';
      item.innerHTML = `
        <span class="result-dot"></span>
        <span class="result-label">${spot.name}</span>
        <span class="result-type">spot</span>
      `;
      item.addEventListener('click', () => {
        closePanel();
        flyToSpotWithTooltip(spotMeshes[index], getCamera(), () => emit('spot:enter', index));
      });
      $searchResults.appendChild(item);
    });

    // Update visible markers
    const matchingIndices = new Set(spotResults.map(r => r.index));
    emit('search:results', matchingIndices);
  } else {
    emit('search:cleared');
  }

  // Geo result
  if (hasGeo) {
    const item = document.createElement('div');
    item.className = 'search-result-item';
    item.style.opacity = hasSpots ? '0.6' : '1';
    item.innerHTML = `
      <span class="result-dot" style="background:var(--sage);opacity:0.4"></span>
      <span class="result-label">${geoResult.name}</span>
      <span class="result-type">place</span>
    `;
    item.addEventListener('click', () => {
      flyToLatLng(geoResult.lat, geoResult.lng);
      closePanel();
    });
    $searchResults.appendChild(item);
  }
}

// ── Search runner ─────────────────────────────────────────────────────────────

async function runSearch(query) {
  state.activeSearchQuery = query;
  const spotResults = rankSpots(query, state.spots);
  showStatus('searching…', true);

  const geoResult = await geocode(query);

  // Bail if query changed while we were fetching
  if (state.activeSearchQuery !== query) return;

  renderResults(spotResults, geoResult);
}

const debouncedSearch = debounce(runSearch, 320);

// ── Event wiring ──────────────────────────────────────────────────────────────

export function initSearch() {
  $searchToggle.addEventListener('click', () => {
    state.searchOpen = !state.searchOpen;
    $searchPanel.classList.toggle('open', state.searchOpen);
    $searchToggle.classList.toggle('active', state.searchOpen);
    if (state.searchOpen) {
      $searchInput.value = '';
      $searchClear.classList.remove('visible');
      $searchResults.innerHTML = '';
      setTimeout(() => $searchInput.focus(), 320);
    } else {
      clearSearch();
    }
  });

  $searchClear.addEventListener('click', () => {
    clearSearch(false);
    $searchInput.focus();
  });

  $searchInput.addEventListener('input', () => {
    const q = $searchInput.value.trim();
    $searchClear.classList.toggle('visible', q.length > 0);
    if (!q) { clearSearch(false); return; }
    debouncedSearch(q);
  });

  $searchInput.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      clearSearch();
      closePanel();
    }
  });
}
