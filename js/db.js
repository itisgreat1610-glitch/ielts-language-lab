// Firestore Database Module
// Uses Firebase compat SDK (loaded via CDN)
// Single document per user at /users/{uid}

let dbInstance = null;
let debounceTimers = {}; // Track debounce timers per user

/**
 * Get Firestore instance (initialize if needed)
 */
function getDbInstance() {
  if (!dbInstance) {
    // Initialize firebase app if not already done
    if (!firebase.apps.length) {
      throw new Error("Firebase app not initialized. Call initAuth first or initialize firebase manually.");
    }
    dbInstance = firebase.firestore();
    // Enable offline persistence
    dbInstance.enablePersistence().catch((err) => {
      if (err.code === "failed-precondition") {
        console.warn("Multiple tabs open, persistence disabled");
      } else if (err.code === "unimplemented") {
        console.warn("Browser doesn't support persistence");
      }
    });
  }
  return dbInstance;
}

/**
 * Create default user data object
 * @param {string} displayName - User's display name
 * @returns {Object} Default user data
 */
export function createDefaultUserData(displayName) {
  return {
    displayName,
    currentLevel: 1,
    streak: 0,
    lastActive: null,
    settings: {
      dailyGoal: 20,
      soundOn: true
    },
    progress: {
      level1: { learned: 0, accuracy: 0, done: false },
      level2: { learned: 0, accuracy: 0, done: false },
      level3: { learned: 0, accuracy: 0, done: false },
      level4: { learned: 0, accuracy: 0, done: false },
      level5: { learned: 0, accuracy: 0, done: false }
    },
    cards: {},
    lastSynced: new Date().toISOString()
  };
}

/**
 * Load user data from Firestore
 * @param {string} uid - User ID
 * @returns {Promise<Object>} User data object
 */
export async function loadUserData(uid) {
  const db = getDbInstance();

  try {
    const docSnap = await db.collection("users").doc(uid).get();

    if (docSnap.exists) {
      return docSnap.data();
    } else {
      // New user, return default data
      return createDefaultUserData("User");
    }
  } catch (error) {
    console.error("Error loading user data:", error);
    throw error;
  }
}

/**
 * Save user data to Firestore (immediate write)
 * @param {string} uid - User ID
 * @param {Object} data - User data to save
 * @returns {Promise<void>}
 */
export async function saveUserData(uid, data) {
  const db = getDbInstance();

  try {
    await db.collection("users").doc(uid).set(data, { merge: true });
  } catch (error) {
    console.error("Error saving user data:", error);
    throw error;
  }
}

/**
 * Debounced save to Firestore (10 second delay)
 * Automatically saves on page beforeunload
 * @param {string} uid - User ID
 * @param {Object} data - User data to save
 * @returns {void}
 */
export function debouncedSave(uid, data) {
  const db = getDbInstance();

  // Clear existing timer for this user
  if (debounceTimers[uid]) {
    clearTimeout(debounceTimers[uid]);
  }

  // Set new timer
  debounceTimers[uid] = setTimeout(async () => {
    try {
      await saveUserData(uid, data);
      delete debounceTimers[uid];
    } catch (error) {
      console.error("Debounced save failed:", error);
    }
  }, 10000); // 10 second delay

  // Also set up beforeunload to save immediately
  const handleBeforeUnload = async () => {
    // Clear the debounce timer and save immediately
    if (debounceTimers[uid]) {
      clearTimeout(debounceTimers[uid]);
      delete debounceTimers[uid];
    }
    try {
      await saveUserData(uid, data);
    } catch (error) {
      console.error("beforeunload save failed:", error);
    }
  };

  // Add listener if not already added (use a flag to avoid multiple listeners)
  if (!window._beforeunloadListenerAdded) {
    window.addEventListener("beforeunload", handleBeforeUnload);
    window._beforeunloadListenerAdded = true;
  }
}

/**
 * Flush all pending debounced saves
 * Useful before app shutdown
 * @returns {Promise<void>}
 */
export async function flushPendingSaves() {
  const db = getDbInstance();
  const timers = Object.keys(debounceTimers);

  for (const uid of timers) {
    if (debounceTimers[uid]) {
      clearTimeout(debounceTimers[uid]);
      delete debounceTimers[uid];
    }
  }
}
