/**
 * srs.js - SM-2 Spaced Repetition Algorithm
 * Pure functions for SRS card scheduling - no dependencies, fully testable
 */

/**
 * Create a new SRS card with default values
 * @param {string} id - Unique card identifier
 * @returns {Object} New card object
 */
export function createCard(id) {
  const today = new Date().toISOString().split('T')[0];
  return {
    id,
    ef: 2.5,      // Ease factor (default per SM-2)
    iv: 1,         // Interval in days
    rep: 0,        // Repetition count
    next: today,   // Next review date (start immediately)
    last: null     // Last review date
  };
}

/**
 * Check if a card is due for review
 * @param {Object} card - Card object
 * @param {string} [today] - Today's date in YYYY-MM-DD format (optional, defaults to actual today)
 * @returns {boolean} True if card is due
 */
export function isDue(card, today = null) {
  if (!today) {
    today = new Date().toISOString().split('T')[0];
  }
  return card.next <= today;
}

/**
 * Get the next review date for a card (used for scheduling)
 * @param {Object} card - Card object
 * @returns {string} Next review date in YYYY-MM-DD format
 */
export function getNextReview(card) {
  return card.next;
}

/**
 * Review a card using SM-2 algorithm
 * Quality scale:
 *   0 = complete blackout (forget completely)
 *   1 = incorrect but recalled correctly on second attempt
 *   2 = incorrect attempt, easy with serious difficulty
 *   3 = correct response but with serious difficulty
 *   4 = correct response after some hesitation
 *   5 = perfect response
 *
 * @param {Object} card - Card object to review
 * @param {number} quality - Quality of response (0-5)
 * @param {string} [today] - Today's date in YYYY-MM-DD format (optional)
 * @returns {Object} Updated card object
 */
export function review(card, quality, today = null) {
  if (quality < 0 || quality > 5) {
    throw new Error('Quality must be between 0 and 5');
  }

  if (!today) {
    today = new Date().toISOString().split('T')[0];
  }

  // Make a copy to avoid mutation
  const updated = { ...card };
  updated.last = today;

  // SM-2 algorithm
  if (quality < 3) {
    // Failed - reset
    updated.rep = 0;
    updated.iv = 1;
    updated.ef = Math.max(1.3, updated.ef - 0.2);
  } else {
    // Passed
    updated.rep += 1;

    if (updated.rep === 1) {
      updated.iv = 1;
    } else if (updated.rep === 2) {
      updated.iv = 3;
    } else {
      updated.iv = Math.round(updated.iv * updated.ef);
    }

    // Ease factor adjustment
    updated.ef = updated.ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    updated.ef = Math.max(1.3, updated.ef);
  }

  // Calculate next review date
  const nextDate = new Date(today);
  nextDate.setDate(nextDate.getDate() + updated.iv);
  updated.next = nextDate.toISOString().split('T')[0];

  return updated;
}
