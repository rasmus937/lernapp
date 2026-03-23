// === LernApp – Main Application ===

let currentView = 'dashboard';
let currentDeckId = null;
let editingCardId = null;
let confirmCallback = null;

// === Initialization ===

document.addEventListener('DOMContentLoaded', async () => {
  await openDB();

  // Apply saved theme
  const settings = await getSettings();
  applyTheme(settings.theme);

  // Navigation
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      if (view) navigateTo(view);
    });
  });

  // Header back button
  document.getElementById('header-back').addEventListener('click', navigateBack);

  // Dashboard
  document.getElementById('btn-start-learn').addEventListener('click', startGlobalLearn);

  // Decks
  document.getElementById('btn-add-deck').addEventListener('click', () => openDeckModal());
  document.getElementById('btn-add-deck-empty').addEventListener('click', () => openDeckModal());
  document.getElementById('deck-form').addEventListener('submit', saveDeck);
  document.getElementById('btn-cancel-deck').addEventListener('click', closeDeckModal);

  // Deck Detail
  document.getElementById('btn-add-card').addEventListener('click', () => openCardEditor());
  document.getElementById('btn-add-card-empty').addEventListener('click', () => openCardEditor());
  document.getElementById('btn-edit-deck').addEventListener('click', () => openDeckModal(currentDeckId));
  document.getElementById('btn-learn-deck').addEventListener('click', startDeckLearn);
  document.getElementById('btn-delete-deck').addEventListener('click', confirmDeleteDeck);

  // AI Generate
  document.getElementById('btn-ai-generate').addEventListener('click', toggleAIPanel);
  document.getElementById('btn-ai-cancel').addEventListener('click', () => document.getElementById('ai-generate-panel').classList.add('hidden'));
  document.getElementById('btn-ai-run').addEventListener('click', runAIGenerate);

  // Card Editor
  document.getElementById('card-type').addEventListener('change', onCardTypeChange);
  document.getElementById('card-form').addEventListener('submit', saveCard);
  document.getElementById('btn-cancel-card').addEventListener('click', () => navigateBack());
  document.getElementById('btn-add-step').addEventListener('click', addProcessStep);

  // Learn Session
  document.getElementById('btn-end-session').addEventListener('click', () => {
    const summary = endSession();
    if (summary) showSummary(summary);
    else navigateTo('dashboard');
  });

  // Summary
  document.getElementById('btn-summary-done').addEventListener('click', () => navigateTo('dashboard'));

  // Settings
  document.getElementById('btn-save-settings').addEventListener('click', saveAppSettings);
  document.getElementById('btn-export').addEventListener('click', exportAllData);
  document.getElementById('btn-import').addEventListener('click', triggerImport);
  document.getElementById('set-theme').addEventListener('change', (e) => applyTheme(e.target.value));

  // Confirm modal
  document.getElementById('btn-confirm-no').addEventListener('click', closeConfirm);
  document.getElementById('btn-confirm-yes').addEventListener('click', () => {
    if (confirmCallback) confirmCallback();
    closeConfirm();
  });

  // Scanner
  initScanner();

  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }

  // Load initial view
  await refreshDashboard();
});

// === Navigation ===

function navigateTo(view, options = {}) {
  currentView = view;

  // Hide all views
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));

  // Show target view
  const viewEl = document.getElementById(`view-${view}`);
  if (viewEl) viewEl.classList.add('active');

  // Update nav
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navBtn = document.querySelector(`.nav-item[data-view="${view}"]`);
  if (navBtn) navBtn.classList.add('active');

  // Update header
  const titles = {
    dashboard: 'LernApp',
    decks: 'Bibliothek',
    'deck-detail': options.title || 'Deck',
    'card-editor': editingCardId ? 'Karte bearbeiten' : 'Neue Karte',
    learn: 'Lernen',
    summary: 'Ergebnis',
    stats: 'Statistiken',
    settings: 'Einstellungen',
    scanner: 'Scanner'
  };
  document.getElementById('header-title').textContent = titles[view] || 'LernApp';

  // Show/hide back button for sub-views
  const backBtn = document.getElementById('header-back');
  const subViews = ['deck-detail', 'card-editor', 'learn', 'summary'];
  if (subViews.includes(view)) {
    backBtn.classList.remove('hidden');
  } else {
    backBtn.classList.add('hidden');
  }

  // Show/hide bottom nav during learn session
  document.getElementById('nav').style.display =
    (view === 'learn' || view === 'summary') ? 'none' : 'flex';

  // Refresh view data
  switch (view) {
    case 'dashboard': refreshDashboard(); break;
    case 'decks': refreshDeckList(); break;
    case 'deck-detail': refreshDeckDetail(); break;
    case 'stats': refreshStats(); break;
    case 'settings': loadSettings(); break;
    case 'scanner': resetScanner(); break;
  }
}

function navigateBack() {
  if (currentView === 'card-editor' && currentDeckId) {
    navigateTo('deck-detail', { title: '' });
  } else if (currentView === 'deck-detail') {
    navigateTo('decks');
  } else {
    navigateTo('dashboard');
  }
}

// === Dashboard ===

