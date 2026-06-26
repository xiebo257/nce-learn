# Lesson Player Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add previous/next lesson navigation, continuous next-lesson autoplay, current-lesson loop, and playback speed controls to all generated lesson analysis pages.

**Architecture:** Move reusable player behavior into `static/lesson-player.js`, keep page-specific subtitles and lesson-order links in `window.NCE_LESSON_PLAYER`, and update all generators/updaters to emit the new markup and script references. Verification is expanded first so old pages fail before implementation.

**Tech Stack:** Static HTML, vanilla JavaScript, Node.js generation scripts, Node.js verification scripts.

---

## File Structure

- Create `static/lesson-player.js`: shared browser player behavior, state persistence, previous/next navigation, loop/continuous end handling, speed handling, sentence playback, and progress updates.
- Modify `tools/generate_nce1_1_20_html.mjs`: compute lesson-order links, emit enhanced dock markup, emit config object, and load shared script.
- Modify `tools/generate_nce2_html.mjs`: same as NCE1 for NCE2.
- Modify `tools/generate_nce4_html.mjs`: same as NCE1 for NCE4.
- Modify `tools/update_nce3_html_player.mjs`: patch existing NCE3 pages to same enhanced dock/config/shared script shape.
- Modify `tools/verify_html_players.mjs`: add failing checks for shared script, config, navigation controls, mode controls, speed controls, and lesson-order hrefs.
- Modify `tools/verify_nce1_player.mjs`: accept shared player implementation while preserving the no-`audio.load()` and readiness guard protections.
- Regenerate/update `NCE*/html/*.analysis.html`: committed static site artifacts.

### Task 1: Verification First

**Files:**
- Modify: `tools/verify_html_players.mjs`
- Modify: `tools/verify_nce1_player.mjs`

- [ ] **Step 1: Add failing shared-player checks to `tools/verify_html_players.mjs`**

Add checks inside the per-page loop for these strings and parsed config:

```js
const playerConfigMatch = html.match(/window\.NCE_LESSON_PLAYER\s*=\s*(\{[\s\S]*?\});/);
let playerConfig = null;
if (!playerConfigMatch) {
  failures.push(`${htmlPath}: missing window.NCE_LESSON_PLAYER config`);
} else {
  try {
    playerConfig = Function(`"use strict"; return (${playerConfigMatch[1]});`)();
  } catch {
    failures.push(`${htmlPath}: window.NCE_LESSON_PLAYER config is not valid JavaScript`);
  }
}

if (!html.includes('<script src="../../static/lesson-player.js"></script>')) {
  failures.push(`${htmlPath}: missing shared lesson player script`);
}
for (const required of [
  'id="dock-prev-lesson"',
  'id="dock-next-lesson"',
  'id="dock-continuous"',
  'id="dock-loop"',
  'id="dock-speed"',
]) {
  if (!html.includes(required)) failures.push(`${htmlPath}: missing player control ${required}`);
}
if (playerConfig && !Array.isArray(playerConfig.subtitles)) {
  failures.push(`${htmlPath}: player config subtitles is not an array`);
}
```

Add a helper before the loops to derive expected previous/next hrefs from the sorted file list:

```js
function expectedLessonHref(files, index) {
  return index >= 0 && index < files.length ? files[index] : null;
}
```

Inside the loop compare config hrefs:

```js
if (playerConfig) {
  const expectedPrevious = expectedLessonHref(files, files.indexOf(file) - 1);
  const expectedNext = expectedLessonHref(files, files.indexOf(file) + 1);
  if ((playerConfig.previousHref ?? null) !== expectedPrevious) {
    failures.push(`${htmlPath}: previousHref ${playerConfig.previousHref ?? null} != ${expectedPrevious}`);
  }
  if ((playerConfig.nextHref ?? null) !== expectedNext) {
    failures.push(`${htmlPath}: nextHref ${playerConfig.nextHref ?? null} != ${expectedNext}`);
  }
}
```

- [ ] **Step 2: Update `tools/verify_nce1_player.mjs` for shared script**

Keep the existing `audio.load()` rejection. Change readiness checks so they pass if the page loads `../../static/lesson-player.js` and the shared script contains `function whenAudioReady(callback)` and `seekTo(item.start);`.

- [ ] **Step 3: Run verification and confirm RED**

Run:

```bash
node tools/verify_html_players.mjs
```

