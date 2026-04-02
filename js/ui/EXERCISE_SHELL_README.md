# Exercise Shell Module

The exercise shell is a universal wrapper that orchestrates all exercise types in the IELTS Language Lab. It handles the UI chrome (header, progress bar, timer), feedback animations, SRS card updates, and results collection.

## Architecture

```
startExercise()
  ├── Renders DOM structure
  ├── Initializes state (score, mistakes, results)
  ├── Manages exercise lifecycle
  │   ├── renderItem() → calls exerciseModule.render()
  │   ├── handleAnswer() → collects result, shows feedback
  │   ├── showFeedback() → displays correct/incorrect animation
  │   ├── finishExercise() → stops timer, updates SRS, shows results
  │   └── updateSRSCards() → calls review() for each item
  └── Returns cleanup function
```

## Usage

### Basic Example

```javascript
import { startExercise } from './js/ui/exercise-shell.js';
import { wordMatchModule } from './js/exercises/word-match.js';

// In your router/app code:
const container = document.getElementById('exercise-container');

startExercise(container, {
  exerciseType: 'word-match',
  levelData: levelDataFromJson,
  exerciseModule: wordMatchModule,
  currentLevel: 3,
  onComplete: (results) => {
    console.log('Exercise finished:', results);
    // Navigate back, update progress, etc.
  }
});
```

### With Timer

```javascript
startExercise(container, {
  exerciseType: 'fill-blank',
  levelData: levelData,
  exerciseModule: fillBlankModule,
  currentLevel: 3,
  timed: true,
  timeLimit: 300, // seconds
  onComplete: handleResults
});
```

## Exercise Module Interface

Each exercise type (word-match, fill-blank, etc.) must export an object with this structure:

```javascript
export const wordMatchModule = {
  // Metadata
  meta: {
    name: 'Word Match',
    description: 'Match words with definitions',
    type: 'word-match'
  },

  // Generate exercise items (optional)
  // If not provided, shell uses levelData directly
  generateItems(levelData) {
    return levelData.slice(0, 10).map((item, idx) => ({
      id: item.id,
      word: item.word,
      definition: item.definition,
      distractors: [...] // for matching exercises
    }));
  },

  // Render a single exercise item
  // MUST call answerCallback when user submits
  render(container, item, answerCallback) {
    // Create UI for this item
    const html = `
      <div class="word-match-item">
        <p>${item.word}</p>
        <select id="match-select">
          <option>Choose...</option>
          ${item.options.map(opt => `<option value="${opt.id}">${opt.text}</option>`).join('')}
        </select>
      </div>
    `;
    container.innerHTML = html;

    // When user selects answer:
    container.querySelector('#match-select').addEventListener('change', (e) => {
      const userAnswer = e.target.value;
      const isCorrect = userAnswer === item.correctId;

      // Call the callback with: (userAnswer, isCorrect, details)
      answerCallback(userAnswer, isCorrect, {
        correct: item.correctId
      });
    });
  }
};
```

### `answerCallback` Signature

```javascript
answerCallback(userAnswer, isCorrect, details = {})
```

**Parameters:**
- `userAnswer` (any): What the user submitted (string, number, etc.)
- `isCorrect` (boolean): Whether answer was correct
- `details` (object): Optional context for feedback
  - `correct`: The correct answer (for error messages)
  - `explanation`: Optional explanation text

The shell automatically:
1. Records the answer
2. Shows feedback animation (✓ or ✗)
3. Updates score
4. Tracks mistakes
5. Waits 1.5 seconds
6. Advances to next item

## Shell Lifecycle

### 1. Initialization
- Clears container and creates DOM structure
- Generates exercise items
- Initializes state (score=0, mistakes=[], etc.)

### 2. Item Rendering Loop
```
[Header: "Word Match 1/10"] ← Shows current progress
[Progress Bar: ====>        ] ← Updates per item
[Exercise Body]             ← Calls exerciseModule.render()
                             ← User interacts with item
[Feedback: "✓ Correct!"]    ← Auto-hidden after 1.5s
↓ (next item)
[Header: "Word Match 2/10"] ← Counter updates
```

### 3. Result Collection
- Stores every answer in `results[]`
- Tracks mistakes for review
- Updates SRS card for each item
  - Quality = 5 (perfect) if correct
  - Quality = 2 (difficult) if incorrect
  - Calls `review(card, quality)` from srs.js
  - Calls `updateCard(level, updatedCard)` to save

### 4. Results Screen
- Shows:
  - Score (8/10)
  - Accuracy (80%)
  - Time elapsed (2:30)
  - "Continue" button → calls onComplete(results)
  - "Review Mistakes" button (if any mistakes)
- Confetti animation if score > 80%

### 5. Mistake Review (Optional)
- Lists each mistake with:
  - Item text
  - User's answer
  - Correct answer
- Back button returns to results

## Results Object

When `onComplete` is called, it receives:

