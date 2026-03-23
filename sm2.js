// === SM-2 Spaced Repetition Algorithm ===
// Quality ratings: 0 = Again, 3 = Hard, 4 = Good, 5 = Easy

function sm2(review, quality) {
  let { interval, repetitions, easeFactor } = review;

  if (quality < 3) {
    // Failed: reset
    repetitions = 0;
    interval = 1;
  } else {
    // Passed
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions++;
  }

  // Update ease factor (only on success per SM-2 spec)
  if (quality >= 3) {
    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (easeFactor < 1.3) easeFactor = 1.3;
  }

  const now = Date.now();
  const nextReview = now + interval * 24 * 60 * 60 * 1000;

  return {
    cardId: review.cardId,
    interval,
    repetitions,
    easeFactor,
    nextReview,
    lastReview: now
  };
}

// Predict next interval for display (e.g., "1d", "6d", "2w", "1m")
function formatInterval(days) {
  if (days <= 0) return 'jetzt';
  if (days === 1) return '1d';
  if (days < 7) return days + 'd';
  if (days < 30) return Math.round(days / 7) + 'w';
  if (days < 365) return Math.round(days / 30) + 'mo';
  return Math.round(days / 365) + 'y';
}

// Preview what intervals would result from each rating
function previewIntervals(review) {
  return {
    again: formatInterval(1),
    hard: formatInterval(sm2(review, 3).interval),
    good: formatInterval(sm2(review, 4).interval),
    easy: formatInterval(sm2(review, 5).interval)
  };
}
