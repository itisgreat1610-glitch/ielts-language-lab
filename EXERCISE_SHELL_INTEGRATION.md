# Exercise Shell Integration Guide

## Overview

The exercise shell (`js/ui/exercise-shell.js`) is now ready to use. This document shows how to integrate it with your existing app architecture and exercise modules.

## Files Created

1. **js/ui/exercise-shell.js** (12 KB)
   - Universal wrapper for all exercise types
   - Handles UI, feedback, SRS updates, results collection

2. **js/ui/EXERCISE_SHELL_README.md** (11 KB)
   - Complete API documentation
   - DOM structure reference
   - CSS customization guide

3. **js/exercises/example-module.js** (7.7 KB)
   - Template exercise module
   - Shows required interface
   - Ready to copy and modify

4. **css/style.css** (updated)
   - Added 500+ lines of exercise shell styles
   - Animations: shake, bounce, pulse, greenPulse, slideUp
   - Responsive design using existing design tokens

## Quick Start

### 1. Create an Exercise Module

Copy `js/exercises/example-module.js` and modify:

```javascript
export const wordMatchModule = {
  meta: {
    name: 'Word Match',
    description: 'Match words with definitions',
    type: 'word-match'
  },

  generateItems(levelData) {
    // Transform levelData into exercise items
    return levelData.slice(0, 10);
  },

  render(container, item, answerCallback) {
    // Create UI
    container.innerHTML = `<div>...</div>`;

    // Handle answer submission
    container.querySelector('button').addEventListener('click', () => {
      const userAnswer = /* get user input */;
      const isCorrect = /* check if correct */;
      answerCallback(userAnswer, isCorrect, {
        correct: /* correct answer */
      });
    });
  }
};
```

### 2. Integrate with Router

In your `router.js` or screen component:

```javascript
import { startExercise } from './ui/exercise-shell.js';
import { wordMatchModule } from './exercises/word-match.js';
import { loadLevel } from './loader.js';

// When user clicks "Start Exercise"
async function handleStartExercise(type, level) {
  const levelData = await loadLevel(level);
  const container = document.getElementById('app-root');

  startExercise(container, {
    exerciseType: type,
    levelData: levelData,
    exerciseModule: wordMatchModule,
    currentLevel: level,
    onComplete: (results) => {
      if (results) {
        console.log('Score:', results.score, '/', results.total);
        // Navigate back to level screen, show toast, etc.
      }
    }
  });
}
```

### 3. With Timer (Optional)

```javascript
startExercise(container, {
  exerciseType: 'word-match',
  levelData: levelData,
  exerciseModule: wordMatchModule,
  currentLevel: 3,
  timed: true,
  timeLimit: 300, // seconds
  onComplete: handleResults
});
```

## Module Interface Checklist

Every exercise module MUST have:

- [ ] `meta.name` — Display name (e.g., "Word Match")
- [ ] `meta.description` — Brief description
- [ ] `meta.type` — Unique type identifier (e.g., "word-match")
- [ ] `render(container, item, answerCallback)` — Render a single item
- [ ] `generateItems(levelData)` (optional) — Transform raw data

The `render()` function MUST:

- [ ] Accept `container` (HTMLElement), `item` (Object), `answerCallback` (Function)
- [ ] Clear the container and render the exercise UI
- [ ] Call `answerCallback(userAnswer, isCorrect, details)` when user submits
- [ ] Pass `isCorrect` as a boolean
- [ ] Include `{ correct: ... }` in details for incorrect answers

## State Management

The shell automatically updates SRS cards through the state store:

```javascript
// For each answered item:
updateCard(level, updatedCard);
```

This means:
- Cards are tracked by item ID
- Quality scores: 5 (correct), 2 (incorrect)
- Next review dates are calculated by SM-2 algorithm
- All changes sync to localStorage and Firebase (Phase 2)

## Results Flow

When exercise completes, `onComplete(results)` receives:

```javascript
{
  exerciseType: 'word-match',
  score: 8,                     // Items answered correctly
  total: 10,                    // Total items in exercise
  accuracy: 80,                 // Percentage (0-100)
  time: 150,                    // Seconds elapsed
  mistakes: [                   // Array of incorrect answers
    {
      index: 2,
      item: { ... },
      userAnswer: '...',
      correctAnswer: '...'
    }
  ],
  results: [                    // Every item (correct or not)
    {
      index: 0,
      item: { ... },
      userAnswer: '...',
      isCorrect: true,
      details: { ... }
    }
  ]
}
```

If user clicks back button, `onComplete(null)` is called.

## Styling & Customization

### Colors (from design system)

