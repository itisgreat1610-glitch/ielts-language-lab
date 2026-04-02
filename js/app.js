/**
 * app.js - Application Entry Point
 * Initializes the entire app on DOMContentLoaded
 */

import { state, setState, getState, emit, subscribe, getDueCards, getNewCards, initializeLevel } from './state.js';
import { initRouter, navigate, registerRoute } from './router.js';
import { loadShared, loadLevel, preloadLevel } from './loader.js';
import { createCard } from './srs.js';

// ============================================================================
// Placeholder Auth Module (to be replaced with real Firebase auth in Phase 2)
// ============================================================================
const auth = {
  user: null,
  onAuthChange: (callback) => {
    // For now, check localStorage for demo user
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      auth.user = JSON.parse(savedUser);
      callback(auth.user);
    }
  },
  signOut: () => {
    auth.user = null;
    localStorage.removeItem('user');
    setState({ user: null });
  }
};

// ============================================================================
// Placeholder DB Module (to be replaced with real Firebase in Phase 2)
// ============================================================================
const db = {
  loadUserData: async () => {
    const saved = localStorage.getItem('userData');
    if (saved) {
      return JSON.parse(saved);
    }
    return { cards: {} };
  },
  saveUserData: async (data) => {
    localStorage.setItem('userData', JSON.stringify(data));
  }
};

// ============================================================================
// Placeholder Offline Module (to be enhanced in Phase 2)
// ============================================================================
const offline = {
  init: () => {
    window.addEventListener('online', () => {
      setState({ isOnline: true });
      console.log('App is online');
    });
    window.addEventListener('offline', () => {
      setState({ isOnline: false });
      console.log('App is offline');
    });
  }
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format a date string for display
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @returns {string} Formatted date (e.g., "April 2")
 */
function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

/**
 * Get daily review summary
 * @returns {Object} { dueTotal, newTotal }
 */
function getDailySummary() {
  let dueTotal = 0;
  let newTotal = 0;

  Object.keys(state.cards).forEach(levelId => {
    const level = parseInt(levelId);
    dueTotal += getDueCards(level).length;
    newTotal += getNewCards(level, Infinity).length;
  });

  return { dueTotal, newTotal };
}

/**
 * Create HTML for level card
 * @param {number} levelNum - Level number
 * @param {boolean} isUnlocked - Whether level is unlocked
 * @returns {string} HTML string
 */
function createLevelCardHTML(levelNum, isUnlocked) {
  const progress = state.progress[String(levelNum)] || { completed: 0, total: 0, dueToday: 0 };
  const percentage = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;

  const locked = !isUnlocked ? 'locked' : '';
  const lockIcon = !isUnlocked ? '🔒' : '';

  return `
    <div class="level-card ${locked}" data-level="${levelNum}">
      <div class="level-number">${lockIcon}Level ${levelNum}</div>
      <div class="progress-info">
        <span class="progress-text">${progress.completed}/${progress.total}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${percentage}%"></div>
      </div>
      <div class="due-badge">${progress.dueToday} due today</div>
    </div>
  `;
}

// ============================================================================
// Screen Renderers
// ============================================================================

/**
 * Render home screen
 */
function renderHomeScreen() {
  const container = document.querySelector('[data-screen="home"]');
  if (!container) return;

  const { dueTotal, newTotal } = getDailySummary();
  const dailyGoal = state.settings.dailyGoal;
  const today = new Date().toISOString().split('T')[0];

  container.innerHTML = `
    <div class="screen-content">
      <h2>Welcome${state.user ? ', ' + (state.user.displayName || 'Learner') : ''}!</h2>

      <div class="daily-summary">
        <div class="summary-card">
          <div class="summary-number">${dueTotal}</div>
          <div class="summary-label">Due Today</div>
        </div>
        <div class="summary-card">
          <div class="summary-number">${newTotal}</div>
          <div class="summary-label">New Cards</div>
        </div>
        <div class="summary-card">
          <div class="summary-number">${dailyGoal}</div>
          <div class="summary-label">Daily Goal</div>
        </div>
      </div>

      <button class="btn btn-primary" id="start-practice-btn">
        Start Practice (${dueTotal > 0 ? 'Review' : 'Learn'})
      </button>

      <div class="quick-stats">
        <h3>Quick Stats</h3>
        ${Object.keys(state.progress).length === 0 ? '<p>No levels started yet. Choose a level to begin!</p>' : ''}
      </div>

      ${state.user ? `
        <button class="btn btn-secondary" id="sign-out-btn">Sign Out</button>
      ` : ''}
    </div>
  `;

  // Event listeners
  const startBtn = container.querySelector('#start-practice-btn');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      const firstLevel = state.currentLevel;
      navigate(`exercise/listening`);
    });
  }

  const signOutBtn = container.querySelector('#sign-out-btn');
  if (signOutBtn) {
    signOutBtn.addEventListener('click', () => {
      auth.signOut();
      navigate('login');
    });
  }
}

