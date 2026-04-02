/**
 * loader.js - JSON Data Loader
 * Handles fetching level and shared data with caching
 */

import { state } from './state.js';

// Memory cache for loaded data
const cache = {
  shared: null,
  levels: {}
};

/**
 * Fetch JSON from a URL with error handling
 * @param {string} url - URL to fetch
 * @returns {Promise<Object>} Parsed JSON
 * @throws {Error} If fetch fails
 */
async function fetchJSON(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (err) {
    console.error(`Failed to load ${url}:`, err);
    throw err;
  }
}

/**
 * Load shared data (vocabulary categories, meta info, etc.)
 * @returns {Promise<Object>} Shared data object
 */
export async function loadShared() {
  // Return from cache if already loaded
  if (cache.shared) {
    return cache.shared;
  }

  try {
    const data = await fetchJSON('./data/shared.json');
    cache.shared = data;
    state.levels = data.levels || {};  // Cache level metadata in state
    return data;
  } catch (err) {
    console.error('Failed to load shared data:', err);
    throw err;
  }
}

/**
 * Load a specific level's data
 * @param {number} level - Level number (1-10)
 * @returns {Promise<Object>} Level data object
 */
export async function loadLevel(level) {
  const levelId = String(level);

  // Return from cache if already loaded
  if (cache.levels[levelId]) {
    return cache.levels[levelId];
  }

  try {
    const data = await fetchJSON(`./data/level-${level}.json`);
    cache.levels[levelId] = data;

    // Also store in state for access by other modules
    state.levels[levelId] = data;

    return data;
  } catch (err) {
    console.error(`Failed to load level ${level}:`, err);
    throw err;
  }
}

/**
 * Preload a level in the background (no await needed)
 * Useful for loading next level while user is reviewing current
 * @param {number} level - Level number to preload
 */
export function preloadLevel(level) {
  const levelId = String(level);

  // Don't preload if already loaded
  if (cache.levels[levelId]) {
    return;
  }

  // Preload in background - errors are logged but not thrown
  loadLevel(level)
    .then(() => {
      console.log(`Preloaded level ${level}`);
    })
    .catch(err => {
      console.log(`Background preload of level ${level} failed:`, err);
    });
}

/**
 * Clear cache (useful for testing or hard refresh)
 */
export function clearCache() {
  cache.shared = null;
  cache.levels = {};
}

/**
 * Get cache status (for debugging)
 * @returns {Object} Cache status
 */
export function getCacheStatus() {
  return {
    sharedLoaded: cache.shared !== null,
    levelsLoaded: Object.keys(cache.levels)
  };
}