```javascript
{
  exerciseType: 'word-match',
  score: 8,
  total: 10,
  accuracy: 80,
  time: 150, // seconds
  mistakes: [
    {
      index: 2,
      item: { id: 'vocab-003', word: '...', ... },
      userAnswer: 'wrong-id',
      correctAnswer: 'correct-id'
    },
    // ...
  ],
  results: [
    { index: 0, item: {...}, userAnswer: '...', isCorrect: true, details: {...} },
    // ... one per item
  ]
}
```

Or `null` if user clicked back (cancellation).

## DOM Structure

```html
<div class="exercise-shell">
  <div class="exercise-header">
    <button class="exercise-back-btn">←</button>
    <span class="exercise-title">Word Match</span>
    <span class="exercise-counter">3 / 10</span>
  </div>

  <div class="exercise-progress-container">
    <div class="exercise-progress">
      <div class="exercise-progress-fill" style="width: 30%"></div>
    </div>
    <div class="exercise-timer">2:15</div> <!-- if timed -->
  </div>

  <div class="exercise-body">
    <!-- exerciseModule.render() outputs here -->
  </div>

  <div class="exercise-feedback hidden">
    <div class="feedback-content">
      <div class="feedback-icon">✓</div>
      <div class="feedback-text">Correct!</div>
    </div>
  </div>

  <div class="exercise-results hidden">
    <div class="results-content">
      <h2>Exercise Complete!</h2>
      <div class="results-stats">
        <div class="stat">
          <div class="stat-label">Score</div>
          <div class="stat-value">8 / 10</div>
        </div>
        <!-- ... -->
      </div>
      <div class="results-buttons">
        <button class="btn btn-primary continue-btn">Continue</button>
        <button class="btn btn-secondary review-btn">Review Mistakes</button>
      </div>
    </div>
  </div>
</div>
```

## CSS Classes

**Core Layout:**
- `.exercise-shell` — Root container, flex column layout
- `.exercise-header` — Sticky header with back button, title, counter
- `.exercise-body` — Scrollable main area for exercise content

**States:**
- `.hidden` — Hide an element (display: none)
- `.correct` — Green feedback style + pulse animation
- `.incorrect` — Red feedback style + shake animation

**Feedback:**
- `.exercise-feedback` — Fixed bottom card, auto-hides after 1.5s
- `.exercise-results` — Modal overlay with results summary

**Animations:**
- `slideUp` — Used by feedback and results containers
- `shake` — Incorrect answer feedback
- `bounce` — Feedback icon animation
- `greenPulse` — Correct answer feedback glow
- `pulse` — Timer when critical

## SRS Integration

The shell automatically handles spaced repetition:

```javascript
// For each answered item:
const quality = isCorrect ? 5 : 2;
const updatedCard = review(card, quality);
updateCard(level, updatedCard);
```

This means:
- Correct answers get quality = 5 (perfect)
- Incorrect answers get quality = 2 (difficult)
- The SM-2 algorithm calculates the next review date
- Cards are updated in the central state store

**Note:** Cards are matched by item ID. If your levelData items don't have an `id` field, the shell generates one as `${exerciseType}-${index}`.

## Timer Behavior

When `timed: true` and `timeLimit` is set:

1. Timer displays in top-right corner
2. Counts down in MM:SS format
3. When time runs out:
   - Exercise automatically finishes
   - Current item is NOT submitted
   - Results screen shows elapsed time
4. Timer stays visible until exercise ends

## Customization

### Styling

All colors and spacing use CSS custom properties from the design system:
- `--accent-indigo` — Primary color
- `--accent-matcha` — Success color
- `--accent-coral` — Error color
- `--spacing-*` — Spacing scale

Override in your CSS or modify `:root` variables.

### Feedback Messages

Edit the feedback display logic in `showFeedback()`:

```javascript
if (isCorrect) {
  text.textContent = 'Correct!'; // ← Change this
} else {
  text.textContent = `The answer was: ${details.correct}`;
}
```

### Progress Bar

The progress bar fills based on item index:
```javascript
const percent = ((currentIndex + 1) / totalItems) * 100;
progressContainer.querySelector('.exercise-progress-fill').style.width = `${percent}%`;
```

### Auto-advance Timing

Change the timeout in `handleAnswer()`:
```javascript
setTimeout(() => {
  currentIndex += 1;
  if (currentIndex < totalItems) renderItem();
  else finishExercise();
}, 1500); // ← Milliseconds before auto-advance
```

## Error Handling

The shell includes basic error handling:

```javascript
try {
  exerciseModule.render(body, item, handleAnswer);
} catch (error) {
  console.error('Error rendering exercise item:', error);
  body.innerHTML = '<p class="error">Error loading exercise. Please try again.</p>';
}
```

If a module crashes, the user sees an error message and can go back.

## Performance Notes

- Uses event delegation where possible
- Lazy-renders only current item (not all items at once)
- Cleanup function stops interval timer and prevents memory leaks
- Progress bar updates use CSS transitions (smooth, GPU-accelerated)

## Future Enhancements

- [ ] Item persistence (save progress on network disconnect)
- [ ] Hint system (show hint, reduce points)
- [ ] Difficulty leveling (adjust item selection based on performance)
- [ ] Analytics (track time per item, attempts, etc.)
- [ ] Accessibility improvements (screen reader announcements)
- [ ] Multi-language support for feedback messages
