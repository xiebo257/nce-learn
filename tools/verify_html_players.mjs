#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const targets = [
  ['NCE1', 'NCE1/html'],
  ['NCE2', 'NCE2/html'],
  ['NCE3', 'NCE3/html'],
  ['NCE4', 'NCE4/html'],
];

const failures = [];
let checked = 0;
const sharedPlayerPath = join('static', 'lesson-player.js');
const sharedPlayer = existsSync(sharedPlayerPath) ? readFileSync(sharedPlayerPath, 'utf8') : '';
const sharedPlayerScriptPattern = /<script src="\.\.\/\.\.\/static\/lesson-player\.js\?v=[^"]+"><\/script>/;
const sharedPlayerFallback = 'https://xiebo257.github.io/nce-learn/static/lesson-player.js';

function countMatches(text, pattern) {
  return [...text.matchAll(pattern)].length;
}

function hasRuleValue(text, selector, property, value) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rulePattern = new RegExp(`${escapedSelector}\\s*\\{[\\s\\S]*?${property}:\\s*${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*;[\\s\\S]*?\\}`);
  return rulePattern.test(text);
}

function expectedLessonHref(files, index) {
  return index >= 0 && index < files.length ? files[index] : null;
}

function hasSharedPlayerScript(html) {
  return sharedPlayerScriptPattern.test(html);
}

if (!sharedPlayer) {
  failures.push(`${sharedPlayerPath}: missing shared player script`);
} else {
  const requiredSharedPlayerSnippets = [
    'function setContinuousChecked(checked)',
    'function setLoopChecked(checked)',
    'if (checked) setLoopChecked(false);',
    'if (checked) setContinuousChecked(false);',
    'setContinuousChecked(false);',
  ];
  for (const snippet of requiredSharedPlayerSnippets) {
    if (!sharedPlayer.includes(snippet)) {
      failures.push(`${sharedPlayerPath}: missing mutually exclusive playback mode logic: ${snippet}`);
    }
  }
}

