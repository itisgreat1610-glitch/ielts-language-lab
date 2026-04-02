/**
 * b1-b2-upgrade.js - B1→B2 Word Upgrade Exercise
 *
 * Student sees a sentence with a basic (Band 5-6) word and must pick the
 * Band 7+ upgrade. Demonstrates understanding of register and academic vocabulary.
 */

export const meta = {
  id: 'b1-b2-upgrade',
  name: 'B1→B2 Upgrade',
  layer: 1,
  minLevel: 2,
  estimatedTime: 25
};

/**
 * Renders the B1→B2 upgrade exercise UI
 * @param {HTMLElement} container - Target container
 * @param {Array} itemData - Array of upgrade items with structure:
 *   [{ b1, b2, gps, tip }, ...] OR
 *   [{ family, band5, band6, band7, band8, context }, ...] (for upgrade_ladder)
 * @param {Object} callbacks - { onAnswer(itemId, correct, details), onSkip(itemId) }
 */
export function render(container, itemData, callbacks) {
  if (!Array.isArray(itemData) || itemData.length === 0) {
    container.innerHTML = '<p>No upgrade data available.</p>';
    return;
  }

  const state = {
    currentIndex: 0,
    answered: false,
    correct: false,
    selectedOption: null
  };

  function getCurrentItem() {
    return itemData[state.currentIndex];
  }

  /**
   * Determine if this is a simple upgrade or band ladder
   */
  function isLadderItem(item) {
    return item.family && item.band5;
  }

  /**
   * Generate options for current question
   */
  function generateOptions() {
    const item = getCurrentItem();

    if (isLadderItem(item)) {
      // For ladder items: band7 is correct, others are distractors
      const options = [item.band7, item.band6, item.band5];
      return options.sort(() => Math.random() - 0.5);
    } else {
      // For simple upgrades: b2 is correct
      // Get distractors from other items
      const correctAnswer = item.b2;
      const allB2s = itemData.map(i => i.b2).filter(b => b !== correctAnswer);
      const distractors = allB2s.slice(0, 2);

      // If we don't have enough distractors, add generics
      while (distractors.length < 2) {
        distractors.push(`Option ${distractors.length + 1}`);
      }

      const options = [correctAnswer, ...distractors.slice(0, 2)];
      return options.sort(() => Math.random() - 0.5);
    }
  }

  /**
   * Create sentence with highlighted B1 word
   */
  function highlightB1Word(sentence, b1Word) {
    // Simple replacement - in production, might use more sophisticated matching
    const regex = new RegExp(`\\b${b1Word}\\b`, 'gi');
    return sentence.replace(
      regex,
      `<span class="b1-word-highlight">${b1Word}</span>`
    );
  }

  /**
   * Render the question
   */
  function renderQuestion() {
    const item = getCurrentItem();
    const options = generateOptions();
    const isLadder = isLadderItem(item);

    // Get the B1 word and context
    const b1Word = isLadder ? item.band5 : item.b1;
    const context = isLadder ? item.context : item.gps;
    const tip = isLadder ? null : item.tip;

    // Create sentence with highlighted B1 word
    const contextHTML =
      isLadder && item.context
        ? highlightB1Word(item.context, b1Word)
        : b1Word;

    const optionsHTML = options
      .map((option, idx) => `
        <button
          class="upgrade-option"
          data-option-idx="${idx}"
          data-option="${option}"
          ${state.answered ? 'disabled' : ''}
        >
          ${option}
        </button>
      `)
      .join('');

    container.innerHTML = `
      <div class="exercise-container upgrade-exercise">
        <div class="exercise-header">
          <h3 class="exercise-title">Upgrade Your Vocabulary</h3>
          <div class="progress-indicator">
            ${state.currentIndex + 1} / ${itemData.length}
          </div>
        </div>

        <div class="upgrade-content">
          ${isLadder && item.context
            ? `
            <div class="upgrade-sentence">
              <p class="sentence-context">${contextHTML}</p>
            </div>

            <div class="upgrade-question">
              <p class="question-label">Which is the Band 7 upgrade?</p>
              <div class="band-label">${item.family}</div>
            </div>
          `
            : `
            <div class="upgrade-question">
              <p class="question-label">Upgrade this phrase:</p>
              <div class="band-label">${b1Word}</div>
            </div>
          `}

          <div class="upgrade-options">
            ${optionsHTML}
          </div>

          ${state.answered
            ? `
            <div class="feedback-section ${state.correct ? 'feedback-correct' : 'feedback-incorrect'}">
              <div class="feedback-icon">${state.correct ? '✓' : '✗'}</div>
              <div class="feedback-text">
                <strong>${state.correct ? 'Excellent!' : 'Not quite'}</strong>
                ${isLadder
                  ? `
                  <div class="band-ladder">
                    <div class="ladder-rung">
                      <span class="band-badge band-5">B5</span>
                      <span class="band-word">${item.band5}</span>
                    </div>
                    <div class="ladder-arrow">↓</div>
                    <div class="ladder-rung">
                      <span class="band-badge band-6">B6</span>
                      <span class="band-word">${item.band6}</span>
                    </div>
                    <div class="ladder-arrow">↓</div>
                    <div class="ladder-rung ladder-target">
                      <span class="band-badge band-7">B7</span>
                      <span class="band-word">${item.band7}</span>
                    </div>
                    <div class="ladder-arrow">↓</div>
                    <div class="ladder-rung">
                      <span class="band-badge band-8">B8</span>
                      <span class="band-word">${item.band8}</span>
                    </div>
                  </div>
                `
                  : `
                  <p class="correct-answer">Band 7 answer: <strong>${item.b2}</strong></p>
                  ${tip ? `<p class="tip-text">${tip}</p>` : ''}
                `}
              </div>
            </div>

            <div class="exercise-controls">
              <button class="btn btn-primary" id="next-btn">
                ${state.currentIndex < itemData.length - 1 ? 'Next' : 'Complete'}
              </button>
            </div>
          `
            : `
            <div class="exercise-controls">
              <button class="btn btn-ghost" id="skip-btn">Skip</button>
            </div>
          `}
        </div>
      </div>
    `;

    // Add event listeners for options
    if (!state.answered) {
      container.querySelectorAll('.upgrade-option').forEach((btn, idx) => {
        btn.addEventListener('click', () => {
          const correct = isLadder
            ? options[idx] === item.band7
            : options[idx] === item.b2;
          handleAnswer(btn, correct);
        });
      });
    }

    // Add skip button listener
    const skipBtn = container.querySelector('#skip-btn');
    if (skipBtn) {
      skipBtn.addEventListener('click', () => {
        callbacks.onSkip(`upgrade-${state.currentIndex}`);
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

    const item = getCurrentItem();
    const correctAnswer = isLadderItem(item) ? item.band7 : item.b2;

    // Visual feedback
    buttonEl.classList.add(isCorrect ? 'option-correct' : 'option-incorrect');

    // Trigger animation
    if (isCorrect) {
      buttonEl.classList.add('pulse-success');
    } else {
      buttonEl.classList.add('shake-error');
      // Show correct answer highlighted
      const options = container.querySelectorAll('.upgrade-option');
      const correctOption = Array.from(options).find(
        opt => opt.dataset.option === correctAnswer
      );
      if (correctOption) {
        correctOption.classList.add('option-highlight');
      }
    }

    // Call callback
    const itemId = `upgrade-${state.currentIndex}`;
    const b1 = isLadderItem(item) ? item.band5 : item.b1;
    callbacks.onAnswer(itemId, isCorrect, {
      selected: state.selectedOption,
      correct: correctAnswer,
      b1: b1,
      context: item.context || item.gps
    });

    // Re-render to show feedback
    setTimeout(renderQuestion, 100);
  }

  function moveToNext() {
    state.answered = false;
    state.selectedOption = null;

    if (state.currentIndex < itemData.length - 1) {
      state.currentIndex++;
      renderQuestion();
    } else {
      // Exercise complete
      callbacks.onSkip(`upgrade-complete`);
    }
  }

  // Initial render
  renderQuestion();
}

/* ============================================================================
   COMPONENT-SPECIFIC STYLES (to be added to style.css)
   ============================================================================ */

const styles = `
.upgrade-exercise {
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

.upgrade-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.upgrade-sentence {
  padding: var(--spacing-lg);
  background: rgba(232, 168, 124, 0.05);
  border-left: 4px solid var(--accent-amber);
  border-radius: var(--radius-md);
}

.sentence-context {
  font-size: var(--font-size-base);
  line-height: 1.8;
  margin: 0;
  color: var(--text-primary);
}

.b1-word-highlight {
  background: rgba(232, 168, 124, 0.3);
  padding: 2px 4px;
  border-radius: 3px;
  font-weight: var(--font-weight-semibold);
  color: var(--accent-amber);
  text-decoration: underline wavy;
}

.upgrade-question {
  text-align: center;
  padding: var(--spacing-xl);
  background: rgba(61, 90, 128, 0.05);
  border-radius: var(--radius-lg);
}

.question-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: var(--spacing-md);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.band-label {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--accent-indigo);
  word-break: break-word;
}

.upgrade-options {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-md);
}

.upgrade-option {
  padding: var(--spacing-lg);
  font-size: var(--font-size-base);
  background: var(--bg-card);
  border: 2px solid var(--border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--duration-fast) var(--easing-default);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  text-align: left;
}

.upgrade-option:hover:not(:disabled) {
  border-color: var(--accent-indigo);
  background: rgba(61, 90, 128, 0.05);
  transform: translateX(4px);
}

.upgrade-option:active:not(:disabled) {
  transform: translateX(0);
}

.upgrade-option:disabled {
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
  50% { transform: scale(1.02); box-shadow: 0 0 0 8px rgba(163, 177, 138, 0.3); }
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
  align-items: flex-start;
  padding-top: 2px;
}

.feedback-incorrect .feedback-icon {
  color: var(--accent-coral);
}

.feedback-text {
  flex: 1;
}

.feedback-text strong {
  display: block;
  margin-bottom: var(--spacing-md);
  font-size: var(--font-size-lg);
}

.correct-answer {
  margin-bottom: var(--spacing-md);
  color: var(--text-primary);
  font-weight: var(--font-weight-medium);
}

.tip-text {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 1px solid rgba(61, 90, 128, 0.1);
}

.band-ladder {
  margin-top: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.ladder-rung {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: rgba(255, 255, 255, 0.5);
  border-radius: var(--radius-md);
  transition: all var(--duration-fast) var(--easing-default);
}

.ladder-rung.ladder-target {
  background: rgba(163, 177, 138, 0.2);
  border: 2px solid var(--accent-matcha);
  font-weight: var(--font-weight-semibold);
}

.band-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: white;
}

.band-5 {
  background: rgba(99, 110, 114, 0.6);
}

.band-6 {
  background: rgba(99, 110, 114, 0.8);
}

.band-7 {
  background: var(--accent-matcha);
}

.band-8 {
  background: rgba(163, 177, 138, 0.6);
}

.band-word {
  flex: 1;
  font-size: var(--font-size-base);
  color: var(--text-primary);
}

.ladder-arrow {
  text-align: center;
  color: var(--text-secondary);
  font-size: var(--font-size-lg);
  margin: -4px 0;
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
  .feedback-section {
    flex-direction: column;
  }

  .exercise-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);
  }

  .band-ladder {
    gap: var(--spacing-xs);
  }

  .ladder-rung {
    gap: var(--spacing-sm);
    padding: var(--spacing-sm);
  }

  .band-badge {
    width: 36px;
    height: 36px;
    font-size: var(--font-size-xs);
  }
}
`;

// Export styles as a string for potential CSS injection
export { styles as componentStyles };
