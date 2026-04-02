/**
 * example-module.js - Example Exercise Module Template
 *
 * This is a template showing the required interface for any exercise module.
 * Copy this file and modify to create new exercise types.
 */

/**
 * Exercise module interface
 * Every exercise module MUST export an object with this structure
 */
export const exampleModule = {
  // =========================================================================
  // METADATA (required)
  // =========================================================================
  meta: {
    name: 'Example Exercise',
    description: 'Template exercise module showing the interface',
    type: 'example',
    version: '1.0.0'
  },

  // =========================================================================
  // GENERATE ITEMS (optional)
  // =========================================================================
  /**
   * Transform raw level data into exercise items
   * If not provided, shell uses levelData directly
   *
   * @param {Array} levelData - Raw vocabulary data from level-N.json
   * @returns {Array} Exercise items ready to render
   */
  generateItems(levelData) {
    // Example: Select first 10 items and shuffle options
    return levelData.slice(0, 10).map((item, idx) => ({
      id: item.id || `example-${idx}`,
      word: item.word,
      definition: item.definition,
      // Add any exercise-specific fields here
      options: item.definitions || []
    }));
  },

  // =========================================================================
  // RENDER (required)
  // =========================================================================
  /**
   * Render a single exercise item and set up the answer callback
   *
   * @param {HTMLElement} container - DOM element to render into
   * @param {Object} item - Exercise item from generateItems()
   * @param {Function} answerCallback - Call when user submits answer
   *
   * Callback signature: answerCallback(userAnswer, isCorrect, details)
   *   - userAnswer: any - what the user submitted
   *   - isCorrect: boolean - whether answer was correct
   *   - details: object - optional context { correct: '...', explanation: '...' }
   */
  render(container, item, answerCallback) {
    // Clear container
    container.innerHTML = '';

    // Create exercise UI
    const exerciseEl = document.createElement('div');
    exerciseEl.className = 'example-exercise-item';

    // Create question
    const question = document.createElement('div');
    question.className = 'exercise-question';
    question.innerHTML = `
      <div class="word-display">
        <span class="word">${item.word}</span>
        <span class="pos" style="color: var(--text-secondary); font-size: 0.875rem;">(noun)</span>
      </div>
      <p class="definition">${item.definition}</p>
    `;
    exerciseEl.appendChild(question);

    // Create answer options (simple example)
    const optionsEl = document.createElement('div');
    optionsEl.className = 'exercise-options';

    // Shuffle options for variety
    const shuffledOptions = shuffleArray([
      { id: 'correct', label: 'Correct answer', isCorrect: true },
      { id: 'dist1', label: 'Distractor 1', isCorrect: false },
      { id: 'dist2', label: 'Distractor 2', isCorrect: false },
      { id: 'dist3', label: 'Distractor 3', isCorrect: false }
    ]);

    shuffledOptions.forEach((option) => {
      const optionBtn = document.createElement('button');
      optionBtn.className = 'exercise-option-btn';
      optionBtn.textContent = option.label;
      optionBtn.setAttribute('data-option-id', option.id);

      optionBtn.addEventListener('click', () => {
        // Disable all options
        optionsEl.querySelectorAll('.exercise-option-btn').forEach(btn => {
          btn.disabled = true;
        });

        // Highlight selected option
        optionBtn.classList.add('selected');

        // Determine if correct
        const isCorrect = option.isCorrect;
        const userAnswer = option.id;
        const correctAnswerId = 'correct';

        // Call shell's answer handler
        // Format: (userAnswer, isCorrect, details)
        answerCallback(userAnswer, isCorrect, {
          correct: correctAnswerId,
          explanation: isCorrect
            ? 'Great job!'
            : 'The correct answer is: Correct answer'
        });
      });

      optionsEl.appendChild(optionBtn);
    });

    exerciseEl.appendChild(optionsEl);
    container.appendChild(exerciseEl);

    // Optional: Add styling
    const style = document.createElement('style');
    style.textContent = `
      .example-exercise-item {
        padding: var(--spacing-lg);
      }

      .exercise-question {
        margin-bottom: var(--spacing-xl);
      }

      .word-display {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
        margin-bottom: var(--spacing-md);
      }

      .word {
        font-size: var(--font-size-xl);
        font-weight: var(--font-weight-bold);
        color: var(--text-primary);
      }

      .definition {
        color: var(--text-secondary);
        font-size: var(--font-size-lg);
      }

      .exercise-options {
        display: grid;
        grid-template-columns: 1fr;
        gap: var(--spacing-md);
      }

      .exercise-option-btn {
        padding: var(--spacing-md) var(--spacing-lg);
        background-color: var(--bg-card);
        border: 2px solid var(--border);
        border-radius: var(--radius-md);
        font-size: var(--font-size-base);
        color: var(--text-primary);
        cursor: pointer;
        transition: all var(--duration-fast) var(--easing-default);
      }

      .exercise-option-btn:hover:not(:disabled) {
        border-color: var(--accent-indigo);
        background-color: rgba(61, 90, 128, 0.02);
      }

      .exercise-option-btn:disabled {
        cursor: not-allowed;
        opacity: 0.6;
      }

      .exercise-option-btn.selected {
        background-color: rgba(61, 90, 128, 0.1);
        border-color: var(--accent-indigo);
      }
    `;
    // Only add style once
    if (!document.querySelector('style[data-example-exercise]')) {
      style.setAttribute('data-example-exercise', 'true');
      document.head.appendChild(style);
    }
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Shuffle array using Fisher-Yates algorithm
 * @param {Array} array - Array to shuffle
 * @returns {Array} New shuffled array
 */
function shuffleArray(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/*
In your app/router code:

import { startExercise } from './js/ui/exercise-shell.js';
import { exampleModule } from './js/exercises/example-module.js';

const container = document.getElementById('exercise-container');

startExercise(container, {
  exerciseType: 'example',
  levelData: levelDataFromJson,      // From loader.js
  exerciseModule: exampleModule,
  currentLevel: 1,
  onComplete: (results) => {
    if (results) {
      console.log('Exercise completed:', results);
      // results.score, results.accuracy, results.time, etc.
    } else {
      console.log('Exercise cancelled');
    }
  }
});

Optional: with timer
startExercise(container, {
  exerciseType: 'example',
  levelData: levelDataFromJson,
  exerciseModule: exampleModule,
  currentLevel: 1,
  timed: true,
  timeLimit: 300, // 5 minutes
  onComplete: handleResults
});
*/
