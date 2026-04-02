/**
 * state.js - Central State Store & Event Bus
 * Single source of truth for the entire app
 */

import { isDue, createCard } from './srs.js';

// Event listeners registry
const listeners = {};

/**
 * Central state object - single source of truth
 */
export const state = {
  user: null,              // { uid, email, displayName } or null if not authenticated
  currentLevel: 1,         // Current IELTS level (1-10)
  currentScreen: 'home',   // Current active screen/route
  cards: {},              // { levelId: [card objects] } - SRS data
  progress: {},           // { levelId: { completed: n, total: n, dueToday: n } }
  settings: {
    dailyGoal: 10,
    notificationsEnabled: true,
    theme: 'light'
  },
  isOnline: navigator.onLine,
  levels: {}              // { levelId: { name, description, wordCount, cards: [...] } }
};

/**
 * Subscribe to state events
 * @param {string} event - Event name
 * @param {Function} callback - Callback function
 */
export function subscribe(event, callback) {
  if (!listeners[event]) {
    listeners[event] = [];
  }
  listeners[event].push(callback);

  // Return unsubscribe function
  return () => {
    listeners[event] = listeners[event].filter(cb => cb !== callback);
  };
}

/**
 * Emit a state event
 * @param {string} event - Event name
 * @param {any} data - Event data
 */
export function emit(event, data) {
  if (!listeners[event]) return;
  listeners[event].forEach(callback => {
    try {
      callback(data);
    } catch (err) {
      console.error(`Error in ${event} listener:`, err);
    }
  });
}

/**
 * Get current state (snapshot)
 * @returns {Object} Copy of current state
 */
export function getState() {
  return JSON.parse(JSON.stringify(state));
}

/**
 * Update state with shallow merge and emit event
 * @param {Object} partial - Partial state update
 */
export function setState(partial) {
  Object.assign(state, partial);
  emit('stateChange', getState());
}

/**
 * Get cards that are due for review for a given level
 * @param {number} level - Level ID
 * @returns {Array} Array of due cards
 */
export function getDueCards(level) {
  const levelId = String(level);
  if (!state.cards[levelId]) {
    return [];
  }
  return state.cards[levelId].filter(card => isDue(card));
}

/**
 * Get new cards (not yet seen) for a given level
 * @param {number} level - Level ID
 * @param {number} count - Number of new cards to return
 * @returns {Array} Array of new cards
 */
export function getNewCards(level, count = 10) {
  const levelId = String(level);
  if (!state.cards[levelId]) {
    return [];
  }
  // New cards: rep === 0 (never reviewed)
  return state.cards[levelId]
    .filter(card => card.rep === 0)
    .slice(0, count);
}

/**
 * Initialize cards for a level
 * Called after loading level data
 * @param {number} level - Level ID
 * @param {Array} cardIds - Array of card IDs to initialize
 */
export function initializeLevel(level, cardIds) {
  const levelId = String(level);
  state.cards[levelId] = cardIds.map(id => createCard(id));
  updateProgress(level);
  emit('levelLoaded', { level, count: cardIds.length });
}

/**
 * Update a card in the store (after review)
 * @param {number} level - Level ID
 * @param {Object} card - Updated card object
 */
export function updateCard(level, card) {
  const levelId = String(level);
  if (!state.cards[levelId]) return;

  const index = state.cards[levelId].findIndex(c => c.id === card.id);
  if (index !== -1) {
    state.cards[levelId][index] = card;
    updateProgress(level);
    emit('cardUpdated', { level, card });
  }
}

/**
 * Update progress stats for a level
 * @param {number} level - Level ID
 */
function updateProgress(level) {
  const levelId = String(level);
  if (!state.cards[levelId]) {
    state.progress[levelId] = { completed: 0, total: 0, dueToday: 0 };
    return;
  }

  const cards = state.cards[levelId];
  const completed = cards.filter(c => c.rep > 0).length;
  const dueToday = cards.filter(c => isDue(c)).length;

  state.progress[levelId] = {
    completed,
    total: cards.length,
    dueToday
  };
}

/**
 * Load user data from store (merge with existing state)
 * @param {Object} userData - User data object
 */
export function loadUserData(userData) {
  if (userData.cards) {
    state.cards = userData.cards;
  }
  if (userData.settings) {
    state.settings = { ...state.settings, ...userData.settings };
  }

  // Recalculate progress for all levels
  Object.keys(state.cards).forEach(levelId => {
    const level = parseInt(levelId);
    updateProgress(level);
  });

  emit('userDataLoaded', {});
}

/**
 * Get serializable state for saving (excluding functions)
 * @returns {Object} State ready for Firestore/storage
 */
export function getSerializableState() {
  return {
    cards: state.cards,
    currentLevel: state.currentLevel,
    settings: state.settings
  };
}
