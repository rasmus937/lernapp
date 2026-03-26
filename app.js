// === LernApp – Main Application ===

const APP_VERSION = '1.1.0';

let currentView = 'dashboard';
let currentDeckId = null;
let editingCardId = null;
let confirmCallback = null;
let _appPin = null; // PIN in memory for encrypting new API keys

// === Lock Screen ===

async function hashPin(pin) {
  const enc = new TextEncoder();
  const hash = await crypto.subtle.digest('SHA-256', enc.encode(pin));
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function initLockScreen() {
  const pinHash = localStorage.getItem('lernapp-pin-hash');

  if (!pinHash) {
    // First launch: show setup
    document.getElementById('lock-setup').classList.remove('hidden');
    document.getElementById('lock-entry').classList.add('hidden');
  } else {
    // Returning user: show entry
    document.getElementById('lock-entry').classList.remove('hidden');
    document.getElementById('lock-setup').classList.add('hidden');
    document.getElementById('lock-pin-entry').focus();
  }

  // Setup: create PIN
  document.getElementById('btn-lock-setup').addEventListener('click', async () => {
    const pin1 = document.getElementById('lock-pin-new').value;
    const pin2 = document.getElementById('lock-pin-confirm').value;
    const errorEl = document.getElementById('lock-setup-error');

    if (!pin1 || pin1.length < 4) {
      errorEl.textContent = 'PIN muss mindestens 4 Zeichen haben';
      errorEl.classList.remove('hidden');
      return;
    }
    if (pin1 !== pin2) {
      errorEl.textContent = 'PINs stimmen nicht überein';
      errorEl.classList.remove('hidden');
      return;
    }

    const hash = await hashPin(pin1);
    localStorage.setItem('lernapp-pin-hash', hash);
    _appPin = pin1;

    // Migrate existing plaintext API key to encrypted
    const settings = await dbGet('settings', 'settings');
    if (settings && settings.ollamaApiKey && !settings.encryptedOllamaApiKey) {
      try {
        const encrypted = await encryptWithPin(settings.ollamaApiKey, pin1);
        _sessionApiKey = settings.ollamaApiKey;
        await saveSettings({ encryptedOllamaApiKey: encrypted, ollamaApiKey: '' });
      } catch (e) {
        console.warn('Migration failed:', e);
      }
    }

    unlockApp();
  });

  // Entry: verify PIN
  document.getElementById('btn-lock-enter').addEventListener('click', verifyPin);
  document.getElementById('lock-pin-entry').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') verifyPin();
  });
  document.getElementById('lock-pin-new').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('lock-pin-confirm').focus();
  });
  document.getElementById('lock-pin-confirm').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('btn-lock-setup').click();
  });
}

async function verifyPin() {
  const pin = document.getElementById('lock-pin-entry').value;
  const errorEl = document.getElementById('lock-entry-error');

  if (!pin) {
    errorEl.textContent = 'Bitte PIN eingeben';
    errorEl.classList.remove('hidden');
    return;
  }

  const hash = await hashPin(pin);
  const stored = localStorage.getItem('lernapp-pin-hash');

  if (hash !== stored) {
    errorEl.textContent = 'Falsche PIN';
    errorEl.classList.remove('hidden');
    document.getElementById('lock-pin-entry').value = '';
    return;
  }

  _appPin = pin;

  // Decrypt API key if stored
  const settings = await dbGet('settings', 'settings');
  if (settings && settings.encryptedOllamaApiKey) {
    try {
      _sessionApiKey = await decryptWithPin(settings.encryptedOllamaApiKey, pin);
    } catch (e) {
      console.warn('API key decrypt failed:', e);
      _sessionApiKey = '';
    }
  }

  unlockApp();
}

function unlockApp() {
  document.body.classList.remove('locked');
  // Set session PIN for auto-backup encryption
  _sessionPin = _appPin;
  initApp();
}

// === Initialization ===