async function refreshDashboard() {
  const dueCards = await getDueCards();
  const stats = await getTodayStats();
  const streak = await updateStreak();
  const decks = await getAllDecks();

  document.getElementById('dash-due').textContent = dueCards.length;
  document.getElementById('dash-streak').textContent = streak;
  document.getElementById('dash-xp').textContent = stats.xpEarned;

  // Disable learn button if nothing due
  const learnBtn = document.getElementById('btn-start-learn');
  if (dueCards.length === 0) {
    learnBtn.textContent = 'Keine fälligen Karten';
    learnBtn.disabled = true;
    learnBtn.style.opacity = '0.5';
  } else {
    learnBtn.textContent = `Jetzt lernen (${dueCards.length})`;
    learnBtn.disabled = false;
    learnBtn.style.opacity = '1';
  }

  // Render deck progress
  const container = document.getElementById('dash-decks');
  if (decks.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📚</div>
        <p>Erstelle dein erstes Deck, um loszulegen</p>
        <button class="btn btn-primary" onclick="navigateTo('decks')">Deck erstellen</button>
      </div>
    `;
    return;
  }

  let html = '';
  for (const deck of decks) {
    const deckStats = await getDeckStats(deck.id);
    const progress = deckStats.total > 0
      ? Math.round((deckStats.mastered / deckStats.total) * 100) : 0;
    const icon = getDeckIcon(deck.type);

    html += `
      <div class="deck-item" onclick="openDeckDetail('${deck.id}')">
        <div class="deck-icon">${icon}</div>
        <div class="deck-info">
          <div class="deck-name">${escapeHtml(deck.name)}</div>
          <div class="progress-bar" style="margin-top:6px">
            <div class="progress-fill ${progress >= 80 ? 'success' : ''}" style="width:${progress}%"></div>
          </div>
        </div>
        ${deckStats.due > 0 ? `<div class="deck-badge">${deckStats.due}</div>` : ''}
      </div>
    `;
  }
  container.innerHTML = html;
}

// === Deck List ===

async function refreshDeckList() {
  const decks = await getAllDecks();
  const container = document.getElementById('deck-list');
  const empty = document.getElementById('deck-empty');

  if (decks.length === 0) {
    container.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');
  let html = '';
  for (const deck of decks) {
    const stats = await getDeckStats(deck.id);
    const icon = getDeckIcon(deck.type);

    html += `
      <div class="deck-item" onclick="openDeckDetail('${deck.id}')">
        <div class="deck-icon">${icon}</div>
        <div class="deck-info">
          <div class="deck-name">${escapeHtml(deck.name)}</div>
          <div class="deck-meta">${stats.total} Karten · ${stats.mastered} gemeistert</div>
        </div>
        ${stats.due > 0 ? `<div class="deck-badge">${stats.due}</div>` : ''}
      </div>
    `;
  }
  container.innerHTML = html;
}

function getDeckIcon(type) {
  switch (type) {
    case 'vocab': return '🗣️';
    case 'terms': return '📖';
    case 'process': return '🔄';
    default: return '📚';
  }
}

// === Deck Modal ===

let editingDeckId = null;

async function openDeckModal(deckId = null) {
  editingDeckId = deckId;
  const modal = document.getElementById('modal-deck');
  const title = document.getElementById('modal-deck-title');

  if (deckId) {
    const deck = await getDeck(deckId);
    title.textContent = 'Deck bearbeiten';
    document.getElementById('deck-name').value = deck.name;
    document.getElementById('deck-type').value = deck.type;
    document.getElementById('deck-tags').value = (deck.tags || []).join(', ');
  } else {
    title.textContent = 'Neues Deck';
    document.getElementById('deck-form').reset();
  }

  modal.classList.add('active');
}

function closeDeckModal() {
  document.getElementById('modal-deck').classList.remove('active');
  editingDeckId = null;
}

async function saveDeck(e) {
  e.preventDefault();
  const name = document.getElementById('deck-name').value.trim();
  const type = document.getElementById('deck-type').value;
  const tags = document.getElementById('deck-tags').value
    .split(',').map(t => t.trim()).filter(t => t);

  if (!name) return;

  if (editingDeckId) {
    await updateDeck(editingDeckId, { name, type, tags });
  } else {
    const deck = await createDeck({ name, type, tags });
    currentDeckId = deck.id;
  }

  closeDeckModal();
  if (currentView === 'deck-detail') {
    refreshDeckDetail();
  } else {
    refreshDeckList();
    refreshDashboard();
  }
}

// === Deck Detail ===

async function openDeckDetail(deckId) {
  currentDeckId = deckId;
  const deck = await getDeck(deckId);
  if (!deck) return;
  navigateTo('deck-detail', { title: deck.name });
}

async function refreshDeckDetail() {
  if (!currentDeckId) return;
  const deck = await getDeck(currentDeckId);
  if (!deck) return;

  document.getElementById('deck-detail-title').textContent = deck.name;
  document.getElementById('header-title').textContent = deck.name;

  const stats = await getDeckStats(deck.id);
  document.getElementById('detail-total').textContent = stats.total;
  document.getElementById('detail-due').textContent = stats.due;
  document.getElementById('detail-mastered').textContent = stats.mastered;

  const cards = await getCardsByDeck(deck.id);
  const container = document.getElementById('card-list');
  const empty = document.getElementById('cards-empty');

  if (cards.length === 0) {
    container.innerHTML = '';
    empty.classList.remove('hidden');
    document.getElementById('btn-learn-deck').classList.add('hidden');
    return;
  }

  empty.classList.add('hidden');
  document.getElementById('btn-learn-deck').classList.remove('hidden');

  let html = '';
  for (const card of cards) {
    const review = await getReview(card.id);
    const isDue = review && review.nextReview <= Date.now();
    const typeLabel = card.type === 'vocab' ? 'Vokabel' : card.type === 'term' ? 'Begriff' : 'Prozess';

    html += `
      <div class="card" style="cursor:pointer" onclick="openCardEditor('${card.id}')">
        <div class="flex-between">
          <div>
            <div class="card-title">${escapeHtml(card.front)}</div>
            <div class="card-subtitle">${escapeHtml(card.type === 'process' ? (card.steps || []).length + ' Schritte' : card.back)}</div>
          </div>
          <div style="text-align:right">
            <span class="tag">${typeLabel}</span>
            ${isDue ? '<span class="tag tag-accent">fällig</span>' : ''}
          </div>
        </div>
        <div class="flex-between mt-8">
          <span class="text-sm text-dim">Nächste: ${review ? formatInterval(review.interval) : 'jetzt'}</span>
          <button class="btn btn-secondary" style="padding:4px 12px; font-size:12px"
                  onclick="event.stopPropagation(); confirmDeleteCard('${card.id}')">Löschen</button>
        </div>
      </div>
    `;
  }
  container.innerHTML = html;
}

function confirmDeleteCard(cardId) {
  showConfirm('Karte löschen?', 'Diese Karte und ihr Lernfortschritt werden unwiderruflich gelöscht.', async () => {
    await deleteCard(cardId);
    refreshDeckDetail();
  });
}

function confirmDeleteDeck() {
  if (!currentDeckId) return;
  showConfirm('Deck löschen?', 'Das gesamte Deck mit allen Karten wird unwiderruflich gelöscht.', async () => {
    await deleteDeck(currentDeckId);
    currentDeckId = null;
    navigateTo('decks');
    showToast('Deck gelöscht');
  });
}

// === Card Editor ===

async function openCardEditor(cardId = null) {
  editingCardId = cardId;

  if (cardId) {
    const card = await getCard(cardId);
    if (!card) return;
    document.getElementById('card-editor-title').textContent = 'Karte bearbeiten';
    document.getElementById('card-type').value = card.type;
    document.getElementById('card-front').value = card.front || '';
    document.getElementById('card-back').value = card.back || '';
    document.getElementById('card-tags').value = (card.tags || []).join(', ');

    if (card.type === 'process') {
      document.getElementById('process-title').value = card.front || '';
      renderProcessSteps(card.steps || []);
    }
  } else {
    document.getElementById('card-editor-title').textContent = 'Neue Karte';
    document.getElementById('card-form').reset();
    document.getElementById('process-steps').innerHTML = '';
  }

  onCardTypeChange();
  navigateTo('card-editor');
}

function onCardTypeChange() {
  const type = document.getElementById('card-type').value;
  const vocabFields = document.getElementById('fields-vocab-term');
  const processFields = document.getElementById('fields-process');
  const labelFront = document.getElementById('label-front');
  const labelBack = document.getElementById('label-back');

  if (type === 'process') {
    vocabFields.classList.add('hidden');
    processFields.classList.remove('hidden');
  } else {
    vocabFields.classList.remove('hidden');
    processFields.classList.add('hidden');
    if (type === 'vocab') {
      labelFront.textContent = 'Wort';
      labelBack.textContent = 'Übersetzung';
    } else {
      labelFront.textContent = 'Begriff';
      labelBack.textContent = 'Definition';
    }
  }
}

function addProcessStep() {
  const container = document.getElementById('process-steps');
  const idx = container.children.length + 1;
  const div = document.createElement('div');
  div.className = 'flex gap-8 mb-8';
  div.innerHTML = `
    <span class="step-number">${idx}</span>
    <input type="text" class="form-input" placeholder="Schritt ${idx}" data-step>
    <button type="button" class="btn btn-secondary" style="padding:8px 12px" onclick="this.parentElement.remove(); renumberSteps()">✕</button>
  `;
  container.appendChild(div);
}

function renumberSteps() {
  const container = document.getElementById('process-steps');
  container.querySelectorAll('.step-number').forEach((el, i) => {
    el.textContent = i + 1;
  });
}

function renderProcessSteps(steps) {
  const container = document.getElementById('process-steps');
  container.innerHTML = '';
  steps.forEach((text, i) => {
    const div = document.createElement('div');
    div.className = 'flex gap-8 mb-8';
    div.innerHTML = `
      <span class="step-number">${i + 1}</span>
      <input type="text" class="form-input" placeholder="Schritt ${i + 1}" data-step value="${escapeHtml(text)}">
      <button type="button" class="btn btn-secondary" style="padding:8px 12px" onclick="this.parentElement.remove(); renumberSteps()">✕</button>
    `;
    container.appendChild(div);
  });
}

async function saveCard(e) {
  e.preventDefault();
  const type = document.getElementById('card-type').value;
  const tags = document.getElementById('card-tags').value
    .split(',').map(t => t.trim()).filter(t => t);

  let front, back, steps = null;

  if (type === 'process') {
    front = document.getElementById('process-title').value.trim();
    const stepInputs = document.querySelectorAll('#process-steps [data-step]');
    steps = Array.from(stepInputs).map(el => el.value.trim()).filter(s => s);
    back = steps.join(' → ');
    if (!front || steps.length === 0) return;
  } else {
    front = document.getElementById('card-front').value.trim();
    back = document.getElementById('card-back').value.trim();
    if (!front || !back) return;
  }

  if (editingCardId) {
    await updateCard(editingCardId, { type, front, back, steps, tags });
  } else {
    await createCard({ deckId: currentDeckId, type, front, back, steps, tags });
  }

  editingCardId = null;
  navigateTo('deck-detail');
}

// === Learn Session ===

async function startGlobalLearn() {
  const dueCards = await getDueCards();
  if (dueCards.length === 0) {
    showToast('Keine fälligen Karten!');
    return;
  }
  startLearnSession(dueCards);
}

async function startDeckLearn() {
  if (!currentDeckId) return;
  const dueCards = await getDueCards(currentDeckId);
  if (dueCards.length === 0) {
    showToast('Keine fälligen Karten in diesem Deck!');
    return;
  }
  startLearnSession(dueCards, currentDeckId);
}

async function startLearnSession(dueCards, deckId = null) {
  const settings = await getSettings();
  const dailyGoal = settings.dailyGoal || 20;
  const limited = dueCards.slice(0, dailyGoal);
  initSession(limited, deckId);
  navigateTo('learn');
  showNextCard();
}

function showNextCard() {
  const item = getCurrentCard();
  if (!item) {
    const summary = endSession();
    showSummary(summary);
    return;
  }

  const progress = getSessionProgress();
  document.getElementById('learn-progress').textContent = `${progress.current + 1} / ${progress.total}`;
  document.getElementById('learn-progress-bar').style.width = `${progress.percent}%`;

  const content = document.getElementById('learn-content');
  content.innerHTML = renderLearnCard(item, session.cards);

  // Focus type input if present
  const typeInput = document.getElementById('type-input');
  if (typeInput) {
    setTimeout(() => typeInput.focus(), 100);
    typeInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const item = getCurrentCard();
        if (item) checkTypeAnswer(item.card.back);
      }
    });
  }

  // Focus cloze input if present
  const clozeInput = document.getElementById('cloze-input');
  if (clozeInput) {
    setTimeout(() => clozeInput.focus(), 100);
    clozeInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const btn = clozeInput.closest('.view').querySelector('[onclick^="checkClozeAnswer"]');
        if (btn) btn.click();
      }
    });
  }

  // Setup drag & drop for sort mode
  setupSortDragDrop();
}

// === Keyboard shortcuts for learn session ===

document.addEventListener('keydown', (e) => {
  if (currentView !== 'learn') return;
  // Don't capture when typing in input
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

  const fc = document.getElementById('flashcard');
  const ratingButtons = document.getElementById('rating-buttons');

  // Space or Enter: flip flashcard
  if ((e.key === ' ' || e.key === 'Enter') && fc && !fc.classList.contains('flipped')) {
    e.preventDefault();
    flipCard();
    return;
  }

  // 1-4: rate card (after flip)
  if (ratingButtons && !ratingButtons.classList.contains('hidden')) {
    const ratingMap = { '1': 0, '2': 3, '3': 4, '4': 5 };
    if (ratingMap[e.key] !== undefined) {
      e.preventDefault();
      rateAndNext(ratingMap[e.key]);
    }
  }
});

// === Flashcard interaction ===

function flipCard() {
  const fc = document.getElementById('flashcard');
  if (!fc) return;
  fc.classList.toggle('flipped');

  if (fc.classList.contains('flipped')) {
    document.getElementById('flip-hint').classList.add('hidden');
    const item = getCurrentCard();
    const intervals = previewIntervals(item.review);
    document.getElementById('rating-buttons').classList.remove('hidden');
    document.getElementById('rating-buttons').innerHTML = `
      <button class="rating-btn again" onclick="rateAndNext(0)">Nochmal<br><span style="font-weight:400; font-size:11px">${intervals.again}</span></button>
      <button class="rating-btn hard" onclick="rateAndNext(3)">Schwer<br><span style="font-weight:400; font-size:11px">${intervals.hard}</span></button>
      <button class="rating-btn good" onclick="rateAndNext(4)">Gut<br><span style="font-weight:400; font-size:11px">${intervals.good}</span></button>
      <button class="rating-btn easy" onclick="rateAndNext(5)">Leicht<br><span style="font-weight:400; font-size:11px">${intervals.easy}</span></button>
    `;
  }
}

async function rateAndNext(quality) {
  await rateCard(quality);
  showNextCard();
}

// === Multiple Choice interaction ===

function checkMCAnswer(btn, selected, correct) {
  const buttons = document.querySelectorAll('#mc-options button');
  buttons.forEach(b => { b.disabled = true; });

  if (selected === correct) {
    btn.style.background = 'var(--success)';
    btn.style.color = '#000';
    setTimeout(() => rateAndNext(4), 800);
  } else {
    btn.style.background = 'var(--danger)';
    btn.style.color = '#000';
    // Highlight correct answer
    buttons.forEach(b => {
      if (b.textContent.trim() === correct) {
        b.style.background = 'var(--success)';
        b.style.color = '#000';
      }
    });
    setTimeout(() => rateAndNext(0), 1500);
  }
}

// === Type Answer interaction ===

function checkTypeAnswer(correct) {
  const input = document.getElementById('type-input');
  const feedback = document.getElementById('type-feedback');
  const btn = document.getElementById('btn-check-type');
  if (!input || !feedback) return;

  const answer = input.value.trim();
  input.disabled = true;
  btn.classList.add('hidden');
  feedback.classList.remove('hidden');

  const isCorrect = answer.toLowerCase() === correct.toLowerCase();

  if (isCorrect) {
    feedback.innerHTML = `
      <div class="card" style="border-color: var(--success); text-align:center;">
        <div style="color:var(--success); font-size:18px; font-weight:700;">Richtig!</div>
      </div>
    `;
    setTimeout(() => rateAndNext(4), 800);
  } else {
    feedback.innerHTML = `
      <div class="card" style="border-color: var(--danger);">
        <div style="color:var(--danger); font-weight:700;">Falsch</div>
        <div class="mt-8">Richtige Antwort: <strong>${escapeHtml(correct)}</strong></div>
      </div>
      <div class="rating-buttons mt-16">
        <button class="rating-btn again" onclick="rateAndNext(0)">Nochmal</button>
        <button class="rating-btn hard" onclick="rateAndNext(3)">Wusste ich fast</button>
      </div>
    `;
  }
}

// === Sort Steps interaction ===

function setupSortDragDrop() {
  const container = document.getElementById('sort-container');
  if (!container) return;

  let draggedEl = null;

  container.querySelectorAll('.step-item').forEach(item => {
    item.addEventListener('dragstart', (e) => {
      draggedEl = item;
      item.style.opacity = '0.5';
      e.dataTransfer.effectAllowed = 'move';
    });

    item.addEventListener('dragend', () => {
      item.style.opacity = '1';
      draggedEl = null;
    });

    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });

    item.addEventListener('drop', (e) => {
      e.preventDefault();
      if (draggedEl && draggedEl !== item) {
        const items = [...container.children];
        const fromIdx = items.indexOf(draggedEl);
        const toIdx = items.indexOf(item);
        if (fromIdx < toIdx) {
          container.insertBefore(draggedEl, item.nextSibling);
        } else {
          container.insertBefore(draggedEl, item);
        }
        // Update step numbers
        container.querySelectorAll('.step-number').forEach((num, i) => {
          num.textContent = i + 1;
        });
      }
    });

    // Touch support
    let touchStartY = 0;
    item.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
      draggedEl = item;
      item.style.opacity = '0.7';
    }, { passive: true });

    item.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const target = document.elementFromPoint(touch.clientX, touch.clientY);
      if (target && target.closest('.step-item') && target.closest('.step-item') !== draggedEl) {
        const dropTarget = target.closest('.step-item');
        const rect = dropTarget.getBoundingClientRect();
        const mid = rect.top + rect.height / 2;
        if (touch.clientY < mid) {
          container.insertBefore(draggedEl, dropTarget);
        } else {
          container.insertBefore(draggedEl, dropTarget.nextSibling);
        }
        container.querySelectorAll('.step-number').forEach((num, i) => {
          num.textContent = i + 1;
        });
      }
    }, { passive: false });

    item.addEventListener('touchend', () => {
      if (draggedEl) draggedEl.style.opacity = '1';
      draggedEl = null;
    });
  });
}

function checkSortOrder() {
  const container = document.getElementById('sort-container');
  const feedback = document.getElementById('sort-feedback');
  if (!container || !feedback) return;

  const items = [...container.querySelectorAll('.step-item')];
  const isCorrect = items.every((el, i) => parseInt(el.dataset.correct) === i);

  feedback.classList.remove('hidden');

  if (isCorrect) {
    items.forEach(el => el.style.borderColor = 'var(--success)');
    feedback.innerHTML = `
      <div class="card" style="border-color:var(--success); text-align:center;">
        <div style="color:var(--success); font-size:18px; font-weight:700;">Richtige Reihenfolge!</div>
      </div>
    `;
    setTimeout(() => rateAndNext(4), 1000);
  } else {
    // Highlight wrong positions
    items.forEach((el, i) => {
      el.style.borderColor = parseInt(el.dataset.correct) === i ? 'var(--success)' : 'var(--danger)';
    });
    feedback.innerHTML = `
      <div class="card" style="border-color:var(--danger);">
        <div style="color:var(--danger); font-weight:700;">Nicht ganz richtig</div>
        <div class="text-dim text-sm mt-8">Rot markierte Schritte sind an der falschen Position.</div>
      </div>
      <div class="rating-buttons mt-16">
        <button class="rating-btn again" onclick="rateAndNext(0)">Nochmal</button>
        <button class="rating-btn hard" onclick="rateAndNext(3)">Fast richtig</button>
      </div>
    `;
  }
}

// === Cloze Answer interaction ===

function checkClozeAnswer(correct) {
  const input = document.getElementById('cloze-input');
  const feedback = document.getElementById('cloze-feedback');
  if (!input || !feedback) return;

  const answer = input.value.trim();
  input.disabled = true;
  feedback.classList.remove('hidden');

  const isCorrect = answer.toLowerCase() === correct.toLowerCase();
  const blank = document.getElementById('cloze-blank');

  if (isCorrect) {
    if (blank) { blank.textContent = correct; blank.style.color = 'var(--success)'; blank.style.fontWeight = '700'; }
    feedback.innerHTML = `
      <div class="card" style="border-color:var(--success); text-align:center;">
        <div style="color:var(--success); font-size:18px; font-weight:700;">Richtig!</div>
      </div>
    `;
    setTimeout(() => rateAndNext(4), 800);
  } else {
    if (blank) { blank.textContent = correct; blank.style.color = 'var(--danger)'; blank.style.fontWeight = '700'; }
    feedback.innerHTML = `
      <div class="card" style="border-color:var(--danger);">
        <div style="color:var(--danger); font-weight:700;">Falsch</div>
        <div class="mt-8">Richtige Antwort: <strong>${escapeHtml(correct)}</strong></div>
        <div class="text-dim text-sm mt-8">Deine Antwort: ${escapeHtml(answer) || '(leer)'}</div>
      </div>
      <div class="rating-buttons mt-16">
        <button class="rating-btn again" onclick="rateAndNext(0)">Nochmal</button>
        <button class="rating-btn hard" onclick="rateAndNext(3)">Wusste ich fast</button>
      </div>
    `;
  }
}

// === Session Summary ===

function showSummary(summary) {
  if (!summary) { navigateTo('dashboard'); return; }
  document.getElementById('summary-correct').textContent = summary.correct;
  document.getElementById('summary-wrong').textContent = summary.wrong;
  document.getElementById('summary-xp').textContent = '+' + summary.xpEarned;
  document.getElementById('summary-subtitle').textContent =
    `${summary.total} Karten in ${Math.round(summary.duration / 60000)} Min.`;
  navigateTo('summary');
}

// === AI Generate ===

async function toggleAIPanel() {
  const panel = document.getElementById('ai-generate-panel');
  panel.classList.toggle('hidden');
  if (!panel.classList.contains('hidden')) {
    // Check Ollama availability
    const available = await isOllamaAvailable();
    if (!available) {
      document.getElementById('ai-status').classList.remove('hidden');
      document.getElementById('ai-status').innerHTML =
        '<span style="color:var(--warning)">Ollama nicht erreichbar. Bitte URL in den Einstellungen konfigurieren.</span>';
    } else {
      document.getElementById('ai-status').classList.add('hidden');
    }
    document.getElementById('ai-topic').focus();
  }
}

async function runAIGenerate() {
  const topic = document.getElementById('ai-topic').value.trim();
  if (!topic) { showToast('Bitte ein Thema eingeben'); return; }

  const status = document.getElementById('ai-status');
  const preview = document.getElementById('ai-preview');
  const btn = document.getElementById('btn-ai-run');

  status.classList.remove('hidden');
  status.innerHTML = 'Generiere Karten...';
  btn.disabled = true;

  try {
    const deck = await getDeck(currentDeckId);
    const cards = await generateCardsFromTopic(topic, deck?.type || 'mixed');

    if (cards.length === 0) {
      status.innerHTML = '<span style="color:var(--warning)">Keine Karten generiert. Versuche ein anderes Thema.</span>';
      btn.disabled = false;
      return;
    }

    status.innerHTML = `${cards.length} Karten generiert. Prüfen und speichern:`;

    preview.innerHTML = cards.map((card, i) => `
      <div class="card mb-8">
        <div class="flex-between">
          <span class="tag tag-accent">${card.type === 'vocab' ? 'Vokabel' : card.type === 'process' ? 'Prozess' : 'Begriff'}</span>
          <button class="btn btn-secondary" style="padding:2px 8px; font-size:11px"
                  onclick="this.closest('.card').remove()">✕</button>
        </div>
        <div class="mt-8" style="font-weight:600">${escapeHtml(card.front)}</div>
        ${card.steps ? `<div class="text-sm text-dim mt-4">${card.steps.map((s,i) => `${i+1}. ${escapeHtml(s)}`).join('<br>')}</div>` : ''}
        ${card.back ? `<div class="text-sm text-dim mt-4">${escapeHtml(card.back)}</div>` : ''}
      </div>
    `).join('') + `
      <button class="btn btn-success btn-full mt-8" onclick="saveAICards()">Alle Karten speichern</button>
    `;

    // Store for saving
    window._aiGeneratedCards = cards;
    btn.disabled = false;
  } catch (err) {
    status.innerHTML = `<span style="color:var(--danger)">Fehler: ${escapeHtml(err.message)}</span>`;
    btn.disabled = false;
  }
}

async function saveAICards() {
  const cards = window._aiGeneratedCards;
  if (!cards || !currentDeckId) return;

  let count = 0;
  for (const card of cards) {
    if (!card.front) continue;
    await createCard({
      deckId: currentDeckId,
      type: card.type || 'term',
      front: card.front,
      back: card.back || '',
      steps: card.steps || null,
      tags: ['ki-generiert']
    });
    count++;
  }

  window._aiGeneratedCards = null;
  document.getElementById('ai-generate-panel').classList.add('hidden');
  document.getElementById('ai-preview').innerHTML = '';
  document.getElementById('ai-topic').value = '';
  showToast(`${count} Karten gespeichert`);
  refreshDeckDetail();
}

// === Scanner ===

let scanRawText = '';
let scanParsedCards = [];

function initScanner() {
  document.getElementById('btn-scan-camera').addEventListener('click', openScanCamera);
  document.getElementById('btn-scan-file').addEventListener('click', () => document.getElementById('scan-file-input').click());
  document.getElementById('scan-file-input').addEventListener('change', onScanFileSelected);
  document.getElementById('btn-scan-capture').addEventListener('click', captureScanPhoto);
  document.getElementById('btn-scan-cancel-cam').addEventListener('click', closeScanCamera);
  document.getElementById('btn-scan-raw').addEventListener('click', toggleScanRaw);
  document.getElementById('btn-scan-reparse').addEventListener('click', reparseScannedText);
  document.getElementById('btn-scan-restart').addEventListener('click', resetScanner);
  document.getElementById('btn-scan-save').addEventListener('click', saveScanCards);
}

function resetScanner() {
  stopCamera();
  scanRawText = '';
  scanParsedCards = [];
  document.getElementById('scan-step-source').classList.remove('hidden');
  document.getElementById('scan-step-camera').classList.add('hidden');
  document.getElementById('scan-step-ocr').classList.add('hidden');
  document.getElementById('scan-step-preview').classList.add('hidden');
  document.getElementById('scan-raw-text').classList.add('hidden');
}

async function openScanCamera() {
  document.getElementById('scan-step-source').classList.add('hidden');
  document.getElementById('scan-step-camera').classList.remove('hidden');
  const video = document.getElementById('scan-video');
  const ok = await startCamera(video);
  if (!ok) {
    showToast('Kamera nicht verfügbar');
    resetScanner();
  }
}

function closeScanCamera() {
  stopCamera();
  resetScanner();
}

function captureScanPhoto() {
  const video = document.getElementById('scan-video');
  const imageData = captureFrame(video);
  stopCamera();
  document.getElementById('scan-step-camera').classList.add('hidden');
  processScannedImage(imageData);
}

function onScanFileSelected(e) {
  const file = e.target.files[0];
  if (!file) return;
  document.getElementById('scan-step-source').classList.add('hidden');
  processScannedImage(file);
  e.target.value = ''; // reset
}

async function processScannedImage(imageSource) {
  document.getElementById('scan-step-ocr').classList.remove('hidden');
  document.getElementById('scan-ocr-progress').style.width = '0%';
  document.getElementById('scan-ocr-status').textContent = 'Lade Tesseract.js...';

  try {
    const text = await runOCR(imageSource, (pct) => {
      document.getElementById('scan-ocr-progress').style.width = pct + '%';
      document.getElementById('scan-ocr-status').textContent = `Erkenne Text... ${pct}%`;
    });

    scanRawText = text;
    document.getElementById('scan-step-ocr').classList.add('hidden');

    // Try Ollama first, fallback to regex
    let cards = await parseWithOllama(text);
    if (!cards || cards.length === 0) {
      cards = parseOCRText(text);
    }
    scanParsedCards = cards;

    showScanPreview();
  } catch (err) {
    showToast('OCR fehlgeschlagen: ' + err.message);
    resetScanner();
  }
}

async function showScanPreview() {
  document.getElementById('scan-step-preview').classList.remove('hidden');
  document.getElementById('scan-count').textContent = `${scanParsedCards.length} Karten erkannt`;
  document.getElementById('scan-raw-textarea').value = scanRawText;

  // Render card previews
  const container = document.getElementById('scan-cards-preview');
  if (scanParsedCards.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding:24px">
        <p class="text-dim">Keine Karten erkannt. Versuche den Rohtext zu bearbeiten und erneut zu parsen.</p>
      </div>
    `;
  } else {
    container.innerHTML = scanParsedCards.map((card, i) => `
      <div class="card" id="scan-card-${i}">
        <div class="flex-between">
          <span class="tag tag-accent">${card.type === 'vocab' ? 'Vokabel' : card.type === 'process' ? 'Prozess' : 'Begriff'}</span>
          <button class="btn btn-secondary" style="padding:4px 10px; font-size:11px"
                  onclick="removeScanCard(${i})">Entfernen</button>
        </div>
        <div class="mt-8">
          <input type="text" class="form-input mb-8" value="${escapeHtml(card.front)}"
                 onchange="scanParsedCards[${i}].front=this.value" placeholder="Vorderseite"
                 style="font-size:14px; padding:8px 12px;">
          ${card.type === 'process' && card.steps ? `
            <div class="text-sm text-dim mb-8">Schritte:</div>
            ${card.steps.map((s, si) => `
              <input type="text" class="form-input mb-8" value="${escapeHtml(s)}"
                     onchange="scanParsedCards[${i}].steps[${si}]=this.value"
                     style="font-size:13px; padding:6px 12px;">
            `).join('')}
          ` : `
            <input type="text" class="form-input" value="${escapeHtml(card.back)}"
                   onchange="scanParsedCards[${i}].back=this.value" placeholder="Rückseite"
                   style="font-size:14px; padding:8px 12px;">
          `}
        </div>
      </div>
    `).join('');
  }

  // Fill deck selector
  const select = document.getElementById('scan-target-deck');
  const decks = await getAllDecks();
  select.innerHTML = decks.length === 0
    ? '<option value="">Kein Deck vorhanden</option>'
    : decks.map(d => `<option value="${d.id}">${escapeHtml(d.name)}</option>`).join('');
}

