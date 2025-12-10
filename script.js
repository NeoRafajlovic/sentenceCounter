/* Cursor trailer & navbar behavior */
const trailer = document.getElementById("trailer");
const body = document.querySelector("body");
const navbar = document.getElementById("navbar");

body.addEventListener("mouseover", () => trailer.style.opacity = 0.75);
body.addEventListener("mouseout", () => trailer.style.opacity = 0);

window.onmousemove = (e) => {
  const x = e.clientX;
  const y = e.clientY;
  // center the trailer visually on pointer
  trailer.style.transform = `translate(${x}px, ${y}px)`;
};

let mouseIsUp = false;
let cursorIsDown = false;

window.addEventListener("mouseup", () => {
  mouseIsUp = true;
  if (cursorIsDown) {
    trailer.style.opacity = 0.75;
    cursorIsDown = false;
  }
});

window.addEventListener("mousedown", () => {
  mouseIsUp = false;
  trailer.style.opacity = 0.35;
  setTimeout(() => {
    if (mouseIsUp) {
      trailer.style.opacity = 0.75;
      cursorIsDown = false;
    } else {
      cursorIsDown = true;
    }
  }, 160);
});

window.addEventListener("scroll", () => {
  if (window.scrollY >= 50) {
    navbar.style.height = "50px";
    navbar.style.opacity = "0.5";
    navbar.style.backgroundColor = "rgb(50,50,50)";
  } else {
    navbar.style.height = "150px";
    navbar.style.opacity = "0.75";
    navbar.style.backgroundColor = "rgb(20,20,20)";
  }
});

/* -------------------------
   Sentence counting logic
   -------------------------
   Heuristics:
   - Handles ellipses (...)
   - Recognizes a list of common abbreviations (case-insensitive)
   - Skips decimal numbers (3.14)
   - Skips domain names / file extensions (openai.com)
   - Avoids counting single-letter initials as sentence ends when pattern looks like initials
   - Counts ?, ! as sentence enders
   - Attempts to handle closing quotes / parentheses
*/

const textBox = document.getElementById("textBox");
const sentCountEl = document.getElementById("sentCount");
const wordCountEl = document.getElementById("wordCount");
const paraCountEl = document.getElementById("paraCount");
const readTimeEl = document.getElementById("readTime");

const sampleBtn = document.getElementById("sampleBtn");
const clearBtn = document.getElementById("clearBtn");
const downloadBtn = document.getElementById("downloadBtn");

const ABBREVIATIONS = [
  "mr", "mrs", "ms", "dr", "prof", "sr", "jr",
  "st", "ave", "rd", "col", "gen", "lt", "hon",
  "etc", "e.g", "i.e", "vs", "a.m", "p.m", "u.s", "u.k",
  "u.n", "c.i.a", "f.b.i", "jan", "feb", "mar", "apr", "jun",
  "jul", "aug", "sep", "sept", "oct", "nov", "dec", "dept", "fig"
];

// build a pattern for quick abbreviation detection
const abbrevSet = new Set(ABBREVIATIONS.map(a => a.toLowerCase()));

// utility: is char letter or number
function isAlphaNumeric(ch) {
  return /[0-9A-Za-z]/.test(ch);
}

