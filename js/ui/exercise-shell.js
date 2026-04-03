/**
 * exercise-shell.js - Universal Exercise Wrapper
 * Wraps all exercise types with header, progress bar, feedback, and results.
 * Handles timing, SRS updates, and result collection.
 */

import { review, createCard } from '../srs.js';
import { updateCard, state } from '../state.js';

/**
 * Start an exercise session
 * @param {HTMLElement} container - DOM element to render exercise into
 * @param {Object} options - Exercise configuration
 *   - exerciseType: string (e.g., "word-match", "fill-blank")
 *   - levelData: Array of items from level-N.json
 *   - exerciseModule: Object with { meta, render, generateItems }
 *   - onComplete: callback(results) when exercise finishes
 *   - timed: boolean (if true, shows timer)
 *   - timeLimit: number (seconds, if timed=true)
 */
export function startExercise(container, options) {
  const {
    exerciseType,
    levelData,
    exerciseModule,
    onComplete,
    timed = false,
    timeLimit = null,
    currentLevel = 1
  } = options;

  // =========================================================================
  // State & Data
  // =========================================================================

  let currentIndex = 0;
  let totalItems = 0;
  let startTime = Date.now();
  let elapsedSeconds = 0;
  let score = 0;
  let mistakes = [];
  let results = [];
  let timerInterval = null;

  // Generate exercise items
  const items = exerciseModule.generateItems
    ? exerciseModule.generateItems(levelData)
    : levelData.slice(0, 10);

  // Some modules handle their own internal iteration (e.g., collocation, b1-b2-upgrade).
  // These expect the full items array passed to render() at once.
  const batchMode = exerciseModule.meta?.batchMode === true;

  totalItems = batchMode ? 1 : items.length;

  // =========================================================================
  // DOM Structure
  // =========================================================================

  container.innerHTML = '';
  const shell = document.createElement('div');
  shell.className = 'exercise-shell';
  container.appendChild(shell);

  const header = document.createElement('div');
  header.className = 'exercise-header';
  header.innerHTML = `
    <button class="exercise-back-btn" aria-label="Back to level">←</button>
    <span class="exercise-title">${exerciseModule.meta?.name || 'Exercise'}</span>
    <span class="exercise-counter"><span class="current">1</span> / <span class="total">${totalItems}</span></span>
  `;
  shell.appendChild(header);

  const progressContainer = document.createElement('div');
  progressContainer.className = 'exercise-progress-container';
  progressContainer.innerHTML = `
    <div class="exercise-progress">
      <div class="exercise-progress-fill" style="width: 0%"></div>
    </div>
  `;
  shell.appendChild(progressContainer);

  // Timer display (if timed mode)
  let timerDisplay = null;
  if (timed && timeLimit) {
    timerDisplay = document.createElement('div');
    timerDisplay.className = 'exercise-timer';
    timerDisplay.textContent = formatTime(timeLimit);
    progressContainer.appendChild(timerDisplay);
  }

  const body = document.createElement('div');
  body.className = 'exercise-body';
  shell.appendChild(body);

  const feedbackContainer = document.createElement('div');
  feedbackContainer.className = 'exercise-feedback hidden';
  feedbackContainer.innerHTML = `
    <div class="feedback-content">
      <div class="feedback-icon">✓</div>
      <div class="feedback-text"></div>
    </div>
  `;
  shell.appendChild(feedbackContainer);

  const resultsContainer = document.createElement('div');
  resultsContainer.className = 'exercise-results hidden';
  resultsContainer.innerHTML = `
    <div class="results-content">
      <h2>Exercise Complete!</h2>
      <div class="results-stats">
        <div class="stat">
          <div class="stat-label">Score</div>
          <div class="stat-value"><span class="score">0</span> / <span class="total">${totalItems}</span></div>
        </div>
        <div class="stat">
          <div class="stat-label">Accuracy</div>
          <div class="stat-value"><span class="accuracy">0</span>%</div>
        </div>
        <div class="stat">
          <div class="stat-label">Time</div>
          <div class="stat-value"><span class="time">0:00</span></div>
        </div>
      </div>
      <div class="results-buttons">
        <button class="btn btn-primary continue-btn">Continue</button>
        <button class="btn btn-secondary review-btn" ${mistakes.length === 0 ? 'disabled' : ''}>Review Mistakes</button>
      </div>
    </div>
  `;
  shell.appendChild(resultsContainer);

  // =========================================================================
  // Event Handlers
  // =========================================================================

  /**
   * Handle answer submission from exercise module
   * Supports both signatures:
   *   handleAnswer(userAnswer, isCorrect, details)  — direct call
   *   callbacks.onAnswer(itemId, isCorrect, details) — object call
   */
  function handleAnswer(userAnswer, isCorrect, details = {}) {
    // Record result
    const result = {
      index: batchMode ? results.length : currentIndex,
      item: batchMode ? { id: userAnswer } : items[currentIndex],
      userAnswer,
      isCorrect,
      details
    };
    results.push(result);

    if (isCorrect) {
      score += 1;
    } else {
      mistakes.push({
        index: batchMode ? results.length - 1 : currentIndex,
        item: batchMode ? { id: userAnswer } : items[currentIndex],
        userAnswer,
        correctAnswer: details.correct
      });
    }

    // In batchMode, the module handles its own UI/feedback/advancement.
    // We just accumulate results and wait for onSkip to signal completion.
    if (batchMode) {
      return;
    }

    // Show feedback
    showFeedback(isCorrect, details);

    // Auto-advance after delay
    setTimeout(() => {
      currentIndex += 1;
      if (currentIndex < totalItems) {
        renderItem();
      } else {
        finishExercise();
      }
    }, 1500);
  }

  /**
   * Handle skip from exercise module
   */
  function handleSkip(itemId) {
    // In batchMode, modules signal completion via onSkip (e.g., 'collocation-complete').
    // When this happens, update totalItems to reflect actual answers and finish.
    if (batchMode) {
      totalItems = results.length || 1;
      // Update the results screen total display
      shell.querySelectorAll('.total').forEach(el => el.textContent = totalItems);
      finishExercise();
      return;
    }

    // Record as skipped (incorrect with no answer)
    const result = {
      index: currentIndex,
      item: items[currentIndex],
      userAnswer: null,
      isCorrect: false,
      details: { skipped: true }
    };
    results.push(result);

    // Advance to next item
    currentIndex += 1;
    if (currentIndex < totalItems) {
      renderItem();
    } else {
      finishExercise();
    }
  }

  /**
   * Callbacks object passed to exercise modules
   * Exercise modules call callbacks.onAnswer(itemId, isCorrect, details)
   * or callbacks.onSkip(itemId)
   */
  const exerciseCallbacks = {
    onAnswer: handleAnswer,
    onSkip: handleSkip
  };

  /**
   * Show feedback animation and message
   */
  function showFeedback(isCorrect, details = {}) {
    // Use stored reference — NOT querySelector, which could match
    // an exercise module's own .exercise-feedback element first.
    const feedbackEl = feedbackContainer;
    const icon = feedbackEl.querySelector('.feedback-icon');
    const text = feedbackEl.querySelector('.feedback-text');

    feedbackEl.classList.remove('hidden', 'correct', 'incorrect');
    if (isCorrect) {
      feedbackEl.classList.add('correct');
      icon.textContent = '✓';
      icon.style.color = 'var(--success)';
      text.textContent = 'Correct!';
    } else {
      feedbackEl.classList.add('incorrect');
      icon.textContent = '✗';
      icon.style.color = 'var(--error)';
      text.textContent = details.correct
        ? `The answer was: ${details.correct}`
        : 'Incorrect. Try again next time!';
    }
  }

  /**
   * Render current item with exercise module
   */
  function renderItem() {
    // Update counter
    header.querySelector('.current').textContent = currentIndex + 1;

    // Update progress bar
    const percent = ((currentIndex + 1) / totalItems) * 100;
    progressContainer.querySelector('.exercise-progress-fill').style.width = `${percent}%`;

    // Clear body
    body.innerHTML = '';

    // Render exercise item — batch modules get the full array, others get one item
    const item = batchMode ? items : items[currentIndex];
    try {
      exerciseModule.render(body, item, exerciseCallbacks);
    } catch (error) {
      console.error('Error rendering exercise item:', error);
      body.innerHTML = '<p class="error">Error loading exercise. Please try again.</p>';
    }

    // Hide feedback
    feedbackContainer.classList.add('hidden');
  }

  /**
   * Finish exercise and show results
   */
  function finishExercise() {
    // Stop timer
    if (timerInterval) {
      clearInterval(timerInterval);
    }

    elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);

    // Hide body
    body.classList.add('hidden');
    feedbackContainer.classList.add('hidden');

    // Update SRS cards
    updateSRSCards(currentLevel);

    // Show results
    showResults();
  }

  /**
   * Update SRS cards based on results
   */
  function updateSRSCards(level) {
    results.forEach((result) => {
      const cardId = result.item.id || `${exerciseType}-${result.index}`;

      // Get or create card
      let card;
      const levelId = String(level);
      if (!state.cards[levelId]) {
        state.cards[levelId] = [];
      }

      const existingCard = state.cards[levelId].find(c => c.id === cardId);
      if (existingCard) {
        card = existingCard;
      } else {
        card = createCard(cardId);
        state.cards[levelId].push(card);
      }

      // Review card with quality based on correctness
      const quality = result.isCorrect ? 5 : 2;
      const updatedCard = review(card, quality);
      updateCard(level, updatedCard);
    });
  }

  /**
   * Display results screen
   */
  function showResults() {
    const resultsEl = resultsContainer;
    resultsEl.classList.remove('hidden');

    // Update stats
    const accuracy = Math.round((score / totalItems) * 100);
    const timeStr = formatTime(elapsedSeconds);

    resultsEl.querySelector('.score').textContent = score;
    resultsEl.querySelector('.accuracy').textContent = accuracy;
    resultsEl.querySelector('.time').textContent = timeStr;

    // Update review button
    const reviewBtn = resultsEl.querySelector('.review-btn');
    if (mistakes.length === 0) {
      reviewBtn.disabled = true;
    }

    // Add confetti animation for high scores
    if (accuracy > 80) {
      shell.classList.add('celebration');
    }

    // Bind buttons
    resultsEl.querySelector('.continue-btn').addEventListener('click', () => {
      if (onComplete) {
        onComplete({
          exerciseType,
          score,
          total: totalItems,
          accuracy,
          time: elapsedSeconds,
          mistakes,
          results
        });
      }
    });

    reviewBtn.addEventListener('click', () => {
      showMistakesReview();
    });
  }

  /**
   * Show review of mistakes
   */
  function showMistakesReview() {
    body.classList.remove('hidden');
    resultsContainer.classList.add('hidden');

    body.innerHTML = '<div class="review-container"></div>';
    const reviewContainer = body.querySelector('.review-container');

    const title = document.createElement('h3');
    title.textContent = 'Review Mistakes';
    reviewContainer.appendChild(title);

    mistakes.forEach((mistake, idx) => {
      const card = document.createElement('div');
      card.className = 'mistake-card';
      card.innerHTML = `
        <div class="mistake-number">Mistake ${idx + 1}</div>
        <div class="mistake-item">
          <strong>Item:</strong> ${JSON.stringify(mistake.item).substring(0, 100)}...
        </div>
        <div class="mistake-answer">
          <strong>Your answer:</strong> ${mistake.userAnswer}
        </div>
        <div class="mistake-correct">
          <strong>Correct answer:</strong> ${mistake.correctAnswer || 'N/A'}
        </div>
      `;
      reviewContainer.appendChild(card);
    });

    const backBtn = document.createElement('button');
    backBtn.className = 'btn btn-secondary';
    backBtn.textContent = 'Back to Results';
    backBtn.addEventListener('click', () => {
      body.classList.add('hidden');
      resultsContainer.classList.remove('hidden');
    });
    reviewContainer.appendChild(backBtn);
  }

  /**
   * Format seconds into HH:MM:SS
   */
  function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${minutes}:${String(secs).padStart(2, '0')}`;
  }

  /**
   * Start timer if timed mode
   */
  function startTimer() {
    if (!timed || !timeLimit) return;

    let timeRemaining = timeLimit;
    timerInterval = setInterval(() => {
      timeRemaining -= 1;
      if (timerDisplay) {
        timerDisplay.textContent = formatTime(timeRemaining);
      }

      if (timeRemaining <= 0) {
        clearInterval(timerInterval);
        finishExercise();
      }
    }, 1000);
  }

  /**
   * Back button handler
   */
  header.querySelector('.exercise-back-btn').addEventListener('click', () => {
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    if (onComplete) {
      onComplete(null); // Signal cancellation
    }
  });

  // =========================================================================
  // Initialize
  // =========================================================================

  renderItem();
  startTimer();

  // Return cleanup function
  return () => {
    if (timerInterval) {
      clearInterval(timerInterval);
    }
  };
}
