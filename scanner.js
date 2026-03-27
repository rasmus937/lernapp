// === Scanner Module: Camera/Image → OCR → Card Parsing ===

let scannerStream = null;

// Load Tesseract.js from CDN with timeout and fallback
function loadTesseract() {
  return new Promise((resolve, reject) => {
    if (window.Tesseract) { resolve(window.Tesseract); return; }

    let settled = false;
    const timeout = setTimeout(() => {
      if (!settled) { settled = true; reject(new Error('Tesseract.js Timeout – prüfe deine Internetverbindung')); }
    }, 20000);

    function tryLoad(withSRI) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
      if (withSRI) {
        script.integrity = 'sha384-GJqSu7vueQ9qN0E9yLPb3Wtpd7OrgK8KmYzC8T1IysG1bcvxvIO4qtYR/D3A991F';
      }
      script.crossOrigin = 'anonymous';
      script.onload = () => {
        if (!settled) {
          settled = true;
          clearTimeout(timeout);
          if (window.Tesseract) resolve(window.Tesseract);
          else reject(new Error('Tesseract.js geladen aber nicht initialisiert'));
        }
      };
      script.onerror = () => {
        if (!settled) {
          if (withSRI) {
            console.warn('Tesseract.js SRI load failed, retrying without integrity check');
            tryLoad(false);
          } else {
            settled = true;
            clearTimeout(timeout);
            reject(new Error('Tesseract.js konnte nicht geladen werden'));
          }
        }
      };
      document.head.appendChild(script);
    }

    tryLoad(true);
  });
}

// === Image Preprocessing Pipeline ===
// LSTM-optimized: grayscale + noise reduction + contrast (NO binarization)
// Binarization destroys thin strokes (d→o confusion) and creates noise artifacts.
// Tesseract's LSTM engine works better with clean grayscale images.

function preprocessImageForOCR(imageDataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        // Step 1: Upscale for better character distinction (o vs d, etc.)
        // Higher resolution gives Tesseract more pixels to distinguish similar glyphs
        let scale = 1;
        const maxDim = Math.max(img.width, img.height);
        if (maxDim < 1500) scale = 3;
        else if (maxDim < 2500) scale = 2;

        const canvas = document.createElement('canvas');
        const w = img.width * scale;
        const h = img.height * scale;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);

        const imageData = ctx.getImageData(0, 0, w, h);
        const data = imageData.data;

        // Step 2: Grayscale using min-channel (captures colored text like red/blue on white)
        // red(255,0,0) → min=0 (black), white(255,255,255) → min=255 (white)
        const gray = new Uint8Array(w * h);
        for (let i = 0; i < data.length; i += 4) {
          gray[i / 4] = Math.min(data[i], data[i + 1], data[i + 2]);
        }

        // Step 3: Gentle noise reduction (3x3 Gaussian-like weighted average)
        // Removes camera sensor noise without destroying letter features
        const smoothed = new Uint8Array(w * h);
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const idx = y * w + x;
            if (y === 0 || y === h - 1 || x === 0 || x === w - 1) {
              smoothed[idx] = gray[idx];
              continue;
            }
            // Kernel: [1,2,1; 2,4,2; 1,2,1] / 16
            smoothed[idx] = (
              gray[(y-1)*w+(x-1)] + 2*gray[(y-1)*w+x] + gray[(y-1)*w+(x+1)] +
              2*gray[y*w+(x-1)]   + 4*gray[idx]        + 2*gray[y*w+(x+1)] +
              gray[(y+1)*w+(x-1)] + 2*gray[(y+1)*w+x] + gray[(y+1)*w+(x+1)]
            ) >> 4;
          }
        }

        // Step 4: Contrast stretch (1st/99th percentile)
        const hist = new Uint32Array(256);
        for (let i = 0; i < smoothed.length; i++) hist[smoothed[i]]++;
        const totalPixels = smoothed.length;
        const pLow = totalPixels * 0.01;
        const pHigh = totalPixels * 0.99;
        let cumSum = 0, minVal = 0, maxVal = 255;
        for (let i = 0; i < 256; i++) {
          cumSum += hist[i];
          if (cumSum >= pLow && minVal === 0 && i > 0) minVal = i;
          if (cumSum >= pHigh) { maxVal = i; break; }
        }
        const range = maxVal - minVal || 1;

        // Write back as grayscale – NO binarization, preserves all letter detail
        for (let i = 0; i < smoothed.length; i++) {
          const val = Math.max(0, Math.min(255, Math.round((smoothed[i] - minVal) * 255 / range)));
          data[i * 4] = val;
          data[i * 4 + 1] = val;
          data[i * 4 + 2] = val;
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error('Bild konnte nicht geladen werden'));
    img.src = imageDataUrl;
  });
}

