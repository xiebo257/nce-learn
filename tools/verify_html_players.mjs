#!/usr/bin/env node
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const targets = [
  ['NCE1', 'NCE1/html'],
  ['NCE2', 'NCE2/html'],
  ['NCE3', 'NCE3/html'],
  ['NCE4', 'NCE4/html'],
];

const failures = [];
let checked = 0;

function countMatches(text, pattern) {
  return [...text.matchAll(pattern)].length;
}

function hasRuleValue(text, selector, property, value) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rulePattern = new RegExp(`${escapedSelector}\\s*\\{[\\s\\S]*?${property}:\\s*${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*;[\\s\\S]*?\\}`);
  return rulePattern.test(text);
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
    let subtitleCount = 0;

    if (subtitleMatch) {
      try {
        subtitleCount = JSON.parse(subtitleMatch[1]).length;
      } catch {
        failures.push(`${htmlPath}: subtitles JSON is not valid`);
      }
    }

    if (/\baudio\.load\(\)/.test(html)) {
      failures.push(`${htmlPath}: contains audio.load(), which can reset playback state`);
    }
    if (!html.includes('function whenAudioReady(callback)')) {
      failures.push(`${htmlPath}: missing whenAudioReady callback guard`);
    }
    if (!html.includes('whenAudioReady(() => {')) {
      failures.push(`${htmlPath}: playFrom does not wait for audio readiness before seeking`);
    }
    if (!html.includes('seekTo(item.start);')) {
      failures.push(`${htmlPath}: playFrom does not seek to the sentence start`);
    }
    if (!html.includes('audio.play().catch(() => {});')) {
      failures.push(`${htmlPath}: playFrom does not start existing audio after seeking`);
    }
    if (!html.includes('function toggleSentence(index)')) {
      failures.push(`${htmlPath}: missing per-sentence pause/resume toggle`);
    }
    if (!hasRuleValue(html, '.sentence-head', 'grid-template-columns', '34px 34px 38px 1fr')) {
      failures.push(`${htmlPath}: desktop sentence header grid does not fit play, pause/resume, number, and text`);
    }
    if (!hasRuleValue(html, '.sentence-head', 'grid-template-columns', '30px 30px 30px 1fr')) {
      failures.push(`${htmlPath}: mobile sentence header grid does not fit play, pause/resume, number, and text`);
    }
    if (!html.includes('audio.pause();')) {
      failures.push(`${htmlPath}: pause/resume toggle does not pause existing playback`);
    }
    if (!html.includes('isTimeInSentence(item)')) {
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
    if (!html.includes('window.history.back();')) {
      failures.push(`${htmlPath}: previous-page button does not use browser history`);
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