Expected: FAIL with missing `window.NCE_LESSON_PLAYER`, missing shared script, and missing new controls on current pages.

### Task 2: Shared Player Runtime

**Files:**
- Create: `static/lesson-player.js`

- [ ] **Step 1: Implement shared player runtime**

Create `static/lesson-player.js` with an IIFE that:

```js
(() => {
  const config = window.NCE_LESSON_PLAYER || {};
  const subtitles = Array.isArray(config.subtitles) ? config.subtitles : [];
  const audio = document.getElementById("lesson-audio");
  const dockPlay = document.getElementById("dock-play");
  const previousButton = document.getElementById("dock-prev-lesson");
  const nextButton = document.getElementById("dock-next-lesson");
  const continuousInput = document.getElementById("dock-continuous");
  const loopInput = document.getElementById("dock-loop");
  const speedSelect = document.getElementById("dock-speed");
  const subtitleEl = document.getElementById("dock-subtitle");
  const currentEl = document.getElementById("dock-current");
  const durationEl = document.getElementById("dock-duration");
  const trackEl = document.getElementById("dock-track");
  const fillEl = document.getElementById("dock-fill");
  const sentenceCards = Array.from(document.querySelectorAll(".sentence-card"));
  const sentenceToggleButtons = Array.from(document.querySelectorAll(".sentence-toggle"));
  const STORAGE = {
    continuous: "ncePlayerContinuous",
    loop: "ncePlayerLoop",
    speed: "ncePlayerSpeed",
    autoplay: "ncePlayerAutoplayNext"
  };
  const SPEEDS = new Set(["0.75", "1", "1.25", "1.5", "2"]);

  if (!audio || !dockPlay) return;

  function safeLocalGet(key) { try { return window.localStorage.getItem(key); } catch { return null; } }
  function safeLocalSet(key, value) { try { window.localStorage.setItem(key, value); } catch {} }
  function safeSessionGet(key) { try { return window.sessionStorage.getItem(key); } catch { return null; } }
  function safeSessionSet(key, value) { try { window.sessionStorage.setItem(key, value); } catch {} }
  function safeSessionRemove(key) { try { window.sessionStorage.removeItem(key); } catch {} }
  function formatTime(value) { if (!Number.isFinite(value)) return "0:00"; const minutes = Math.floor(value / 60); const seconds = Math.floor(value % 60).toString().padStart(2, "0"); return minutes + ":" + seconds; }
  function activeSubtitle(time) { return subtitles.find((item) => time >= item.start && time < item.end) ?? subtitles[subtitles.length - 1]; }
  function setActiveSentence(item) { sentenceCards.forEach((card) => card.classList.toggle("is-active", card.id === "sentence-" + item?.index)); if (item && subtitleEl) subtitleEl.textContent = item.text; }
  function updateProgress(time) { const duration = audio.duration || subtitles[subtitles.length - 1]?.end || 0; if (currentEl) currentEl.textContent = formatTime(time); if (durationEl) durationEl.textContent = formatTime(duration); if (fillEl) fillEl.style.width = duration ? Math.min(100, (time / duration) * 100) + "%" : "0%"; const item = activeSubtitle(time); if (item) setActiveSentence(item); }
  function seekTo(time) { audio.currentTime = time; updateProgress(time); }
  function whenAudioReady(callback) { if (audio.readyState >= 2) { callback(); return; } let done = false; const runOnce = () => { if (done) return; done = true; callback(); }; audio.addEventListener("canplay", runOnce, { once: true }); audio.addEventListener("loadedmetadata", runOnce, { once: true }); }
  function playFrom(index) { const item = subtitles.find((entry) => entry.index === index); if (!item) return; setActiveSentence(item); whenAudioReady(() => { seekTo(item.start); audio.play().catch(() => {}); }); }
  function isTimeInSentence(item) { const time = audio.currentTime; return item && time >= item.start && time < item.end; }
  function refreshSentenceToggleButtons() { const current = activeSubtitle(audio.currentTime); sentenceToggleButtons.forEach((button) => { const isCurrent = current && Number(button.dataset.sentence) === current.index; const isPause = isCurrent && !audio.paused; button.textContent = isPause ? "Ⅱ" : "▶"; button.setAttribute("aria-label", (isPause ? "Pause" : "Resume") + " sentence " + button.dataset.sentence); }); }
  function toggleSentence(index) { const item = subtitles.find((entry) => entry.index === index); if (!item) return; if (!audio.paused && isTimeInSentence(item)) { audio.pause(); refreshSentenceToggleButtons(); return; } if (audio.paused && isTimeInSentence(item)) { setActiveSentence(item); audio.play().catch(() => {}); return; } setActiveSentence(item); whenAudioReady(() => { seekTo(item.start); audio.play().catch(() => {}); }); }
  function navigateToLesson(href, autoplay) { if (!href) return; if (autoplay) safeSessionSet(STORAGE.autoplay, "1"); window.location.href = href; }
  function applySpeed(value) { const normalized = SPEEDS.has(String(value)) ? String(value) : "1"; audio.playbackRate = Number(normalized); if (speedSelect) speedSelect.value = normalized; safeLocalSet(STORAGE.speed, normalized); }
  function initializeStoredControls() { if (continuousInput) continuousInput.checked = safeLocalGet(STORAGE.continuous) === "1"; if (loopInput) loopInput.checked = safeLocalGet(STORAGE.loop) === "1"; applySpeed(safeLocalGet(STORAGE.speed) || "1"); }
  function initializeLessonNavigation() { if (previousButton) { previousButton.disabled = !config.previousHref; previousButton.addEventListener("click", () => navigateToLesson(config.previousHref, false)); } if (nextButton) { nextButton.disabled = !config.nextHref; nextButton.addEventListener("click", () => navigateToLesson(config.nextHref, false)); } }
  function handleEnded() { refreshSentenceToggleButtons(); if (loopInput?.checked) { seekTo(0); audio.play().catch(() => {}); return; } if (continuousInput?.checked && config.nextHref) { navigateToLesson(config.nextHref, true); } }

  document.querySelectorAll(".sentence-play").forEach((button) => { button.addEventListener("click", () => playFrom(Number(button.dataset.sentence))); });
  sentenceToggleButtons.forEach((button) => { button.addEventListener("click", () => toggleSentence(Number(button.dataset.sentence))); });
  dockPlay.addEventListener("click", () => { if (audio.paused) audio.play(); else audio.pause(); });
  continuousInput?.addEventListener("change", () => safeLocalSet(STORAGE.continuous, continuousInput.checked ? "1" : "0"));
  loopInput?.addEventListener("change", () => safeLocalSet(STORAGE.loop, loopInput.checked ? "1" : "0"));
  speedSelect?.addEventListener("change", () => applySpeed(speedSelect.value));
  previousButton?.setAttribute("aria-label", "Previous lesson");
  nextButton?.setAttribute("aria-label", "Next lesson");
  audio.addEventListener("play", () => { dockPlay.textContent = "Ⅱ"; refreshSentenceToggleButtons(); });
  audio.addEventListener("pause", () => { dockPlay.textContent = "▶"; refreshSentenceToggleButtons(); });
  audio.addEventListener("loadedmetadata", () => { if (durationEl) durationEl.textContent = formatTime(audio.duration); });
  audio.addEventListener("timeupdate", () => { updateProgress(audio.currentTime); refreshSentenceToggleButtons(); });
  audio.addEventListener("ended", handleEnded);
  trackEl?.addEventListener("click", (event) => { const rect = trackEl.getBoundingClientRect(); const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)); const duration = audio.duration || subtitles[subtitles.length - 1]?.end || 0; audio.currentTime = ratio * duration; updateProgress(audio.currentTime); });

  initializeStoredControls();
  initializeLessonNavigation();
  if (safeSessionGet(STORAGE.autoplay) === "1") { safeSessionRemove(STORAGE.autoplay); whenAudioReady(() => { seekTo(0); audio.play().catch(() => {}); }); }
  window.NCELessonPlayer = { playFrom, toggleSentence, seekTo };
})();
```

