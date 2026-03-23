// === IndexedDB Module ===

const DB_NAME = 'lernapp';
const DB_VERSION = 1;

let _db = null;

// Request persistent storage so browser won't auto-evict IndexedDB
if (navigator.storage && navigator.storage.persist) {
  navigator.storage.persist().then(granted => {
    if (granted) console.log('Storage: persistent');
  });
}

function openDB() {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      const db = e.target.result;

      // Decks store
      if (!db.objectStoreNames.contains('decks')) {
        const decks = db.createObjectStore('decks', { keyPath: 'id' });
        decks.createIndex('name', 'name', { unique: false });
      }

      // Cards store
      if (!db.objectStoreNames.contains('cards')) {
        const cards = db.createObjectStore('cards', { keyPath: 'id' });
        cards.createIndex('deckId', 'deckId', { unique: false });
        cards.createIndex('type', 'type', { unique: false });
      }

      // Reviews store (SM-2 scheduling data)
      if (!db.objectStoreNames.contains('reviews')) {
        const reviews = db.createObjectStore('reviews', { keyPath: 'cardId' });
        reviews.createIndex('nextReview', 'nextReview', { unique: false });
      }

      // Stats store (one entry per day)
      if (!db.objectStoreNames.contains('stats')) {
        db.createObjectStore('stats', { keyPath: 'date' });
      }

      // Settings store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    };
    req.onsuccess = e => {
      _db = e.target.result;
      resolve(_db);
    };
    req.onerror = e => reject(e.target.error);
  });
}

// === Generic helpers ===

async function dbPut(storeName, item) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).put(item);
    tx.oncomplete = () => resolve(item);
    tx.onerror = e => reject(e.target.error);
  });
}

async function dbGet(storeName, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = e => reject(e.target.error);
  });
}

async function dbGetAll(storeName) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = e => reject(e.target.error);
  });
}

async function dbDelete(storeName, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = e => reject(e.target.error);
  });
}

async function dbGetByIndex(storeName, indexName, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const idx = tx.objectStore(storeName).index(indexName);
    const req = idx.getAll(value);
    req.onsuccess = () => resolve(req.result);
    req.onerror = e => reject(e.target.error);
  });
}

async function dbClear(storeName) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = e => reject(e.target.error);
  });
}

// === UUID ===

function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

// === Deck Operations ===

async function createDeck({ name, type = 'mixed', tags = [] }) {
  const deck = {
    id: uuid(),
    name,
    type,
    tags,
    created: Date.now(),
    updated: Date.now()
  };
  return dbPut('decks', deck);
}

async function updateDeck(id, updates) {
  const deck = await dbGet('decks', id);
  if (!deck) throw new Error('Deck not found');
  Object.assign(deck, updates, { updated: Date.now() });
  return dbPut('decks', deck);
}

async function deleteDeck(id) {
  // Delete all cards in this deck
  const cards = await getCardsByDeck(id);
  for (const card of cards) {
    await deleteCard(card.id);
  }
  return dbDelete('decks', id);
}

async function getAllDecks() {
  return dbGetAll('decks');
}

async function getDeck(id) {
  return dbGet('decks', id);
}

// === Card Operations ===

async function createCard({ deckId, type = 'vocab', front = '', back = '', steps = null, image = null, tags = [] }) {
  const card = {
    id: uuid(),
    deckId,
    type,
    front,
    back,
    steps,
    image,
    tags,
    created: Date.now()
  };
  await dbPut('cards', card);

  // Create initial review entry
  const review = {
    cardId: card.id,
    interval: 0,
    repetitions: 0,
    easeFactor: 2.5,
    nextReview: Date.now(), // due immediately
    lastReview: null
  };
  await dbPut('reviews', review);

  return card;
}

async function updateCard(id, updates) {
  const card = await dbGet('cards', id);
  if (!card) throw new Error('Card not found');
  Object.assign(card, updates);
  return dbPut('cards', card);
}

async function deleteCard(id) {
  await dbDelete('reviews', id); // review uses cardId as key
  return dbDelete('cards', id);
}

async function getCardsByDeck(deckId) {
  return dbGetByIndex('cards', 'deckId', deckId);
}

async function getCard(id) {
  return dbGet('cards', id);
}

// === Review Operations ===

async function getReview(cardId) {
  return dbGet('reviews', cardId);
}

async function updateReview(cardId, updates) {
  const review = await dbGet('reviews', cardId);
  if (!review) throw new Error('Review not found');
  Object.assign(review, updates);
  return dbPut('reviews', review);
}

async function getDueCards(deckId = null) {
  const now = Date.now();
  const allReviews = await dbGetAll('reviews');
  const dueReviews = allReviews.filter(r => r.nextReview <= now);

  if (!deckId) {
    // Get all due cards across all decks
    const cards = [];
    for (const rev of dueReviews) {
      const card = await dbGet('cards', rev.cardId);
      if (card) cards.push({ card, review: rev });
    }
    return cards;
  }

  // Get due cards for a specific deck
  const deckCards = await getCardsByDeck(deckId);
  const deckCardIds = new Set(deckCards.map(c => c.id));
  const cards = [];
  for (const rev of dueReviews) {
    if (deckCardIds.has(rev.cardId)) {
      const card = await dbGet('cards', rev.cardId);
      if (card) cards.push({ card, review: rev });
    }
  }
  return cards;
}

async function getDeckStats(deckId) {
  const cards = await getCardsByDeck(deckId);
  const now = Date.now();
  let due = 0;
  let mastered = 0;

  for (const card of cards) {
    const review = await getReview(card.id);
    if (review) {
      if (review.nextReview <= now) due++;
      if (review.interval >= 21) mastered++; // 21+ days = mastered
    }
  }

  return { total: cards.length, due, mastered };
}

// === Stats Operations ===

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

async function getTodayStats() {
  const stats = await dbGet('stats', todayStr());
  return stats || { date: todayStr(), cardsReviewed: 0, correct: 0, wrong: 0, xpEarned: 0, streak: 0 };
}

async function updateTodayStats(updates) {
  const stats = await getTodayStats();
  Object.assign(stats, updates);
  return dbPut('stats', stats);
}

async function getAllStats() {
  return dbGetAll('stats');
}

// === Settings Operations ===

const DEFAULT_SETTINGS = {
  key: 'settings',
  ollamaUrl: '',
  ollamaApiKey: '',
  dailyGoal: 20,
  theme: 'dark',
  streakFreezes: 2
};

async function getSettings() {
  const settings = await dbGet('settings', 'settings');
  return settings || { ...DEFAULT_SETTINGS };
}

async function saveSettings(updates) {
  const settings = await getSettings();
  Object.assign(settings, updates);
  return dbPut('settings', settings);
}
