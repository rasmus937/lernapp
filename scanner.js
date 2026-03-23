// === Scanner Module: Camera/Image → OCR → Card Parsing ===

let scannerStream = null;

// Load Tesseract.js from CDN
function loadTesseract() {
  return new Promise((resolve, reject) => {
    if (window.Tesseract) { resolve(window.Tesseract); return; }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
    script.integrity = 'sha384-GJqSu7vueQ9qN0E9yLPb3Wtpd7OrgK8KmYzC8T1IysG1bcvxvIO4qtYR/D3A991F';
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve(window.Tesseract);
    script.onerror = () => reject(new Error('Tesseract.js konnte nicht geladen werden'));
    document.head.appendChild(script);
  });
}

// Start camera preview
async function startCamera(videoEl) {
  try {
    scannerStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
    });
    videoEl.srcObject = scannerStream;
    await videoEl.play();
    return true;
  } catch (err) {
    console.error('Camera error:', err);
    // Clean up stream if play() failed after getUserMedia() succeeded
    if (scannerStream) {
      scannerStream.getTracks().forEach(t => t.stop());
      scannerStream = null;
    }
    return false;
  }
}

// Stop camera
function stopCamera() {
  if (scannerStream) {
    scannerStream.getTracks().forEach(t => t.stop());
    scannerStream = null;
  }
}

// Capture frame from video to canvas and return image data
function captureFrame(videoEl) {
  const canvas = document.createElement('canvas');
  canvas.width = videoEl.videoWidth;
  canvas.height = videoEl.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(videoEl, 0, 0);
  return canvas.toDataURL('image/png');
}

// Run OCR on an image (data URL, Blob, or File)
async function runOCR(imageSource, progressCallback) {
  const Tess = await loadTesseract();

  const worker = await Tess.createWorker('deu+eng', 1, {
    logger: m => {
      if (progressCallback && m.status === 'recognizing text') {
        progressCallback(Math.round(m.progress * 100));
      }
    }
  });

  const { data: { text } } = await worker.recognize(imageSource);
  await worker.terminate();
  return text;
}

// Parse OCR text into card candidates
function parseOCRText(rawText) {
  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 1 && l.length < 500);
  const cards = [];

  // Common separator patterns for vocabulary lists
  const separators = [
    /^(.+?)\s*[-–—=:→]\s*(.+)$/,       // "word - translation", "word = translation"
    /^(.+?)\s{3,}(.+)$/,                 // "word      translation" (3+ spaces)
    /^(.+?)\t+(.+)$/,                     // "word\ttranslation" (tab-separated)
  ];

  for (const line of lines) {
    let matched = false;
    for (const sep of separators) {
      const m = line.match(sep);
      if (m && m[1].trim() && m[2].trim()) {
        cards.push({
          front: m[1].trim(),
          back: m[2].trim(),
          type: 'vocab'
        });
        matched = true;
        break;
      }
    }

    // If no separator matched, try numbered list (for processes)
    if (!matched) {
      const numMatch = line.match(/^(\d+)[.)]\s*(.+)/);
      if (numMatch) {
        cards.push({
          front: numMatch[2].trim(),
          back: '',
          type: '_step', // marked as step, will be grouped later
          stepNum: parseInt(numMatch[1])
        });
        matched = true;
      }
    }

    // Unmatched lines: store as single-sided terms
    if (!matched && line.length > 3) {
      cards.push({
        front: line,
        back: '',
        type: '_unmatched'
      });
    }
  }

  // Group consecutive _step items into a single process card
  const result = [];
  let stepBuffer = [];

  for (const card of cards) {
    if (card.type === '_step') {
      stepBuffer.push(card.front);
    } else {
      if (stepBuffer.length > 0) {
        result.push({
          front: 'Prozess',
          back: stepBuffer.join(' → '),
          steps: [...stepBuffer],
          type: 'process'
        });
        stepBuffer = [];
      }
      if (card.type !== '_unmatched') {
        result.push(card);
      }
    }
  }
  // Flush remaining steps
  if (stepBuffer.length > 0) {
    result.push({
      front: 'Prozess',
      back: stepBuffer.join(' → '),
      steps: [...stepBuffer],
      type: 'process'
    });
  }

  return result;
}

// Optional: Use Ollama for smarter parsing
async function parseWithOllama(rawText) {
  const settings = await getSettings();
  if (!settings.ollamaUrl) return null;

  const headers = { 'Content-Type': 'application/json' };
  if (settings.ollamaApiKey) {
    headers['Authorization'] = 'Bearer ' + settings.ollamaApiKey;
  }

  try {
    const response = await fetch(settings.ollamaUrl + '/api/chat', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'qwen3:1.7b',
        stream: false,
        messages: [{
          role: 'user',
          content: `Analysiere diesen Text aus einem Lehrbuch/Vokabelliste und extrahiere Lernkarten.
Gib NUR ein JSON-Array zurück, jedes Element hat: { "type": "vocab"|"term"|"process", "front": "...", "back": "...", "steps": [...] (nur bei process) }

Text:
${rawText}`
        }]
      })
    });

    const data = await response.json();
    const content = (data.message?.content || '').slice(0, 100000);
    // Extract JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const raw = JSON.parse(jsonMatch[0]);
      if (!Array.isArray(raw)) return null;
      // Sanitize: only allow expected fields
      const VALID_TYPES = ['vocab', 'term', 'process'];
      return raw.slice(0, 50).filter(c => c && typeof c === 'object' && c.front).map(c => ({
        type: VALID_TYPES.includes(c.type) ? c.type : 'vocab',
        front: String(c.front).slice(0, 500).trim(),
        back: String(c.back || '').slice(0, 2000).trim(),
        steps: Array.isArray(c.steps) ? c.steps.slice(0, 30).map(s => String(s).slice(0, 500).trim()) : null
      }));
    }
  } catch (err) {
    console.warn('Ollama parsing failed:', err);
  }
  return null;
}