- [ ] **Step 2: Run RED verification again**

Run:

```bash
node tools/verify_html_players.mjs
```

Expected: still FAIL because pages are not regenerated and controls/config are missing.

### Task 3: Generator Templates

**Files:**
- Modify: `tools/generate_nce1_1_20_html.mjs`
- Modify: `tools/generate_nce2_html.mjs`
- Modify: `tools/generate_nce4_html.mjs`
- Modify: `tools/update_nce3_html_player.mjs`

- [ ] **Step 1: Add lesson-order metadata**

For NCE1/NCE2/NCE4, change render functions to accept `previousHref` and `nextHref` or assign those fields before rendering. Use the sorted lesson list and each output filename.

For NCE3, derive sorted HTML filenames in `update_nce3_html_player.mjs` and pass previous/next hrefs to `playerMarkup`.

- [ ] **Step 2: Replace dock markup**

Emit controls in this shape:

```html
<div class="player-row">
  <button class="player-btn" type="button" id="dock-prev-lesson" aria-label="Previous lesson">‹</button>
  <button class="player-btn" type="button" id="dock-play" aria-label="Play or pause">▶</button>
  <button class="player-btn" type="button" id="dock-next-lesson" aria-label="Next lesson">›</button>
  <div class="progress-wrap">...</div>
  <div class="player-options" aria-label="Playback options">
    <label><input type="checkbox" id="dock-continuous"> 连续播放</label>
    <label><input type="checkbox" id="dock-loop"> 循环播放</label>
    <label>倍速 <select id="dock-speed">...</select></label>
  </div>
  <div class="dock-title">...</div>
</div>
```

