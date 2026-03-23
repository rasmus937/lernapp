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
      stats: await dbGetAll('stats'),
      settings: await getSettings()
    };

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

async function importData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.version || !data.decks || !data.cards) {
          throw new Error('Ungültige Datei');
        }

        // Import decks
        for (const deck of data.decks) {
          await dbPut('decks', deck);
        }

        // Import cards
        for (const card of data.cards) {
          await dbPut('cards', card);
        }

        // Import reviews
        if (data.reviews) {
          for (const review of data.reviews) {
            await dbPut('reviews', review);
          }
        }

        // Import stats
        if (data.stats) {
          for (const stat of data.stats) {
            await dbPut('stats', stat);
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
