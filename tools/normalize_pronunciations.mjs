import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const targets = [
  ...fs.readdirSync(path.join(root, 'NCE3'))
    .filter((name) => name.endsWith('.analysis.md'))
    .map((name) => path.join(root, 'NCE3', name)),
  ...fs.readdirSync(path.join(root, 'NCE3', 'html'))
    .filter((name) => name.endsWith('.analysis.html'))
    .map((name) => path.join(root, 'NCE3', 'html', name)),
];

const replacements = [
  // macOS Dictionary AmE base forms, with learner-friendly connected-speech IPA kept.
  [/əˈmɛrɪkə/g, 'əˈmɛrəkə'],
  [/əˈmɛrɪkən/g, 'əˈmɛrəkən'],
  [/ˈɛvriˌbɑdi/g, 'ˈɛvribədi'],
  [/ˈrɪli/g, 'ˈriəli'],
  [/ˈfeɪvərɪt/g, 'ˈfeɪvərət'],
  [/ˈfeɪvərɪts/g, 'ˈfeɪvərəts'],
  [/ˈfeɪvərəbli/g, 'ˈfeɪvərəbli'],
  [/kɑzˈmɛtɪks/g, 'kɑzˈmɛdɪks'],
  [/kɑzˈmɛtɪk/g, 'kɑzˈmɛdɪk'],
  [/ˈbɑtəlz/g, 'ˈbɑɾəlz'],
  [/ˈbɑtəl/g, 'ˈbɑɾəl'],
  [/ˈvɪzɪtɪd/g, 'ˈvɪzɪɾɪd'],
  [/ˈnoʊɾɪsɪŋ/g, 'ˈnoʊɾəsɪŋ'],
  [/ˈnoʊɾɪst/g, 'ˈnoʊɾəst'],
  [/ˈnoʊɾɪs/g, 'ˈnoʊɾəs'],
  [/ˈheɪɾɪd/g, 'ˈheɪɾəd'],
  [/ˈhɑspɪɾəlz/g, 'ˈhɑˌspɪɾəlz'],
  [/ˈhɑspɪɾəl/g, 'ˈhɑˌspɪɾəl'],
  [/kɑzˈmɛɾɪks/g, 'kɑzˈmɛdɪks'],
  [/kɑzˈmɛɾɪk/g, 'kɑzˈmɛdɪk'],
  [/ˈfɔrti/g, 'ˈfɔrdi'],
  [/ˈhjumɚdli/g, 'ˈhjumərdli'],
  [/ɡʊd ˈhjumərdli/g, 'ˈɡʊdˌhjumərdli'],
  [/ɡʊd ˈhjumɚdli/g, 'ˈɡʊdˌhjumərdli'],
  [/ʌnˈsɛtlɪŋ/g, 'ənˈsɛɾəlɪŋ'],
  [/ənˈsɛtlɪŋ/g, 'ənˈsɛɾəlɪŋ'],
  [/ˈvɝɾɪkəli/g, 'ˈvɝtɪkəli'],
  [/ˈprɪməɾɪv/g, 'ˈprɪmədɪv'],
  [/bækˈtɪriə/g, 'bækˈtɪriə'],
  [/ˌrɛɡjəˈlærəti/g, 'ˌrɛɡjəˈlɛrədi'],
  [/məˈnɑtənəs/g, 'məˈnɑtənəs'],
  [/məˈnɑtəni/g, 'məˈnɑtəni'],
];

function normalizeHtml(content) {
  let next = content;

  // Keep the pronunciation slash outside highlight spans.
  next = next.replace(/<span class="([^"]+)">\/([^<]+)<\/span>/g, '/<span class="$1">$2</span>');
  next = next.replace(/<span class="([^"]+)">([^<]+)\/<\/span>/g, '<span class="$1">$2</span>/');

  if (!next.includes('.pron-note')) {
    next = next.replace(
      '    .toc { display: flex;',
      '    .pron-note { margin: 0 0 18px; padding: 12px 14px; background: #f8fafc; border: 1px solid #dbeafe; border-left: 4px solid #0f766e; border-radius: 8px; color: #334155; font-size: 14px; }\n    .pron-note strong { color: #0f766e; }\n    .toc { display: flex;',
    );
  }

  if (!next.includes('class="pron-note"')) {
    next = next.replace(
      '  <main>\n',
      '  <main>\n    <p class="pron-note"><strong>发音说明:</strong> 美音发音以 macOS Dictionary 的 AmE 单词读音为基础，并保留句子里的 connected speech：连读、弱读和美式闪音。</p>\n',
    );
  }

  return next;
}

let changed = 0;

for (const file of targets) {
  let content = fs.readFileSync(file, 'utf8');
  let next = content;

  for (const [from, to] of replacements) {
    next = next.replace(from, to);
  }

  if (file.endsWith('.html')) {
    next = normalizeHtml(next);
  }

  if (next !== content) {
    fs.writeFileSync(file, next);
    changed += 1;
  }
}

console.log(`normalized ${changed} files`);