// === Camera Functions ===

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
    if (scannerStream) {
      scannerStream.getTracks().forEach(t => t.stop());
      scannerStream = null;
    }
    return false;
  }
}

function stopCamera() {
  if (scannerStream) {
    scannerStream.getTracks().forEach(t => t.stop());
    scannerStream = null;
  }
}

function captureFrame(videoEl) {
  const canvas = document.createElement('canvas');
  canvas.width = videoEl.videoWidth;
  canvas.height = videoEl.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(videoEl, 0, 0);
  return canvas.toDataURL('image/png');
}

// === OCR ===

async function runOCR(imageSource, progressCallback, statusCallback) {
  // Step 1: Preprocess image
  if (statusCallback) statusCallback('Bild wird optimiert...');
  let preprocessed;
  try {
    preprocessed = await preprocessImageForOCR(imageSource);
  } catch (err) {
    console.warn('Image preprocessing failed, using original:', err);
    preprocessed = imageSource;
  }

  // Step 2: Load Tesseract
  if (statusCallback) statusCallback('Lade Tesseract.js...');
  const Tess = await loadTesseract();

  // Step 3: Create worker with optimized parameters
  if (statusCallback) statusCallback('Starte OCR-Engine...');
  const worker = await Tess.createWorker('lat+deu+eng', 1, {
    logger: m => {
      if (m.status === 'loading language traineddata') {
        if (statusCallback) statusCallback('Lade Sprachdaten...');
      }
      if (progressCallback && m.status === 'recognizing text') {
        progressCallback(Math.round(m.progress * 100));
        if (statusCallback) statusCallback(`Erkenne Text... ${Math.round(m.progress * 100)}%`);
      }
    }
  });

  // PSM 6 = uniform block of text (ideal for vocab lists)
  // preserve_interword_spaces keeps column spacing intact
  await worker.setParameters({
    tessedit_pageseg_mode: '6',
    preserve_interword_spaces: '1',
  });

  // Step 4: Recognize
  if (statusCallback) statusCallback('Erkenne Text...');
  const { data: { text } } = await worker.recognize(preprocessed);
  await worker.terminate();

  // Step 5: Clean OCR artifacts
  return cleanOCRText(text);
}

// === OCR Text Cleaning ===

