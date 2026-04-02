/**
 * word-match.js - Word Match Exercise Module
 * Students match words on the left to definitions on the right
 * All 6 pairs must be matched to complete the exercise
 */

export const meta = {
  id: 'word-match',
  name: 'Word Match',
  layer: 1,
  minLevel: 1,
  estimatedTime: 30
};

/**
 * Render the word match exercise
 * @param {HTMLElement} container - The container to render into
 * @param {Object} itemData - Exercise data with items array
 * @param {Object} callbacks - { onAnswer, onSkip }
 */
export function render(container, itemData, callbacks) {
  // Destructure data
  const { items = [] } = itemData;

  if (!items || items.length === 0) {
    container.innerHTML = '<p class="exercise-error">No items to display</p>';
    return;
  }

  // State tracking
  const matchState = {
    selectedWord: null,
    selectedWordId: null,
    matchedPairs: new Set(),
    attempts: {} // Track attempts per pair for scoring
  };

  // Shuffle definitions for randomness
  const definitions = items.map((item, idx) => ({
    index: idx,
    word: item.word,
    definition: item.definition,
    wordId: item.word_id
  }));
  const shuffledDefs = definitions.sort(() => Math.random() - 0.5);

  // Build HTML structure
  const exerciseHTML = document.createElement('div');
  exerciseHTML.className = 'word-match-exercise';
  exerciseHTML.innerHTML = `
    <div class="word-match-container">
      <div class="word-match-column">
        <h3 class="word-match-label">Words</h3>
        <div class="word-match-items words-column">
          ${items.map((item, idx) => `
            <div class="word-match-item word-item" data-index="${idx}" data-word-id="${item.word_id}">
              <div class="word-match-item-content">
                ${item.word}
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="word-match-column">
        <h3 class="word-match-label">Definitions</h3>
        <div class="word-match-items definitions-column">
          ${shuffledDefs.map((item, idx) => `
            <div class="word-match-item def-item" data-index="${item.index}" data-word-id="${item.wordId}">
              <div class="word-match-item-content">
                ${item.definition}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <div class="word-match-progress">
      <div class="word-match-progress-text">Matched: <span class="matched-count">0</span>/${items.length}</div>
      <div class="word-match-progress-bar">
        <div class="word-match-progress-fill" style="width: 0%"></div>
      </div>
    </div>

    <div class="word-match-controls">
      <button class="btn btn-secondary btn-block" id="wm-skip-btn">Skip Exercise</button>
    </div>
  `;

  container.appendChild(exerciseHTML);

  // Get all word and definition items
  const wordItems = container.querySelectorAll('.word-item');
  const defItems = container.querySelectorAll('.def-item');
  const matchedCountSpan = container.querySelector('.matched-count');
  const progressFill = container.querySelector('.word-match-progress-fill');
  const skipBtn = container.querySelector('#wm-skip-btn');

  /**
   * Update progress display
   */
  function updateProgress() {
    const percent = (matchState.matchedPairs.size / items.length) * 100;
    matchedCountSpan.textContent = matchState.matchedPairs.size;
    progressFill.style.width = percent + '%';

    // If all matched, call onAnswer for completion
    if (matchState.matchedPairs.size === items.length) {
      // Small delay for visual feedback
      setTimeout(() => {
        callbacks.onAnswer(itemData.id, true, {
          exerciseType: 'word-match',
          matchedCount: matchState.matchedPairs.size,
          totalCount: items.length
        });
      }, 300);
    }
  }

  /**
   * Mark a pair as matched
   */
  function markMatched(wordIndex, defIndex) {
    const pairKey = `${wordIndex}-${defIndex}`;
    if (matchState.matchedPairs.has(pairKey)) return;

    matchState.matchedPairs.add(pairKey);

    // Find and mark the items as matched
    const wordItem = Array.from(wordItems).find(
      el => el.dataset.index === String(wordIndex)
    );
    const defItem = Array.from(defItems).find(
      el => el.dataset.index === String(defIndex)
    );

    if (wordItem) wordItem.classList.add('matched');
    if (defItem) defItem.classList.add('matched');

    // Disable the matched items
    if (wordItem) wordItem.style.pointerEvents = 'none';
    if (defItem) defItem.style.pointerEvents = 'none';

    // Track for SRS feedback
    const pairId = `pair-${wordIndex}-${defIndex}`;
    if (!matchState.attempts[pairId]) {
      matchState.attempts[pairId] = 0;
    }
    matchState.attempts[pairId]++;

    updateProgress();
  }

  /**
   * Show incorrect match feedback
   */
  function showIncorrectFeedback(wordItem, defItem) {
    wordItem.classList.add('shake-error');
    defItem.classList.add('shake-error');

    setTimeout(() => {
      wordItem.classList.remove('shake-error');
      defItem.classList.remove('shake-error');
    }, 600);
  }

  /**
   * Clear selection
   */
  function clearSelection() {
    if (matchState.selectedWord) {
      matchState.selectedWord.classList.remove('selected');
    }
    matchState.selectedWord = null;
    matchState.selectedWordId = null;
  }

  // Word item click handler
  wordItems.forEach(wordItem => {
    wordItem.addEventListener('click', () => {
      if (wordItem.classList.contains('matched')) return;

      // If this word is already selected, deselect it
      if (matchState.selectedWord === wordItem) {
        clearSelection();
        return;
      }

      // Clear previous selection
      clearSelection();

      // Select this word
      wordItem.classList.add('selected');
      matchState.selectedWord = wordItem;
      matchState.selectedWordId = wordItem.dataset.wordId;
    });
  });

  // Definition item click handler
  defItems.forEach(defItem => {
    defItem.addEventListener('click', () => {
      if (defItem.classList.contains('matched') || !matchState.selectedWord) return;

      const wordIndex = parseInt(matchState.selectedWord.dataset.index);
      const defIndex = parseInt(defItem.dataset.index);
      const selectedDefWordId = defItem.dataset.wordId;

      // Check if this definition matches the selected word
      if (matchState.selectedWordId === selectedDefWordId) {
        // Correct match
        markMatched(wordIndex, defIndex);
        clearSelection();
      } else {
        // Incorrect match
        showIncorrectFeedback(matchState.selectedWord, defItem);
        clearSelection();
      }
    });
  });

  // Skip button handler
  skipBtn.addEventListener('click', () => {
    callbacks.onSkip(itemData.id);
  });
}
