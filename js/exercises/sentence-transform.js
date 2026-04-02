/**
 * Sentence Transform Exercise Module
 * Students select the correct transformation of a sentence from a given type
 * to a target type.
 */

export const meta = {
  id: 'sentence-transform',
  name: 'Sentence Transform',
  layer: 2,
  minLevel: 3,
  estimatedTime: 50,
};

/**
 * Render a sentence transformation exercise.
 * @param {HTMLElement} container - The DOM container
 * @param {Object} itemData - Single item from sentence_transform array
 * @param {Object} callbacks - { onAnswer(id, correct, details), onSkip(id) }
 */
export function render(container, itemData, callbacks) {
  const { id, original, type, target_type, options } = itemData;

  // Build the exercise card structure
  const card = document.createElement('div');
  card.className = 'exercise-card sentence-transform-card';
  card.innerHTML = `
    <div class="exercise-header">
      <h2 class="exercise-title">Transform the Sentence</h2>
    </div>

    <div class="sentence-context">
      <div class="original-sentence">
        <div class="label">Original <span class="type-badge">${capitalize(type)}</span></div>
        <p class="sentence-text">${escapeHtml(original)}</p>
      </div>

      <div class="target-info">
        <div class="arrow">↓</div>
        <div class="target-type-badge">Transform to: <strong>${capitalize(target_type)}</strong></div>
      </div>
    </div>

    <div class="options-container">
      ${options.map((option, idx) => `
        <button class="option-card" data-index="${idx}" aria-label="Option ${idx + 1}">
          <div class="option-text">${escapeHtml(option.text)}</div>
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
  const optionButtons = card.querySelectorAll('.option-card');

  // Track state
  let answered = false;

  // Find the correct option
  const correctIndex = options.findIndex(opt => opt.correct);

  // Handle option clicks
  optionButtons.forEach((button, idx) => {
    button.addEventListener('click', () => {
      if (answered) return;
      answered = true;

      const isCorrect = idx === correctIndex;
      const selectedOption = options[idx];
      const correctOption = options[correctIndex];

      // Disable all buttons
      optionButtons.forEach(b => b.disabled = true);

      if (isCorrect) {
        // Correct answer: highlight and show explanation
        button.classList.add('correct-answer');
        showCorrectFeedback(feedbackArea, correctOption);
      } else {
        // Incorrect answer: show why wrong and highlight correct
        button.classList.add('incorrect-answer');
        optionButtons[correctIndex].classList.add('correct-answer-highlight');
        showIncorrectFeedback(feedbackArea, selectedOption, correctOption);
      }

      // Call callback
      callbacks.onAnswer(id, isCorrect, {
        selectedIndex: idx,
        correctIndex: correctIndex,
        selectedText: selectedOption.text,
        correctText: correctOption.text,
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
function showCorrectFeedback(feedbackArea, correctOption) {
  let highlightedText = correctOption.text;

  feedbackArea.innerHTML = `
    <div class="feedback feedback-correct">
      <div class="feedback-icon">✓</div>
      <div class="feedback-content">
        <p class="feedback-title">Excellent!</p>
        <p class="feedback-explanation">
          This is a <strong>${getTransformType(correctOption.text)}</strong> sentence.
          It correctly demonstrates the target transformation.
        </p>
        <div class="highlighted-sentence">
          ${highlightStructure(correctOption.text)}
        </div>
      </div>
    </div>
  `;
  feedbackArea.classList.add('show');
}

/**
 * Display feedback for an incorrect answer.
 */
function showIncorrectFeedback(feedbackArea, selectedOption, correctOption) {
  feedbackArea.innerHTML = `
    <div class="feedback feedback-incorrect">
      <div class="feedback-icon">✗</div>
      <div class="feedback-content">
        <p class="feedback-title">Not quite.</p>
        <p class="feedback-reason">
          <strong>Why this isn't correct:</strong><br>
          ${selectedOption.why ? escapeHtml(selectedOption.why) : 'This transformation does not match the target sentence type.'}
        </p>
        <p class="feedback-correction">
          <strong>The correct answer:</strong><br>
          <em>${escapeHtml(correctOption.text)}</em>
        </p>
        <div class="highlighted-sentence">
          ${highlightStructure(correctOption.text)}
        </div>
      </div>
    </div>
  `;
  feedbackArea.classList.add('show');
}

/**
 * Highlight structural elements (conjunctions, clause markers) in the sentence.
 * Simple heuristic highlighting for common patterns.
 */
function highlightStructure(text) {
  let highlighted = escapeHtml(text);

  // Common subordinating conjunctions and clause markers
  const subordinators = [
    'because', 'since', 'although', 'though', 'while', 'whereas',
    'if', 'unless', 'as', 'when', 'whenever', 'where', 'wherever',
    'who', 'whom', 'which', 'that', 'whose', 'how', 'why',
  ];

  // Coordinating conjunctions
  const coordinators = ['and', 'but', 'or', 'nor', 'yet', 'so'];

  // Wrap subordinators
  subordinators.forEach(subord => {
    const regex = new RegExp(`\\b${subord}\\b`, 'gi');
    highlighted = highlighted.replace(regex, `<mark class="subordinator">$&</mark>`);
  });

  // Wrap coordinators
  coordinators.forEach(coord => {
    const regex = new RegExp(`\\b${coord}\\b`, 'gi');
    highlighted = highlighted.replace(regex, `<mark class="coordinator">$&</mark>`);
  });

  return `<p class="highlighted-text">${highlighted}</p>`;
}

/**
 * Guess the sentence type based on basic heuristics.
 * This is a simple helper for feedback; not definitive.
 */
function getTransformType(text) {
  const subordinators = ['because', 'since', 'although', 'though', 'while', 'if', 'unless', 'when', 'who', 'which', 'that'];
  const coordinators = ['and', 'but', 'or', 'nor', 'yet', 'so'];

  const hasSubordinator = subordinators.some(s => new RegExp(`\\b${s}\\b`, 'i').test(text));
  const hasCoordinator = coordinators.some(c => new RegExp(`\\b${c}\\b`, 'i').test(text));

  if (hasSubordinator && !hasCoordinator) {
    return 'complex';
  } else if (hasCoordinator && !hasSubordinator) {
    return 'compound';
  } else if (hasSubordinator && hasCoordinator) {
    return 'mixed';
  }
  return 'simple';
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
