/**
 * Sentence Type ID Exercise Module
 * Students identify whether a sentence is simple, compound, complex, or mixed.
 */

export const meta = {
  id: 'sentence-type-id',
  name: 'Sentence Type ID',
  layer: 2,
  minLevel: 3,
  estimatedTime: 45,
};

const SENTENCE_TYPES = ['simple', 'compound', 'complex', 'mixed'];
const TYPE_COLORS = {
  simple: '#A3B18A',    // matcha
  compound: '#E8A87C',  // amber
  complex: '#3D5A80',   // indigo
  mixed: '#C1666B',     // coral
};

/**
 * Render a sentence type identification exercise.
 * @param {HTMLElement} container - The DOM container
 * @param {Object} itemData - Single item from sentence_type_id array
 * @param {Object} callbacks - { onAnswer(id, correct, details), onSkip(id) }
 */
export function render(container, itemData, callbacks) {
  const { id, sentence, answer, explanation } = itemData;

  // Build the exercise card structure
  const card = document.createElement('div');
  card.className = 'exercise-card sentence-type-id-card';
  card.innerHTML = `
    <div class="exercise-header">
      <h2 class="exercise-title">What type of sentence is this?</h2>
    </div>

    <div class="sentence-display">
      <p class="sentence-text">${escapeHtml(sentence)}</p>
    </div>

    <div class="type-buttons">
      ${SENTENCE_TYPES.map(type => `
        <button
          class="type-button"
          data-type="${type}"
          style="--button-color: ${TYPE_COLORS[type]}"
        >
          <span class="type-label">${capitalize(type)}</span>
        </button>
      `).join('')}
    </div>

    <div class="feedback-area" aria-live="polite" aria-atomic="true">
      <!-- Filled on answer -->
    </div>

    <div class="exercise-footer">
      <button class="skip-button" aria-label="Skip this question">Skip</button>
    </div>
  `;

  container.appendChild(card);

  const feedbackArea = card.querySelector('.feedback-area');
  const skipButton = card.querySelector('.skip-button');
  const typeButtons = card.querySelectorAll('.type-button');

  // Track state
  let answered = false;

  // Handle type button clicks
  typeButtons.forEach(button => {
    button.addEventListener('click', () => {
      if (answered) return;
      answered = true;

      const selectedType = button.getAttribute('data-type');
      const isCorrect = selectedType === answer;

      // Disable all buttons
      typeButtons.forEach(b => b.disabled = true);

      if (isCorrect) {
        // Correct answer: green pulse animation
        button.classList.add('correct-answer');
        showCorrectFeedback(button, feedbackArea, explanation);
      } else {
        // Incorrect answer: red shake animation
        button.classList.add('incorrect-answer');
        const correctBtn = card.querySelector(`[data-type="${answer}"]`);
        if (correctBtn) {
          correctBtn.classList.add('correct-answer-highlight');
        }
        showIncorrectFeedback(feedbackArea, answer, explanation);
      }

      // Call callback
      callbacks.onAnswer(id, isCorrect, {
        selected: selectedType,
        correct: answer,
        explanation,
      });
    });
  });

  // Handle skip
  skipButton.addEventListener('click', () => {
    if (!answered) {
      callbacks.onSkip(id);
    }
  });
}

/**
 * Display feedback for a correct answer.
 */
function showCorrectFeedback(button, feedbackArea, explanation) {
  feedbackArea.innerHTML = `
    <div class="feedback feedback-correct">
      <div class="feedback-icon">✓</div>
      <div class="feedback-content">
        <p class="feedback-title">Correct!</p>
        <p class="feedback-explanation">${escapeHtml(explanation)}</p>
      </div>
    </div>
  `;
  feedbackArea.classList.add('show');
}

/**
 * Display feedback for an incorrect answer.
 */
function showIncorrectFeedback(feedbackArea, correctAnswer, explanation) {
  feedbackArea.innerHTML = `
    <div class="feedback feedback-incorrect">
      <div class="feedback-icon">✗</div>
      <div class="feedback-content">
        <p class="feedback-title">Not quite.</p>
        <p class="feedback-correction">The correct answer is <strong>${capitalize(correctAnswer)}</strong>.</p>
        <p class="feedback-explanation">${escapeHtml(explanation)}</p>
      </div>
    </div>
  `;
  feedbackArea.classList.add('show');
}

/**
 * Utility: Escape HTML to prevent XSS.
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Utility: Capitalize first letter.
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