async function initApp() {
  await openDB();

  // Apply saved theme
  const settings = await getSettings();
  applyTheme(settings.theme);

  // Auto-migration: if API key exists but no provider set, default to ollama-cloud
  if (settings.ollamaApiKey && (!settings.aiProvider || settings.aiProvider === 'none')) {
    await saveSettings({ aiProvider: 'ollama-cloud' });
  }

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
  document.getElementById('btn-export').addEventListener('click', async () => { await exportAllData(); showToast('Export heruntergeladen'); });
  document.getElementById('btn-import').addEventListener('click', triggerImport);
  document.getElementById('btn-restore-backup').addEventListener('click', restoreBackup);
  document.getElementById('set-auto-backup').addEventListener('change', (e) => {
    localStorage.setItem('lernapp-auto-backup', e.target.checked ? 'true' : 'false');
  });
  document.getElementById('set-theme').addEventListener('change', (e) => applyTheme(e.target.value));

  // AI Provider switching
  document.getElementById('set-ai-provider').addEventListener('change', updateAiProviderUI);

  // AI Connection test
  document.getElementById('btn-ai-test').addEventListener('click', async () => {
    const statusText = document.getElementById('ai-status-text');
    statusText.textContent = 'Teste...';
    statusText.style.color = '';
    const result = await testAiConnection();
    if (result.ok) {
      statusText.textContent = `Verbunden – Modell: ${result.model}`;
      statusText.style.color = 'var(--success)';
    } else {
      statusText.textContent = `Fehler: ${result.error}`;
      statusText.style.color = 'var(--danger)';
    }
  });

  // API Key buttons
  document.getElementById('btn-api-key-change').addEventListener('click', () => {
    document.getElementById('api-key-edit').classList.remove('hidden');
    document.getElementById('set-ollama-key').value = '';
    document.getElementById('set-ollama-key').focus();
  });
  document.getElementById('btn-api-key-cancel').addEventListener('click', () => {
    document.getElementById('api-key-edit').classList.add('hidden');
  });
  document.getElementById('btn-api-key-save').addEventListener('click', async () => {
    const key = document.getElementById('set-ollama-key').value.trim();
    if (!key) { showToast('Bitte API Key eingeben'); return; }
    await saveApiKey(key);
  });
  document.getElementById('btn-api-key-remove').addEventListener('click', () => {
    showConfirm('API Key entfernen', 'Möchtest du den gespeicherten API Key wirklich entfernen?', removeApiKey, 'Entfernen', 'btn btn-danger');
  });

  // Confirm modal
  document.getElementById('btn-confirm-no').addEventListener('click', closeConfirm);
  document.getElementById('btn-confirm-yes').addEventListener('click', () => {
    if (confirmCallback) confirmCallback();
    closeConfirm();
  });

  // Scanner
  initScanner();

  // Global event delegation for dynamic elements
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const action = el.dataset.action;
    const id = el.dataset.id;
    switch (action) {
      case 'open-deck': openDeckDetail(id); break;
      case 'edit-card': openCardEditor(id); break;
      case 'delete-card': e.stopPropagation(); confirmDeleteCard(id); break;
      case 'remove-scan-card': removeScanCard(parseInt(el.dataset.index)); break;
    }
  });

  // Delegated input change for scan card editing
  document.addEventListener('change', (e) => {
    const el = e.target;
    if (!el.dataset.scanField) return;
    const i = parseInt(el.dataset.index);
    if (i < 0 || i >= scanParsedCards.length) return;
    const field = el.dataset.scanField;
    if (field === 'front') scanParsedCards[i].front = el.value;
    else if (field === 'back') scanParsedCards[i].back = el.value;
    else if (field === 'step') {
      const si = parseInt(el.dataset.step);
      if (scanParsedCards[i].steps && si >= 0 && si < scanParsedCards[i].steps.length) {
        scanParsedCards[i].steps[si] = el.value;
      }
    }
  });

  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }

  // Load initial view
  await refreshDashboard();
}

// === DOMContentLoaded ===

