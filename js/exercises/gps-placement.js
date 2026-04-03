/**
 * gps-placement.js - GPS Placement Exercise Module
 * Students drag or tap phrase cards into correct PEEEL/UPEPE zone slots.
 * Mobile-friendly: tap phrase, then tap zone to place it.
 */

export const meta = {
  id: 'gps-placement',
  name: 'GPS Placement',
  layer: 3,
  minLevel: 4,
  estimatedTime: 45
};

/**
 * GPS color map for visual feedback
 */
const gpsColors = {
  // GPS letter codes
  'P': '#3498db',          // Blue
  'E-explain': '#2ecc71',  // Green
  'E-example': '#f1c40f',  // Amber
  'E-effect': '#e74c3c',   // Coral
  'L': '#9b59b6',          // Purple
  'U': '#e84393',          // Pink
  // Data key codes (from level JSON)
  'hook': '#3498db',       // Blue
  'background': '#2ecc71', // Green
  'thesis': '#f1c40f',     // Amber
  'point': '#3498db',      // Blue
  'explain': '#2ecc71',    // Green
  'example': '#f1c40f',    // Amber
  'effect': '#e74c3c',     // Coral
  'link': '#9b59b6',       // Purple
  'understanding': '#e84393', // Pink
  'problem': '#3498db',    // Blue
  'evidence': '#f1c40f',   // Amber
  'position': '#e84393'    // Pink
};

/**
 * Render the GPS placement exercise
 * @param {HTMLElement} container - The container to render into
 * @param {Object} itemData - Exercise data with zones and items
 * @param {Object} callbacks - { onAnswer, onSkip }
 */
