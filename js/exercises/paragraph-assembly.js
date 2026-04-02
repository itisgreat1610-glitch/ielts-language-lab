/**
 * paragraph-assembly.js - Paragraph Assembly Exercise Module
 * Students reorder jumbled sentences into correct PEEEL/UPEPE sequence.
 * Mobile-friendly: tap to select, tap position to place or use up/down buttons.
 */

export const meta = {
  id: 'paragraph-assembly',
  name: 'Paragraph Assembly',
  layer: 3,
  minLevel: 5,
  estimatedTime: 40
};

/**
 * GPS color map for visual feedback
 */
const gpsColors = {
  'P': '#3498db',          // Blue
  'E-explain': '#2ecc71',  // Green
  'E-example': '#f1c40f',  // Amber
  'E-effect': '#e74c3c',   // Coral
  'L': '#9b59b6',          // Purple
  'U': '#e84393'           // Pink
};

/**
 * Render the paragraph assembly exercise
 * @param {HTMLElement} container - The container to render into
 * @param {Object} itemData - Exercise data with sentences and slots
 * @param {Object} callbacks - { onAnswer, onSkip }
 */
export function render(container, itemData, callbacks) {
  // Destructure data
  const { sentences = [], type = 'PEEEL', title = '', failTip = '' } = itemData;

  if (!sentences || sentences.length === 0) {
    container.innerHTML = '<p class="exercise-error">Invalid exercise data</p>';
    return;
  }

  // Create ordered list of sentences for verification
  const correctOrder = sentences
    .slice()
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  const correctSlotOrder = correctOrder.map(s => s.slot);

  // Shuffle sentences for display
  const shuffledSentences = sentences
    .slice()
    .sort(() => Math.random() - 0.5);

  // State tracking
  const exerciseState = {
    currentOrder: shuffledSentences.map((s, idx) => ({
      ...s,
      currentIndex: idx
    })),
    isChecking: false
  };

  // Build HTML structure
  const exerciseHTML = document.createElement('div');
  exerciseHTML.className = 'paragraph-assembly-exercise';
  exerciseHTML.innerHTML = `
    <div class="paragraph-assembly-container">
      <div class="paragraph-assembly-title">${escapeHtml(title || type)}</div>
      <p class="paragraph-assembly-instruction">
        Reorder the sentences to form a correct ${type} paragraph
      </p>

      <div class="paragraph-assembly-workspace">
        <div class="pa-shuffled-sentences">
          <h3>Shuffled Sentences:</h3>
          <div class="pa-sentence-list">
            ${shuffledSentences.map((sent, idx) => `
              <div class="pa-sentence-card" data-sentence-id="${idx}" draggable="true">
                <span class="pa-card-number">${idx + 1}</span>
                <span class="pa-card-text">${escapeHtml(sent.text)}</span>
                <div class="pa-card-controls">
                  <button class="pa-btn-up" title="Move up">▲</button>
                  <button class="pa-btn-down" title="Move down">▼</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="pa-ordered-area">
          <h3>Ordered Sequence:</h3>
          <div class="pa-ordered-list" id="pa-ordered-list">
            ${shuffledSentences.map((sent, idx) => `
              <div class="pa-slot" data-index="${idx}" style="border-left: 4px solid ${gpsColors[sent.slot] || '#999'}">
                <span class="pa-slot-label">${sent.slot}</span>
                <span class="pa-slot-text">${escapeHtml(sent.text)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="paragraph-assembly-feedback" id="pa-feedback" style="display: none;"></div>

      <div class="paragraph-assembly-controls">
        <button class="btn btn-primary" id="pa-check-btn">Check Order</button>
        <button class="btn btn-secondary" id="pa-skip-btn">Skip Exercise</button>
      </div>
    </div>
  `;

  container.appendChild(exerciseHTML);

  // Get references to elements
  const sentenceCards = container.querySelectorAll('.pa-sentence-card');
  const orderedList = container.querySelector('#pa-ordered-list');
  const orderedSlots = container.querySelectorAll('.pa-slot');
  const feedbackDiv = container.querySelector('#pa-feedback');
  const checkBtn = container.querySelector('#pa-check-btn');
  const skipBtn = container.querySelector('#pa-skip-btn');

  /**
   * Show feedback message
   */
  function showFeedback(message, isSuccess = false, details = '') {
    feedbackDiv.className = 'paragraph-assembly-feedback exercise-feedback';
    if (isSuccess) {
      feedbackDiv.classList.add('correct');
      feedbackDiv.innerHTML = `
        <span class="exercise-feedback-icon">✓</span>
        <span class="exercise-feedback-text">${message}</span>
      `;
    } else {
      feedbackDiv.classList.add('incorrect');
      feedbackDiv.innerHTML = `
        <span class="exercise-feedback-icon">✗</span>
        <div class="exercise-feedback-text">
          <div>${message}</div>
          ${details ? `<div class="feedback-details">${details}</div>` : ''}
          ${failTip ? `<div class="feedback-tip">Tip: ${escapeHtml(failTip)}</div>` : ''}
        </div>
      `;
    }
    feedbackDiv.style.display = 'block';
  }

  /**
   * Update the ordered display
   */
  function updateOrderedDisplay() {
    orderedList.innerHTML = '';
    exerciseState.currentOrder.forEach((sent, idx) => {
      const slot = document.createElement('div');
      slot.className = 'pa-slot';
      slot.dataset.index = idx;
      slot.style.borderLeftColor = gpsColors[sent.slot] || '#999';
      slot.innerHTML = `
        <span class="pa-slot-label">${sent.slot}</span>
        <span class="pa-slot-text">${escapeHtml(sent.text)}</span>
      `;
      orderedList.appendChild(slot);
    });
  }

  /**
   * Move sentence up in order
   */
  function moveSentenceUp(sentenceId) {
    const index = exerciseState.currentOrder.findIndex(
      s => s === sentences[sentenceId]
    );
    if (index > 0) {
      [exerciseState.currentOrder[index], exerciseState.currentOrder[index - 1]] = [
        exerciseState.currentOrder[index - 1],
        exerciseState.currentOrder[index]
      ];
      updateOrderedDisplay();
    }
  }

  /**
   * Move sentence down in order
   */
  function moveSentenceDown(sentenceId) {
    const index = exerciseState.currentOrder.findIndex(
      s => s === sentences[sentenceId]
    );
    if (index < exerciseState.currentOrder.length - 1) {
      [exerciseState.currentOrder[index], exerciseState.currentOrder[index + 1]] = [
        exerciseState.currentOrder[index + 1],
        exerciseState.currentOrder[index]
      ];
      updateOrderedDisplay();
    }
  }

  /**
   * Check if order is correct
   */
  function checkOrder() {
    if (exerciseState.isChecking) return;
    exerciseState.isChecking = true;

    let allCorrect = true;
    const wrongPositions = [];

    exerciseState.currentOrder.forEach((sent, idx) => {
      const expectedSlot = correctSlotOrder[idx];
      if (sent.slot !== expectedSlot) {
        allCorrect = false;
        wrongPositions.push(idx + 1);
      }
    });

    if (allCorrect) {
      // Highlight all slots with their correct colors
      orderedSlots.forEach(slot => {
        slot.classList.add('correct');
      });
      showFeedback('Perfect! Your paragraph is in the correct sequence.');

      setTimeout(() => {
        callbacks.onAnswer(itemData.id, true, {
          exerciseType: 'paragraph-assembly',
          type: type,
          correct: true
        });
      }, 800);
    } else {
      showFeedback(
        'Some sentences are in the wrong positions.',
        false,
        `Check positions: ${wrongPositions.join(', ')}`
      );
      exerciseState.isChecking = false;
    }
  }

  // Attach up/down button handlers
  sentenceCards.forEach(card => {
    const sentenceId = parseInt(card.dataset.sentenceId);
    const upBtn = card.querySelector('.pa-btn-up');
    const downBtn = card.querySelector('.pa-btn-down');

    upBtn.addEventListener('click', () => moveSentenceUp(sentenceId));
    downBtn.addEventListener('click', () => moveSentenceDown(sentenceId));
  });

  // Check button handler
  checkBtn.addEventListener('click', checkOrder);

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
  return String(text).replace(/[&<>"']/g, char => map[char]);
}