function countSentences(text) {
  if (!text || !text.length) return { sentences: 0, sentencesArr: [] };

  let sentences = 0;
  const sentencesArr = [];

  // normalize line endings
  const normalized = text.replace(/\r\n?/g, "\n");

  // We'll scan char-by-char and build a current buffer
  let buf = "";
  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i];
    buf += ch;

    // handle ellipses quickly - don't treat '.' inside '...' as sentence end
    if (ch === ".") {
      if (normalized.substring(i, i + 3) === "..." ) {
        // consume the rest of ellipsis in buffer — it will be appended naturally
        continue;
      }
    }

    // If we find a sentence-terminating punctuation (., ?, !) consider rules
    if (ch === "." || ch === "!" || ch === "?") {
      // look ahead to next non-space char (to see if quotes or parentheses follow)
      let j = i + 1;
      while (j < normalized.length && /\s/.test(normalized[j])) j++;
      const nextChar = normalized[j] || "";

      // capture token before the punctuation (up to 20 chars back)
      const lookBehindStart = Math.max(0, i - 20);
      const tokenBefore = normalized.substring(lookBehindStart, i + 1).trim().toLowerCase();

      // 1) QUESTION/EXCLAMATION — count (most of the time)
      if (ch === "?" || ch === "!") {
        sentences++;
        sentencesArr.push(buf.trim());
        buf = "";
        continue;
      }

      // 2) DECIMAL CASE: digit . digit (e.g., 3.14)
      if (/\d\.\d/.test(normalized.substring(Math.max(0, i - 1), i + 2))) {
        continue; // part of number
      }

      // 3) DOMAIN / FILENAME: letters/digits . letters (openai.com)
      const priorChar = normalized[i - 1] || "";
      const afterChar = normalized[i + 1] || "";
      if (isAlphaNumeric(priorChar) && /[A-Za-z]/.test(afterChar)) {
        // but guard: if next char is space and next token is newline/uppercase we might still be sentence end
        // simple heuristic: if immediate next char after period is letter and not space, assume domain/extension => skip
        if (afterChar && !/\s/.test(afterChar)) {
          continue;
        }
      }

      // 4) ABBREVIATION: check last token(s) ending at the dot
      // extract the word immediately before the period
      const wordMatch = tokenBefore.match(/([A-Za-z\.]+)$/);
      if (wordMatch) {
        const word = wordMatch[1].replace(/\.+$/, ""); // strip trailing periods
        if (abbrevSet.has(word)) {
          continue; // skip counting for common abbreviations
        }
      }

      // 5) INITIALS: pattern "J. K. Rowling" or "J. K."
      // Look behind up to 6 characters to find patterns like "J." or "J. K."
      const beforeSlice = normalized.substring(Math.max(0, i - 6), i + 1);
      if (/([A-Za-z]\.)\s*([A-Za-z]\.)?$/i.test(beforeSlice)) {
        // looks like initials; skip.
        continue;
      }

      // 6) If next non-space char is lowercase (e.g., "e.g. this") it's likely not end of sentence.
      if (nextChar && /[a-z]/.test(nextChar)) {
        // but handle urgent case where next char is newline and then capitalized word — let heuristics handle that later
        continue;
      }

      // 7) Otherwise — count as sentence end
      sentences++;
      sentencesArr.push(buf.trim());
      buf = "";
    }
  }

  // if leftover buffer contains any alpha-numeric, count it as a sentence (short trailing fragment)
  if (buf.trim().length) {
    // Only count if it contains letters or digits (not just whitespace)
    if (/\w/.test(buf)) {
      sentences++;
      sentencesArr.push(buf.trim());
    }
  }

  return { sentences, sentencesArr };
}

/* words & paragraphs */
function countWords(text) {
  if (!text) return 0;
  // split by whitespace and filter out empty tokens
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.length;
}

function countParagraphs(text) {
  if (!text) return 0;
  // paragraphs separated by two or more newlines or a blank line
  const paras = text.trim().split(/\n{2,}/).filter(p => p.trim().length > 0);
  return paras.length;
}

/* reading time estimate (words per minute) */
function readingTimeMinutes(wordCount, wpm = 220) {
  if (!wordCount) return 0;
  return Math.max(1, Math.round(wordCount / wpm));
}

/* debounce utility to avoid excessive reflows while typing */
function debounce(fn, wait = 180) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

/* update UI */
function updateStats() {
  const text = textBox.value;
  const { sentences } = countSentences(text);
  const words = countWords(text);
  const paras = countParagraphs(text);
  const readMin = readingTimeMinutes(words);

  sentCountEl.textContent = sentences;
  wordCountEl.textContent = words;
  paraCountEl.textContent = paras;
  readTimeEl.textContent = `${readMin} min`;
}

/* wire events with debounce */
const debouncedUpdate = debounce(updateStats, 140);
textBox.addEventListener("input", debouncedUpdate);

/* buttons */
sampleBtn.addEventListener("click", () => {
  const sample = `Dr. Smith visited the U.S. office on Jan. 2. He said: "We should launch v2.0 soon..." 
This is a short paragraph. Here's a sentence with a decimal: 3.14 is pi.
Visit openai.com for more. J. K. Rowling wrote the series. Is this counted correctly? Yes!`;
  textBox.value = sample;
  updateStats();
  textBox.focus();
});

clearBtn.addEventListener("click", () => {
  textBox.value = "";
  updateStats();
  textBox.focus();
});

downloadBtn.addEventListener("click", () => {
  const text = textBox.value || "";
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "text.txt";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

/* initialize */
updateStats();
