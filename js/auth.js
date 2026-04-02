// Firebase Authentication Module
// Uses Firebase compat SDK (loaded via CDN)

// TODO: Replace with your Firebase config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase if not already initialized
let authInstance = null;

function getAuthInstance() {
  if (!authInstance) {
    firebase.initializeApp(firebaseConfig);
    authInstance = firebase.auth();
  }
  return authInstance;
}

/**
 * Initialize authentication listener
 * @param {Function} onAuthChange - Callback when auth state changes
 *                                 Called with user object or null
 */
export function initAuth(onAuthChange) {
  const auth = getAuthInstance();

  auth.onAuthStateChanged((user) => {
    if (user) {
      onAuthChange({
        uid: user.uid,
        displayName: user.displayName || "User",
        email: user.email,
        photoURL: user.photoURL
      });
    } else {
      onAuthChange(null);
    }
  });
}

/**
 * Sign in with Google using popup
 */
export async function signIn() {
  const auth = getAuthInstance();
  const provider = new firebase.auth.GoogleAuthProvider();

  try {
    const result = await auth.signInWithPopup(provider);
    return result.user;
  } catch (error) {
    console.error("Google sign-in error:", error);
    throw error;
  }
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const auth = getAuthInstance();

  try {
    await auth.signOut();
  } catch (error) {
    console.error("Sign-out error:", error);
    throw error;
  }
}

/**
 * Get the current user
 * @returns {Object|null} User object or null if not signed in
 */
export function getUser() {
  const auth = getAuthInstance();
  return auth.currentUser ? {
    uid: auth.currentUser.uid,
    displayName: auth.currentUser.displayName || "User",
    email: auth.currentUser.email,
    photoURL: auth.currentUser.photoURL
  } : null;
}