/**
 * Render levels screen
 */
function renderLevelsScreen() {
  const container = document.querySelector('[data-screen="levels"]');
  if (!container) return;

  const levelCount = 10;
  let html = '<div class="screen-content"><h2>IELTS Levels</h2><div class="levels-grid">';

  for (let i = 1; i <= levelCount; i++) {
    const isUnlocked = state.currentLevel >= i;
    html += createLevelCardHTML(i, isUnlocked);
  }

  html += '</div></div>';
  container.innerHTML = html;

  // Add click listeners to level cards
  container.querySelectorAll('.level-card:not(.locked)').forEach(card => {
    card.addEventListener('click', () => {
      const levelNum = parseInt(card.dataset.level);
      setState({ currentLevel: levelNum });
      navigate(`exercise/listening`);
    });
  });
}

/**
 * Render login screen
 */
function renderLoginScreen() {
  const container = document.querySelector('[data-screen="login"]');
  if (!container) return;

  container.innerHTML = `
    <div class="screen-content login-content">
      <h1>IELTS Language Lab</h1>
      <p class="subtitle">Master English for the IELTS exam</p>

      <div class="login-buttons">
        <button class="btn btn-google" id="google-sign-in-btn">
          Sign in with Google
        </button>
        <button class="btn btn-demo" id="demo-sign-in-btn">
          Continue as Demo User
        </button>
      </div>

      <p class="login-note">No account? We'll create one for you.</p>
    </div>
  `;

  // Demo sign in
  const demoBtn = container.querySelector('#demo-sign-in-btn');
  if (demoBtn) {
    demoBtn.addEventListener('click', async () => {
      const demoUser = {
        uid: 'demo-user',
        email: 'demo@example.com',
        displayName: 'Demo User'
      };
      localStorage.setItem('user', JSON.stringify(demoUser));
      setState({ user: demoUser });
      await initializeUserData();
      navigate('home');
    });
  }

  // Google sign in (placeholder)
  const googleBtn = container.querySelector('#google-sign-in-btn');
  if (googleBtn) {
    googleBtn.addEventListener('click', () => {
      alert('Google Sign-In will be implemented in Phase 2 with Firebase');
    });
  }
}

/**
 * Render dashboard screen
 */
function renderDashboardScreen() {
  const container = document.querySelector('[data-screen="dashboard"]');
  if (!container) return;

  const totalCompleted = Object.values(state.progress).reduce((sum, p) => sum + p.completed, 0);
  const totalCards = Object.values(state.progress).reduce((sum, p) => sum + p.total, 0);

  container.innerHTML = `
    <div class="screen-content">
      <h2>Dashboard</h2>

      <div class="stats-grid">
        <div class="stat-box">
          <div class="stat-number">${totalCards}</div>
          <div class="stat-label">Total Cards</div>
        </div>
        <div class="stat-box">
          <div class="stat-number">${totalCompleted}</div>
          <div class="stat-label">Completed</div>
        </div>
        <div class="stat-box">
          <div class="stat-number">${totalCards > 0 ? Math.round((totalCompleted / totalCards) * 100) : 0}%</div>
          <div class="stat-label">Overall Progress</div>
        </div>
      </div>

      <div class="stats-by-level">
        <h3>Progress by Level</h3>
        ${Object.keys(state.progress).map(levelId => {
          const level = parseInt(levelId);
          const p = state.progress[levelId];
          const pct = p.total > 0 ? Math.round((p.completed / p.total) * 100) : 0;
          return `
            <div class="level-stat">
              <span class="level-name">Level ${level}</span>
              <div class="mini-bar">
                <div class="mini-fill" style="width: ${pct}%"></div>
              </div>
              <span class="level-pct">${pct}%</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

/**
 * Render settings screen
 */
function renderSettingsScreen() {
  const container = document.querySelector('[data-screen="settings"]');
  if (!container) return;

  container.innerHTML = `
    <div class="screen-content">
      <h2>Settings</h2>

      <div class="settings-group">
        <label>Daily Goal (cards)</label>
        <div class="setting-control">
          <input type="number" id="daily-goal-input" value="${state.settings.dailyGoal}" min="1" max="50">
        </div>
      </div>

      <div class="settings-group">
        <label>Notifications</label>
        <div class="setting-control">
          <input type="checkbox" id="notifications-toggle" ${state.settings.notificationsEnabled ? 'checked' : ''}>
          <span>${state.settings.notificationsEnabled ? 'Enabled' : 'Disabled'}</span>
        </div>
      </div>

      <div class="settings-group">
        <label>Theme</label>
        <div class="setting-control">
          <select id="theme-select">
            <option value="light" ${state.settings.theme === 'light' ? 'selected' : ''}>Light</option>
            <option value="dark" ${state.settings.theme === 'dark' ? 'selected' : ''}>Dark</option>
          </select>
        </div>
      </div>

      <button class="btn btn-secondary" id="save-settings-btn">Save Settings</button>
    </div>
  `;

  // Event listeners
  const saveBtn = container.querySelector('#save-settings-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const newSettings = {
        dailyGoal: parseInt(container.querySelector('#daily-goal-input').value),
        notificationsEnabled: container.querySelector('#notifications-toggle').checked,
        theme: container.querySelector('#theme-select').value
      };
      setState({ settings: { ...state.settings, ...newSettings } });
      alert('Settings saved!');
    });
  }
}

