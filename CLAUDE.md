# IELTS Language Lab

## What This Is
A web app that trains IELTS students to deploy ~3,000 vocabulary items in the right exam context. Built as a single-page app with ES modules, Firebase auth, Firestore sync, and spaced repetition.

## Architecture
- **Single-page app** served from app.html
- **state.js** is THE HUB — every module reads/writes through it
- **Hash-based routing** (#/home, #/levels, #/exercise/:type, etc.)
- **10 levels**, each with a level-N.json data file
- **Exercise modules** are self-contained: receive data, return results
- **SM-2 spaced repetition** tracks 3 dimensions per card

## File Structure
```
app.html              ← SPA shell
css/style.css         ← Design system (Apple × Japanese retro)
js/
  app.js              ← Entry point
  state.js            ← Central store + event bus
  router.js           ← Hash-based routing
  loader.js           ← JSON data fetcher + cache
  srs.js              ← SM-2 algorithm (pure functions)
  auth.js             ← Firebase Google login
  db.js               ← Firestore read/write (1 doc per user)
  offline.js          ← IndexedDB fallback + merge
data/
  shared.json         ← GPS defs, band ladder, discourse markers
  level-1.json        ← through level-10.json
```

## Key Rules
- No module imports from another except through state.js
- Exercise modules export: render(container, data, callbacks)
- Firestore: 1 document per user (batched cards map)
- Dev server: `python3 -m http.server 8000`
- Production: esbuild bundle + GitHub Pages

## Current Status
- Phase 0 (Data Pipeline): Levels 1-6 have exercises, 7-10 need exercise generation
- Phase 1 (App Skeleton): Complete
- Phase 2 (Core Exercises): TODO — build exercise-shell.js + 10 exercise type modules
- Phase 3 (UI + Dashboard): TODO
- Phase 4 (Build + Deploy): TODO

## Firebase Setup
Replace placeholder config in js/auth.js with your Firebase project credentials.
Enable Google sign-in in Firebase Console > Authentication.
Create Firestore database with security rules.
