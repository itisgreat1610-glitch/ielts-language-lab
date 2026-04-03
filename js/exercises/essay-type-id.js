/**
 * essay-type-id.js - Essay Type Identification Exercise Module
 * Students read an essay question and identify its type (Opinion, Discussion, etc.)
 * Teaches recognition of different task command words and structures.
 */

export const meta = {
  id: 'essay-type-id',
  name: 'Essay Type ID',
  layer: 3,
  minLevel: 6,
  estimatedTime: 25
};

/**
 * Essay type definitions and keywords
 */
const essayTypes = {
  opinion: {
    name: 'Opinion',
    color: '#e74c3c',
    keywords: ['agree or disagree', 'do you agree', 'opinion', 'view'],
    description: 'You must present your opinion clearly and support it with examples.'
  },
  discussion: {
    name: 'Discussion',
    color: '#3498db',
    keywords: ['discuss both', 'advantages and disadvantages', 'pros and cons', 'both views'],
    description: 'Present both sides of an argument, then give your opinion.'
  },
  advdis: {
    name: 'Advantages/Disadvantages',
    color: '#2ecc71',
    keywords: ['advantages', 'disadvantages', 'benefits', 'drawbacks', 'positive', 'negative'],
    description: 'Discuss the advantages and disadvantages of a topic in separate paragraphs.'
  },
  problem: {
    name: 'Problem/Solution',
    color: '#f1c40f',
    keywords: ['problem', 'solution', 'causes', 'remedy', 'address', 'solve'],
    description: 'Identify problems and propose practical solutions with explanation.'
  },
  twopart: {
    name: 'Two-Part Question',
    color: '#9b59b6',
    keywords: ['to what extent', 'how far', 'how much', 'and', 'also', 'as well'],
    description: 'Answer two related questions within the same essay.'
  }
};

/**
 * Render the essay type identification exercise
 * @param {HTMLElement} container - The container to render into
 * @param {Object} itemData - Exercise data with question and correct type
 * @param {Object} callbacks - { onAnswer, onSkip }
 */
