# Exercise Shell - Quick Start Guide

## 60-Second Setup

### 1. Create Exercise Module

```javascript
// js/exercises/my-exercise.js
export const myExerciseModule = {
  meta: {
    name: 'My Exercise',
    description: 'Exercise description',
    type: 'my-exercise'
  },

  render(container, item, answerCallback) {
    // Create UI
    container.innerHTML = `<div>
      <p>${item.question}</p>
      <button id="answer-btn">Submit</button>
    </div>`;

    // Handle answer
    container.querySelector('#answer-btn').addEventListener('click', () => {
      const userAnswer = 'user input here';
      const isCorrect = userAnswer === item.correct;
      answerCallback(userAnswer, isCorrect, {
        correct: item.correct
      });
    });
  }
};
```

### 2. Use in App

```javascript
import { startExercise } from './js/ui/exercise-shell.js';
import { myExerciseModule } from './js/exercises/my-exercise.js';

// Start exercise
const cleanup = startExercise(document.getElementById('app'), {
  exerciseType: 'my-exercise',
  levelData: levelDataFromJson,
  exerciseModule: myExerciseModule,
  currentLevel: 1,
  onComplete: (results) => {
    if (results) {
      console.log(`Score: ${results.score}/${results.total} (${results.accuracy}%)`);
    } else {
      console.log('Cancelled');
    }
  }
});
```

### 3. With Timer (Optional)

```javascript
startExercise(container, {
  exerciseType: 'my-exercise',
  levelData: data,
  exerciseModule: myExerciseModule,
  currentLevel: 1,
  timed: true,
  timeLimit: 300, // 5 minutes
  onComplete: handleResults
});
```

## Module Interface

**MUST export:**

```javascript
{
  meta: {
    name: string,        // Display name
    description: string, // Description
    type: string         // Unique ID
  },
  render(container, item, answerCallback)
}
```

**SHOULD call:**

```javascript
answerCallback(
  userAnswer,           // any - what user submitted
  isCorrect,            // boolean - true/false
  { correct: '...' }    // optional - for feedback
)
```

## Shell Options

```javascript
startExercise(container, {
  exerciseType: string,        // e.g., 'word-match'
  levelData: Array,            // Items to exercise
  exerciseModule: Object,      // Module with render()
  currentLevel: number,        // 1-10
  onComplete: Function,        // (results) => {}
  timed: boolean,              // Optional, default false
  timeLimit: number            // Seconds (if timed)
})
```

## Results Object

```javascript
{
  exerciseType: 'word-match',
  score: 8,              // Correct
  total: 10,             // Total items
  accuracy: 80,          // Percentage
  time: 150,             // Seconds
  mistakes: Array,       // Incorrect items
  results: Array         // All items
}
```

## CSS Classes

- `.exercise-shell` — Root
- `.exercise-header` — Header with title
- `.exercise-body` — Content area
- `.exercise-feedback` — Feedback card
- `.exercise-results` — Results modal
- `.correct` / `.incorrect` — States

## Animations

- `slideUp` — Appear/disappear
- `bounce` — Icon feedback
- `shake` — Wrong answer
- `greenPulse` — Correct answer
- `pulse` — Timer critical

## Key Files

| File | Size | Purpose |
|------|------|---------|
| `js/ui/exercise-shell.js` | 12 KB | Main module |
| `js/ui/EXERCISE_SHELL_README.md` | 11 KB | Full API docs |
| `js/exercises/example-module.js` | 7.7 KB | Template |
| `EXERCISE_SHELL_INTEGRATION.md` | 8 KB | Integration guide |

## Common Patterns

### Multiple Choice
```javascript
container.innerHTML = `<div>
  ${item.options.map(opt => `
    <button data-id="${opt.id}">${opt.text}</button>
  `).join('')}
</div>`;

container.addEventListener('click', (e) => {
  if (e.target.tagName === 'BUTTON') {
    const userAnswer = e.target.dataset.id;
    answerCallback(userAnswer, userAnswer === item.correct, {
      correct: item.correct
    });
  }
});
```

### Text Input
```javascript
container.innerHTML = `<input id="answer" type="text" placeholder="Your answer">`;

const input = container.querySelector('#answer');
input.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    const userAnswer = input.value.trim().toLowerCase();
    const isCorrect = userAnswer === item.correct.toLowerCase();
    answerCallback(userAnswer, isCorrect, { correct: item.correct });
  }
});
```

### Dropdown Select
```javascript
container.innerHTML = `<select id="answer">
  <option>Choose...</option>
  ${item.options.map(opt => `<option value="${opt.id}">${opt.text}</option>`).join('')}
</select>`;

container.querySelector('#answer').addEventListener('change', (e) => {
  const userAnswer = e.target.value;
  answerCallback(userAnswer, userAnswer === item.correct, {
    correct: item.correct
  });
});
```

## Testing

```javascript
// Quick test
const container = document.createElement('div');
startExercise(container, {
  exerciseType: 'test',
  levelData: [{ id: '1', question: 'Q?' }],
  exerciseModule: myModule,
  currentLevel: 1,
  onComplete: (results) => console.log('Done:', results)
});
```

## Troubleshooting

**Exercise doesn't render?**
- Check `exerciseModule.render()` implementation
- Verify `answerCallback` is called with 3 arguments
- Check browser console for errors

**Timer not working?**
- Set `timed: true` and `timeLimit: number` (seconds)
- Verify CSS class `.exercise-timer` exists

**Results not showing?**
- Ensure all items are answered
- Check `onComplete` callback is defined
- Look for JavaScript errors in console

**SRS not updating?**
- Verify item has `id` field
- Check `updateCard()` is called with correct level
- Confirm state imports are correct

## Complete Example

```javascript
// data.json
[
  { id: '1', word: 'test', definition: 'eval' }
]

// my-module.js
export const wordMatch = {
  meta: { name: 'Word Match', description: '...', type: 'word-match' },
  render(container, item, callback) {
    container.innerHTML = `<div>
      <p>${item.word}</p>
      <button onclick="this.onclick()">Check</button>
    </div>`;
    container.querySelector('button').onclick = () => {
      callback('answer', true, { correct: 'answer' });
    };
  }
};

// app.js
import { startExercise } from './js/ui/exercise-shell.js';
import { wordMatch } from './my-module.js';

fetch('data.json').then(r => r.json()).then(data => {
  startExercise(document.getElementById('app'), {
    exerciseType: 'word-match',
    levelData: data,
    exerciseModule: wordMatch,
    currentLevel: 1,
    onComplete: (r) => console.log(r)
  });
});
```

---

**Full documentation:** See `EXERCISE_SHELL_README.md`
**Integration guide:** See `EXERCISE_SHELL_INTEGRATION.md`
**Example module:** See `js/exercises/example-module.js`
