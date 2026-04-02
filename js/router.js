/**
 * router.js - Hash-based Router
 * Handles client-side routing and screen management
 */

import { state, emit } from './state.js';

// Route registry: path -> render function
const routes = {};

// Current route
let currentRoute = {
  path: 'home',
  params: {}
};

/**
 * Parse hash path and extract route + params
 * Examples:
 *   #/home -> { path: 'home', params: {} }
 *   #/exercise/listening -> { path: 'exercise', params: { type: 'listening' } }
 *
 * @param {string} hash - Hash string (e.g., "#/home" or "#/exercise/listening")
 * @returns {Object} { path, params }
 */
function parseHash(hash) {
  // Remove leading #/
  let path = hash.replace(/^#\/?/, '') || 'home';

  // Handle parameterized routes
  const parts = path.split('/');
  const basePath = parts[0] || 'home';

  const params = {};

  if (basePath === 'exercise' && parts[1]) {
    params.type = parts[1];
  }

  return { path: basePath, params };
}

/**
 * Get the render function for a route
 * @param {string} path - Route path
 * @returns {Function|null} Render function or null
 */
function getRenderFunction(path) {
  return routes[path] || null;
}

/**
 * Navigate to a path
 * @param {string} path - Path to navigate to (e.g., "home", "levels", "exercise/listening")
 */
export function navigate(path) {
  // Ensure path doesn't start with #/
  path = path.replace(/^#\/?/, '');

  // Set hash (will trigger hashchange event)
  window.location.hash = `#/${path}`;
}

/**
 * Get current route
 * @returns {Object} Current route object { path, params }
 */
export function getCurrentRoute() {
  return { ...currentRoute };
}

/**
 * Register a route with its render function
 * @param {string} path - Route path (e.g., "home", "levels", "exercise")
 * @param {Function} renderFn - Render function that accepts (path, params)
 */
export function registerRoute(path, renderFn) {
  routes[path] = renderFn;
  console.log(`Registered route: ${path}`);
}

/**
 * Render the current route
 * Hides all screens, shows the active one, calls render function
 */
function renderRoute() {
  const { path, params } = currentRoute;

  // Hide all screen elements
  document.querySelectorAll('[data-screen]').forEach(screen => {
    screen.style.display = 'none';
  });

  // Show the screen for this path
  const screenEl = document.querySelector(`[data-screen="${path}"]`);
  if (screenEl) {
    screenEl.style.display = 'block';
  }

  // Call the render function if registered
  const renderFn = getRenderFunction(path);
  if (renderFn) {
    try {
      renderFn(path, params);
    } catch (err) {
      console.error(`Error rendering ${path}:`, err);
    }
  } else {
    console.warn(`No render function registered for route: ${path}`);
  }

  // Update state
  state.currentScreen = path;
  emit('routeChanged', { path, params });
}

/**
 * Handle hash change event
 */
function handleHashChange() {
  currentRoute = parseHash(window.location.hash);
  renderRoute();
}

/**
 * Initialize router
 * Call this once on app startup
 */
export function initRouter() {
  // Listen to hash changes
  window.addEventListener('hashchange', handleHashChange);

  // Render initial route
  if (!window.location.hash) {
    // No hash - default to home or login
    const defaultPath = state.user ? 'home' : 'login';
    navigate(defaultPath);
  } else {
    // Render current hash
    handleHashChange();
  }

  console.log('Router initialized');
}

/**
 * Get all registered routes (for debugging)
 * @returns {Object} Routes object
 */
export function getRoutes() {
  return { ...routes };
}