- Primary: `--accent-indigo` (#3D5A80)
- Success: `--accent-matcha` (#A3B18A)
- Error: `--accent-coral` (#C1666B)
- Background: `--bg-cream` (#FDF6EC)

### Key CSS Classes

- `.exercise-shell` — Root container
- `.exercise-header` — Sticky header (back btn, title, counter)
- `.exercise-body` — Scrollable content area
- `.exercise-feedback` — Fixed feedback card (bottom)
- `.exercise-results` — Modal results screen
- `.correct` / `.incorrect` — Feedback states

### Animations

All defined in CSS. Modify in `style.css`:

```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-8px); }
  75% { transform: translateX(8px); }
}

@keyframes greenPulse {
  0%, 100% { box-shadow: var(--shadow-lg); }
  50% { box-shadow: 0 0 0 8px rgba(163, 177, 138, 0.2); }
}
```

### Override Timing

In `exercise-shell.js`, change these constants:

```javascript
// Auto-advance after answer
setTimeout(() => { ... }, 1500); // milliseconds

// Timer countdown interval
timerInterval = setInterval(() => { ... }, 1000); // milliseconds
```

## Existing Exercise Modules

The exercises directory already contains implementations:

- `word-match.js` — Match words with definitions
- `collocation.js` — Identify collocations
- `gap-fill.js` — Fill blanks in sentences
- `gps-placement.js` — GPS framework (Point, Explain, Show, Effect)
- `sentence-transform.js` — Transform sentences
- `sentence-type-id.js` — Identify sentence types
- `paragraph-assembly.js` — Assemble paragraphs
- `b1-b2-upgrade.js` — B1→B2 vocabulary upgrade

All should already conform to the module interface. Verify by checking their exports:

```bash
grep -l "export const.*Module = {" js/exercises/*.js
grep "meta:" js/exercises/*.js
```

## Testing

### Unit Test (Module Interface)

```javascript
import { wordMatchModule } from './exercises/word-match.js';

// Check interface
console.assert(wordMatchModule.meta, 'Missing meta');
console.assert(wordMatchModule.render, 'Missing render function');
console.assert(wordMatchModule.generateItems, 'Missing generateItems function');

// Test render
const container = document.createElement('div');
const item = { word: 'test', definition: 'test' };
const callback = (answer, isCorrect) => {
  console.log('Answer:', answer, 'Correct:', isCorrect);
};

wordMatchModule.render(container, item, callback);
console.assert(container.innerHTML, 'Render produced no output');
```

### Integration Test (Full Exercise)

```javascript
import { startExercise } from './ui/exercise-shell.js';
import { wordMatchModule } from './exercises/word-match.js';

const container = document.getElementById('test-container');
const levelData = [
  { id: 'word1', word: 'test', definition: 'evaluation' },
  { id: 'word2', word: 'sample', definition: 'example' }
];

startExercise(container, {
  exerciseType: 'word-match',
  levelData,
  exerciseModule: wordMatchModule,
  currentLevel: 1,
  onComplete: (results) => {
    console.log('Results:', results);
    // Verify results structure
    console.assert(results.score !== undefined);
    console.assert(results.accuracy !== undefined);
    console.assert(results.time !== undefined);
  }
});
```

## Troubleshooting

### Exercise doesn't load

- Check browser console for errors
- Verify module exports: `export const wordMatchModule = { ... }`
- Confirm `render()` and `answerCallback` are called
- Check that levelData has required fields

### Feedback not showing

- Verify `isCorrect` is a boolean (true/false)
- Check that `answerCallback()` is called with 3 arguments
- Ensure CSS classes `.correct` and `.incorrect` are in stylesheet

### Timer not working

- Verify `timed: true` is passed in options
- Check `timeLimit` is in seconds (number)
- Confirm `clearInterval()` is not being called prematurely

### SRS cards not updating

- Verify `state` is imported from `state.js`
- Check that item has an `id` field (or shell generates one)
- Confirm `updateCard()` is being called
- Review `srs.js` review() function quality values

### Results modal not showing

- Check that `finishExercise()` is called
- Verify all items were answered (currentIndex >= totalItems)
- Ensure `.exercise-results` element exists in DOM

## Architecture Diagram

```
Router/Screen Component
  ↓
startExercise(container, options)
  ├─ Parse options
  ├─ Create DOM structure
  ├─ Initialize state
  ├─ Start timer (if timed)
  ├─ renderItem()
  │   └─ exerciseModule.render()
  │       └─ User interacts
  │           └─ answerCallback()
  │               ├─ Record result
  │               ├─ Update score/mistakes
  │               ├─ Show feedback
  │               ├─ Wait 1.5s
  │               └─ renderItem() [next]
  ├─ finishExercise()
  │   ├─ Stop timer
  │   ├─ updateSRSCards()
  │   │   └─ review(card, quality)
  │   │       └─ updateCard(level, card)
  │   └─ showResults()
  │       └─ onComplete(results)
  └─ Return cleanup function

Results Flow:
onComplete(results) → Router navigates away
                    → Show toast
                    → Update progress UI
                    → Save to Firebase (Phase 2)
```

## Next Steps

1. **Test with existing modules** — Run exercises through the shell
2. **Verify SRS updates** — Check localStorage for updated cards
3. **Add to router** — Create exercise routes in `router.js`
4. **Create exercise screens** — Build level→exercise→results flow
5. **Phase 2 integration** — Connect to Firebase auth and Firestore

## Phase 2: Firebase Sync

When integrating with Firebase (Phase 2):

```javascript
// In db.js, after exercise:
await db.saveUserData({
  cards: state.cards,
  currentLevel: state.currentLevel,
  settings: state.settings
});

// Consider:
- Batch updates (save after multiple exercises, not each one)
- Offline queue (IndexedDB, merge on sync)
- Analytics (log exercise completions, time, scores)
```

## Known Limitations

- No item persistence (if page reloads mid-exercise, progress is lost)
- No hint system yet
- No difficulty leveling (all items same weight)
- Timer doesn't pause if user switches tabs
- No accessibility announcements (screen readers)

These can be added in future iterations.

## Support

For questions or issues:
1. Check `EXERCISE_SHELL_README.md` for detailed API docs
2. Review `js/exercises/example-module.js` for module template
3. Examine existing exercises for implementation examples
4. Check browser console for error messages

---

**Status:** Exercise shell complete and ready for integration.
**Created:** 2026-04-02
**Version:** 1.0.0
**Dependencies:** state.js, srs.js, CSS design system