function removeScanCard(index) {
  scanParsedCards.splice(index, 1);
  showScanPreview();
}

function toggleScanRaw() {
  document.getElementById('scan-raw-text').classList.toggle('hidden');
}

function reparseScannedText() {
  scanRawText = document.getElementById('scan-raw-textarea').value;
  scanParsedCards = parseOCRText(scanRawText);
  document.getElementById('scan-raw-text').classList.add('hidden');
  showScanPreview();
}

async function saveScanCards() {
  const deckId = document.getElementById('scan-target-deck').value;
  if (!deckId) {
    showToast('Bitte zuerst ein Deck erstellen');
    return;
  }
  if (scanParsedCards.length === 0) {
    showToast('Keine Karten zum Speichern');
    return;
  }

  let count = 0;
  for (const card of scanParsedCards) {
    if (!card.front) continue;
    await createCard({
      deckId,
      type: card.type || 'vocab',
      front: card.front,
      back: card.back || '',
      steps: card.steps || null,
      tags: ['scan']
    });
    count++;
  }

  showToast(`${count} Karten gespeichert`);
  resetScanner();
  navigateTo('decks');
}

// === Statistics ===

async function refreshStats() {
  const allCards = await dbGetAll('cards');
  const allReviews = await dbGetAll('reviews');
  const streak = await updateStreak();
  const totalXP = await getTotalXP();

  document.getElementById('stats-total-cards').textContent = allCards.length;
  document.getElementById('stats-mastered').textContent = allReviews.filter(r => r.interval >= 21).length;
  document.getElementById('stats-streak').textContent = streak;
  document.getElementById('stats-total-xp').textContent = totalXP;

  // Last 7 days chart
  const weekContainer = document.getElementById('stats-week');
  const allStats = await getAllStats();
  let html = '<div style="display:flex; gap:4px; align-items:end; height:120px;">';

  for (let i = 6; i >= 0; i--) {
    const date = new Date(Date.now() - i * 86400000);
    const dateStr = date.toISOString().slice(0, 10);
    const stat = allStats.find(s => s.date === dateStr);
    const count = stat ? stat.cardsReviewed : 0;
    const maxHeight = 100;
    const barHeight = count > 0 ? Math.max(8, Math.min(maxHeight, count * 4)) : 4;
    const day = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][date.getDay()];
    const isToday = i === 0;

    html += `
      <div style="flex:1; text-align:center;">
        <div style="font-size:11px; color:var(--text-dim); margin-bottom:4px;">${count}</div>
        <div style="height:${barHeight}px; background:${isToday ? 'var(--accent)' : 'var(--bg-input)'}; border-radius:4px; margin:0 2px;"></div>
        <div style="font-size:11px; color:${isToday ? 'var(--accent)' : 'var(--text-dim)'}; margin-top:4px;">${day}</div>
      </div>
    `;
  }
  html += '</div>';
  weekContainer.innerHTML = html;
}

