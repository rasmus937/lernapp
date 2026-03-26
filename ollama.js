// === AI Module – Central abstraction for Ollama / OpenAI-compatible APIs ===

// Model preference order for auto-selection (best first)
const AI_MODEL_PREFERENCE = [
  'qwen3:8b', 'qwen3:4b', 'qwen3:1.7b', 'qwen2.5:7b', 'qwen2.5:3b', 'qwen2.5:1.5b',
  'llama3.1:8b', 'llama3:8b', 'gemma2:9b', 'gemma2:2b', 'phi3:mini', 'mistral:7b'
];

// Resolve provider settings → { url, headers, model, isOllama }
async function getAiConfig() {
  const settings = await getSettings();
  const provider = settings.aiProvider || 'none';
  if (provider === 'none') return null;

  const isOllama = provider === 'ollama-local' || provider === 'ollama-cloud';
  let url = '';
  const headers = { 'Content-Type': 'application/json' };

  if (provider === 'ollama-local') {
    url = settings.aiUrl || 'http://localhost:11434';
  } else if (provider === 'ollama-cloud') {
    // Use CORS proxy if configured, otherwise direct URL
    url = settings.aiProxyUrl || settings.aiUrl || 'https://api.ollama.com';
    if (!url) return null;
  } else if (provider === 'openai') {
    url = settings.aiUrl || '';
    if (!url) return null;
  }

  // API key from settings
  const apiKey = settings.ollamaApiKey || '';
  if (apiKey) {
    headers['Authorization'] = 'Bearer ' + apiKey;
  }

  // Model: manual override or auto-select
  let model = settings.aiModel || '';

  return { url, headers, model, isOllama, provider };
}

// Auto-detect best available model via Ollama /api/tags
async function detectBestModel(config) {
  if (!config || !config.isOllama) return config?.model || '';
  if (config.model) return config.model; // manual override

  try {
    const resp = await fetch(config.url + '/api/tags', { headers: config.headers });
    if (!resp.ok) return '';
    const data = await resp.json();
    const available = (data.models || []).map(m => m.name || m.model || '');

    // Match against preference list
    for (const preferred of AI_MODEL_PREFERENCE) {
      if (available.some(a => a === preferred || a.startsWith(preferred.split(':')[0] + ':'))) {
        const exact = available.find(a => a === preferred);
        if (exact) return exact;
        // Partial match (same base model)
        const base = preferred.split(':')[0];
        const partial = available.find(a => a.startsWith(base + ':'));
        if (partial) return partial;
      }
    }
    // Fallback: first available model
    return available[0] || '';
  } catch {
    return '';
  }
}

// Central chat function – works with Ollama and OpenAI-compatible APIs
async function aiChat(messages, options = {}) {
  const config = await getAiConfig();
  if (!config) throw new Error('Keine KI konfiguriert');

  const model = options.model || await detectBestModel(config);
  if (!model) throw new Error('Kein KI-Modell verfügbar');

  if (config.isOllama) {
    // Ollama /api/chat
    const response = await fetch(config.url + '/api/chat', {
      method: 'POST',
      headers: config.headers,
      body: JSON.stringify({
        model,
        stream: false,
        think: true,
        messages,
        options: options.ollamaOptions || undefined
      })
    });
    if (!response.ok) throw new Error(`KI-Fehler: ${response.status}`);
    const data = await response.json();
    return (data.message?.content || '').slice(0, 100000);
  } else {
    // OpenAI-compatible /v1/chat/completions
    const body = {
      model,
      messages,
      stream: false
    };
    if (options.maxTokens) body.max_tokens = options.maxTokens;

    const response = await fetch(config.url + '/v1/chat/completions', {
      method: 'POST',
      headers: config.headers,
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error(`KI-Fehler: ${response.status}`);
    const data = await response.json();
    return (data.choices?.[0]?.message?.content || '').slice(0, 100000);
  }
}

// Test AI connection – returns { ok, model, error }
async function testAiConnection() {
  const config = await getAiConfig();
  if (!config) return { ok: false, error: 'Kein Anbieter konfiguriert' };

  try {
    if (config.isOllama) {
      const resp = await fetch(config.url + '/api/tags', { headers: config.headers });
      if (!resp.ok) return { ok: false, error: `HTTP ${resp.status}` };
      const data = await resp.json();
      const models = (data.models || []).map(m => m.name || m.model || '');
      const best = await detectBestModel(config);
      return { ok: true, model: best || models[0] || '?', models };
    } else {
      // OpenAI-compatible: try /v1/models
      const resp = await fetch(config.url + '/v1/models', { headers: config.headers });
      if (!resp.ok) return { ok: false, error: `HTTP ${resp.status}` };
      const data = await resp.json();
      const models = (data.data || []).map(m => m.id || '');
      return { ok: true, model: config.model || models[0] || '?', models };
    }
  } catch (err) {
    return { ok: false, error: err.message || 'Verbindung fehlgeschlagen' };
  }
}

// Check if any AI provider is configured and reachable
async function isAiAvailable() {
  const config = await getAiConfig();
  if (!config) return false;
  try {
    const result = await testAiConnection();
    return result.ok;
  } catch {
    return false;
  }
}

// === High-level: Generate cards from topic ===

async function generateCardsFromTopic(topic, type = 'mixed') {
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

  const content = await aiChat([{ role: 'user', content: prompt }]);

  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('KI hat kein gültiges JSON zurückgegeben');

  const raw = JSON.parse(jsonMatch[0]);
  if (!Array.isArray(raw)) throw new Error('Erwartetes Array nicht gefunden');

  const VALID_TYPES = ['vocab', 'term', 'process'];
  return raw.slice(0, 50).filter(c => c && typeof c === 'object' && c.front).map(c => ({
    type: VALID_TYPES.includes(c.type) ? c.type : 'term',
    front: String(c.front).slice(0, 500).trim(),
    back: String(c.back || '').slice(0, 2000).trim(),
    steps: Array.isArray(c.steps) ? c.steps.slice(0, 30).map(s => String(s).slice(0, 500).trim()) : null
  }));
}
