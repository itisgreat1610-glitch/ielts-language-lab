/**
 * paraphrase-match.js - Paraphrase Match Exercise Module
 * Students match original text to its correct paraphrase among multiple options.
 * Useful for understanding vocabulary in context and synonym recognition.
 */

export const meta = {
  id: 'paraphrase-match',
  name: 'Paraphrase Match',
  layer: 2,
  minLevel: 2,
  estimatedTime: 30
};

/**
 * Render the paraphrase match exercise
 * @param {HTMLElement} container - The container to render into
 * @param {Object} itemData - Exercise data with original, paraphrase, and distractors
 * @param {Object} callbacks - { onAnswer, onSkip }
 */
export function render(container, itemData, callbacks) {
  // Destructure data
  const {
    original = '',
    paraphrase = '',
    distractors = [],
    id = 'pm-001'
  } = itemData;

  if (!original || !paraphrase) {
    container.innerHTML = '<p class="exercise-error">Invalid exercise data</p>';
    return;
  }

  // Create options by shuffling paraphrase with distractors
  const allOptions = [paraphrase, ...distractors].sort(() => Math.random() - 0.5);

  // State tracking
  const exerciseState = {
    answered: false,
    isCorrect: false,
    selectedOption: null,
    attemptCount: 0
  };

  // Build HTML structure
  const exerciseHTML = document.createElement('div');
  exerciseHTML.className = 'paraphrase-match-exercise';
  exerciseHTML.innerHTML = `
    <div class="paraphrase-match-container">
      <div class="paraphrase-match-question">
        <h3 class="paraphrase-match-label">Original Text:</h3>
        <div class="paraphrase-match-original">
          <p class="paraphrase-text">${escapeHtml(original)}</p>
        </div>
      </div>

      <div class="paraphrase-match-instruction">
        <p>Select the best paraphrase of the original text:</p>
      </div>

      <div class="paraphrase-match-options">
        ${allOptions.map((option, idx) => `
          <button class="paraphrase-option-btn" data-index="${idx}" data-value="${escapeHtml(option)}">
            <span class="paraphrase-option-letter">${String.fromCharCode(65 + idx)}</span>
            <span class="paraphrase-option-text">${escapeHtml(option)}</span>
          </button>
        `).join('')}
      </div>

      <div class="paraphrase-match-feedback" id="pm-feedback" style="display: none;"></div>

      <div class="paraphrase-match-comparison" id="pm-comparison" style="display: none;">
        <div class="comparison-row">
          <div class="comparison-col">
            <h4>Original:</h4>
            <p id="pm-original-display">${escapeHtml(original)}</p>
          </div>
          <div class="comparison-col">
            <h4>Your Paraphrase:</h4>
            <p id="pm-selected-display"></p>
          </div>
        </div>
      </div>

      <div class="paraphrase-match-controls">
        <button class="btn btn-secondary btn-block" id="pm-skip-btn">Skip Question</button>
      </div>
    </div>
  `;

  container.appendChild(exerciseHTML);

  // Get references to elements
  const optionButtons = container.querySelectorAll('.paraphrase-option-btn');
  const feedbackDiv = container.querySelector('#pm-feedback');
  const comparisonDiv = container.querySelector('#pm-comparison');
  const selectedDisplay = container.querySelector('#pm-selected-display');
  const skipBtn = container.querySelector('#pm-skip-btn');

  /**
   * Show feedback message
   */
  function showFeedback(isCorrect, message) {
    feedbackDiv.className = 'paraphrase-match-feedback exercise-feedback';
    if (isCorrect) {
      feedbackDiv.classList.add('correct');
      feedbackDiv.innerHTML = `
        <span class="exercise-feedback-icon">✓</span>
        <span class="exercise-feedback-text">${message}</span>
      `;
    } else {
      feedbackDiv.classList.add('incorrect');
      feedbackDiv.innerHTML = `
        <span class="exercise-feedback-icon">✗</span>
        <span class="exercise-feedback-text">${message}</span>
      `;
    }
    feedbackDiv.style.display = 'block';
  }

  /**
   * Show comparison between original and selected paraphrase
   */
  function showComparison(selectedText) {
    selectedDisplay.textContent = selectedText;
    comparisonDiv.style.display = 'block';
  }

  /**
   * Handle option button click
   */
  function handleOptionClick(button) {
    if (exerciseState.answered) return;

    exerciseState.attemptCount++;
    const selectedValue = button.dataset.value;
    const isCorrect = selectedValue === paraphrase;

    exerciseState.answered = true;
    exerciseState.isCorrect = isCorrect;
    exerciseState.selectedOption = button;

    // Visual feedback on button
    if (isCorrect) {
      button.classList.add('correct');
      showComparison(selectedValue);
      showFeedback(true, 'Excellent! You found the correct paraphrase.');

      // Call onAnswer callback after a brief delay
      setTimeout(() => {
        callbacks.onAnswer(itemData.id || id, true, {
          exerciseType: 'paraphrase-match',
          selectedAnswer: selectedValue,
          attempts: exerciseState.attemptCount
        });
      }, 800);
    } else {
      button.classList.add('incorrect');
      button.style.opacity = '0.5';
      showComparison(selectedValue);
      showFeedback(false, 'Not quite right. This is not the best paraphrase.');

      // Disable this option for future attempts
      button.style.pointerEvents = 'none';

      // Check if only one enabled option remains
      const enabledButtons = Array.from(optionButtons).filter(
        btn => !btn.classList.contains('incorrect')
      );

      if (enabledButtons.length === 1) {
        // Reveal the correct answer after a delay
        setTimeout(() => {
          const correctBtn = enabledButtons[0];
          correctBtn.classList.add('revealed-answer');
          showFeedback(false, `The correct paraphrase is: "${paraphrase}"`);
          showComparison(paraphrase);
          exerciseState.answered = true;

          // Call onAnswer as incorrect
          setTimeout(() => {
            callbacks.onAnswer(itemData.id || id, false, {
              exerciseType: 'paraphrase-match',
              correctAnswer: paraphrase,
              selectedAnswer: selectedValue,
              attempts: exerciseState.attemptCount
            });
          }, 800);
        }, 600);
      } else {
        // Allow another attempt
        exerciseState.answered = false;
      }
    }
  }

  // Attach click handlers to option buttons
  optionButtons.forEach(button => {
    button.addEventListener('click', () => handleOptionClick(button));
  });

  // Skip button handler
  skipBtn.addEventListener('click', () => {
    callbacks.onSkip(itemData.id || id);
  });
}

/**
 * Escape HTML special characters for safe display
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, char => map[char]);
}
