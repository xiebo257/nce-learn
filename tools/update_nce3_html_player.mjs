#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const nce3Dir = path.join(root, 'NCE3');
const htmlDir = path.join(nce3Dir, 'html');

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function decodeHtml(value) {
  return String(value)
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'");
}

function stripTags(value) {
  return decodeHtml(String(value).replace(/<[^>]*>/g, ''))
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:?!])/g, '$1')
    .trim();
}

function normalizeText(value) {
  return stripTags(value)
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9]+/g, '');
}

function parseTime(minutes, seconds, hundredths) {
  return Number(minutes) * 60 + Number(seconds) + Number(hundredths) / 100;
}

function parseLrc(file) {
  return fs.readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .map((line) => {
      const match = line.match(/^\[(\d{2}):(\d{2})\.(\d{2})\](.*)$/);
      if (!match) return null;
      const text = match[4].trim();
      if (!text) return null;
      return {
        start: parseTime(match[1], match[2], match[3]),
        text,
        normalized: normalizeText(text),
      };
    })
    .filter(Boolean)
    .filter((entry) => entry.normalized);
}

function extractSentences(html) {
  const sentences = [];
  const cardPattern = /<article class="sentence-card" id="sentence-(\d+)"[^>]*>([\s\S]*?)<\/article>/g;
  let match;
  while ((match = cardPattern.exec(html))) {
    const head = match[2].match(/<p class="en-text">([\s\S]*?)<\/p>/);
    if (!head) continue;
    const text = stripTags(head[1]);
    sentences.push({
      index: Number(match[1]),
      text,
      normalized: normalizeText(head[1]),
    });
  }
  return sentences;
}

function buildLrcTimeline(entries) {
  let cursor = 0;
  return entries.map((entry, index) => {
    const startChar = cursor;
    cursor += entry.normalized.length;
    const next = entries[index + 1];
    return {
      ...entry,
      end: next?.start ?? entry.start + Math.max(2.5, entry.normalized.length / 13),
      startChar,
      endChar: cursor,
    };
  });
}

function timeAtChar(timeline, position) {
  if (!timeline.length) return 0;
  const segment = timeline.find((entry) => position >= entry.startChar && position <= entry.endChar)
    ?? timeline.find((entry) => position < entry.endChar)
    ?? timeline[timeline.length - 1];
  const span = Math.max(1, segment.endChar - segment.startChar);
  const ratio = Math.min(1, Math.max(0, (position - segment.startChar) / span));
  return segment.start + (segment.end - segment.start) * ratio;
}

function alignSubtitles(sentences, lrcEntries) {
  const timeline = buildLrcTimeline(lrcEntries);
  const lrcText = timeline.map((entry) => entry.normalized).join('');
  let cursor = 0;
  const positions = sentences.map((sentence) => {
    let found = lrcText.indexOf(sentence.normalized, cursor);
    if (found < 0) {
      found = lrcText.indexOf(sentence.normalized);
    }
    if (found < 0) {
      found = cursor;
    }
    cursor = Math.max(cursor, found + sentence.normalized.length);
    return {
      ...sentence,
      charStart: found,
      charEnd: found + sentence.normalized.length,
    };
  });

  return positions.map((sentence, index) => {
    const next = positions[index + 1];
    const rawStart = timeAtChar(timeline, sentence.charStart);
    const rawEnd = next ? timeAtChar(timeline, next.charStart) : timeAtChar(timeline, sentence.charEnd);
    const start = Math.max(0, rawStart);
    const end = Math.max(start + 0.5, rawEnd);
    return {
      index: sentence.index,
      start: Number(start.toFixed(2)),
      end: Number(end.toFixed(2)),
      text: sentence.text,
    };
  });
}

