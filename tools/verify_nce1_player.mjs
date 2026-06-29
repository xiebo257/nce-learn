#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const htmlDir = 'NCE1/html';
const files = readdirSync(htmlDir).filter((file) => file.endsWith('.analysis.html'));
const failures = [];
const sharedPlayerPath = join('static', 'lesson-player.js');
const sharedPlayer = existsSync(sharedPlayerPath) ? readFileSync(sharedPlayerPath, 'utf8') : '';
const sharedPlayerPattern = /<script src="\.\.\/\.\.\/static\/lesson-player\.js\?v=[^"]+"><\/script>/;

for (const file of files) {
  const path = join(htmlDir, file);
  const html = readFileSync(path, 'utf8');
  const usesSharedPlayer = sharedPlayerPattern.test(html);
  const playerSource = usesSharedPlayer ? sharedPlayer : html;
  if (/\baudio\.load\(\)/.test(html)) {
    failures.push(`${path}: contains audio.load(), which can reset playback state`);
  }
  if (usesSharedPlayer && !sharedPlayer) {
    failures.push(`${path}: references missing shared player script`);
  }
  if (!playerSource.includes('function whenAudioReady(callback)')) {
    failures.push(`${path}: missing whenAudioReady callback guard`);
  }
  if (!playerSource.includes('whenAudioReady(() => {')) {
    failures.push(`${path}: playFrom does not wait for audio readiness before seeking`);
  }
  if (!playerSource.includes('seekTo(item.start);')) {
    failures.push(`${path}: playFrom does not seek to the sentence start`);
  }
  const audioMatch = html.match(/<audio id="lesson-audio"[^>]*src="([^"]+)"[^>]*data-fallback-src="([^"]+)"/);
  if (!audioMatch) {
    failures.push(`${path}: missing American-pronunciation audio source with fallback`);
  } else {
    const [, audioSrc, fallbackSrc] = audioMatch;
    if (!audioSrc.startsWith('../american-audio/')) {
      failures.push(`${path}: audio source ${audioSrc} does not prefer American pronunciation audio`);
    }
    if (!fallbackSrc.startsWith('../') || fallbackSrc.startsWith('../american-audio/')) {
      failures.push(`${path}: fallback audio source ${fallbackSrc} does not use the original local audio`);
    }
    if (audioSrc.replace('../american-audio/', '') !== fallbackSrc.replace('../', '')) {
      failures.push(`${path}: American audio and fallback audio filenames do not match`);
    }
  }
  if (!playerSource.includes('fallbackSrc') || !playerSource.includes('audio.addEventListener("error"')) {
    failures.push(`${path}: shared player does not fall back when American audio is unavailable`);
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`Verified ${files.length} NCE1 player pages.`);