// === Settings ===

async function loadSettings() {
  const settings = await getSettings();
  document.getElementById('set-ollama-url').value = settings.ollamaUrl || '';
  document.getElementById('set-ollama-key').value = settings.ollamaApiKey || '';
  document.getElementById('set-daily-goal').value = settings.dailyGoal || 20;
  document.getElementById('set-theme').value = settings.theme || 'dark';
}

async function saveAppSettings() {
  await saveSettings({
    ollamaUrl: document.getElementById('set-ollama-url').value.trim(),
    ollamaApiKey: document.getElementById('set-ollama-key').value.trim(),
    dailyGoal: parseInt(document.getElementById('set-daily-goal').value) || 20,
    theme: document.getElementById('set-theme').value
  });
  showToast('Einstellungen gespeichert');
}

function applyTheme(theme) {
  if (theme === 'light') {
    document.body.classList.add('theme-light');
  } else {
    document.body.classList.remove('theme-light');
  }
}

// === Import trigger ===

function triggerImport() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,.csv';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      if (file.name.endsWith('.csv')) {
        const decks = await getAllDecks();
        if (decks.length === 0) {
          showToast('Erstelle zuerst ein Deck für den CSV-Import');
          return;
        }
        // Show deck chooser modal
        showCSVImportDeckChooser(file, decks);
      } else {
        const count = await importData(file);
        showToast(`${count} Decks importiert`);
        refreshDashboard();
      }
    } catch (err) {
      showToast('Import fehlgeschlagen: ' + err.message);
    }
  };
  input.click();
}

