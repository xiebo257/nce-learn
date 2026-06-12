#!/usr/bin/env node
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const htmlDir = 'NCE1/html';
const files = readdirSync(htmlDir).filter((file) => file.endsWith('.analysis.html'));
const failures = [];

for (const file of files) {
  const path = join(htmlDir, file);
  const html = readFileSync(path, 'utf8');
  if (/\baudio\.load\(\)/.test(html)) {
    failures.push(`${path}: contains audio.load(), which can reset playback state`);
  }
  if (!html.includes('function whenAudioReady(callback)')) {
    failures.push(`${path}: missing whenAudioReady callback guard`);
  }
  if (!html.includes('whenAudioReady(() => {')) {
    failures.push(`${path}: playFrom does not wait for audio readiness before seeking`);
  }
  if (!html.includes('seekTo(item.start);')) {
    failures.push(`${path}: playFrom does not seek to the sentence start`);
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`Verified ${files.length} NCE1 player pages.`);
