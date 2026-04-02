# IELTS Language Lab - Build Progress Tracker

> Last updated: 2026-04-02
> Update this file at the end of each session.

---

## PHASE 0: DATA PIPELINE

| Step | Task | Status | Output File(s) | Notes |
|------|------|--------|-----------------|-------|
| P0-S01 | Extract Tier 1 vocabulary | DONE | tier1_raw.json | 1,680 words |
| P0-S02 | Extract Tier 2 vocabulary | DONE | tier2_raw.json | 1,185 words |
| P0-S03 | Extract discourse markers | DONE | discourse_markers.json | 141 markers |
| P0-S04 | Extract bridge/AWL/phrases | DONE | bridge_words.json, awl_words.json, key_phrases.json | 500 + 546 + 148 |
| P0-S05 | Parse sample essays | DONE | essays_parsed.json | 37 essays, 79 body paragraphs |
| P0-S06 | Classify sentences by type | DONE | sentence_bank.json | 428 sentences |
| P0-S07 | Parse speaking questions | DONE | speaking_part1/2/3.json | 36 topics, 60 cue cards, 269 Qs |
| P0-S08 | Cross-reference vocab x topics | PARTIAL | topic tags in tier1/tier2 | Needs completion |
| P0-S09 | Extract HTML app exercise data | DONE | app_exercises_raw.json | 95 exercises |
| P0-S11 | Build shared.json | DONE | shared.json | GPS + markers + ladder + manifest |
| P0-S12 | Bundle level JSONs | DONE | level-1.json through level-10.json | L1-6 have exercises, L7-10 need more |
| P0-S13 | Coverage report + validation | PARTIAL | | 95 exercises across 6 levels |
| P0-S14 | GATE 0 | PARTIAL | | Core data ready, some gaps remain |

---

## PHASE 1: APP SKELETON

| Step | Task | Status | Notes |
|------|------|--------|-------|
| P1-S01 | app.html + style.css | DONE | Design system complete |
| P1-S02 | state.js | DONE | Central store + event bus |
| P1-S03 | router.js | DONE | Hash-based, 6 routes |
| P1-S04 | loader.js | DONE | JSON fetch + memory cache |
| P1-S05 | srs.js (SM-2) | DONE | Pure functions |
| P1-S06 | auth.js (Firebase) | DONE | Needs Firebase config |
| P1-S07 | db.js (Firestore) | DONE | 1 doc per user, debounced |
| P1-S08 | offline.js (IndexedDB) | DONE | Fallback + merge strategy |
| P1-S09 | app.js + integration | DONE | Entry point with 6 screens |
| -- | GATE 1 | DONE | Skeleton complete |

---

## PHASE 2: CORE EXERCISES - TODO

Build exercise-shell.js + 10 individual exercise type modules.

## PHASE 3: UI + DASHBOARD - TODO

Home screen, level map, dashboard, responsive testing, polish.

## PHASE 4: BUILD + DEPLOY - TODO

build.sh, service worker, PWA manifest, GitHub Pages, Firebase production.

---

## SESSION LOG

| Date | Steps Completed | Notes |
|------|----------------|-------|
| 2026-04-01 | P0-S01 through P0-S07 | Raw data extraction |
| 2026-04-02 | P0-S09, P0-S11, P0-S12, P1-S01 through P1-S09 | App skeleton complete, exercises generated for L1 and L3 |