function showCSVImportDeckChooser(file, decks) {
  const modal = document.getElementById('modal-confirm');
  document.getElementById('confirm-title').textContent = 'CSV importieren in...';
  document.getElementById('confirm-text').innerHTML =
    `<select id="csv-deck-select" class="form-select mt-8">
      ${decks.map(d => `<option value="${d.id}">${escapeHtml(d.name)}</option>`).join('')}
    </select>`;
  document.getElementById('btn-confirm-yes').textContent = 'Importieren';
  document.getElementById('btn-confirm-yes').className = 'btn btn-primary';
  confirmCallback = async () => {
    const deckId = document.getElementById('csv-deck-select').value;
    try {
      const count = await importCSV(file, deckId);
      showToast(`${count} Karten importiert`);
      refreshDashboard();
    } catch (err) {
      showToast('Import fehlgeschlagen: ' + err.message);
    }
    // Reset button
    document.getElementById('btn-confirm-yes').textContent = 'Löschen';
    document.getElementById('btn-confirm-yes').className = 'btn btn-danger';
  };
  modal.classList.add('active');
}

// === Confirm Dialog ===

function showConfirm(title, text, callback) {
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-text').textContent = text;
  confirmCallback = callback;
  document.getElementById('modal-confirm').classList.add('active');
}

function closeConfirm() {
  document.getElementById('modal-confirm').classList.remove('active');
  confirmCallback = null;
}

// === Toast Notification ===

function showToast(message, duration = 2500) {
  // Remove existing toast
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
    background: var(--bg-card); color: var(--text); padding: 12px 24px;
    border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.4);
    border: 1px solid var(--border); z-index: 300; font-size: 14px;
    animation: fadeIn 0.2s ease;
  `;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
