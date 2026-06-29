import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const sharedPlayerPath = join('static', 'lesson-player.js');
const sharedPlayer = existsSync(sharedPlayerPath) ? readFileSync(sharedPlayerPath, 'utf8') : '';
const sharedPlayerPattern = /<script src="\.\.\/\.\.\/static\/lesson-player\.js\?v=[^"]+"><\/script>/;
const sharedPlayerFallback = 'https://xiebo257.github.io/nce-learn/static/lesson-player.js';

export function verifyBookPlayer({ book, htmlDir, expectedCount = null }) {
  const files = readdirSync(htmlDir).filter((file) => file.endsWith('.analysis.html')).sort();
  const failures = [];

  if (expectedCount !== null && files.length !== expectedCount) {
    failures.push(`${htmlDir}: expected ${expectedCount} ${book} pages, found ${files.length}`);
  }

  for (const file of files) {
    const path = join(htmlDir, file);
    const html = readFileSync(path, 'utf8');
    const usesSharedPlayer = sharedPlayerPattern.test(html);
    const playerSource = usesSharedPlayer ? sharedPlayer : html;

    if (/\baudio\.load\(\)/.test(html)) {
      failures.push(`${path}: contains audio.load(), which can reset playback state`);
    }
    if (!usesSharedPlayer) {
      failures.push(`${path}: missing cache-busted shared lesson player script`);
    }
    if (usesSharedPlayer && !sharedPlayer) {
      failures.push(`${path}: references missing shared player script`);
    }
    if (!html.includes(sharedPlayerFallback) || !html.includes('if (!window.NCELessonPlayer)')) {
      failures.push(`${path}: missing shared lesson player fallback`);
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
    if (!playerSource.includes('function setContinuousChecked(checked)')) {
      failures.push(`${path}: missing continuous playback mode setter`);
    }
    if (!playerSource.includes('function setLoopChecked(checked)')) {
      failures.push(`${path}: missing loop playback mode setter`);
    }
    if (!playerSource.includes('if (checked) setLoopChecked(false);')) {
      failures.push(`${path}: continuous playback does not turn off loop playback`);
    }
    if (!playerSource.includes('if (checked) setContinuousChecked(false);')) {
      failures.push(`${path}: loop playback does not turn off continuous playback`);
    }

    for (const required of [
      'id="dock-prev-lesson"',
      'id="dock-next-lesson"',
      'id="dock-continuous"',
      'id="dock-loop"',
      'id="dock-speed"',
    ]) {
      if (!html.includes(required)) failures.push(`${path}: missing player control ${required}`);
    }
  }

  if (failures.length) {
    console.error(failures.join('\n'));
    process.exit(1);
  }

  console.log(`Verified ${files.length} ${book} player pages.`);
}