/**
 * Render exercise screen (placeholder for Phase 2)
 */
function renderExerciseScreen(path, params) {
  const container = document.querySelector('[data-screen="exercise"]');
  if (!container) return;

  const exerciseType = params.type || 'listening';

  container.innerHTML = `
    <div class="screen-content exercise-placeholder">
      <h2>${exerciseType.charAt(0).toUpperCase() + exerciseType.slice(1)} Exercise</h2>
      <p>Level ${state.currentLevel}</p>
      <div class="placeholder-message">
        <p>Exercise content coming soon in Phase 2!</p>
        <p>This will include interactive listening, reading, and writing exercises.</p>
      </div>
      <button class="btn btn-secondary" onclick="window.history.back()">Back</button>
    </div>
  `;
}

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize user data (load from DB or create new)
 */
async function initializeUserData() {
  try {
    // Load shared data first
    const shared = await loadShared();

    // Load user's existing data
    const userData = await db.loadUserData();

    // If user has no cards for any level, initialize levels
    if (Object.keys(userData.cards || {}).length === 0) {
      // Initialize first level with cards
      const level1Data = await loadLevel(1);
      if (level1Data.cards) {
        initializeLevel(1, level1Data.cards.map(c => c.id));
      }
    } else {
      // Load existing user data
      state.cards = userData.cards;
      // Recalculate progress
      Object.keys(state.cards).forEach(levelId => {
        const level = parseInt(levelId);
        // This is already done in state.loadUserData
      });
    }

    // Load user settings if available
    if (userData.settings) {
      state.settings = { ...state.settings, ...userData.settings };
    }

    emit('userDataInitialized', {});
  } catch (err) {
    console.error('Failed to initialize user data:', err);
    // Continue anyway - user can still browse
  }
}

/**
 * Main app initialization
 */
async function initApp() {
  // Show splash screen
  const splash = document.querySelector('.splash-screen');
  if (splash) {
    splash.style.display = 'flex';
  }

  try {
    // Initialize online/offline detection
    offline.init();

    // Set up auth listener
    auth.onAuthChange(async (user) => {
      if (user) {
        setState({ user });
        // Load user data if not already loaded
        if (Object.keys(state.cards).length === 0) {
          await initializeUserData();
        }
        navigate('home');
      } else {
        setState({ user: null });
        navigate('login');
      }
    });

    // Check if already logged in
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setState({ user });
      await initializeUserData();
      navigate('home');
    } else {
      navigate('login');
    }

    // Register all routes
    registerRoute('home', renderHomeScreen);
    registerRoute('levels', renderLevelsScreen);
    registerRoute('login', renderLoginScreen);
    registerRoute('dashboard', renderDashboardScreen);
    registerRoute('settings', renderSettingsScreen);
    registerRoute('exercise', renderExerciseScreen);

    // Initialize router (must be after registering routes)
    initRouter();

    // Set up bottom navigation
    const navButtons = {
      'nav-home': 'home',
      'nav-levels': 'levels',
      'nav-dashboard': 'dashboard',
      'nav-settings': 'settings'
    };

    Object.entries(navButtons).forEach(([id, path]) => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener('click', () => navigate(path));
      }
    });

    // Subscribe to state changes for bottom nav highlighting
    subscribe('routeChanged', ({ path }) => {
      document.querySelectorAll('[data-nav]').forEach(el => {
        el.classList.remove('active');
      });
      const activeBtn = document.querySelector(`[data-nav="${path}"]`);
      if (activeBtn) {
        activeBtn.classList.add('active');
      }
    });

    console.log('App initialized successfully');
  } catch (err) {
    console.error('App initialization failed:', err);
  } finally {
    // Hide splash screen
    if (splash) {
      splash.style.display = 'none';
    }
  }
}

// ============================================================================
// Start the app when DOM is ready
// ============================================================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
