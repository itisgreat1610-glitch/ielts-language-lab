/**
 * collocation.js - Collocation Match Exercise
 *
 * Student sees a target word and must pick the correct natural partner from options.
 * Demonstrates understanding of how words combine in English.
 */

export const meta = {
  id: 'collocation',
  name: 'Collocation Match',
  layer: 1,
  minLevel: 2,
  estimatedTime: 30,
  batchMode: true
};

/**
 * Renders the collocation exercise UI
 * @param {HTMLElement} container - Target container
 * @param {Array} itemData - Array of collocation items with structure:
 *   [{ title, pairs: [{ b1, b2, gps, demo }, ...] }, ...]
 * @param {Object} callbacks - { onAnswer(itemId, correct, details), onSkip(itemId) }
 */
export function render(container, itemData, callbacks) {
  if (!Array.isArray(itemData) || itemData.length === 0) {
    container.innerHTML = '<p>No collocation data available.</p>';
    return;
  }

  const state = {
    currentSetIndex: 0,
    currentItemIndex: 0,
    answered: false,
    correct: false,
    selectedOption: null
  };

  function getCurrentSet() {
    return itemData[state.currentSetIndex];
  }

  function getCurrentItem() {
    const set = getCurrentSet();
    return set.pairs[state.currentItemIndex];
  }

  /**
   * Generate options for current question
   * Returns: { correct, incorrect: [...] }
   */
  function generateOptions() {
    const set = getCurrentSet();
    const currentPair = getCurrentItem();
    const allPartners = set.pairs.map(p => p.b2);

    // Get the correct answer
    const correctAnswer = currentPair.b2;

    // Get up to 3 distractors
    const distractors = allPartners
      .filter(p => p !== correctAnswer)
      .slice(0, 3);

    // Shuffle and return
    const options = [correctAnswer, ...distractors];
    return options.sort(() => Math.random() - 0.5);
  }

  function renderQuestion() {
    const set = getCurrentSet();
    const item = getCurrentItem();
    const options = generateOptions();

    const optionsHTML = options
      .map((option, idx) => `
        <button
          class="collocation-option"
          data-option-idx="${idx}"
          data-option="${option}"
          ${state.answered ? 'disabled' : ''}
        >
          ${option}
        </button>
      `)
      .join('');

    container.innerHTML = `
      <div class="exercise-container collocation-exercise">
        <div class="exercise-header">
          <h3 class="exercise-title">${set.title}</h3>
          <div class="progress-indicator">
            ${state.currentItemIndex + 1} / ${set.pairs.length}
          </div>
        </div>

        <div class="collocation-content">
          <div class="collocation-question">
            <p class="question-label">Choose the correct collocation:</p>
            <div class="target-word">${item.b1}</div>
          </div>

          <div class="collocation-options">
            ${optionsHTML}
          </div>

          ${state.answered ? `
            <div class="feedback-section ${state.correct ? 'feedback-correct' : 'feedback-incorrect'}">
              <div class="feedback-icon">${state.correct ? '✓' : '✗'}</div>
              <div class="feedback-text">
                <strong>${state.correct ? 'Correct!' : 'Incorrect'}</strong>
                <p class="correct-answer">Correct answer: <strong>${item.b2}</strong></p>
                <p class="example-context">"${item.demo}"</p>
                ${item.gps ? `<p class="gps-label">GPS: ${item.gps}</p>` : ''}
              </div>
            </div>

            <div class="exercise-controls">
              <button class="btn btn-primary" id="next-btn">
                ${state.currentItemIndex < getCurrentSet().pairs.length - 1 ? 'Next' : 'Complete'}
              </button>
            </div>
          ` : `
            <div class="exercise-controls">
              <button class="btn btn-ghost" id="skip-btn">Skip</button>
            </div>
          `}
        </div>
      </div>
    `;

    // Add event listeners for options
    if (!state.answered) {
      container.querySelectorAll('.collocation-option').forEach((btn, idx) => {
        btn.addEventListener('click', () => {
          handleAnswer(btn, options[idx] === item.b2);
        });
      });
    }

    // Add skip button listener
    const skipBtn = container.querySelector('#skip-btn');
    if (skipBtn) {
      skipBtn.addEventListener('click', () => {
        callbacks.onSkip(`collocation-${state.currentSetIndex}-${state.currentItemIndex}`);
        moveToNext();
      });
    }

    // Add next button listener
    const nextBtn = container.querySelector('#next-btn');
    if (nextBtn) {
      nextBtn.addEventListener('click', moveToNext);
    }
  }

  function handleAnswer(buttonEl, isCorrect) {
    state.answered = true;
    state.correct = isCorrect;
    state.selectedOption = buttonEl.dataset.option;

    // Visual feedback
    buttonEl.classList.add(isCorrect ? 'option-correct' : 'option-incorrect');

    // Trigger animation
    if (isCorrect) {
      buttonEl.classList.add('pulse-success');
    } else {
      buttonEl.classList.add('shake-error');
      // Show correct answer highlighted
      const options = container.querySelectorAll('.collocation-option');
      const correctOption = Array.from(options).find(
        opt => opt.dataset.option === getCurrentItem().b2
      );
      if (correctOption) {
        correctOption.classList.add('option-highlight');
      }
    }

    // Call callback
    const itemId = `collocation-${state.currentSetIndex}-${state.currentItemIndex}`;
    callbacks.onAnswer(itemId, isCorrect, {
      selected: state.selectedOption,
      correct: getCurrentItem().b2,
      question: getCurrentItem().b1
    });

    // Re-render to show feedback
    setTimeout(renderQuestion, 100);
  }

  function moveToNext() {
    state.answered = false;
    state.selectedOption = null;

    // Move to next item
    if (state.currentItemIndex < getCurrentSet().pairs.length - 1) {
      state.currentItemIndex++;
    } else if (state.currentSetIndex < itemData.length - 1) {
      // Move to next set
      state.currentSetIndex++;
      state.currentItemIndex = 0;
    } else {
      // Exercise complete
      callbacks.onSkip(`collocation-complete`);
      return;
    }

    renderQuestion();
  }

  // Initial render
  renderQuestion();
}