export function render(container, itemData, callbacks) {
  // Destructure data
  const { phrase = '', correct = 'opinion', gps = '', tip = '', id = 'ets-001' } = itemData;

  if (!phrase) {
    container.innerHTML = '<p class="exercise-error">Invalid exercise data</p>';
    return;
  }

  // Normalize correct type(s) â data may provide an array of valid types
  const correctTypes = Array.isArray(correct)
    ? correct.map(c => c.toLowerCase().replace(/\s+/g, '_'))
    : [correct.toLowerCase().replace(/\s+/g, '_')];
  // Use the first correct type as the primary answer for display
  const normalizedCorrect = correctTypes[0];

  // State tracking
  const exerciseState = {
    answered: false,
    isCorrect: false,
    selectedType: null,
    attemptCount: 0
  };

  // Build HTML structure
  const exerciseHTML = document.createElement('div');
  exerciseHTML.className = 'essay-type-id-exercise';
  exerciseHTML.innerHTML = `
    <div class="essay-type-id-container">
      <div class="essay-type-id-question">
        <h2 class="essay-question-text">"${escapeHtml(phrase)}"</h2>
        <p class="essay-type-instruction">What type of essay question is this?</p>
      </div>

      <div class="essay-type-buttons">
        ${Object.entries(essayTypes).map(([key, type]) => `
          <button class="essay-type-btn" data-type="${key}" style="border-color: ${type.color}">
            <span class="essay-type-btn-name">${type.name}</span>
            <span class="essay-type-btn-desc">${type.description}</span>
          </button>
        `).join('')}
      </div>

      <div class="essay-type-id-feedback" id="eti-feedback" style="display: none;"></div>

      <div class="essay-type-id-explanation" id="eti-explanation" style="display: none;">
        <div class="explanation-content">
          <h4>Why is this correct?</h4>
          <p id="eti-explanation-text"></p>
          <div class="explanation-keywords">
            <strong>Key phrases:</strong> <span id="eti-keywords"></span>
          </div>
          ${tip ? `<div class="explanation-tip"><strong>Tip:</strong> ${escapeHtml(tip)}</div>` : ''}
        </div>
      </div>

      <div class="essay-type-id-controls">
        <button class="btn btn-secondary btn-block" id="eti-skip-btn">Skip Question</button>
      </div>
    </div>
  `;

  container.appendChild(exerciseHTML);

  // Get references to elements
  const typeButtons = container.querySelectorAll('.essay-type-btn');
  const feedbackDiv = container.querySelector('#eti-feedback');
  const explanationDiv = container.querySelector('#eti-explanation');
  const explanationText = container.querySelector('#eti-explanation-text');
  const keywordsSpan = container.querySelector('#eti-keywords');
  const skipBtn = container.querySelector('#eti-skip-btn');

  /**
   * Show feedback message
   */
  function showFeedback(isCorrect, message) {
    feedbackDiv.className = 'essay-type-id-feedback exercise-feedback';
    if (isCorrect) {
      feedbackDiv.classList.add('correct');
      feedbackDiv.innerHTML = `
        <span class="exercise-feedback-icon">â</span>
        <span class="exercise-feedback-text">${message}</span>
      `;
    } else {
      feedbackDiv.classList.add('incorrect');
      feedbackDiv.innerHTML = `
        <span class="exercise-feedback-icon">â</span>
        <span class="exercise-feedback-text">${message}</span>
      `;
    }
    feedbackDiv.style.display = 'block';
  }

  /**
   * Show explanation of the correct type
   */
  function showExplanation(typeKey) {
    const typeInfo = essayTypes[typeKey];
    if (!typeInfo) return;

    explanationText.textContent = typeInfo.description;
    keywordsSpan.textContent = typeInfo.keywords.join(', ');
    explanationDiv.style.display = 'block';
  }

  /**
   * Handle type button click
   */
  function handleTypeClick(button) {
    if (exerciseState.answered) return;

    exerciseState.attemptCount++;
    const selectedType = button.dataset.type;
    const isCorrect = correctTypes.includes(selectedType);

    exerciseState.answered = true;
    exerciseState.isCorrect = isCorrect;
    exerciseState.selectedType = button;

    // Visual feedback on button
    if (isCorrect) {
      button.classList.add('correct');
      showFeedback(true,
        `Correct! This is a ${essayTypes[selectedType].name} question.`
      );
      showExplanation(selectedType);

      // Call onAnswer callback after a brief delay
      setTimeout(() => {
        callbacks.onAnswer(itemData.id || id, true, {
          exerciseType: 'essay-type-id',
          selectedType: selectedType,
          attempts: exerciseState.attemptCount
        });
      }, 800);
    } else {
      button.classList.add('incorrect');
      button.style.opacity = '0.5';

      const validNames = correctTypes
        .map(t => essayTypes[t]?.name)
        .filter(Boolean)
        .join(' / ');
      showFeedback(false,
        `Not quite. Valid type(s): ${validNames}. Not ${essayTypes[selectedType]?.name || selectedType}.`
      );
      showExplanation(normalizedCorrect);

      // Allow another attempt
      setTimeout(() => {
        exerciseState.answered = false;
      }, 1000);
    }
  }

  /**
   * Reveal correct answer after max attempts
   */
  function revealCorrectAnswer() {
    const correctBtn = Array.from(typeButtons).find(
      btn => btn.dataset.type === normalizedCorrect
    );
    if (correctBtn && !correctBtn.classList.contains('correct')) {
      correctBtn.classList.add('revealed-answer');

      const correctType = essayTypes[normalizedCorrect];
      showFeedback(false,
        `The correct answer is: ${correctType?.name || normalizedCorrect}`
      );
      showExplanation(normalizedCorrect);
      exerciseState.answered = true;

      // Call onAnswer as incorrect
      setTimeout(() => {
        callbacks.onAnswer(itemData.id || id, false, {
          exerciseType: 'essay-type-id',
          correctType: normalizedCorrect,
          selectedType: exerciseState.selectedType?.dataset.type,
          attempts: exerciseState.attemptCount
        });
      }, 800);
    }
  }

  // Attach click handlers to type buttons
  typeButtons.forEach(button => {
    button.addEventListener('click', () => {
      handleTypeClick(button);

      // Reveal answer after 2 wrong attempts
      if (!exerciseState.isCorrect && exerciseState.attemptCount >= 2) {
        setTimeout(() => revealCorrectAnswer(), 1200);
      }
    });
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