document.addEventListener('DOMContentLoaded', async () => {
  await openDB();

  // Apply theme early
  const rawSettings = await dbGet('settings', 'settings');
  if (rawSettings && rawSettings.theme) applyTheme(rawSettings.theme);

  // Load plaintext API key into session
  if (rawSettings && rawSettings.ollamaApiKey) {
    _sessionApiKey = rawSettings.ollamaApiKey;
  }

  initApp();
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
      <div class="deck-item" data-action="open-deck" data-id="${escapeHtml(deck.id)}">
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
      <div class="deck-item" data-action="open-deck" data-id="${escapeHtml(deck.id)}">
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
      <div class="card" style="cursor:pointer" data-action="edit-card" data-id="${escapeHtml(card.id)}">
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
                  data-action="delete-card" data-id="${escapeHtml(card.id)}">Löschen</button>
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
  autoBackup();
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

function checkMCAnswer(btn) {
  const selected = btn.dataset.answer;
  const correct = btn.dataset.correct;
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
      if (b.dataset.answer === correct) {
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
  const mins = Math.max(1, Math.round(summary.duration / 60000));
  document.getElementById('summary-subtitle').textContent =
    `${summary.total} Karten in ${mins} Min.`;
  navigateTo('summary');
  autoBackup();
}

// === AI Generate ===

async function toggleAIPanel() {
  const panel = document.getElementById('ai-generate-panel');
  panel.classList.toggle('hidden');
  if (!panel.classList.contains('hidden')) {
    const available = await isAiAvailable();
    if (!available) {
      document.getElementById('ai-status').classList.remove('hidden');
      document.getElementById('ai-status').innerHTML =
        '<span style="color:var(--warning)">KI nicht erreichbar. Bitte in den Einstellungen konfigurieren.</span>';
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
      <div class="card mb-8" data-ai-index="${i}">
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

  // Only save cards still visible in the DOM
  const remaining = new Set(
    [...document.querySelectorAll('#ai-preview .card[data-ai-index]')]
      .map(el => parseInt(el.dataset.aiIndex))
  );

  let count = 0;
  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    if (!card.front || !remaining.has(i)) continue;
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
  autoBackup();
}

// === Scanner ===

let scanRawText = '';
let scanParsedCards = [];

let scanCropState = null; // { imageData, crop: {x,y,w,h}, containerRect }

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
  document.getElementById('btn-crop-retake').addEventListener('click', cropRetake);
  document.getElementById('btn-crop-confirm').addEventListener('click', cropConfirm);
  initCropHandles();
}

function resetScanner() {
  stopCamera();
  scanRawText = '';
  scanParsedCards = [];
  scanCropState = null;
  document.getElementById('scan-step-source').classList.remove('hidden');
  document.getElementById('scan-step-camera').classList.add('hidden');
  document.getElementById('scan-step-crop').classList.add('hidden');
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
  showCropPreview(imageData);
}

function onScanFileSelected(e) {
  const file = e.target.files[0];
  if (!file) return;
  document.getElementById('scan-step-source').classList.add('hidden');
  // Load file as data URL for crop preview
  const reader = new FileReader();
  reader.onload = () => showCropPreview(reader.result);
  reader.readAsDataURL(file);
  e.target.value = ''; // reset
}

function showCropPreview(imageDataUrl) {
  document.getElementById('scan-step-crop').classList.remove('hidden');
  const canvas = document.getElementById('scan-crop-canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();
  img.onload = () => {
    // Fit canvas to container, constrained by both width and height
    const containerWidth = canvas.parentElement.clientWidth;
    let scale = containerWidth / img.width;
    // In landscape, also constrain by available viewport height
    const maxH = window.innerHeight - 280; // header(56) + nav(64) + title(42) + buttons(56) + padding(62)
    if (maxH > 100 && img.height * scale > maxH) {
      scale = maxH / img.height;
    }
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.style.width = (img.width * scale) + 'px';
    canvas.style.height = (img.height * scale) + 'px';
    ctx.drawImage(img, 0, 0);

    // Initialize crop rect (default: 8% margin like the guide frame)
    const mx = Math.round(img.width * 0.08);
    const my = Math.round(img.height * 0.08);
    scanCropState = {
      imageDataUrl,
      img,
      crop: { x: mx, y: my, w: img.width - mx * 2, h: img.height - my * 2 },
      displayScale: scale
    };
    updateCropOverlay();
  };
  img.src = imageDataUrl;
}

function updateCropOverlay() {
  if (!scanCropState) return;
  const { crop, displayScale } = scanCropState;
  const overlay = document.getElementById('scan-crop-overlay');
  overlay.style.left = (crop.x * displayScale) + 'px';
  overlay.style.top = (crop.y * displayScale) + 'px';
  overlay.style.width = (crop.w * displayScale) + 'px';
  overlay.style.height = (crop.h * displayScale) + 'px';
}

function initCropHandles() {
  const handles = document.querySelectorAll('.scan-crop-handle');
  handles.forEach(handle => {
    const onStart = (e) => {
      e.preventDefault();
      if (!scanCropState) return;
      const corner = handle.dataset.corner;
      const container = document.getElementById('scan-crop-canvas');
      const rect = container.getBoundingClientRect();
      const scale = scanCropState.displayScale;

      const onMove = (ev) => {
        const clientX = ev.touches ? ev.touches[0].clientX : ev.clientX;
        const clientY = ev.touches ? ev.touches[0].clientY : ev.clientY;
        // Position relative to canvas in image coordinates
        const px = Math.max(0, Math.min(scanCropState.img.width, (clientX - rect.left) / scale));
        const py = Math.max(0, Math.min(scanCropState.img.height, (clientY - rect.top) / scale));
        const c = scanCropState.crop;
        const minSize = 50;

        if (corner === 'tl') {
          c.w = Math.max(minSize, c.x + c.w - px);
          c.h = Math.max(minSize, c.y + c.h - py);
          c.x = px; c.y = py;
        } else if (corner === 'tr') {
          c.w = Math.max(minSize, px - c.x);
          c.h = Math.max(minSize, c.y + c.h - py);
          c.y = py;
        } else if (corner === 'bl') {
          c.w = Math.max(minSize, c.x + c.w - px);
          c.h = Math.max(minSize, py - c.y);
          c.x = px;
        } else if (corner === 'br') {
          c.w = Math.max(minSize, px - c.x);
          c.h = Math.max(minSize, py - c.y);
        }
        updateCropOverlay();
      };

      const onEnd = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onEnd);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onEnd);
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onEnd);
      document.addEventListener('touchmove', onMove, { passive: false });
      document.addEventListener('touchend', onEnd);
    };

    handle.addEventListener('mousedown', onStart);
    handle.addEventListener('touchstart', onStart, { passive: false });
  });
}

function cropRetake() {
  scanCropState = null;
  document.getElementById('scan-step-crop').classList.add('hidden');
  openScanCamera();
}

function cropConfirm() {
  if (!scanCropState) return;
  const { img, crop } = scanCropState;
  // Crop the image to selected region
  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = Math.round(crop.w);
  cropCanvas.height = Math.round(crop.h);
  const ctx = cropCanvas.getContext('2d');
  ctx.drawImage(img, Math.round(crop.x), Math.round(crop.y),
    Math.round(crop.w), Math.round(crop.h), 0, 0, cropCanvas.width, cropCanvas.height);
  const croppedData = cropCanvas.toDataURL('image/png');
  scanCropState = null;
  document.getElementById('scan-step-crop').classList.add('hidden');
  processScannedImage(croppedData);
}

async function processScannedImage(imageSource) {
  document.getElementById('scan-step-ocr').classList.remove('hidden');
  document.getElementById('scan-ocr-progress').style.width = '0%';
  document.getElementById('scan-ocr-status').textContent = 'Lade Tesseract.js...';

  try {
    const text = await runOCR(
      imageSource,
      (pct) => { document.getElementById('scan-ocr-progress').style.width = pct + '%'; },
      (status) => { document.getElementById('scan-ocr-status').textContent = status; }
    );

    scanRawText = text;
    document.getElementById('scan-step-ocr').classList.add('hidden');

    // Always use local parser first (instant results)
    scanParsedCards = parseOCRText(text);
    showScanPreview();

    // Then try Ollama correction in background (if connected)
    tryOllamaCorrection();
  } catch (err) {
    showToast('OCR fehlgeschlagen: ' + (err?.message || String(err) || 'Unbekannter Fehler'));
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
      <div class="card" data-scan-index="${i}">
        <div class="flex-between">
          <span class="tag tag-accent">${card.type === 'vocab' ? 'Vokabel' : card.type === 'process' ? 'Prozess' : 'Begriff'}</span>
          <button class="btn btn-secondary" style="padding:4px 10px; font-size:11px"
                  data-action="remove-scan-card" data-index="${i}">Entfernen</button>
        </div>
        <div class="mt-8">
          <input type="text" class="form-input mb-8" value="${escapeHtml(card.front)}"
                 data-scan-field="front" data-index="${i}" placeholder="Vorderseite"
                 style="font-size:14px; padding:8px 12px;">
          ${card.type === 'process' && card.steps ? `
            <div class="text-sm text-dim mb-8">Schritte:</div>
            ${card.steps.map((s, si) => `
              <input type="text" class="form-input mb-8" value="${escapeHtml(s)}"
                     data-scan-field="step" data-index="${i}" data-step="${si}"
                     style="font-size:13px; padding:6px 12px;">
            `).join('')}
          ` : `
            <input type="text" class="form-input" value="${escapeHtml(card.back)}"
                   data-scan-field="back" data-index="${i}" placeholder="Rückseite"
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

// Ollama background correction for scanned cards
async function tryOllamaCorrection() {
  const config = await getAiConfig();
  if (!config || scanParsedCards.length === 0) return;

  // Show indicator
  const countEl = document.getElementById('scan-count');
  const originalText = countEl.textContent;
  countEl.textContent = originalText + ' – KI korrigiert...';

  try {
    const corrected = await correctCardsWithOllama(scanParsedCards);
    if (corrected && corrected.length > 0) {
      scanParsedCards = corrected;
      showScanPreview();
      countEl.textContent = `${scanParsedCards.length} Karten (KI-korrigiert)`;
    } else {
      countEl.textContent = originalText;
    }
  } catch {
    countEl.textContent = originalText;
  }
}

function toggleScanRaw() {
  document.getElementById('scan-raw-text').classList.toggle('hidden');
}

function reparseScannedText() {
  scanRawText = document.getElementById('scan-raw-textarea').value;
  scanParsedCards = parseOCRText(scanRawText);
  document.getElementById('scan-raw-text').classList.add('hidden');
  showScanPreview();
  tryOllamaCorrection();
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
  autoBackup();
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

// Show/hide AI settings fields based on selected provider
function updateAiProviderUI() {
  const provider = document.getElementById('set-ai-provider').value;
  const urlGroup = document.getElementById('ai-url-group');
  const keyGroup = document.getElementById('ai-key-group');
  const modelGroup = document.getElementById('ai-model-group');
  const statusBar = document.getElementById('ai-status-bar');

  // Reset all hidden
  urlGroup.classList.add('hidden');
  keyGroup.classList.add('hidden');
  modelGroup.classList.add('hidden');
  statusBar.classList.add('hidden');

  if (provider === 'none') return;

  // Show status bar for all providers
  statusBar.classList.remove('hidden');

  if (provider === 'ollama-local') {
    modelGroup.classList.remove('hidden');
    document.getElementById('set-ai-model').placeholder = 'Automatisch (empfohlen)';
  } else if (provider === 'ollama-cloud') {
    keyGroup.classList.remove('hidden');
    modelGroup.classList.remove('hidden');
    document.getElementById('set-ai-model').placeholder = 'Automatisch (empfohlen)';
  } else if (provider === 'openai') {
    urlGroup.classList.remove('hidden');
    keyGroup.classList.remove('hidden');
    modelGroup.classList.remove('hidden');
    document.getElementById('set-ai-url').placeholder = 'https://api.openai.com (oder LM Studio, vLLM, ...)';
    document.getElementById('set-ai-model').placeholder = 'z.B. gpt-4o-mini, llama3.1';
  }
}

async function loadSettings() {
  const settings = await getSettings();

  // AI Provider fields
  document.getElementById('set-ai-provider').value = settings.aiProvider || 'none';
  document.getElementById('set-ai-url').value = settings.aiUrl || '';
  document.getElementById('set-ai-model').value = settings.aiModel || '';
  updateAiProviderUI();

  // Auto-test connection if provider is configured
  const statusText = document.getElementById('ai-status-text');
  if (settings.aiProvider && settings.aiProvider !== 'none') {
    statusText.textContent = 'Teste Verbindung...';
    statusText.style.color = '';
    testAiConnection().then(result => {
      if (result.ok) {
        statusText.textContent = 'Verbunden – Modell: ' + result.model;
        statusText.style.color = 'var(--success)';
      } else {
        statusText.textContent = 'Nicht verbunden: ' + result.error;
        statusText.style.color = 'var(--danger)';
      }
    });
  } else {
    statusText.textContent = 'Kein Anbieter gewählt';
    statusText.style.color = '';
  }

  // Learning & theme
  document.getElementById('set-daily-goal').value = settings.dailyGoal || 20;
  document.getElementById('set-theme').value = settings.theme || 'dark';

  // API Key status display
  const hasKey = !!settings.ollamaApiKey;
  document.getElementById('api-key-text').textContent = hasKey ? '●●●●●●●● gespeichert' : 'Nicht gespeichert';
  document.getElementById('api-key-text').style.color = hasKey ? 'var(--success)' : '';
  document.getElementById('btn-api-key-remove').classList.toggle('hidden', !hasKey);
  document.getElementById('api-key-edit').classList.add('hidden');
  document.getElementById('api-key-status').classList.remove('hidden');

  // Auto-backup toggle
  const autoOn = localStorage.getItem('lernapp-auto-backup') !== 'false';
  document.getElementById('set-auto-backup').checked = autoOn;

  // Backup status
  const info = getBackupInfo();
  const statusEl = document.getElementById('backup-status');
  if (info) {
    const d = new Date(info.date);
    const timeStr = d.toLocaleDateString('de-DE') + ', ' + d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    statusEl.textContent = `Letztes Backup: ${timeStr} (${info.count})`;
  } else {
    statusEl.textContent = 'Kein Backup vorhanden';
  }

  // Version anzeigen
  const verEl = document.getElementById('app-version');
  if (verEl) verEl.textContent = 'LernApp v' + APP_VERSION;
}

async function saveAppSettings() {
  const aiProvider = document.getElementById('set-ai-provider').value;
  const aiUrl = document.getElementById('set-ai-url').value.trim();
  const aiModel = document.getElementById('set-ai-model').value.trim();

  // Validate URL
  if (aiUrl) {
    try {
      const url = new URL(aiUrl);
      if (url.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(url.hostname)) {
        showToast('URLs müssen HTTPS verwenden (außer localhost)');
        return;
      }
    } catch {
      showToast('Ungültige URL: ' + aiUrl);
      return;
    }
  }

  // OpenAI requires a URL
  if (aiProvider === 'openai' && !aiUrl) {
    showToast('Bitte API URL eingeben');
    return;
  }

  const theme = document.getElementById('set-theme').value;
  if (!['dark', 'light'].includes(theme)) return;

  await saveSettings({
    aiProvider,
    aiUrl,
    aiModel,
    dailyGoal: Math.min(200, Math.max(5, parseInt(document.getElementById('set-daily-goal').value) || 20)),
    theme
  });
  showToast('Einstellungen gespeichert');

  // Auto-test connection after save
  if (aiProvider !== 'none') {
    const statusText = document.getElementById('ai-status-text');
    statusText.textContent = 'Teste Verbindung...';
    statusText.style.color = '';
    const result = await testAiConnection();
    if (result.ok) {
      statusText.textContent = 'Verbunden – Modell: ' + result.model;
      statusText.style.color = 'var(--success)';
    } else {
      statusText.textContent = 'Nicht verbunden: ' + result.error;
      statusText.style.color = 'var(--danger)';
    }
  }
}

// === API Key Management ===

async function saveApiKey(newKey) {
  try {
    _sessionApiKey = newKey;
    const settings = await getSettings();
    const updates = { ollamaApiKey: newKey };
    // Auto-set provider to ollama-cloud if no provider is configured
    if (!settings.aiProvider || settings.aiProvider === 'none') {
      updates.aiProvider = 'ollama-cloud';
    }
    await saveSettings(updates);
    showToast('API Key gespeichert');
    loadSettings();
    autoBackup();
  } catch (e) {
    console.error('API key save failed:', e);
    showToast('Fehler beim Speichern: ' + (e.message || 'Unbekannter Fehler'));
  }
}

async function removeApiKey() {
  _sessionApiKey = '';
  await saveSettings({ ollamaApiKey: '', encryptedOllamaApiKey: '' });
  showToast('API Key entfernt');
  loadSettings();
  autoBackup();
}

async function restoreBackup() {
  const info = getBackupInfo();
  if (!info) {
    showToast('Kein Backup vorhanden');
    return;
  }
  const d = new Date(info.date);
  const timeStr = d.toLocaleDateString('de-DE') + ', ' + d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  showConfirm(
    'Backup wiederherstellen',
    `Backup vom ${timeStr} (${info.count}) wiederherstellen? Vorhandene Daten werden überschrieben.`,
    async () => {
      try {
        const count = await restoreFromBackup();
        showToast(`${count} Decks wiederhergestellt`);
        navigateTo('dashboard');
      } catch (e) {
        showToast('Fehler: ' + e.message);
      }
    },
    'Wiederherstellen',
    'btn btn-primary'
  );
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
        autoBackup();
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
      autoBackup();
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

function showConfirm(title, text, callback, btnText, btnClass) {
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-text').textContent = text;
  confirmCallback = callback;
  if (btnText) {
    const btn = document.getElementById('btn-confirm-yes');
    btn.textContent = btnText;
    if (btnClass) btn.className = btnClass;
  }
  document.getElementById('modal-confirm').classList.add('active');
}

function closeConfirm() {
  document.getElementById('modal-confirm').classList.remove('active');
  confirmCallback = null;
  // Reset button to default state
  const btn = document.getElementById('btn-confirm-yes');
  btn.textContent = 'Löschen';
  btn.className = 'btn btn-danger';
}

// === PIN Modal ===

function askPin(title, description) {
  return new Promise((resolve) => {
    const modal = document.getElementById('modal-pin');
    const input = document.getElementById('pin-input');
    const errorEl = document.getElementById('pin-error');
    document.getElementById('pin-title').textContent = title;
    document.getElementById('pin-description').textContent = description;
    input.value = '';
    errorEl.classList.add('hidden');
    modal.classList.add('active');
    input.focus();

    function cleanup() {
      modal.classList.remove('active');
      document.getElementById('btn-pin-confirm').removeEventListener('click', onConfirm);
      document.getElementById('btn-pin-cancel').removeEventListener('click', onCancel);
      input.removeEventListener('keydown', onKey);
    }
    function onConfirm() {
      const pin = input.value;
      if (!pin || pin.length < 1) {
        errorEl.textContent = 'Bitte PIN eingeben';
        errorEl.classList.remove('hidden');
        return;
      }
      cleanup();
      resolve(pin);
    }
    function onCancel() { cleanup(); resolve(null); }
    function onKey(e) { if (e.key === 'Enter') onConfirm(); if (e.key === 'Escape') onCancel(); }

    document.getElementById('btn-pin-confirm').addEventListener('click', onConfirm);
    document.getElementById('btn-pin-cancel').addEventListener('click', onCancel);
    input.addEventListener('keydown', onKey);
  });
}

function showPinError(msg) {
  const el = document.getElementById('pin-error');
  el.textContent = msg;
  el.classList.remove('hidden');
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
