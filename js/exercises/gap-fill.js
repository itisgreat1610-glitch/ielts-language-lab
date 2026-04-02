/**
 * gap-fill.js - Gap Fill Exercise Module
 * Students select the correct word from 4 multiple-choice options
 * to fill in the blank in a sentence
 */

export const meta = {
  id: 'gap-fill',
  name: 'Gap Fill',
  layer: 1,
  minLevel: 1,
  estimatedTime: 45
};

/**
 * Render the gap fill exercise
 * @param {HTMLElement} container - The container to render into
 * @param {Object} itemData - Exercise data with sentence, answer, options
 * @param {Object} callbacks - { onAnswer, onSkip }
 */
export function render(container, itemData, callbacks) {
  // Destructure data
  const { sentence = '', answer = '', options = [] } = itemData;

  if (!sentence || !answer) {
    container.innerHTML = '<p class="exercise-error">Invalid exercise data</p>';
    return;
  }

  // State tracking
  const exerciseState = {
    answered: false,
    isCorrect: false,
    selectedOption: null,
    disabledOptions: new Set(),
    attemptCount: 0
  };

  // Build HTML structure
  const exerciseHTML = document.createElement('div');
  exerciseHTML.className = 'gap-fill-exercise';
  exerciseHTML.innerHTML = `
    <div class="gap-fill-container">
      <div class="gap-fill-question">
        <p class="gap-fill-sentence" id="gf-sentence">
          ${buildSentenceHTML(sentence, answer, exerciseState)}
        </p>
      </div>

      <div class="gap-fill-options">
        <p class="gap-fill-label">Select the correct word:</p>
        <div class="exercise-options gap-fill-option-list">
          ${options.map((option, idx) => `
            <button class="exercise-option gap-fill-option" data-index="${idx}" data-value="${escapeHtml(option)}">
              <span class="exercise-option-text">${escapeHtml(option)}</span>
            </button>
          `).join('')}
        </div>
      </div>

      <div class="gap-fill-feedback" id="gf-feedback" style="display: none;"></div>

      <div class="gap-fill-controls">
        <button class="btn btn-secondary btn-block" id="gf-skip-btn">Skip Question</button>
      </div>
    </div>
  `;

  container.appendChild(exerciseHTML);

  // Get references to elements
  const optionButtons = container.querySelectorAll('.gap-fill-option');
  const feedbackDiv = container.querySelector('#gf-feedback');
  const sentenceDiv = container.querySelector('#gf-sentence');
  const skipBtn = container.querySelector('#gf-skip-btn');

  /**
   * Build sentence HTML with blank highlighted
   */
  function buildSentenceHTML(sent, ans, state) {
    const blankHTML = '<span class="gap-fill-blank">___</span>';
    return sent.replace('___', blankHTML);
  }

  /**
   * Show feedback message
   */
  function showFeedback(isCorrect, message) {
    feedbackDiv.className = 'gap-fill-feedback exercise-feedback';
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
   * Fill in the blank with the selected answer
   */
  function fillInBlank(word) {
    const blank = sentenceDiv.querySelector('.gap-fill-blank');
    if (blank) {
      blank.textContent = word;
      blank.classList.add('gap-fill-filled');
    }
  }

  /**
   * Handle option button click
   */
  function handleOptionClick(button) {
    if (exerciseState.answered) return;
    if (exerciseState.disabledOptions.has(button.dataset.index)) return;

    exerciseState.attemptCount++;
    const selectedValue = button.dataset.value;
    const isCorrect = selectedValue === answer;

    exerciseState.answered = true;
    exerciseState.isCorrect = isCorrect;
    exerciseState.selectedOption = button;

    // Visual feedback on button
    if (isCorrect) {
      button.classList.add('correct');
      fillInBlank(selectedValue);
      showFeedback(true, 'Correct! Great choice.');

      // Call onAnswer callback after a brief delay
      setTimeout(() => {
        callbacks.onAnswer(itemData.id, true, {
          exerciseType: 'gap-fill',
          selectedAnswer: selectedValue,
          attempts: exerciseState.attemptCount
        });
      }, 800);
    } else {
      button.classList.add('incorrect');
      button.style.opacity = '0.5';
      showFeedback(false, 'Incorrect. Try another option.');

      // Mark this option as disabled for future attempts
      exerciseState.disabledOptions.add(button.dataset.index);

      // If only one option left, reveal the answer
      const enabledCount = options.length - exerciseState.disabledOptions.size;
      if (enabledCount === 1) {
        // Find and highlight the correct option after a delay
        setTimeout(() => {
          const correctBtn = Array.from(optionButtons).find(
            btn => btn.dataset.value === answer
          );
          if (correctBtn && !correctBtn.classList.contains('incorrect')) {
            correctBtn.classList.add('revealed-answer');
            showFeedback(false, `The correct answer is: ${answer}`);
            exerciseState.answered = true;

            // Call onAnswer as incorrect
            setTimeout(() => {
              callbacks.onAnswer(itemData.id, false, {
                exerciseType: 'gap-fill',
                correctAnswer: answer,
                selectedAnswer: selectedValue,
                attempts: exerciseState.attemptCount
              });
            }, 800);
          }
        }, 600);
      }

      // Re-enable answering after animation
      setTimeout(() => {
        exerciseState.answered = false;
      }, 600);
    }
  }

  // Attach click handlers to option buttons
  optionButtons.forEach(button => {
    button.addEventListener('click', () => handleOptionClick(button));
  });

  // Skip button handler
  skipBtn.addEventListener('click', () => {
    callbacks.onSkip(itemData.id);
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
  return text.replace(/[&<>"']/g, char => map[char]);
}
