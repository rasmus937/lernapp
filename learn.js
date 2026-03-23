// === Learn Session Module ===

let session = null;

function initSession(dueCards, deckId = null) {
  // Shuffle for interleaving
  const shuffled = [...dueCards].sort(() => Math.random() - 0.5);
  session = {
    cards: shuffled,
    deckId,
    currentIndex: 0,
    correct: 0,
    wrong: 0,
    xpEarned: 0,
    startTime: Date.now()
  };
  return session;
}

function getCurrentCard() {
  if (!session || session.currentIndex >= session.cards.length) return null;
  return session.cards[session.currentIndex];
}

function getSessionProgress() {
  if (!session) return { current: 0, total: 0, percent: 0 };
  return {
    current: session.currentIndex,
    total: session.cards.length,
    percent: Math.round((session.currentIndex / session.cards.length) * 100)
  };
}

async function rateCard(quality) {
  const item = getCurrentCard();
  if (!item) return null;

  const { card, review } = item;

  // Calculate new SM-2 values
  const updated = sm2(review, quality);

  // Calculate XP
  const xp = calcXP(quality, review);
  session.xpEarned += xp;

  if (quality >= 3) {
    session.correct++;
  } else {
    session.wrong++;
  }

  // Save updated review
  await updateReview(card.id, updated);

  // Update daily stats
  const stats = await getTodayStats();
  stats.cardsReviewed++;
  if (quality >= 3) stats.correct++;
  else stats.wrong++;
  stats.xpEarned += xp;
  stats.streak = await updateStreak();
  await updateTodayStats(stats);

  // Advance to next card
  session.currentIndex++;

  return {
    xp,
    isCorrect: quality >= 3,
    hasNext: session.currentIndex < session.cards.length
  };
}

function getSessionSummary() {
  if (!session) return null;
  return {
    correct: session.correct,
    wrong: session.wrong,
    xpEarned: session.xpEarned,
    total: session.cards.length,
    duration: Date.now() - session.startTime
  };
}

function endSession() {
  const summary = getSessionSummary();
  session = null;
  return summary;
}

// === Render Helpers for Learn Modes ===

function renderFlashcard(card) {
  const front = card.type === 'process' ? card.front : card.front;
  const back = card.type === 'process'
    ? (card.steps || []).map((s, i) => `${i + 1}. ${s}`).join('\n')
    : card.back;

  return `
    <div class="flashcard" id="flashcard" onclick="flipCard()">
      <div class="flashcard-inner">
        <div class="flashcard-face flashcard-front">${escapeHtml(front)}</div>
        <div class="flashcard-face flashcard-back" style="white-space:pre-line">${escapeHtml(back)}</div>
      </div>
    </div>
    <p class="text-center text-dim mt-8 text-sm" id="flip-hint">Antippen zum Umdrehen</p>
    <div class="rating-buttons hidden" id="rating-buttons"></div>
  `;
}

function renderMultipleChoice(card, allCards) {
  const correctAnswer = card.back;
  // Pick 3 wrong answers from other cards in the session
  const wrongAnswers = allCards
    .filter(c => c.card.id !== card.id && c.card.back && c.card.back !== correctAnswer)
    .map(c => c.card.back)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  // If not enough wrong answers, generate placeholders
  while (wrongAnswers.length < 3) {
    wrongAnswers.push('—');
  }

  const options = [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5);

  return `
    <div class="card" style="text-align:center; padding:32px 24px;">
      <div style="font-size:22px; font-weight:600;">${escapeHtml(card.front)}</div>
    </div>
    <div class="mt-16" id="mc-options">
      ${options.map(opt => `
        <button class="btn btn-secondary btn-full mb-8" style="text-align:left; padding:16px;"
                onclick="checkMCAnswer(this, '${escapeAttr(opt)}', '${escapeAttr(correctAnswer)}')"
                ${opt === '—' ? 'disabled' : ''}>
          ${escapeHtml(opt)}
        </button>
      `).join('')}
    </div>
  `;
}

function renderTypeAnswer(card) {
  return `
    <div class="card" style="text-align:center; padding:32px 24px;">
      <div style="font-size:22px; font-weight:600;">${escapeHtml(card.front)}</div>
    </div>
    <div class="form-group mt-16">
      <input type="text" class="form-input" id="type-input" placeholder="Deine Antwort..."
             style="font-size:18px; text-align:center;" autocomplete="off">
    </div>
    <button class="btn btn-primary btn-full mt-8" id="btn-check-type" onclick="checkTypeAnswer('${escapeAttr(card.back)}')">
      Pruefen
    </button>
    <div id="type-feedback" class="hidden mt-16"></div>
  `;
}

function renderSortSteps(card) {
  if (!card.steps || card.steps.length === 0) return renderFlashcard(card);

  // Shuffle steps
  const shuffled = card.steps.map((text, idx) => ({ text, correctIdx: idx }))
    .sort(() => Math.random() - 0.5);

  return `
    <div class="card" style="text-align:center; padding:20px;">
      <div style="font-size:18px; font-weight:600;">${escapeHtml(card.front)}</div>
      <p class="text-dim text-sm mt-8">Bringe die Schritte in die richtige Reihenfolge</p>
    </div>
    <div id="sort-container" class="mt-16">
      ${shuffled.map((s, i) => `
        <div class="step-item" draggable="true" data-correct="${s.correctIdx}" data-current="${i}">
          <span class="step-handle">☰</span>
          <span class="step-number">${i + 1}</span>
          <span class="step-text">${escapeHtml(s.text)}</span>
        </div>
      `).join('')}
    </div>
    <button class="btn btn-primary btn-full mt-16" onclick="checkSortOrder()">Pruefen</button>
    <div id="sort-feedback" class="hidden mt-16"></div>
  `;
}

// === Choose learn mode based on card type and repetitions ===

function chooseLernMode(card, review, allCards) {
  const { type } = card;

  // Process cards: prefer sort mode
  if (type === 'process' && card.steps && card.steps.length >= 2) {
    // New cards: flashcard first, then sort
    if (review.repetitions === 0) return 'flashcard';
    if (review.repetitions < 3) return Math.random() < 0.5 ? 'sort' : 'flashcard';
    return 'sort';
  }

  // Vocab/Term cards: progress from easy to hard
  if (review.repetitions === 0) return 'flashcard';         // First time: just show
  if (review.repetitions === 1) return 'mc';                // Second time: multiple choice
  if (review.repetitions < 4) return Math.random() < 0.5 ? 'mc' : 'type'; // Mix
  return 'type';                                             // Advanced: type answer
}

function renderLearnCard(item, allCards) {
  const { card, review } = item;
  const mode = chooseLernMode(card, review, allCards);

  switch (mode) {
    case 'flashcard': return renderFlashcard(card);
    case 'mc': return renderMultipleChoice(card, allCards);
    case 'type': return renderTypeAnswer(card);
    case 'sort': return renderSortSteps(card);
    default: return renderFlashcard(card);
  }
}

// === HTML Escaping ===

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function escapeAttr(text) {
  if (!text) return '';
  return text.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}
