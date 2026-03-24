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

  // Detect if this is a numbered vocabulary list (e.g. Latin textbook format)
  // Check if many lines start with a number followed by a space
  const numberedLines = lines.filter(l => /^\d{1,4}\s/.test(l));
  if (numberedLines.length >= 3 && numberedLines.length >= lines.length * 0.4) {
    return parseNumberedVocabList(lines);
  }

  // Fallback: generic separator-based parsing
  return parseGenericList(lines);
}

// Parse numbered vocabulary lists (e.g. "182 consistere, constitit ... stehen bleiben L 14")
function parseNumberedVocabList(lines) {
  // First pass: merge continuation lines into their parent numbered line
  const merged = [];
  for (const line of lines) {
    if (/^\d{1,4}\s/.test(line)) {
      merged.push(line);
    } else if (merged.length > 0 && !/^Seite\s*\d+$/i.test(line)) {
      // Continuation line: append to previous (skip page markers)
      merged[merged.length - 1] += ' ' + line;
    }
    // Skip orphan continuation lines at the start
  }

  const cards = [];
  for (const line of merged) {
    const parsed = parseNumberedVocabLine(line);
    if (parsed) cards.push(parsed);
  }
  return cards;
}

// Parse a single numbered vocab line
function parseNumberedVocabLine(line) {
  // Strip leading number: "182 consistere..." → "consistere..."
  const stripped = line.replace(/^\d{1,4}\s+/, '');
  if (!stripped) return null;

  // Strip trailing lesson reference: "... L 14", "... L14", "... Lektion 5"
  // Also strip embedded lesson refs from merged continuation lines (e.g. "... L 14 bestehen (aus)")
  // Also strip page markers like "Seite 5"
  const cleaned = stripped
    .replace(/\s+Seite\s*\d+\s*$/i, '')
    .replace(/\s+L\.?\s*\d{1,3}\s*$/, '')
    .replace(/\s+L\.?\s*\d{1,3}\s+(?=[a-zäöüA-ZÄÖÜ(])/, ' ')
    .trim();
  if (!cleaned) return null;

  // Try explicit separator first (dash, arrow, equals, colon)
  const dashMatch = cleaned.match(/^(.+?)\s*[–—→=]\s+(.+)$/);
  if (dashMatch && dashMatch[1].trim().length > 0 && dashMatch[2].trim().length > 0) {
    return { front: dashMatch[1].trim(), back: dashMatch[2].trim(), type: 'vocab' };
  }

  // Try tab separator
  const tabMatch = cleaned.match(/^(.+?)\t+(.+)$/);
  if (tabMatch) {
    return { front: tabMatch[1].trim(), back: tabMatch[2].trim(), type: 'vocab' };
  }

  // Try 3+ space separator
  const spaceMatch = cleaned.match(/^(.+?)\s{3,}(.+)$/);
  if (spaceMatch) {
    return { front: spaceMatch[1].trim(), back: spaceMatch[2].trim(), type: 'vocab' };
  }

  // Heuristic split: find where foreign word ends and translation begins
  // For Latin/Greek vocab: grammatical info ends, German/translation starts
  // Common patterns: "word, word, word  translation" or "word (grammar) translation"
  const heuristicResult = heuristicSplitVocab(cleaned);
  if (heuristicResult) return heuristicResult;

  // Last resort: if line is short enough, keep as single-sided card
  if (cleaned.length > 2 && cleaned.length < 200) {
    return { front: cleaned, back: '', type: 'vocab' };
  }
  return null;
}

// Heuristic: split a vocab line into foreign word + translation
// Works for patterns like "longus, longa, longum lang; lang andauernd"
function heuristicSplitVocab(text) {
  // Common German words that signal the start of a translation
  const DE_STARTERS = /\b(der|die|das|ein|eine|er|sie|es|sich|nicht|und|oder|vor|für|fur|aus|auf|mit|bei|nach|von|zu|jeder|ganz|mein|dein|sein|ihr|euer|unser|wahr|lang|hier|oft|genug|wissen|fühlen|fuhlen|führen|fuhren|setzen|stellen|legen|stehen|bitten|glauben|gerade|leicht|schwer|wichtig|ernst|gewaltig|hierher|wohin|ebenfalls|anreden|herantreten|hochheben|beseitigen)\b/;

  // Try to find where German starts after Latin forms
  // Strategy: scan for the first German word that isn't inside parentheses/grammar notation
  const words = text.split(/\s+/);
  let parenDepth = 0;

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    // Track parentheses – but ignore inline optional markers like "(be)urteilen"
    // These have '(' and ')' within the same word with text after ')'
    const isInlineOptional = /^\([^)]+\)\w/.test(w) || /\w\([^)]+\)$/.test(w);
    if (!isInlineOptional) {
      for (const ch of w) {
        if (ch === '(') parenDepth++;
        if (ch === ')') parenDepth = Math.max(0, parenDepth - 1);
      }
    }
    if (parenDepth > 0) continue;

    // Skip grammatical markers commonly found in Latin entries
    if (/^[,;.]$/.test(w)) continue;
    if (/^(m|f|n|Pl|Gen|Dat|Abl|Akk|Nom|Sg|Imp|Abl\.)$/i.test(w)) continue;

    // Check if this word looks like the start of a German translation
    // Also detect German words with optional prefixes like "(be)urteilen", "(er)bitten"
    const isDeWord = DE_STARTERS.test(w) || /^\([a-zäöü]+\)[a-zäöü]/i.test(w);
    if (i > 0 && isDeWord) {
      const front = words.slice(0, i).join(' ').replace(/[\s,;]+$/, '').trim();
      const back = words.slice(i).join(' ').trim();
      if (front.length > 0 && back.length > 0) {
        return { front, back, type: 'vocab' };
      }
    }
  }

  // Fallback: if no German starter found, look for a pattern break
  // Latin words tend to have commas between forms, then a clear word follows
  // Try splitting after the last comma-group that looks like Latin declension
  const commaGroups = text.match(/^([^,]+(?:,\s*[^,]+)*?)\s+([A-Za-zÄÖÜäöüß].{2,})$/);
  if (commaGroups) {
    const potentialFront = commaGroups[1].trim();
    const potentialBack = commaGroups[2].trim();
    // Verify: back should contain at least one common German character pattern
    if (/[äöüßÄÖÜ]|^(der|die|das|ein|nicht)\b/.test(potentialBack)) {
      return { front: potentialFront, back: potentialBack, type: 'vocab' };
    }
  }

  return null;
}

// Generic separator-based parsing for non-numbered lists
function parseGenericList(lines) {
  const cards = [];

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
          type: '_step',
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
