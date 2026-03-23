// === Import & Export Module ===

// Auto-backup: saves all data to localStorage after each significant change
async function autoBackup() {
  try {
    const enabled = localStorage.getItem('lernapp-auto-backup') !== 'false';
    if (!enabled) return;

    const data = {
      version: 1,
      exported: new Date().toISOString(),
      decks: await dbGetAll('decks'),
      cards: await dbGetAll('cards'),
      reviews: await dbGetAll('reviews'),
      stats: await dbGetAll('stats')
    };

    // Exclude API key from localStorage backup for security
    const settings = await getSettings();
    data.settings = { ...settings, ollamaApiKey: '' };

    localStorage.setItem('lernapp-backup', JSON.stringify(data));
    localStorage.setItem('lernapp-backup-date', data.exported);
    localStorage.setItem('lernapp-backup-count',
      (data.decks.length) + ' Decks, ' + (data.cards.length) + ' Karten');
  } catch (e) {
    console.warn('Auto-backup failed:', e);
  }
}

function getBackupInfo() {
  const date = localStorage.getItem('lernapp-backup-date');
  const count = localStorage.getItem('lernapp-backup-count');
  if (!date) return null;
  return { date, count };
}

async function restoreFromBackup() {
  const raw = localStorage.getItem('lernapp-backup');
  if (!raw) return 0;
  const data = JSON.parse(raw);
  if (!data.decks || !data.cards) throw new Error('Backup ungültig');

  for (const deck of data.decks) await dbPut('decks', deck);
  for (const card of data.cards) await dbPut('cards', card);
  if (data.reviews) for (const r of data.reviews) await dbPut('reviews', r);
  if (data.stats) for (const s of data.stats) await dbPut('stats', s);

  return data.decks.length;
}

async function exportAllData() {
  const data = {
    version: 1,
    exported: new Date().toISOString(),
    decks: await dbGetAll('decks'),
    cards: await dbGetAll('cards'),
    reviews: await dbGetAll('reviews'),
    stats: await dbGetAll('stats'),
    settings: await getSettings()
  };

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `lernapp-backup-${todayStr()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Sanitize an object: only allow whitelisted keys, strip __proto__ etc.
function sanitizeObj(obj, allowedKeys) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return null;
  const clean = {};
  for (const key of allowedKeys) {
    if (key in obj) clean[key] = obj[key];
  }
  return clean;
}

const DECK_KEYS = ['id', 'name', 'type', 'tags', 'created', 'updated'];
const CARD_KEYS = ['id', 'deckId', 'type', 'front', 'back', 'steps', 'image', 'tags', 'created'];
const REVIEW_KEYS = ['cardId', 'interval', 'repetitions', 'easeFactor', 'nextReview', 'lastReview'];
const STAT_KEYS = ['date', 'cardsReviewed', 'correct', 'wrong', 'xpEarned', 'streak'];
const IMPORT_MAX_ITEMS = 10000;

async function importData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        if (e.target.result.length > 50 * 1024 * 1024) {
          throw new Error('Datei zu groß (max. 50 MB)');
        }
        const data = JSON.parse(e.target.result);
        if (!data.version || !Array.isArray(data.decks) || !Array.isArray(data.cards)) {
          throw new Error('Ungültige Datei');
        }
        if (data.decks.length > IMPORT_MAX_ITEMS || data.cards.length > IMPORT_MAX_ITEMS) {
          throw new Error(`Zu viele Einträge (max. ${IMPORT_MAX_ITEMS})`);
        }

        // Import decks (sanitized)
        for (const deck of data.decks) {
          const clean = sanitizeObj(deck, DECK_KEYS);
          if (clean && clean.id && clean.name) await dbPut('decks', clean);
        }

        // Import cards (sanitized)
        for (const card of data.cards) {
          const clean = sanitizeObj(card, CARD_KEYS);
          if (clean && clean.id && clean.deckId && clean.front) await dbPut('cards', clean);
        }

        // Import reviews (sanitized)
        if (Array.isArray(data.reviews)) {
          for (const review of data.reviews) {
            const clean = sanitizeObj(review, REVIEW_KEYS);
            if (clean && clean.cardId) await dbPut('reviews', clean);
          }
        }

        // Import stats (sanitized)
        if (Array.isArray(data.stats)) {
          for (const stat of data.stats) {
            const clean = sanitizeObj(stat, STAT_KEYS);
            if (clean && clean.date) await dbPut('stats', clean);
          }
        }

        resolve(data.decks.length);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden'));
    reader.readAsText(file);
  });
}

// CSV Import: expects "front;back" or "front,back" per line
async function importCSV(file, deckId, type = 'vocab') {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        let imported = 0;

        for (const line of lines) {
          // Try semicolon, then comma, then tab as separator
          let parts = null;
          for (const sep of [';', '\t', ',']) {
            const split = line.split(sep);
            if (split.length >= 2) {
              parts = split;
              break;
            }
          }

          if (parts && parts.length >= 2) {
            const front = parts[0].trim();
            const back = parts.slice(1).join(', ').trim();
            if (front && back) {
              await createCard({ deckId, type, front, back });
              imported++;
            }
          }
        }

        resolve(imported);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden'));
    reader.readAsText(file);
  });
}