for (const [book, htmlDir] of targets) {
  const files = readdirSync(htmlDir).filter((file) => file.endsWith('.analysis.html')).sort();
  const previousHref = book === 'NCE3' ? '../../NCE1/html/index.html#nce3-lessons' : 'index.html';
  for (const file of files) {
    const htmlPath = join(htmlDir, file);
    const html = readFileSync(htmlPath, 'utf8');
    const cardCount = countMatches(html, /<article class="sentence-card"/g);
    const buttonCount = countMatches(html, /class="sentence-play"/g);
    const toggleCount = countMatches(html, /class="sentence-toggle"/g);
    const subtitleMatch = html.match(/const subtitles = (\[[\s\S]*?\]);/);
    const playerConfigMatch = html.match(/window\.NCE_LESSON_PLAYER\s*=\s*(\{[\s\S]*?\});/);
    let subtitleCount = 0;
    let playerConfig = null;

    if (subtitleMatch) {
      try {
        subtitleCount = JSON.parse(subtitleMatch[1]).length;
      } catch {
        failures.push(`${htmlPath}: subtitles JSON is not valid`);
      }
    }

    if (!playerConfigMatch) {
      failures.push(`${htmlPath}: missing window.NCE_LESSON_PLAYER config`);
    } else {
      try {
        playerConfig = Function(`"use strict"; return (${playerConfigMatch[1]});`)();
        subtitleCount = Array.isArray(playerConfig.subtitles) ? playerConfig.subtitles.length : subtitleCount;
      } catch {
        failures.push(`${htmlPath}: window.NCE_LESSON_PLAYER config is not valid JavaScript`);
      }
    }

    if (/\baudio\.load\(\)/.test(html)) {
      failures.push(`${htmlPath}: contains audio.load(), which can reset playback state`);
    }
    if (!html.includes('function whenAudioReady(callback)') && !hasSharedPlayerScript(html)) {
      failures.push(`${htmlPath}: missing whenAudioReady callback guard`);
    }
    if (!html.includes('whenAudioReady(() => {') && !hasSharedPlayerScript(html)) {
      failures.push(`${htmlPath}: playFrom does not wait for audio readiness before seeking`);
    }
    if (!html.includes('seekTo(item.start);') && !hasSharedPlayerScript(html)) {
      failures.push(`${htmlPath}: playFrom does not seek to the sentence start`);
    }
    if (!html.includes('audio.play().catch(() => {});') && !hasSharedPlayerScript(html)) {
      failures.push(`${htmlPath}: playFrom does not start existing audio after seeking`);
    }
    if (!html.includes('function toggleSentence(index)') && !hasSharedPlayerScript(html)) {
      failures.push(`${htmlPath}: missing per-sentence pause/resume toggle`);
    }
    if (!hasSharedPlayerScript(html)) {
      failures.push(`${htmlPath}: missing cache-busted shared lesson player script`);
    }
    if (!html.includes(sharedPlayerFallback) || !html.includes('if (!window.NCELessonPlayer)')) {
      failures.push(`${htmlPath}: missing shared lesson player fallback`);
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
    if (playerConfig) {
      const fileIndex = files.indexOf(file);
      const expectedPrevious = expectedLessonHref(files, fileIndex - 1);
      const expectedNext = expectedLessonHref(files, fileIndex + 1);
      if ((playerConfig.previousHref ?? null) !== expectedPrevious) {
        failures.push(`${htmlPath}: previousHref ${playerConfig.previousHref ?? null} != ${expectedPrevious}`);
      }
      if ((playerConfig.nextHref ?? null) !== expectedNext) {
        failures.push(`${htmlPath}: nextHref ${playerConfig.nextHref ?? null} != ${expectedNext}`);
      }
    }
    if (!hasRuleValue(html, '.sentence-head', 'grid-template-columns', '34px 34px 38px 1fr')) {
      failures.push(`${htmlPath}: desktop sentence header grid does not fit play, pause/resume, number, and text`);
    }
    if (!hasRuleValue(html, '.sentence-head', 'grid-template-columns', '30px 30px 30px 1fr')) {
      failures.push(`${htmlPath}: mobile sentence header grid does not fit play, pause/resume, number, and text`);
    }
    if (!html.includes('audio.pause();') && !hasSharedPlayerScript(html)) {
      failures.push(`${htmlPath}: pause/resume toggle does not pause existing playback`);
    }
    if (!html.includes('isTimeInSentence(item)') && !hasSharedPlayerScript(html)) {
      failures.push(`${htmlPath}: pause/resume toggle does not check the current sentence before resuming`);
    }
    if (!html.includes('<div class="audio-dock"')) {
      failures.push(`${htmlPath}: missing bottom audio dock`);
    }
    if (!html.includes('class="back-prev"')) {
      failures.push(`${htmlPath}: missing previous-page button`);
    }
    if (!html.includes(`class="back-prev" href="${previousHref}"`)) {
      failures.push(`${htmlPath}: previous-page fallback href is not ${previousHref}`);
    }
    if (!html.includes('function goPreviousPage(event)')) {
      failures.push(`${htmlPath}: missing previous-page history handler`);
    }
    if (!html.includes('const RETURN_KEY = "nceReturnTarget";')) {
      failures.push(`${htmlPath}: previous-page button does not read stored return target`);
    }
    if (!html.includes('const target = safeSessionGet(RETURN_KEY);')) {
      failures.push(`${htmlPath}: previous-page button does not prefer stored return target`);
    }
    if (!html.includes('window.location.href = target;')) {
      failures.push(`${htmlPath}: previous-page button does not navigate to the stored return URL`);
    }
    if (html.includes('window.history.length > 1')) {
      failures.push(`${htmlPath}: previous-page button still uses broad history.length detection`);
    }
    if (cardCount === 0) {
      failures.push(`${htmlPath}: has no sentence cards`);
    }
    if (buttonCount !== cardCount) {
      failures.push(`${htmlPath}: sentence play buttons ${buttonCount} != sentence cards ${cardCount}`);
    }
    if (toggleCount !== cardCount) {
      failures.push(`${htmlPath}: sentence pause/resume buttons ${toggleCount} != sentence cards ${cardCount}`);
    }
    if (subtitleCount !== cardCount) {
      failures.push(`${htmlPath}: subtitles ${subtitleCount} != sentence cards ${cardCount}`);
    }

    checked += 1;
  }

  if (book === 'NCE3' && files.length !== 60) {
    failures.push(`${htmlDir}: expected 60 NCE3 pages, found ${files.length}`);
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`Verified ${checked} HTML player pages.`);