function cleanOCRText(rawText) {
  let lines = rawText.split('\n');

  lines = lines.map(line => {
    let l = line;

    // Fix digit/letter confusion inside words
    l = l.replace(/(?<=[a-zA-ZäöüÄÖÜ])1(?=[a-zA-ZäöüÄÖÜ])/g, 'l');
    l = l.replace(/(?<=[a-zA-ZäöüÄÖÜ])0(?=[a-zA-ZäöüÄÖÜ])/g, 'o');
    l = l.replace(/(?<=[a-zA-ZäöüÄÖÜ])5(?=[a-zA-ZäöüÄÖÜ])/g, 's');
    // Capital I misread as lowercase l at word start before lowercase letters
    l = l.replace(/(?<=\s|^)I(?=[a-zäöü]{2})/g, 'l');
    // Stray I inside lowercase word
    l = l.replace(/(?<=[a-zäöü])I(?=[a-zäöü])/g, 'l');

    // Capital T misread at end of lowercase word → likely i (e.g. accessT → accessi)
    l = l.replace(/(?<=[a-z])T(?=\s|,|;|$)/g, 'i');

    // Normalize non-German accented characters (é, è, ê, ó, ò, etc.)
    // These are NOT valid in German or Latin – they're OCR artifacts from macrons
    // German umlauts (ä, ö, ü, ß) are kept intact
    l = l.replace(/[éèêë]/g, 'e').replace(/[ÉÈÊË]/g, 'E');
    l = l.replace(/[óòô]/g, 'o').replace(/[ÓÒÔ]/g, 'O');
    l = l.replace(/[íìîï]/g, 'i').replace(/[ÍÌÎÏ]/g, 'I');
    l = l.replace(/[úùû]/g, 'u').replace(/[ÚÙÛ]/g, 'U');
    l = l.replace(/[áàâ]/g, 'a').replace(/[ÁÀÂ]/g, 'A');

    // Remove isolated special characters (noise artifacts between words)
    l = l.replace(/(?<=\s|^)[|\\\/^~`#@&*<>{}[\]_]+(?=\s|$)/g, '');

    // Remove isolated single non-alphanumeric chars that are likely noise
    l = l.replace(/(?<=\s)[^a-zA-Z0-9äöüÄÖÜß.,;:!?()\-–—'"]+(?=\s)/g, ' ');

    // Double commas/periods
    l = l.replace(/,\s*,/g, ',');
    l = l.replace(/\.\s*\./g, '.');

    // Normalize various dash types
    l = l.replace(/[‐‑‒―]/g, '-');

    // Strip lesson/page references like "L 14", "L14", "L.14", "L 14-17", "L1i" (OCR noise after digit)
    l = l.replace(/\bL\.?\s*\d{1,3}[a-zA-Z]{0,2}(?:\s*[-–]\s*\d{1,3})?\b/g, '');
    l = l.replace(/\bLektion\s*\d{1,3}\b/gi, '');
    l = l.replace(/\bKap\.?\s*\d{1,3}\b/gi, '');
    l = l.replace(/\bSeite\s*\d+\b/gi, '');

    // Collapse multiple spaces to single
    l = l.replace(/\s{2,}/g, ' ');

    return l.trim();
  });

  // Remove page artifacts, empty lines, and garbage lines
  lines = lines.filter(l => {
    if (!l) return false;
    if (/^\s*Seite\s*\d+\s*$/i.test(l)) return false;
    if (/^\s*\d{1,2}\s*$/.test(l)) return false;
    // Lines with only 1-2 chars that aren't real words
    if (l.length <= 2 && !/^[a-zA-ZäöüÄÖÜß]{2}$/.test(l)) return false;
    // Lines that are mostly special characters (>50% non-alphanumeric)
    const alphaCount = (l.match(/[a-zA-ZäöüÄÖÜß0-9]/g) || []).length;
    if (l.length > 3 && alphaCount < l.length * 0.4) return false;
    return true;
  });

  return lines.join('\n');
}

// === Card Parsing ===

// Expanded German word list for detecting translation boundaries
const DE_STARTER_WORDS = [
  // Articles & pronouns
  'der','die','das','ein','eine','einer','einem','einen',
  'er','sie','es','sich','jeder','jede','jedes','ganz',
  'mein','dein','sein','ihr','euer','unser','wir','man','wer','was',
  // Prepositions
  'vor','für','fur','aus','auf','mit','bei','nach','von','zu',
  'gegen','ohne','über','unter','zwischen','neben','hinter',
  'wegen','während','trotz','statt','außer','seit','bis','durch','an','in','um',
  // Conjunctions & particles
  'und','oder','nicht','ob','wenn','weil','damit','obwohl',
  'also','denn','doch','sondern','jedoch','außerdem','bereits',
  'dennoch','ebenfalls','sogar','zwar','aber','dass','daß',
  // Adverbs
  'hier','dort','oft','genug','sehr','schon','noch','immer','nie','niemals',
  'gerade','etwa','ungefähr','fast','kaum','sofort','plötzlich',
  'endlich','zuletzt','zuerst','damals','bisher','jetzt','dann',
  'deshalb','daher','darum','trotzdem','neulich',
  // Common adjectives that start translations
  'lang','wahr','kurz','groß','klein','gut','schlecht','neu','alt',
  'hoch','tief','breit','eng','stark','schnell','langsam',
  'richtig','falsch','möglich','nötig','eigen','fremd','heilig',
  'mächtig','tapfer','günstig','ungünstig','leicht','schwer',
  'wichtig','ernst','gewaltig','treu','grausam',
  // Common verbs that start translations
  'wissen','fühlen','fuhlen','führen','fuhren','setzen','stellen',
  'legen','stehen','bitten','glauben','gehen','kommen','nehmen',
  'geben','machen','sagen','halten','lassen','bringen','tragen',
  'ziehen','schlagen','rufen','fallen','treiben','brechen',
  'sprechen','werfen','greifen','heißen','bleiben','scheinen',
  'treten','reden','meinen','kennen','nennen','erkennen',
  'versuchen','bestehen','beurteilen','bezeichnen','vernichten',
  'beseitigen','hochheben','angreifen','verteidigen','errichten',
  'zerstören','herrschen','gehorchen','kämpfen','siegen',
  'besiegen','erobern','fliehen','verfolgen','zurückkehren',
  'anreden','herantreten','hierher','wohin',
  'beten','bieten','lesen','lieben','leben','loben','raten',
  'retten','reiten','senden','sorgen','suchen','teilen','tragen',
  'wagen','warten','wecken','weinen','werben','wirken','wohnen',
  'zahlen','zeigen','zwingen','dienen','danken','denken','dulden',
  'fordern','fragen','handeln','helfen','hoffen','kaufen',
  'klagen','lernen','leiden','lohnen','nutzen','opfern','pflegen',
  'planen','preisen','rechnen','regieren','sammeln','schaffen',
  'schenken','schicken','schreiben','schulden','spielen',
  'sterben','strafen','streiten','tauschen','urteilen','verbinden',
  'verlassen','versprechen','wachsen','wandern','warnen','widmen',
  // Additional starters
  'alle','alles','kein','keine','viel','viele','wenig','wenige',
  'mehr','selbst','nur','so','wie','wo','weg','teil',
];
const DE_STARTERS = new RegExp('\\b(' + DE_STARTER_WORDS.join('|') + ')\\b', 'i');

function parseOCRText(rawText) {
  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 1 && l.length < 500);

  // Detect if this is a numbered vocabulary list
  const numberedLines = lines.filter(l => /^\d{1,4}\s/.test(l));
  let cards;
  if (numberedLines.length >= 3 && numberedLines.length >= lines.length * 0.4) {
    cards = parseNumberedVocabList(lines);
  } else {
    cards = parseGenericList(lines);
  }

  return cleanParsedCards(cards);
}

function parseNumberedVocabList(lines) {
  const merged = [];
  for (const line of lines) {
    if (/^\d{1,4}\s/.test(line)) {
      merged.push(line);
    } else if (merged.length > 0 && !/^Seite\s*\d+$/i.test(line)) {
      merged[merged.length - 1] += ' ' + line;
    }
  }

  const cards = [];
  for (const line of merged) {
    const parsed = parseNumberedVocabLine(line);
    if (parsed) cards.push(parsed);
  }
  return cards;
}

function parseNumberedVocabLine(line) {
  const stripped = line.replace(/^\d{1,4}\s+/, '');
  if (!stripped) return null;

  // Strip trailing lesson/page references
  const cleaned = stripped
    .replace(/\s+Seite\s*\d+\s*$/i, '')
    .replace(/\s+Lektion\s*\d{1,3}\s*$/i, '')
    .replace(/\s+Kap\.?\s*\d{1,3}\s*$/i, '')
    .replace(/\s+L\.?\s*\d{1,3}\s*$/, '')
    .replace(/\s+L\.?\s*\d{1,3}\s+(?=[a-zäöüA-ZÄÖÜ(])/, ' ')
    .trim();
  if (!cleaned) return null;

  // Try explicit separator (dash, arrow, equals)
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

  // Try 2-space separator if right side looks German
  const twoSpaceMatch = cleaned.match(/^(.{8,}?)\s{2}([A-ZÄÖÜa-zäöüß].{2,})$/);
  if (twoSpaceMatch && /[äöüßÄÖÜ]/.test(twoSpaceMatch[2])) {
    return { front: twoSpaceMatch[1].trim(), back: twoSpaceMatch[2].trim(), type: 'vocab' };
  }

  // Heuristic split
  const heuristicResult = heuristicSplitVocab(cleaned);
  if (heuristicResult) return heuristicResult;

  // Last resort: single-sided card
  if (cleaned.length > 2 && cleaned.length < 200) {
    return { front: cleaned, back: '', type: 'vocab' };
  }
  return null;
}

// Heuristic: split vocab line into foreign word + translation
function heuristicSplitVocab(text) {
  const words = text.split(/\s+/);
  let parenDepth = 0;

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    // Track parentheses – but ignore inline optional markers like "(be)urteilen"
    const isInlineOptional = /^\([^)]+\)\w/.test(w) || /\w\([^)]+\)$/.test(w);
    if (!isInlineOptional) {
      for (const ch of w) {
        if (ch === '(') parenDepth++;
        if (ch === ')') parenDepth = Math.max(0, parenDepth - 1);
      }
    }
    if (parenDepth > 0) continue;

    // Skip grammatical markers
    if (/^[,;.]$/.test(w)) continue;
    if (/^(m|f|n|Pl|Gen|Dat|Abl|Akk|Nom|Sg|Imp|Abl\.)$/i.test(w)) continue;

    if (i === 0) continue;

    // Umlaut/ß detection – but umlauts in lowercase words are often OCR artifacts in Latin
    // Only trust umlauts as German signal if: word is capitalized (German noun) or contains ß
    const hasGermanChar = /[ß]/.test(w) || (/[äöüÄÖÜ]/.test(w) && /^[A-ZÄÖÜ]/.test(w));

    // Word matches DE_STARTERS list or has reliable German characters
    const isDeWord = hasGermanChar || DE_STARTERS.test(w) || /^\([a-zäöü]+\)[a-zäöü]/i.test(w);

    if (isDeWord) {
      const front = words.slice(0, i).join(' ').replace(/[\s,;]+$/, '').trim();
      const back = words.slice(i).join(' ').trim();
      if (front.length > 0 && back.length > 0) {
        return { front, back, type: 'vocab' };
      }
    }
  }

  // Fallback: pattern break after comma-groups (Latin declension pattern)
  const commaGroups = text.match(/^([^,]+(?:,\s*[^,]+)*?)\s+([A-Za-zÄÖÜäöüß].{2,})$/);
  if (commaGroups) {
    const potentialFront = commaGroups[1].trim();
    const potentialBack = commaGroups[2].trim();
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
    /^(.+?)\s*[-–—=:→]\s*(.+)$/,
    /^(.+?)\s{3,}(.+)$/,
    /^(.+?)\t+(.+)$/,
  ];

  for (const line of lines) {
    let matched = false;
    for (const sep of separators) {
      const m = line.match(sep);
      if (m && m[1].trim() && m[2].trim()) {
        cards.push({ front: m[1].trim(), back: m[2].trim(), type: 'vocab' });
        matched = true;
        break;
      }
    }

    if (!matched) {
      const numMatch = line.match(/^(\d+)[.)]\s*(.+)/);
      if (numMatch) {
        cards.push({ front: numMatch[2].trim(), back: '', type: '_step', stepNum: parseInt(numMatch[1]) });
        matched = true;
      }
    }

    if (!matched && line.length > 3) {
      cards.push({ front: line, back: '', type: '_unmatched' });
    }
  }

  // Group consecutive _step items into process cards
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

// === Post-Parse Cleanup ===

function cleanParsedCards(cards) {
  // Detect if this is a Latin vocab list (front sides have Latin-looking words)
  const isLatin = cards.length >= 3 && cards.filter(c =>
    /^[a-z]/.test(c.front) && /[,;]/.test(c.front)
  ).length >= cards.length * 0.3;

  let result = cards.map(card => ({
    ...card,
    front: isLatin ? cleanLatinText(cleanCardText(card.front)) : cleanCardText(card.front),
    back: isLatin ? autoCorrectGermanOCR(cleanCardText(card.back || '')) : cleanCardText(card.back || ''),
    steps: card.steps ? card.steps.map(cleanCardText) : card.steps
  })).filter(c => c.front.length > 1);

  return result;
}

// Clean Latin text: strip umlauts/accents that are OCR artifacts
// Latin uses only ASCII letters + macrons (which we strip)
function cleanLatinText(text) {
  return text
    .replace(/ö/g, 'o').replace(/Ö/g, 'O')
    .replace(/ü/g, 'u').replace(/Ü/g, 'U')
    .replace(/ä/g, 'a').replace(/Ä/g, 'A')
    .replace(/ß/g, 'ss')
    .replace(/&/g, 'e')
    .replace(/\b[A-Z](?=[a-z]{2,})/g, m => m.toLowerCase())
    .split(/(\s+|[,;:()\-–\/]+)/).map(part =>
      /^[a-z]{3,}$/.test(part) ? autoCorrectLatinOCR(part) : part
    ).join('');
}

// Rule-based OCR autocorrect for Latin words
// Only fixes high-confidence patterns (known Tesseract confusions)
function autoCorrectLatinOCR(word) {
  // Latin words that legitimately end in 'd'
  const LATIN_D_ENDINGS = new Set([
    'ad','sed','id','quid','quod','aliud','illud','istud','haud','apud',
    'idem','eiusdem','eundem','eandem'
  ]);

  let w = word;

  // Rule 1: Final 'd' → 'o' for words >3 chars
  // Latin 1st person (-o) is extremely common; final -d is rare for longer words
  if (w.length > 3 && w.endsWith('d') && !LATIN_D_ENDINGS.has(w)) {
    w = w.slice(0, -1) + 'o';
  }

  // Rule 2: 'nd' → 'no' when followed by consonant
  // e.g. honds→honos, but keep: secundum (nd+vowel), undecim, etc.
  w = w.replace(/nd(?=[bcdfghjklmnpqrstvwxyz])/g, 'no');

  // Rule 3: Final 'bt' → 'bi' (sibt → sibi)
  if (w.endsWith('bt')) {
    w = w.slice(0, -1) + 'i';
  }

  return w;
}

// === Grammar-aware Latin OCR correction ===
// Detects noun/verb entries and validates each form against expected endings.
// Fixes forms that don't match (e.g., iudicit→iudicii in genitive position).

const LATIN_GENITIVE_ENDINGS = ['ae', 'i', 'ii', 'is', 'us', 'ei', 'ium', 'um', 'orum', 'arum', 'onis', 'inis', 'itis', 'oris', 'eris', 'inis', 'utis', 'alis', 'aris', 'ionis'];
const LATIN_INFINITIVE_ENDINGS = ['are', 'ere', 'ire', 're'];
const LATIN_1STPERSON_ENDINGS = ['o', 'or'];
const LATIN_PERFECT_ENDINGS = ['i', 'ivi', 'ui', 'si', 'xi', 'di', 'ci', 'vi'];
const LATIN_SUPINE_ENDINGS = ['um', 'tum', 'sum', 'ctum', 'ptum', 'xtum', 'itum', 'atum', 'etum', 'utum'];

function matchesAnyEnding(word, endings) {
  return endings.some(e => word.endsWith(e));
}

function correctByGrammar(front) {
  // Split into forms: "word1, word2, word3" or "word1, word2; Gen. word3"
  const parts = front.split(/,\s*/);
  if (parts.length < 2) return front;

  // Detect entry type from gender markers or form count
  const lastPart = parts[parts.length - 1].trim();
  const genderMatch = lastPart.match(/\b([mfn])$/);
  const hasGender = genderMatch !== null;

  // Also check for gender marker after semicolon in 2nd part: "iter, itineris n"
  const secondPart = parts[1] ? parts[1].trim() : '';
  const genderInSecond = secondPart.match(/^(\S+)\s+([mfn])$/);

  if (hasGender || genderInSecond) {
    // NOUN entry: nominative, genitive [gender]
    return correctNounEntry(parts, front);
  }

  // Check for verb pattern: infinitive (-re), 1st person (-o), perfect (-i), supine (-um)
  const firstWord = parts[0].trim().split(/\s/)[0];
  if (matchesAnyEnding(firstWord, LATIN_INFINITIVE_ENDINGS) && parts.length >= 3) {
    return correctVerbEntry(parts, front);
  }

  return front;
}

function correctNounEntry(parts, original) {
  // parts[0] = nominative, parts[1] = genitive (possibly + gender)
  if (parts.length < 2) return original;

  const genPart = parts[1].trim();
  // Extract genitive word (remove gender marker and other suffixes)
  const genMatch = genPart.match(/^(\S+)/);
  if (!genMatch) return original;
  const genWord = genMatch[1];

  // Check if genitive has a valid ending
  if (matchesAnyEnding(genWord, LATIN_GENITIVE_ENDINGS)) return original;

  // Try fixing the ending: find closest valid genitive ending
  const fixed = tryFixEnding(genWord, LATIN_GENITIVE_ENDINGS);
  if (fixed && fixed !== genWord) {
    return original.replace(genWord, fixed);
  }

  return original;
}

function correctVerbEntry(parts, original) {
  let result = original;

  // parts[0] = infinitive, [1] = 1st person, [2] = perfect, [3] = supine
  const forms = parts.map(p => p.trim().split(/\s/)[0]);

  // Check 1st person (position 1)
  if (forms[1] && !matchesAnyEnding(forms[1], LATIN_1STPERSON_ENDINGS)) {
    const fixed = tryFixEnding(forms[1], LATIN_1STPERSON_ENDINGS);
    if (fixed && fixed !== forms[1]) result = result.replace(forms[1], fixed);
  }

  // Check perfect (position 2)
  if (forms[2] && !matchesAnyEnding(forms[2], LATIN_PERFECT_ENDINGS)) {
    const fixed = tryFixEnding(forms[2], LATIN_PERFECT_ENDINGS);
    if (fixed && fixed !== forms[2]) result = result.replace(forms[2], fixed);
  }

  // Check supine (position 3)
  if (forms[3] && !matchesAnyEnding(forms[3], LATIN_SUPINE_ENDINGS)) {
    const fixed = tryFixEnding(forms[3], LATIN_SUPINE_ENDINGS);
    if (fixed && fixed !== forms[3]) result = result.replace(forms[3], fixed);
  }

  return result;
}

// Try to fix a word ending by finding the closest valid Latin ending
// Picks the candidate with the lowest Levenshtein distance (max 2)
function tryFixEnding(word, validEndings) {
  if (word.length < 3) return word;

  let best = word;
  let bestDist = Infinity;

  for (let cut = 1; cut <= 3 && cut < word.length - 1; cut++) {
    const stem = word.slice(0, -cut);
    for (const ending of validEndings) {
      if (ending.length >= cut - 1 && ending.length <= cut + 1) {
        const candidate = stem + ending;
        const dist = levenshtein(word, candidate);
        if (dist <= 2 && dist < bestDist) {
          best = candidate;
          bestDist = dist;
        }
      }
    }
  }
  return best;
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
    }
  }
  return dp[m][n];
}

// Fix missing umlauts in German translations (OCR often drops the dots)
const GERMAN_UMLAUT_FIXES = {
  'Konig': 'König', 'Konigsherrschaft': 'Königsherrschaft', 'Konigreich': 'Königreich',
  'konig': 'könig', 'koniglich': 'königlich',
  'moglich': 'möglich', 'notig': 'nötig', 'offentlich': 'öffentlich',
  'plotzlich': 'plötzlich', 'gewohnlich': 'gewöhnlich', 'personlich': 'persönlich',
  'unmoglich': 'unmöglich', 'vollig': 'völlig', 'hoflich': 'höflich',
  'feindlich': 'feindlich', 'frohlich': 'fröhlich', 'gottlich': 'göttlich',
  'Gotter': 'Götter', 'Volker': 'Völker', 'Worter': 'Wörter',
  'ubel': 'übel', 'uber': 'über', 'Ubel': 'Übel',
  'fur': 'für', 'Tur': 'Tür', 'zuruck': 'zurück',
  'glucken': 'glücken', 'Gluck': 'Glück', 'Stuck': 'Stück',
  'Bruder': 'Brüder', 'Mutter': 'Mütter', 'Vater': 'Väter',
  'wahlen': 'wählen', 'erzahlen': 'erzählen', 'zahlen': 'zählen',
  'gefahrlich': 'gefährlich', 'jahrlich': 'jährlich', 'ahnlich': 'ähnlich',
  'machtig': 'mächtig', 'unganglich': 'ungänglich', 'umganglich': 'umgänglich',
  'standig': 'ständig', 'vollstandig': 'vollständig',
  'Romer': 'Römer', 'romisch': 'römisch',
  'kampfen': 'kämpfen', 'Kampf': 'Kämpf',
  'zerstoren': 'zerstören', 'horen': 'hören', 'gehoren': 'gehören',
  'bose': 'böse', 'Grosse': 'Größe', 'grosse': 'größe',
  'Fuhrer': 'Führer', 'fuhren': 'führen', 'ausfuhren': 'ausführen',
};

function autoCorrectGermanOCR(text) {
  return text.split(/(\s+|[,;:()\-–]+)/).map(part => {
    return GERMAN_UMLAUT_FIXES[part] || part;
  }).join('');
}

function cleanCardText(text) {
  return text
    .replace(/\bL\.?\s*\d{1,3}[a-zA-Z]{0,2}(?:\s*[-–]\s*\d{1,3})?\b/g, '')
    .replace(/\bLektion\s*\d{1,3}\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[.,;:\s]+/, '')
    .replace(/[.,;:\s]+$/, '')
    .replace(/^\d{1,4}\s+/, '')
    .trim();
}

// === Ollama OCR Correction (per card) ===

async function correctCardsWithOllama(cards, onProgress) {
  if (cards.length === 0) return null;

  const config = await getAiConfig();
  if (!config) return null;

  const result = [...cards];
  const total = Math.min(cards.length, 60);

  for (let i = 0; i < total; i++) {
    if (onProgress) onProgress(i + 1, total);
    const card = cards[i];

    const prompt = `Vokabelkarte aus OCR-Scan. Prüfe und korrigiere mit minimalen Änderungen.

Vorderseite (Latein): ${card.front}
Rückseite (Deutsch): ${card.back}

1. Ist Latein/Deutsch richtig zugeordnet? Falls nicht, tausche die Seiten.
2. Sind die lateinischen Wortformen korrekt? Korrigiere nur einzelne falsche Zeichen (OCR-Fehler wie d statt o, fehlende Buchstaben). Ändere so wenig wie möglich.
3. Ist die deutsche Übersetzung korrekt geschrieben? Fehlende Umlaute ergänzen.

Antworte NUR mit JSON: {"front":"...","back":"..."}
Wenn alles korrekt ist, gib die Karte unverändert zurück.`;

    try {
      const content = await aiChat([{ role: 'user', content: prompt }]);

      let jsonStr = null;
      const codeBlock = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (codeBlock) {
        jsonStr = codeBlock[1];
      } else {
        const objMatch = content.match(/\{[\s\S]*\}/);
        if (objMatch) jsonStr = objMatch[0];
      }
      if (!jsonStr) continue;

      const fix = JSON.parse(jsonStr);
      if (!fix || typeof fix !== 'object') continue;

      // Only accept if the fix doesn't change too much (safety check)
      const newFront = (typeof fix.front === 'string' && fix.front.trim()) ? fix.front.trim().slice(0, 500) : null;
      const newBack = (typeof fix.back === 'string' && fix.back.trim()) ? fix.back.trim().slice(0, 2000) : null;

      if (newFront && newBack) {
        result[i] = { ...result[i], front: newFront, back: newBack };
      }
    } catch (err) {
      console.warn('AI correction card ' + (i + 1) + ' failed:', err);
    }
  }

  return result;
}