/* ============================================================================
   COMPONENT-SPECIFIC STYLES (to be added to style.css)
   ============================================================================ */

const styles = `
.collocation-exercise {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.exercise-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-lg);
  border-bottom: 2px solid var(--border);
}

.exercise-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
}

.progress-indicator {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  background: rgba(61, 90, 128, 0.05);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
}

.collocation-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.collocation-question {
  text-align: center;
  padding: var(--spacing-xl);
  background: rgba(163, 177, 138, 0.05);
  border-radius: var(--radius-lg);
}

.question-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: var(--spacing-md);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.target-word {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--accent-indigo);
  word-break: break-word;
}

.collocation-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
}

.collocation-option {
  padding: var(--spacing-lg);
  font-size: var(--font-size-base);
  background: var(--bg-card);
  border: 2px solid var(--border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--duration-fast) var(--easing-default);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.collocation-option:hover:not(:disabled) {
  border-color: var(--accent-indigo);
  background: rgba(61, 90, 128, 0.05);
  transform: translateY(-2px);
}

.collocation-option:active:not(:disabled) {
  transform: translateY(0);
}

.collocation-option:disabled {
  cursor: not-allowed;
}

.option-correct {
  background: rgba(163, 177, 138, 0.1);
  border-color: var(--accent-matcha);
  color: var(--accent-matcha);
}

.option-incorrect {
  background: rgba(193, 102, 107, 0.1);
  border-color: var(--accent-coral);
  color: var(--text-secondary);
}

.option-highlight {
  background: rgba(163, 177, 138, 0.15);
  border-color: var(--accent-matcha);
  box-shadow: 0 0 0 3px rgba(163, 177, 138, 0.2);
}

.pulse-success {
  animation: pulse-green 0.6s var(--easing-smooth);
}

.shake-error {
  animation: shake-red 0.5s var(--easing-smooth);
}

@keyframes pulse-green {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); box-shadow: 0 0 0 8px rgba(163, 177, 138, 0.3); }
  100% { transform: scale(1); }
}

@keyframes shake-red {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}

.feedback-section {
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
  display: flex;
  gap: var(--spacing-lg);
}

.feedback-correct {
  background: rgba(163, 177, 138, 0.1);
  border: 2px solid var(--accent-matcha);
}

.feedback-incorrect {
  background: rgba(193, 102, 107, 0.1);
  border: 2px solid var(--accent-coral);
}

.feedback-icon {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--accent-matcha);
  min-width: 40px;
  display: flex;
  align-items: center;
}

.feedback-incorrect .feedback-icon {
  color: var(--accent-coral);
}

.feedback-text {
  flex: 1;
}

.feedback-text strong {
  display: block;
  margin-bottom: var(--spacing-sm);
  font-size: var(--font-size-lg);
}

.correct-answer {
  margin-bottom: var(--spacing-sm);
  color: var(--text-primary);
  font-weight: var(--font-weight-medium);
}

.example-context {
  margin-bottom: var(--spacing-sm);
  color: var(--text-secondary);
  font-style: italic;
  font-size: var(--font-size-sm);
}

.gps-label {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 1px solid rgba(61, 90, 128, 0.1);
}

.exercise-controls {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
  padding-top: var(--spacing-lg);
}

.btn {
  min-width: 120px;
}

@media (max-width: 480px) {
  .collocation-options {
    grid-template-columns: 1fr;
  }

  .exercise-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);
  }
}
`;

// Export styles as a string for potential CSS injection
export { styles as componentStyles };