Use option values `0.75`, `1`, `1.25`, `1.5`, `2` and labels `0.75x`, `1x`, `1.25x`, `1.5x`, `2x`.

- [ ] **Step 3: Replace inline player script**

Remove duplicated inline player behavior and emit:

```html
<script>
  window.NCE_LESSON_PLAYER = {
    subtitles: SUBTITLE_JSON,
    previousHref: PREVIOUS_JSON,
    nextHref: NEXT_JSON
  };
</script>
<script src="../../static/lesson-player.js"></script>
```

Keep the existing Back/history script on the page, either inline or adjacent to config.

- [ ] **Step 4: Update CSS for controls**

Adjust generated CSS to:

```css
.player-row { display: grid; grid-template-columns: auto auto auto minmax(160px, 1fr) auto auto; gap: 10px; align-items: center; }
.player-btn:disabled { opacity: 0.42; cursor: not-allowed; }
.player-options { display: flex; flex-wrap: wrap; gap: 8px 12px; align-items: center; color: #e5e7eb; font-size: 12px; }
.player-options label { display: inline-flex; align-items: center; gap: 4px; white-space: nowrap; }
.player-options select { border: 1px solid #475569; border-radius: 6px; background: #111827; color: #fff; padding: 3px 6px; }
@media (max-width: 760px) { body { padding-bottom: 176px; } .player-row { grid-template-columns: auto auto auto 1fr; } .player-options { grid-column: 1 / -1; } .dock-title { display: none; } }
```

- [ ] **Step 5: Run verification and confirm it still fails before regeneration**

Run:

```bash
node tools/verify_html_players.mjs
```

Expected: FAIL until generated HTML is refreshed.

### Task 4: Regenerate Static Pages

**Files:**
- Modify generated: `NCE1/html/*.analysis.html`
- Modify generated: `NCE2/html/*.analysis.html`
- Modify generated: `NCE3/html/*.analysis.html`
- Modify generated: `NCE4/html/*.analysis.html`

- [ ] **Step 1: Regenerate/update pages**

Run:

```bash
node tools/generate_nce1_1_20_html.mjs 1 144
node tools/generate_nce2_html.mjs
node tools/update_nce3_html_player.mjs
node tools/generate_nce4_html.mjs
```

- [ ] **Step 2: Run full verification**

Run:

```bash
node tools/verify_html_players.mjs
node tools/verify_nce1_player.mjs
node tools/verify_nce1_analysis_fields.mjs
```

Expected: all PASS.

### Task 5: Final Review

**Files:**
- Review all modified exact paths.

- [ ] **Step 1: Inspect git status**

Run:

```bash
git status --short
```

Expected: modified generators, verification scripts, generated HTML pages, and new `static/lesson-player.js`. No `.ipa-cache.json` or `.translation-cache.json` files staged.

- [ ] **Step 2: Inspect representative generated pages**

Check first/middle/last pages in at least NCE1 and NCE4 for expected config links and controls.

- [ ] **Step 3: Commit implementation**

Stage exact paths:

```bash
git add static/lesson-player.js tools/generate_nce1_1_20_html.mjs tools/generate_nce2_html.mjs tools/generate_nce4_html.mjs tools/update_nce3_html_player.mjs tools/verify_html_players.mjs tools/verify_nce1_player.mjs NCE1/html NCE2/html NCE3/html NCE4/html
```

Commit:

```bash
git commit -m "feat(player): add lesson navigation playback modes"
```
