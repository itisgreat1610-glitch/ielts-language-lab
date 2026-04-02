// IndexedDB Offline Module
// Provides offline storage and sync capabilities when Firestore is unavailable

const DB_NAME = "ielts-lab";
const DB_VERSION = 1;
const STORE_USERDATA = "userData";
const STORE_PENDING = "pendingWrites";

let db = null;

/**
 * Initialize IndexedDB database
 * @returns {Promise<IDBDatabase>}
 */
export function initOffline() {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error("IndexedDB open error:", request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const newDb = event.target.result;

      // Create userData store
      if (!newDb.objectStoreNames.contains(STORE_USERDATA)) {
        newDb.createObjectStore(STORE_USERDATA, { keyPath: "uid" });
      }

      // Create pendingWrites store
      if (!newDb.objectStoreNames.contains(STORE_PENDING)) {
        newDb.createObjectStore(STORE_PENDING, { keyPath: "id", autoIncrement: true });
      }
    };
  });
}

/**
 * Save user data to IndexedDB
 * @param {Object} data - User data object (should include uid)
 * @returns {Promise<void>}
 */
export async function saveLocal(data) {
  if (!db) {
    await initOffline();
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_USERDATA], "readwrite");
    const store = tx.objectStore(STORE_USERDATA);
    const request = store.put(data);

    request.onerror = () => {
      console.error("Error saving to IndexedDB:", request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve();
    };
  });
}

/**
 * Load user data from IndexedDB by uid
 * @param {string} uid - User ID (optional, if not provided loads last saved)
 * @returns {Promise<Object|null>}
 */
export async function loadLocal(uid) {
  if (!db) {
    await initOffline();
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_USERDATA], "readonly");
    const store = tx.objectStore(STORE_USERDATA);

    let request;
    if (uid) {
      request = store.get(uid);
    } else {
      // Get all and return the first one (for single-user scenario)
      request = store.getAll();
    }

    request.onerror = () => {
      console.error("Error loading from IndexedDB:", request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      if (uid) {
        resolve(request.result || null);
      } else {
        const results = request.result;
        resolve(results.length > 0 ? results[0] : null);
      }
    };
  });
}

/**
 * Queue a pending write for sync when back online
 * @param {Object} data - Data to queue (should include uid)
 * @returns {Promise<number>} - ID of the queued write
 */
export async function queueWrite(data) {
  if (!db) {
    await initOffline();
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_PENDING], "readwrite");
    const store = tx.objectStore(STORE_PENDING);

    const writeRecord = {
      uid: data.uid,
      timestamp: Date.now(),
      data
    };

    const request = store.add(writeRecord);

    request.onerror = () => {
      console.error("Error queuing write:", request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };
  });
}

/**
 * Get all pending writes
 * @returns {Promise<Array>}
 */
export async function getPendingWrites() {
  if (!db) {
    await initOffline();
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_PENDING], "readonly");
    const store = tx.objectStore(STORE_PENDING);
    const request = store.getAll();

    request.onerror = () => {
      console.error("Error getting pending writes:", request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };
  });
}

/**
 * Remove a pending write by id
 * @param {number} id - ID of the pending write
 * @returns {Promise<void>}
 */
export async function removePendingWrite(id) {
  if (!db) {
    await initOffline();
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_PENDING], "readwrite");
    const store = tx.objectStore(STORE_PENDING);
    const request = store.delete(id);

    request.onerror = () => {
      console.error("Error removing pending write:", request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve();
    };
  });
}

/**
 * Sync pending writes to Firestore
 * Uses merge strategy: keep card with latest "last" date
 * @param {string} uid - User ID
 * @param {Function} saveToFirestore - Firestore save function (from db.js)
 * @returns {Promise<number>} - Number of synced writes
 */
export async function syncPending(uid, saveToFirestore) {
  if (!db) {
    await initOffline();
  }

  try {
    const pendingWrites = await getPendingWrites();
    const userWrites = pendingWrites.filter(w => w.uid === uid);

    if (userWrites.length === 0) {
      return 0;
    }

    // Load current data from IndexedDB as base
    let mergedData = await loadLocal(uid);
    if (!mergedData) {
      console.warn("No local data found for merge");
      return 0;
    }

    // Merge all pending writes
    for (const write of userWrites) {
      mergedData = mergeData(mergedData, write.data);
    }

    // Save merged data to Firestore
    await saveToFirestore(uid, mergedData);

    // Remove synced writes
    for (const write of userWrites) {
      await removePendingWrite(write.id);
    }

    return userWrites.length;
  } catch (error) {
    console.error("Error syncing pending writes:", error);
    throw error;
  }
}

/**
 * Merge two data objects, keeping the card with the latest "last" date
 * @param {Object} base - Base data
 * @param {Object} update - Data to merge in
 * @returns {Object} - Merged data
 */
function mergeData(base, update) {
  const merged = { ...base, ...update };

  // Special merge logic for cards object
  if (base.cards && update.cards) {
    merged.cards = { ...base.cards };

    for (const cardKey in update.cards) {
      const baseCard = base.cards[cardKey];
      const updateCard = update.cards[cardKey];

      if (baseCard && updateCard) {
        // Keep the card with the latest "last" date
        const baseTime = new Date(baseCard.last || 0).getTime();
        const updateTime = new Date(updateCard.last || 0).getTime();
        merged.cards[cardKey] = updateTime >= baseTime ? updateCard : baseCard;
      } else {
        merged.cards[cardKey] = updateCard;
      }
    }
  }

  return merged;
}

/**
 * Check if device is online
 * @returns {boolean}
 */
export function isOnline() {
  return navigator.onLine;
}

/**
 * Set up online/offline listeners
 * @param {Function} onOnline - Callback when coming online
 * @param {Function} onOffline - Callback when going offline
 * @returns {void}
 */
export function setupNetworkListeners(onOnline, onOffline) {
  window.addEventListener("online", () => {
    console.log("Device is online");
    if (onOnline) onOnline();
  });

  window.addEventListener("offline", () => {
    console.log("Device is offline");
    if (onOffline) onOffline();
  });
}