export function render(container, itemData, callbacks) {
  // Destructure data
  const { zones = [], items = [], title = '', feedback = {} } = itemData;

  if (!zones || !items || items.length === 0) {
    container.innerHTML = '<p class="exercise-error">Invalid exercise data</p>';
    return;
  }

  // State tracking
  const exerciseState = {
    selectedPhrase: null,
    placedItems: new Map(), // itemId -> zoneIndex
    isChecking: false,
    totalCorrect: 0
  };

  // Build HTML structure
  const exerciseHTML = document.createElement('div');
  exerciseHTML.className = 'gps-placement-exercise';
  exerciseHTML.innerHTML = `
    <div class="gps-placement-container">
      <div class="gps-placement-title">${escapeHtml(title)}</div>

      <div class="gps-placement-zones">
        ${zones.map((zone, idx) => {
          const zoneLabel = typeof zone === 'object' ? zone.label : zone;
          const zoneKey = typeof zone === 'object' ? (zone.key || zone.label) : zone;
          const color = gpsColors[zoneKey] || gpsColors[zone] || '#888';
          return `
          <div class="gps-zone" data-zone-index="${idx}" data-zone-key="${escapeHtml(zoneKey)}" style="border-color: ${color}">
            <div class="gps-zone-label" style="background-color: ${color}">${escapeHtml(zoneLabel)}</div>
            <div class="gps-zone-slots">
              <!-- Phrases will be placed here -->
            </div>
          </div>
        `}).join('')}
      </div>

      <div class="gps-placement-phrases">
        <p class="gps-phrases-label">Phrase Cards (Tap to select, then tap zone to place):</p>
        <div class="gps-phrase-list">
          ${items.map((item, idx) => `
            <button class="gps-phrase-card" data-item-index="${idx}" data-item-id="${escapeHtml(item.id || idx)}">
              <span class="gps-phrase-text">${escapeHtml(item.text)}</span>
            </button>
          `).join('')}
        </div>
      </div>

      <div class="gps-placement-feedback" id="gps-feedback" style="display: none;"></div>

      <div class="gps-placement-controls">
        <button class="btn btn-primary" id="gps-check-btn">Check Placement</button>
        <button class="btn btn-secondary" id="gps-skip-btn">Skip Exercise</button>
      </div>
    </div>
  `;

  container.appendChild(exerciseHTML);

  // Get references to elements
  const phraseCards = container.querySelectorAll('.gps-phrase-card');
  const zoneElements = container.querySelectorAll('.gps-zone');
  const feedbackDiv = container.querySelector('#gps-feedback');
  const checkBtn = container.querySelector('#gps-check-btn');
  const skipBtn = container.querySelector('#gps-skip-btn');

  /**
   * Show feedback message
   */
  function showFeedback(message, isSuccess = false) {
    feedbackDiv.className = 'gps-placement-feedback exercise-feedback';
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
        <span class="exercise-feedback-text">${message}</span>
      `;
    }
    feedbackDiv.style.display = 'block';
  }

  /**
   * Handle phrase card click - select/deselect
   */
  function handlePhraseClick(button) {
    const itemIndex = button.dataset.itemIndex;
    const itemId = button.dataset.itemId;

    // If already placed, don't allow reselection
    if (exerciseState.placedItems.has(itemId)) {
      return;
    }

    // Toggle selection
    if (exerciseState.selectedPhrase === button) {
      button.classList.remove('selected');
      exerciseState.selectedPhrase = null;
    } else {
      // Deselect previous
      if (exerciseState.selectedPhrase) {
        exerciseState.selectedPhrase.classList.remove('selected');
      }
      button.classList.add('selected');
      exerciseState.selectedPhrase = button;
    }
  }

  /**
   * Handle zone click - place selected phrase
   */
  function handleZoneClick(zoneElement) {
    if (!exerciseState.selectedPhrase) {
      showFeedback('Please select a phrase first.', false);
      return;
    }

    const zoneIndex = parseInt(zoneElement.dataset.zoneIndex);
    const itemId = exerciseState.selectedPhrase.dataset.itemId;
    const itemIndex = parseInt(exerciseState.selectedPhrase.dataset.itemIndex);

    // Place the item
    exerciseState.placedItems.set(itemId, zoneIndex);

    // Add visual feedback
    exerciseState.selectedPhrase.classList.add('placed');
    exerciseState.selectedPhrase.classList.remove('selected');

    // Add phrase to zone (visual representation)
    const zoneSlots = zoneElement.querySelector('.gps-zone-slots');
    const phraseDisplay = document.createElement('div');
    phraseDisplay.className = 'gps-placed-phrase';
    phraseDisplay.textContent = items[itemIndex].text;
    zoneSlots.appendChild(phraseDisplay);

    exerciseState.selectedPhrase = null;

    // Check if all placed
    if (exerciseState.placedItems.size === items.length) {
      showFeedback('All phrases placed! Click "Check Placement" to verify.', true);
    }
  }

  /**
   * Check if all placements are correct
   */
  function checkPlacement() {
    if (exerciseState.isChecking) return;
    if (exerciseState.placedItems.size !== items.length) {
      showFeedback('Please place all phrases before checking.', false);
      return;
    }

    exerciseState.isChecking = true;

    let allCorrect = true;
    let correctCount = 0;

    // Verify each placement
    items.forEach((item, itemIndex) => {
      const itemId = item.id || String(itemIndex);
      const placedZoneIndex = exerciseState.placedItems.get(itemId);
      // Match by key: data uses item.correct (a key string), zones are objects with .key
      const correctKey = item.correct_zone || item.correct;
      const correctZoneIndex = zones.findIndex(z =>
        (typeof z === 'object' ? z.key : z) === correctKey
      );

      if (placedZoneIndex === correctZoneIndex) {
        correctCount++;
        // Highlight correct placement with green flash
        const phraseCard = container.querySelector(
          `[data-item-id="${itemId}"]`
        );
        if (phraseCard) {
          phraseCard.classList.add('correct');
        }
      } else {
        allCorrect = false;
        // Highlight incorrect placement
        const phraseCard = container.querySelector(
          `[data-item-id="${itemId}"]`
        );
        if (phraseCard) {
          phraseCard.classList.add('incorrect');
          phraseCard.style.animation = 'shake 0.5s';
        }
      }
    });

    if (allCorrect) {
      showFeedback(
        'Excellent! All phrases placed in correct zones.',
        true
      );
      setTimeout(() => {
        callbacks.onAnswer(itemData.id, true, {
          exerciseType: 'gps-placement',
          correctPlacements: correctCount,
          totalPlacements: items.length
        });
      }, 800);
    } else {
      showFeedback(
        `${correctCount}/${items.length} correct. Try adjusting the misplaced phrases.`,
        false
      );
      exerciseState.isChecking = false;
    }
  }

  // Attach phrase click handlers
  phraseCards.forEach(card => {
    card.addEventListener('click', () => handlePhraseClick(card));
  });

  // Attach zone click handlers
  zoneElements.forEach(zone => {
    zone.addEventListener('click', () => handleZoneClick(zone));
  });

  // Check button handler
  checkBtn.addEventListener('click', checkPlacement);

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
