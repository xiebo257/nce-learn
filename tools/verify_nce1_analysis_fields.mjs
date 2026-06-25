import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const htmlDir = path.join(root, 'NCE1', 'html');

const files = fs.readdirSync(htmlDir)
  .filter((name) => name.endsWith('.analysis.html'))
  .sort();

if (files.length === 0) {
  throw new Error('No NCE1 analysis HTML files found.');
}

function stripTags(value) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function wordKeys(value) {
  return Array.from(value.matchAll(/[A-Za-z]+(?:[-'][A-Za-z]+)*/g), (match) => {
    const raw = match[0].toLowerCase();
    if (raw.includes('-')) {
      return raw.split('-').filter(Boolean);
    }
    return [raw];
  }).flat();
}

const failures = [];

for (const file of files) {
  const html = fs.readFileSync(path.join(htmlDir, file), 'utf8');
  const cards = html.match(/<article class="sentence-card"[\s\S]*?<\/article>/g) ?? [];
  if (cards.length === 0) failures.push(`${file}: no sentence cards found`);

  cards.forEach((card, index) => {
    const label = `${file}#${index + 1}`;
    const en = stripTags(card.match(/<p class="en-text">([\s\S]*?)<\/p>/)?.[1] ?? '');
    const words = stripTags(card.match(/<div class="field words">[\s\S]*?<p>([\s\S]*?)<\/p>/)?.[1] ?? '');
    const structure = stripTags(card.match(/<div class="field structure">[\s\S]*?<p>([\s\S]*?)<\/p>/)?.[1] ?? '');
    const pattern = stripTags(card.match(/<div class="field pattern">[\s\S]*?<p>([\s\S]*?)<\/p>/)?.[1] ?? '');
    const components = stripTags(card.match(/<div class="field components">[\s\S]*?<p>([\s\S]*?)<\/p>/)?.[1] ?? '');

    if (!pattern.includes('五大句型')) failures.push(`${label}: missing 五大句型 in 句型`);
    if (!/[主谓宾系表]/.test(components)) failures.push(`${label}: missing grammar component labels`);
    if (!structure.includes('句型:') || !structure.includes('成分:')) failures.push(`${label}: structure must summarize 句型 and 成分`);

    for (const key of wordKeys(en)) {
      if (!words.toLowerCase().includes(key)) {
        failures.push(`${label}: word list missing "${key}" from "${en}"`);
      }
    }
  });
}

if (failures.length > 0) {
  console.error(failures.slice(0, 60).join('\n'));
  if (failures.length > 60) console.error(`...and ${failures.length - 60} more`);
  process.exit(1);
}

console.log(`Verified ${files.length} NCE1 analysis HTML files.`);