function addPlayerCss(html) {
  let next = html;
  next = next.replace(
    /body \{ margin: 0; (?!padding-bottom)/,
    'body { margin: 0; padding-bottom: 116px; ',
  );
  next = next.replace(
    '.sentence-head { display: grid; grid-template-columns: 38px 1fr; gap: 12px;',
    '.sentence-head { display: grid; grid-template-columns: 34px 34px 38px 1fr; gap: 12px;',
  );
  next = next.replace(
    '.sentence-head { display: grid; grid-template-columns: 34px 38px 1fr; gap: 12px;',
    '.sentence-head { display: grid; grid-template-columns: 34px 34px 38px 1fr; gap: 12px;',
  );
  if (!next.includes('.sentence-play {')) {
    next = next.replace(
      '    .sentence-head { display: grid; grid-template-columns: 34px 34px 38px 1fr; gap: 12px; align-items: start; margin-bottom: 12px; }\n',
      '    .sentence-head { display: grid; grid-template-columns: 34px 34px 38px 1fr; gap: 12px; align-items: start; margin-bottom: 12px; }\n'
        + '    .sentence-play, .sentence-toggle { display: inline-flex; width: 34px; height: 34px; align-items: center; justify-content: center; border: 0; border-radius: 50%; color: #fff; background: #0f766e; font-weight: 800; font-size: 13px; line-height: 1; cursor: pointer; box-shadow: 0 2px 8px rgba(15, 118, 110, 0.28); }\n'
        + '    .sentence-play:hover, .sentence-play:focus-visible { background: #115e59; outline: 3px solid rgba(15, 118, 110, 0.2); }\n'
        + '    .sentence-toggle { background: #2563eb; box-shadow: 0 2px 8px rgba(37, 99, 235, 0.24); }\n'
        + '    .sentence-toggle:hover, .sentence-toggle:focus-visible { background: #1d4ed8; outline: 3px solid rgba(37, 99, 235, 0.2); }\n'
        + '    .sentence-card.is-active { border-left-color: #0f766e; background: #f0fdfa; }\n',
    );
  }
  next = next.replace(
    '    .sentence-play { display: inline-flex;',
    '    .sentence-play, .sentence-toggle { display: inline-flex;',
  );
  if (!next.includes('.sentence-toggle { background: #2563eb;')) {
    next = next.replace(
      '    .sentence-play:hover, .sentence-play:focus-visible { background: #115e59; outline: 3px solid rgba(15, 118, 110, 0.2); }\n',
      '    .sentence-play:hover, .sentence-play:focus-visible { background: #115e59; outline: 3px solid rgba(15, 118, 110, 0.2); }\n'
        + '    .sentence-toggle { background: #2563eb; box-shadow: 0 2px 8px rgba(37, 99, 235, 0.24); }\n'
        + '    .sentence-toggle:hover, .sentence-toggle:focus-visible { background: #1d4ed8; outline: 3px solid rgba(37, 99, 235, 0.2); }\n',
    );
  }
  if (!next.includes('.audio-dock {')) {
    next = next.replace(
      '    .back-top { position: fixed; right: 16px; bottom: 16px; color: #fff; background: #111827; text-decoration: none; border-radius: 8px; padding: 8px 10px; font-size: 13px; box-shadow: 0 8px 20px rgba(15, 23, 42, 0.2); }\n',
      '    .back-top, .back-prev { position: fixed; right: 16px; bottom: 132px; z-index: 30; color: #fff; background: #111827; text-decoration: none; border-radius: 8px; padding: 8px 10px; font-size: 13px; box-shadow: 0 8px 20px rgba(15, 23, 42, 0.2); }\n'
        + '    .back-prev { bottom: 178px; }\n'
        + '    .audio-dock { position: fixed; left: 0; right: 0; bottom: 0; z-index: 20; border-top: 1px solid #1f2937; background: rgba(17, 24, 39, 0.96); color: #fff; box-shadow: 0 -10px 30px rgba(15, 23, 42, 0.25); backdrop-filter: blur(10px); }\n'
        + '    .audio-dock .inner { width: min(1080px, calc(100% - 24px)); margin: 0 auto; padding: 10px 0 12px; }\n'
        + '    .player-row { display: grid; grid-template-columns: auto 1fr auto; gap: 12px; align-items: center; }\n'
        + '    .player-btn { display: inline-flex; width: 40px; height: 40px; align-items: center; justify-content: center; border: 0; border-radius: 50%; color: #111827; background: #93c5fd; font-size: 15px; font-weight: 800; cursor: pointer; }\n'
        + '    .player-btn:hover, .player-btn:focus-visible { background: #bfdbfe; outline: 3px solid rgba(147, 197, 253, 0.28); }\n'
        + '    .progress-wrap { display: grid; gap: 5px; min-width: 0; }\n'
        + '    .subtitle-line { min-height: 22px; color: #f8fafc; font-size: 15px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n'
        + '    .progress-line { display: grid; grid-template-columns: auto 1fr auto; gap: 8px; align-items: center; color: #cbd5e1; font-size: 12px; }\n'
        + '    .progress-track { position: relative; height: 8px; overflow: hidden; border-radius: 999px; background: #334155; cursor: pointer; }\n'
        + '    .progress-fill { position: absolute; inset: 0 auto 0 0; width: 0%; border-radius: inherit; background: #22c55e; }\n'
        + '    .dock-title { color: #cbd5e1; font-size: 12px; white-space: nowrap; }\n',
    );
  }
  next = next.replace(
    '.back-top { position: fixed; right: 16px; bottom: 16px;',
    '.back-top, .back-prev { position: fixed; right: 16px; bottom: 132px; z-index: 30;',
  );
  next = next.replace(
    '.back-top { position: fixed; right: 16px; bottom: 132px; z-index: 30;',
    '.back-top, .back-prev { position: fixed; right: 16px; bottom: 132px; z-index: 30;',
  );
  if (!next.includes('.back-prev { bottom: 178px; }')) {
    next = next.replace(
      /(\.back-top, \.back-prev \{[^\n]*\}\n)/,
      '$1    .back-prev { bottom: 178px; }\n',
    );
  }
  next = next.replace(
    /@media \(max-width: 640px\) \{ \.page-header \.inner, main \{ width: min\(100% - 20px, 1080px\); \} \.sentence-card, \.summary-section \{ padding: 14px; \} \.sentence-head \{ grid-template-columns: 32px 1fr; gap: 10px; \} \.sentence-num \{ width: 30px; height: 30px; \} \.en-text \{ font-size: 16px; \} \.field \{ grid-template-columns: 1fr; gap: 2px; \} \.back-top \{ display: none; \} \}/,
    '@media (max-width: 640px) { body { padding-bottom: 132px; } .page-header .inner, main { width: min(100% - 20px, 1080px); } .sentence-card, .summary-section { padding: 14px; } .sentence-head { grid-template-columns: 30px 30px 30px 1fr; gap: 8px; } .sentence-play, .sentence-toggle, .sentence-num { width: 30px; height: 30px; } .en-text { font-size: 16px; } .field { grid-template-columns: 1fr; gap: 2px; } .back-top, .back-prev { right: 10px; bottom: 140px; min-width: 40px; min-height: 40px; display: inline-flex; align-items: center; justify-content: center; padding: 8px; } .back-prev { bottom: 186px; } .player-row { grid-template-columns: auto 1fr; } .dock-title { display: none; } .subtitle-line { white-space: normal; line-height: 1.3; } }',
  );
  next = next.replace(
    '.sentence-head { grid-template-columns: 30px 30px 1fr; gap: 8px; } .sentence-play, .sentence-num { width: 30px; height: 30px; }',
    '.sentence-head { grid-template-columns: 30px 30px 30px 1fr; gap: 8px; } .sentence-play, .sentence-toggle, .sentence-num { width: 30px; height: 30px; }',
  );
  next = next.replace(
    '.back-top { display: none; }',
    '.back-top, .back-prev { right: 10px; bottom: 140px; min-width: 40px; min-height: 40px; display: inline-flex; align-items: center; justify-content: center; padding: 8px; } .back-prev { bottom: 186px; }',
  );
  next = next.replace(
    '.back-top { right: 10px; bottom: 140px; min-width: 40px; min-height: 40px; display: inline-flex; align-items: center; justify-content: center; padding: 8px; }',
    '.back-top, .back-prev { right: 10px; bottom: 140px; min-width: 40px; min-height: 40px; display: inline-flex; align-items: center; justify-content: center; padding: 8px; } .back-prev { bottom: 186px; }',
  );
  next = next.replace(
    'body { margin: 0; padding-bottom: 116px;',
    'body { margin: 0; padding-bottom: 156px;',
  );
  next = next.replace(
    '.player-row { display: grid; grid-template-columns: auto 1fr auto; gap: 12px; align-items: center; }',
    '.player-row { display: grid; grid-template-columns: auto auto auto minmax(160px, 1fr) auto auto; gap: 10px; align-items: center; }',
  );
  if (!next.includes('.player-options {')) {
    next = next.replace(
      '    .player-btn:hover, .player-btn:focus-visible { background: #bfdbfe; outline: 3px solid rgba(147, 197, 253, 0.28); }\n',
      '    .player-btn:hover, .player-btn:focus-visible { background: #bfdbfe; outline: 3px solid rgba(147, 197, 253, 0.28); }\n'
        + '    .player-btn:disabled { opacity: 0.42; cursor: not-allowed; }\n'
        + '    .player-options { display: flex; flex-wrap: wrap; gap: 8px 12px; align-items: center; color: #e5e7eb; font-size: 12px; }\n'
        + '    .player-options label { display: inline-flex; align-items: center; gap: 4px; white-space: nowrap; }\n'
        + '    .player-options select { border: 1px solid #475569; border-radius: 6px; background: #111827; color: #fff; padding: 3px 6px; }\n',
    );
  }
  next = next.replace(
    '@media (max-width: 640px) { body { padding-bottom: 132px; }',
    '@media (max-width: 760px) { body { padding-bottom: 176px; }',
  );
  next = next.replace(
    '.back-top, .back-prev { right: 10px; bottom: 140px;',
    '.back-top, .back-prev { right: 10px; bottom: 184px;',
  );
  next = next.replace('.back-prev { bottom: 186px; }', '.back-prev { bottom: 230px; }');
  next = next.replace(
    '.player-row { grid-template-columns: auto 1fr; }',
    '.player-row { grid-template-columns: auto auto auto 1fr; } .player-options { grid-column: 1 / -1; }',
  );
  return next;
}

function addSentenceButtons(html, subtitles) {
  let next = html;
  for (const item of subtitles) {
    const articlePattern = new RegExp(`<article class="sentence-card" id="sentence-${item.index}"(?: data-start="[^"]*" data-end="[^"]*")?>`);
    next = next.replace(
      articlePattern,
      `<article class="sentence-card" id="sentence-${item.index}" data-start="${item.start}" data-end="${item.end}">`,
    );
    next = next.replace(
      new RegExp(`<div class="sentence-head">(?!<button class="sentence-play"[^>]*data-sentence="${item.index}")<span class="sentence-num">${item.index}</span>`),
      `<div class="sentence-head"><button class="sentence-play" type="button" data-sentence="${item.index}" aria-label="Play sentence ${item.index}">▶</button><button class="sentence-toggle" type="button" data-sentence="${item.index}" aria-label="Pause or resume sentence ${item.index}">Ⅱ</button><span class="sentence-num">${item.index}</span>`,
    );
    next = next.replace(
      new RegExp(`(<button class="sentence-play" type="button" data-sentence="${item.index}" aria-label="Play sentence ${item.index}">▶<\\/button>)(?!<button class="sentence-toggle")`),
      `$1<button class="sentence-toggle" type="button" data-sentence="${item.index}" aria-label="Pause or resume sentence ${item.index}">Ⅱ</button>`,
    );
  }
  return next;
}

function playerMarkup(title, audioSrc, subtitles, previousHref, nextHref) {
  return `  <div class="audio-dock" role="region" aria-label="Lesson audio player">
    <div class="inner">
      <div class="player-row">
        <button class="player-btn" type="button" id="dock-prev-lesson" aria-label="Previous lesson">‹</button>
        <button class="player-btn" type="button" id="dock-play" aria-label="Play or pause">▶</button>
        <button class="player-btn" type="button" id="dock-next-lesson" aria-label="Next lesson">›</button>
        <div class="progress-wrap">
          <div class="subtitle-line" id="dock-subtitle">点击句子开头的播放按钮，从当前句开始播放。</div>
          <div class="progress-line">
            <span id="dock-current">0:00</span>
            <div class="progress-track" id="dock-track"><div class="progress-fill" id="dock-fill"></div></div>
            <span id="dock-duration">0:00</span>
          </div>
        </div>
        <div class="player-options" aria-label="Playback options">
          <label><input type="checkbox" id="dock-continuous"> 连续播放</label>
          <label><input type="checkbox" id="dock-loop"> 循环播放</label>
          <label>倍速 <select id="dock-speed"><option value="0.75">0.75x</option><option value="1">1x</option><option value="1.25">1.25x</option><option value="1.5">1.5x</option><option value="2">2x</option></select></label>
        </div>
        <div class="dock-title">${escapeHtml(title)}</div>
      </div>
      <audio id="lesson-audio" preload="auto" src="${escapeHtml(audioSrc)}"></audio>
    </div>
  </div>
  <script>
    const RETURN_KEY = "nceReturnTarget";

    function safeSessionGet(key) {
      try {
        return window.sessionStorage.getItem(key);
      } catch {
        return null;
      }
    }

    function safeSessionRemove(key) {
      try {
        window.sessionStorage.removeItem(key);
      } catch {}
    }

    function goPreviousPage(event) {
      const target = safeSessionGet(RETURN_KEY);
      if (target) {
        event.preventDefault();
        safeSessionRemove(RETURN_KEY);
        window.location.href = target;
        return;
      }
      if (document.referrer && new URL(document.referrer).origin === window.location.origin) {
        event.preventDefault();
        window.history.back();
      }
    }

    window.NCE_LESSON_PLAYER = {
      subtitles: ${JSON.stringify(subtitles)},
      previousHref: ${JSON.stringify(previousHref)},
      nextHref: ${JSON.stringify(nextHref)}
    };
  </script>
  <script src="../../static/lesson-player.js"></script>`;
}

function removeExistingPlayer(html) {
  return html
    .replace(/\n  <div class="audio-dock"[\s\S]*?\n  <script>[\s\S]*?\n  <\/script>(?=\n<\/body>)/, '')
    .replace(/\n  <script>\n    const subtitles = [\s\S]*?\n  <\/script>(?=\n<\/body>)/, '');
}

let changed = 0;
const failures = [];
const files = fs.readdirSync(htmlDir)
  .filter((name) => name.endsWith('.analysis.html'))
  .sort();

for (const file of files) {
  const htmlPath = path.join(htmlDir, file);
  const baseName = file.replace(/\.analysis\.html$/, '');
  const lrcPath = path.join(nce3Dir, `${baseName}.lrc`);
  const audioPath = path.join(nce3Dir, `${baseName}.mp3`);
  if (!fs.existsSync(lrcPath) || !fs.existsSync(audioPath)) {
    failures.push(`${file}: missing matching lrc or mp3`);
    continue;
  }

  const html = fs.readFileSync(htmlPath, 'utf8');
  const sentences = extractSentences(html);
  const lrcEntries = parseLrc(lrcPath);
  const subtitles = alignSubtitles(sentences, lrcEntries);
  if (subtitles.length !== sentences.length || subtitles.some((item) => !Number.isFinite(item.start))) {
    failures.push(`${file}: failed to align ${sentences.length} sentences`);
    continue;
  }

  const title = stripTags(html.match(/<h1>([\s\S]*?)<\/h1>/)?.[1] ?? baseName);
  const fileIndex = files.indexOf(file);
  const previousHref = files[fileIndex - 1] ?? null;
  const nextHref = files[fileIndex + 1] ?? null;
  let next = removeExistingPlayer(html);
  next = addPlayerCss(next);
  next = addSentenceButtons(next, subtitles);
  next = next.replace(
    /  <a class="back-top" href="#top">([\s\S]*?)<\/a>\n<\/body>/,
    `  <a class="back-prev" href="../../NCE1/html/index.html#nce3-lessons" onclick="goPreviousPage(event)" aria-label="Return to previous page">Back</a>\n  <a class="back-top" href="#top">$1</a>\n${playerMarkup(title, `../${baseName}.mp3`, subtitles, previousHref, nextHref)}\n</body>`,
  );

  if (next !== html) {
    fs.writeFileSync(htmlPath, next);
    changed += 1;
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`updated ${changed} NCE3 HTML player pages`);
