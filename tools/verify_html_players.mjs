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

for (const [book, htmlDir] of targets) {
  const files = readdirSync(htmlDir).filter((file) => file.endsWith('.analysis.html')).sort();
  for (const file of files) {
    const htmlPath = join(htmlDir, file);
    const html = readFileSync(htmlPath, 'utf8');
    const cardCount = countMatches(html, /<article class="sentence-card"/g);
    const buttonCount = countMatches(html, /class="sentence-play"/g);
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
    if (!html.includes('<div class="audio-dock"')) {
      failures.push(`${htmlPath}: missing bottom audio dock`);
    }
    if (cardCount === 0) {
      failures.push(`${htmlPath}: has no sentence cards`);
    }
    if (buttonCount !== cardCount) {
      failures.push(`${htmlPath}: sentence play buttons ${buttonCount} != sentence cards ${cardCount}`);
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
