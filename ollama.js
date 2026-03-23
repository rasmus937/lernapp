// === Ollama Cloud Integration ===
// Generates learning cards from a topic using Ollama Cloud API

async function isOllamaAvailable() {
  const settings = await getSettings();
  if (!settings.ollamaUrl) return false;
  try {
    const resp = await fetch(settings.ollamaUrl + '/api/tags', {
      headers: settings.ollamaApiKey ? { 'Authorization': 'Bearer ' + settings.ollamaApiKey } : {}
    });
    return resp.ok;
  } catch {
    return false;
  }
}

async function generateCardsFromTopic(topic, type = 'mixed') {
  const settings = await getSettings();
  if (!settings.ollamaUrl) throw new Error('Ollama URL nicht konfiguriert');

  const typeInstruction = {
    vocab: 'Erstelle Vokabelkarten mit "front" (Fremdsprache) und "back" (Deutsch).',
    terms: 'Erstelle Fachbegriff-Karten mit "front" (Begriff) und "back" (Definition).',
    process: 'Erstelle eine Prozess-Karte mit "front" (Prozessname), "steps" (Array der Schritte in richtiger Reihenfolge) und "back" (Zusammenfassung).',
    mixed: 'Erstelle eine Mischung aus Fachbegriff-Karten ("type":"term") und falls passend eine Prozess-Karte ("type":"process"). Fachbegriffe haben "front" und "back". Prozesse haben "front", "steps" (Array) und "back".'
  }[type] || typeInstruction.mixed;

  const prompt = `Du bist ein Lernkarten-Generator. Erstelle Lernkarten zum Thema: "${topic}"

${typeInstruction}

WICHTIG:
- Alle Inhalte auf Deutsch
- Gib NUR ein JSON-Array zurück, kein anderer Text
- Jedes Element hat: { "type": "vocab"|"term"|"process", "front": "...", "back": "...", "steps": [...] }
- Bei "process": "steps" ist ein Array von Strings in der richtigen Reihenfolge
- Erstelle 5-15 sinnvolle Karten
- Sei praezise und fachlich korrekt`;

  const response = await fetch(settings.ollamaUrl + '/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(settings.ollamaApiKey ? { 'Authorization': 'Bearer ' + settings.ollamaApiKey } : {})
    },
    body: JSON.stringify({
      model: 'qwen3:1.7b',
      stream: false,
      think: true,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) throw new Error(`Ollama Fehler: ${response.status}`);

  const data = await response.json();
  const content = data.message?.content || '';

  // Extract JSON array from response
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('Ollama hat kein gueltiges JSON zurueckgegeben');

  const cards = JSON.parse(jsonMatch[0]);

  // Validate and clean
  return cards.filter(c => c && c.front).map(c => ({
    type: c.type || 'term',
    front: String(c.front).trim(),
    back: String(c.back || '').trim(),
    steps: Array.isArray(c.steps) ? c.steps.map(s => String(s).trim()) : null
  }));
}
