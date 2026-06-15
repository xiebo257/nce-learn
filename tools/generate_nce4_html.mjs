#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const srcDir = path.join(root, 'NCE4');
const outDir = path.join(srcDir, 'html');
const translationCacheFile = path.join(outDir, '.translation-cache.json');
const ipaCacheFile = path.join(outDir, '.ipa-cache.json');

const startLesson = Number(process.argv[2] ?? 1);
const endLesson = Number(process.argv[3] ?? 48);

fs.mkdirSync(outDir, { recursive: true });

const translationCache = fs.existsSync(translationCacheFile)
  ? JSON.parse(fs.readFileSync(translationCacheFile, 'utf8'))
  : {};
const ipaCache = fs.existsSync(ipaCacheFile)
  ? JSON.parse(fs.readFileSync(ipaCacheFile, 'utf8'))
  : {};

const weakForms = new Set([
  'a', 'an', 'and', 'are', 'am', 'as', 'at', 'be', 'been', 'but', 'can', 'could',
  'do', 'does', 'for', 'from', 'had', 'has', 'have', 'he', 'her', 'him', 'his',
  'i', 'in', 'is', 'it', 'me', 'my', 'of', 'our', 'she', 'that', 'the', 'their',
  'them', 'there', 'they', 'to', 'was', 'we', 'were', 'will', 'would', 'you', 'your',
]);

const baseIpa = new Map(Object.entries({
  a: 'ə',
  an: 'ən',
  and: 'ən',
  are: 'ɑr',
  as: 'əz',
  at: 'ət',
  be: 'bi',
  been: 'bɪn',
  but: 'bət',
  can: 'kən',
  "can't": 'kænt',
  could: 'kəd',
  "couldn't": 'ˈkʊdənt',
  did: 'dɪd',
  "didn't": 'ˈdɪdənt',
  do: 'du',
  does: 'dəz',
  "doesn't": 'ˈdʌzənt',
  "don't": 'doʊnt',
  for: 'fɚ',
  from: 'frəm',
  had: 'həd',
  "hadn't": 'ˈhædənt',
  has: 'həz',
  "hasn't": 'ˈhæzənt',
  have: 'həv',
  "haven't": 'ˈhævənt',
  he: 'hi',
  her: 'hɚ',
  him: 'hɪm',
  his: 'hɪz',
  i: 'aɪ',
  "i'm": 'aɪm',
  in: 'ɪn',
  is: 'ɪz',
  "isn't": 'ˈɪzənt',
  it: 'ɪt',
  "it's": 'ɪts',
  me: 'mi',
  my: 'maɪ',
  of: 'əv',
  our: 'aʊɚ',
  she: 'ʃi',
  that: 'ðæt',
  "that's": 'ðæts',
  the: 'ðə',
  their: 'ðɛr',
  them: 'ðəm',
  there: 'ðɛr',
  "there's": 'ðɛrz',
  they: 'ðeɪ',
  this: 'ðɪs',
  to: 'tə',
  was: 'wəz',
  "wasn't": 'ˈwɑzənt',
  we: 'wi',
  were: 'wɚ',
  "weren't": 'wɝnt',
  will: 'wɪl',
  "won't": 'woʊnt',
  would: 'wəd',
  "wouldn't": 'ˈwʊdənt',
  you: 'ju',
  "you're": 'jʊr',
  your: 'jɚ',
  actor: 'ˈæktɚ',
  actors: 'ˈæktɚz',
  again: 'əˈɡɛn',
  angry: 'ˈæŋɡri',
  angrily: 'ˈæŋɡrəli',
  attention: 'əˈtɛnʃən',
  bear: 'bɛr',
  behind: 'bɪˈhaɪnd',
  business: 'ˈbɪznəs',
  conversation: 'ˌkɑnvɚˈseɪʃən',
  end: 'ɛnd',
  enjoy: 'ɪnˈdʒɔɪ',
  good: 'ɡʊd',
  hear: 'hɪr',
  interesting: 'ˈɪntrəstɪŋ',
  last: 'læst',
  look: 'lʊk',
  man: 'mæn',
  none: 'nʌn',
  pay: 'peɪ',
  play: 'pleɪ',
  private: 'ˈpraɪvət',
  round: 'raʊnd',
  rude: 'rud',
  rudely: 'ˈrudli',
  say: 'seɪ',
  said: 'sɛd',
  seat: 'sit',
  talk: 'tɔk',
  theatre: 'ˈθiətɚ',
  turn: 'tɝn',
  very: 'ˈvɛri',
  week: 'wik',
  went: 'wɛnt',
  woman: 'ˈwʊmən',
  word: 'wɝd',
  young: 'jʌŋ',
}));

const vocabCache = new Map(Object.entries({
  actor: '演员',
  actress: '女演员',
  attention: '注意',
  bear: '忍受',
  business: '事情/业务',
  conversation: '谈话',
  complain: '抱怨',
  theatre: '剧院',
  rudely: '粗鲁地',
  angrily: '生气地',
  loudly: '大声地',
  private: '私人的',
  interesting: '有趣的',
  breakfast: '早餐',
  lunch: '午餐',
  postcard: '明信片',
  museum: '博物馆',
  decision: '决定',
  journey: '旅行',
  distance: '距离',
  airport: '机场',
  detective: '侦探',
  valuable: '贵重的',
  parcel: '包裹',
  request: '请求',
  polite: '有礼貌的',
  neighbour: '邻居',
  immediately: '立刻',
  received: '收到',
  borrowed: '借入',
  deserved: '应得',
  conversation: '谈话',
  manager: '经理',
  secretary: '秘书',
  afford: '买得起',
  interrupt: '打断',
  performance: '演出',
  instrument: '乐器',
  damage: '损坏',
  government: '政府',
  precious: '珍贵的',
  distance: '距离',
  garage: '车库',
  repair: '修理',
  discover: '发现',
  whole: '整个的',
  single: '单个的',
  explain: '解释',
  excited: '兴奋的',
  receive: '收到',
  different: '不同的',
  station: '车站',
  platform: '站台',
  ticket: '票',
  return: '回来/返回',
  journey: '旅程',
  difficult: '困难的',
  impossible: '不可能的',
  dentist: '牙医',
  collection: '收藏',
  meanwhile: '与此同时',
  removed: '取出/移开',
  festival: '节日',
  cheerful: '欢快的',
  occasion: '场合',
  lantern: '灯笼',
  spectacle: '景象',
}));

const phraseCn = new Map(Object.entries({
  'pay attention': '注意',
  'pay any attention': '注意/理会',
  'in the end': '最后',
  'none of your business': '不关你的事',
  'a private conversation': '私人谈话',
  'pull out': '拔出',
  'for a while': '一会儿',
  'cotton wool': '药棉',
  'in answer to': '作为对……的回答',
  'search out': '寻找/探查',
  'at last': '最后',
  'be able to': '能够',
  'once a year': '一年一次',
  'be said to': '据说',
  'lay out': '摆放',
  'find their way': '找到路',
  'all night long': '整夜',
  'drift out to sea': '漂向大海',
  'no more': '不再',
}));

function saveCaches() {
  fs.writeFileSync(translationCacheFile, JSON.stringify(translationCache, null, 2));
  fs.writeFileSync(ipaCacheFile, JSON.stringify(ipaCache, null, 2));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function cleanLine(line) {
  return String(line)
    .replace(/[“”]/g, "'")
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeText(value) {
  return cleanLine(value)
    .toLowerCase()
    .replace(/[^a-z0-9']+/g, '');
}

function translateText(text) {
  const clean = cleanLine(text);
  if (!clean) return '';
  if (translationCache[clean]) return translationCache[clean];

  let translated = null;
  try {
    const output = execFileSync('curl', [
      '-sS',
      '--max-time',
      '10',
      '--get',
      'https://translate.googleapis.com/translate_a/single',
      '--data-urlencode',
      'client=gtx',
      '--data-urlencode',
      'sl=en',
      '--data-urlencode',
      'tl=zh-CN',
      '--data-urlencode',
      'dt=t',
      '--data-urlencode',
      `q=${clean}`,
    ], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    const data = JSON.parse(output);
    translated = data?.[0]?.map((part) => part?.[0] ?? '').join('').trim();
  } catch {
    translated = null;
  }

  translationCache[clean] = translated || `（需校对）${clean}`;
  return translationCache[clean];
}

function dictionaryIpa(key) {
  if (!key || key.includes("'")) return null;
  if (ipaCache[key]) return ipaCache[key];
  let value = null;
  try {
    const output = execFileSync('swift', ['tools/macos_dictionary_pron.swift', key], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    const match = output.match(/\tAmE ([^\t\n]+)/);
    if (match) value = match[1].replace(/\([^)]*\)/g, '').replace(/\s+/g, '');
  } catch {
    value = null;
  }
  ipaCache[key] = value || key;
  return value;
}

function finalSoundClass(ipa) {
  if (/[ptkfθsʃtʃ]$/.test(ipa)) return 'voiceless';
  if (/[td]$/.test(ipa)) return 'alveolar';
  if (/[szʃʒtʃdʒ]$/.test(ipa)) return 'sibilant';
  return 'voiced';
}

function basePronunciation(key) {
  const direct = baseIpa.get(key);
  if (direct) return direct;
  const dict = dictionaryIpa(key);
  if (dict && dict !== key) return dict;
  return derivedIpa(key) ?? dict ?? key;
}

function derivedIpa(key) {
  if (baseIpa.has(key)) return baseIpa.get(key);

  if (/^[a-z]+ed$/.test(key) && key.length > 4) {
    const candidates = [
      key.replace(/ied$/, 'y'),
      key.replace(/ed$/, ''),
      key.replace(/d$/, ''),
    ];
    for (const candidate of candidates) {
      if (!candidate || candidate === key) continue;
      const base = baseIpa.get(candidate) ?? dictionaryIpa(candidate);
      if (!base || base === candidate) continue;
      const cls = finalSoundClass(base);
      const suffix = cls === 'voiceless' ? 't' : cls === 'alveolar' ? 'ɪd' : 'd';
      return `${base}${suffix}`;
    }
  }

  if (/^[a-z]+ing$/.test(key) && key.length > 5) {
    const candidates = [
      key.replace(/ying$/, 'ie'),
      key.replace(/ing$/, ''),
      key.replace(/ing$/, 'e'),
    ];
    for (const candidate of candidates) {
      const base = baseIpa.get(candidate) ?? dictionaryIpa(candidate);
      if (base && base !== candidate) return `${base}ɪŋ`;
    }
  }

  if (/^[a-z]+s$/.test(key) && key.length > 3) {
    const candidates = [key.replace(/ies$/, 'y'), key.replace(/es$/, ''), key.replace(/s$/, '')];
    for (const candidate of candidates) {
      const base = baseIpa.get(candidate) ?? dictionaryIpa(candidate);
      if (!base || base === candidate) continue;
      const cls = finalSoundClass(base);
      const suffix = cls === 'sibilant' ? 'ɪz' : cls === 'voiceless' ? 's' : 'z';
      return `${base}${suffix}`;
    }
  }

  return null;
}

function tokenize(line) {
  return cleanLine(line)
    .replace(/\.\.\./g, ' ')
    .replace(/[-]/g, '')
    .split(/[^A-Za-z']+/)
    .filter(Boolean);
}

function wordKey(word) {
  return String(word)
    .toLowerCase()
    .replace(/^'+|'+$/g, '')
    .replace(/[^a-z']/g, '');
}

function startsWithVowelSound(ipa) {
  return /^[ˈˌ]?[ɑɔɛɪiæʌəɚɝuʊo]/.test(ipa);
}

function endsWithLinkableSound(ipa) {
  return /[bcdfghjklmnprstvwzðθʃʒŋɡɚɝrlmn]$/.test(ipa);
}

function applyConnectedSpeech(words, ipas) {
  const next = [...ipas];
  for (let index = 0; index < words.length; index += 1) {
    const key = words[index];
    if (key === 'and') next[index] = 'ən';
    if (key === 'a') next[index] = 'ə';
    if (key === 'an') next[index] = 'ən';
    if (key === 'as') next[index] = 'əz';
    if (key === 'at') next[index] = 'ət';
    if (key === 'but') next[index] = 'bət';
    if (key === 'can') next[index] = 'kən';
    if (key === 'for') next[index] = 'fɚ';
    if (key === 'from') next[index] = 'frəm';
    if (key === 'had') next[index] = 'həd';
    if (key === 'has') next[index] = 'həz';
    if (key === 'have') next[index] = 'həv';
    if (key === 'of') next[index] = 'əv';
    if (key === 'to') next[index] = 'tə';
    if (key === 'the') next[index] = startsWithVowelSound(next[index + 1] ?? '') ? 'ði' : 'ðə';
    if (key === 'was') next[index] = 'wəz';
    if (key === 'were') next[index] = 'wɚ';
    if (key === 'would') next[index] = 'wəd';
    if (key === 'you' && ['do', 'did', 'can', 'could', 'would', 'will'].includes(words[index - 1])) next[index] = 'jə';
    if (key === 'are' && index > 0) next[index] = 'ɑr';
    if (key === 'your') next[index] = 'jɚ';
  }

  let ipa = '';
  for (let index = 0; index < next.length; index += 1) {
    if (index === 0) {
      ipa = next[index];
      continue;
    }
    const previous = next[index - 1];
    const current = next[index];
    const previousWord = words[index - 1];
    const currentWord = words[index];
    const shouldLink = startsWithVowelSound(current)
      && (endsWithLinkableSound(previous) || ['i', 'aɪ', 'ði', 'ə', 'ən', 'əv', 'ɑr'].includes(previous));
    const commonPhrase =
      (previousWord === 'that' && currentWord === 'is') ||
      (previousWord === 'it' && currentWord === 'is') ||
      (previousWord === 'there' && currentWord === 'is') ||
      (previousWord === 'here' && currentWord === 'is') ||
      (previousWord === 'look' && currentWord === 'at') ||
      (previousWord === 'pay' && currentWord === 'attention') ||
      (previousWord === 'not' && startsWithVowelSound(current)) ||
      (previousWord === 'got' && startsWithVowelSound(current)) ||
      (previousWord === 'get' && startsWithVowelSound(current));
    ipa += shouldLink || commonPhrase ? `‿${current}` : ` ${current}`;
  }

  return ipa
    .replace(/\bɪt‿ɪz\b/g, 'ɪɾ‿ɪz')
    .replace(/\bðæt‿ɪz\b/g, 'ðæɾ‿ɪz')
    .replace(/\bwʌt‿ɪz\b/g, 'wʌɾ‿ɪz')
    .replace(/\bɡɛt‿/g, 'ɡɛɾ‿')
    .replace(/\bɡɑt‿/g, 'ɡɑɾ‿')
    .replace(/\bnɑt‿/g, 'nɑɾ‿')
    .replace(/\bæt‿/g, 'æɾ‿');
}

function ipaForSentence(sentence) {
  const words = tokenize(sentence).map(wordKey).filter(Boolean);
  const parts = words.map(basePronunciation);
  return applyConnectedSpeech(words, parts);
}

function highlightIpa(ipa) {
  let next = escapeHtml(`/${ipa}/`).replace(/‿/g, '<span class="linking">‿</span>');
  const ipaChars = 'A-Za-zɚɝɑɔɛɪʊəæʌɒiuyʃʒθðŋɡɾr';
  for (const weak of ['frəm', 'həv', 'həd', 'həz', 'kən', 'wəz', 'ðə', 'ði', 'ən', 'əm', 'əz', 'ət', 'tə', 'əv', 'ɑr', 'ɪz', 'wɚ', 'fɚ', 'jɚ', 'jə', 'ə']) {
    next = next.replace(new RegExp(`(?<![${ipaChars}])${weak}(?![${ipaChars}])`, 'g'), `<span class="weak">${weak}</span>`);
  }
  return next;
}

function highlightEnglish(sentence) {
  const tokens = tokenize(sentence);
  const linkIndexes = new Set();
  for (let index = 0; index < tokens.length - 1; index += 1) {
    const left = wordKey(tokens[index]);
    const right = wordKey(tokens[index + 1]);
    const leftIpa = basePronunciation(left);
    const rightIpa = basePronunciation(right);
    const reducedRight = { a: 'ə', an: 'ən', and: 'ən', are: 'ɑr', as: 'əz', at: 'ət', is: 'ɪz', of: 'əv', the: 'ðə', to: 'tə', in: 'ɪn' }[right] ?? rightIpa;
    if (startsWithVowelSound(reducedRight) && (endsWithLinkableSound(leftIpa) || weakForms.has(right))) {
      linkIndexes.add(index);
      linkIndexes.add(index + 1);
    }
  }

  let wordIndex = 0;
  return cleanLine(sentence).split(/(\s+)/).map((part) => {
    if (/^\s+$/.test(part)) return part;
    const key = wordKey(part);
    const current = wordIndex;
    if (key) wordIndex += 1;
    const classes = [];
    if (weakForms.has(key)) classes.push('weak');
    if (linkIndexes.has(current)) classes.push('linking');
    return classes.length ? `<span class="${classes.join(' ')}">${escapeHtml(part)}</span>` : escapeHtml(part);
  }).join('');
}

function linkedIpaChunks(ipa) {
  return [...ipa.matchAll(/[^\s]+‿[^\s]+/g)]
    .map((match) => match[0].replace(/[/?.,;:!()"']/g, ''))
    .filter(Boolean)
    .slice(0, 5);
}

function weakIpaForms(ipa) {
  const forms = [];
  for (const weak of ['ðə', 'ði', 'ə', 'ən', 'əm', 'əz', 'ət', 'tə', 'kən', 'əv', 'ɑr', 'ɪz', 'wəz', 'wɚ', 'fɚ', 'frəm', 'həd', 'həz', 'həv', 'jə', 'jɚ']) {
    const pattern = new RegExp(`(^|[\\s‿])${weak}(?=$|[\\s‿])`);
    if (pattern.test(ipa) && !forms.includes(weak)) forms.push(weak);
  }
  return forms.slice(0, 6);
}

function flapChunks(ipa) {
  return ipa.split(/\s+/)
    .map((part) => part.replace(/[/?.,;:!()"']/g, ''))
    .filter((part) => part.includes('ɾ'))
    .slice(0, 3);
}

function contentWords(sentence) {
  return tokenize(sentence)
    .map(wordKey)
    .filter((word) => word && word.length > 3 && !weakForms.has(word))
    .slice(0, 4);
}

function liaisonFor(sentence, ipa) {
  const points = [];
  const links = linkedIpaChunks(ipa);
  const weak = weakIpaForms(ipa);
  const flaps = flapChunks(ipa);
  if (links.length) points.push(`${links.join('、')} 连读`);
  if (weak.length) points.push(`${weak.join('、')} 弱读/弱化`);
  if (flaps.length) points.push(`${flaps.join('、')} 中 /ɾ/ 为美式闪音`);
  if (!points.length) points.push(`本句按意群朗读，重读 ${contentWords(sentence).join(' / ') || '主要实词'}`);
  return `${points.join('；')}。`;
}

function structureFor(sentence) {
  const s = cleanLine(sentence);
  const parts = [];
  if (/^['"].*[?!.,]['"]?\s+\w+\s+(said|asked|answered|replied)/i.test(s) || /\b(said|asked|answered|replied)\b/i.test(s)) parts.push('直接引语与叙述语结合');
  if (/\bwhen\b/i.test(s)) parts.push('when 引导时间状语从句');
  if (/\b(after|before|as soon as|while|until)\b/i.test(s)) parts.push('时间状语从句交代动作先后');
  if (/\b(because|for|as|so)\b/i.test(s)) parts.push('原因或结果关系连接分句');
  if (/\b(who|which|that|where)\b/i.test(s)) parts.push('含定语从句或名词性从句');
  if (/\b(was|were|is|are|be|been)\s+\w+ed\b/i.test(s)) parts.push('含被动结构');
  if (/\b(?:decided|tried|wanted|told|asked|managed|promised|began|started|used|able|impossible|difficult)\s+(?:\w+\s+)?to\s+\w+|\bto\s+(?:be|have|do|go|see|find|make|take|tell|meet|sit|rest|stay|visit|buy|sell|work|look|answer|hear|speak|leave|lead|rush|eat|help|return|repair|open|close|catch|pay|bear|keep|put|ask|give)\b/i.test(s)) parts.push('不定式短语补充目的、结果或宾语');
  if (/,\s+and\b/i.test(s) || /\band\b/i.test(s)) parts.push('并列结构连接动作或信息');
  if (parts.length === 0) parts.push('主语 + 谓语 + 宾语/补足语的基础叙述句');
  return `${parts.slice(0, 3).join('；')}。`;
}

function tenseFor(sentence) {
  const s = cleanLine(sentence);
  const parts = [];
  if (/\bhad\s+(?:been|[a-z]+(?:ed|en)|gone|seen|done|made|given|taken|told|found|left|come|become|known|written|spoken|broken|forgotten|put|cut|shut|lost|won|sent|met|heard|built|felt|thought|bought|brought|caught|taught|kept|slept|stood|understood|paid|said)\b/i.test(s)) parts.push('过去完成时说明更早发生的动作');
  if (/\b(was|were)\s+\w+ing\b/i.test(s)) parts.push('过去进行时描写当时正在发生的动作');
  if (/\b(have|has)\s+\w+(ed|en)?\b/i.test(s)) parts.push('现在完成时强调结果或经历');
  if (/\b(will|shall|be going to)\b/i.test(s)) parts.push('将来结构表示预期或安排');
  if (/\b(can|could|may|might|must|should|would|have to|had to)\b/i.test(s)) parts.push('情态结构表达能力、义务、推测或意愿');
  if (/\b(went|had|did|said|asked|told|looked|turned|came|saw|found|made|got|was|were)\b/i.test(s)) parts.push('一般过去时叙述故事主线');
  if (!parts.length) parts.push('一般现在时或基础事实陈述');
  return `${parts.slice(0, 3).join('；')}。`;
}

function wordsFor(sentence) {
  const lower = cleanLine(sentence).toLowerCase();
  const items = [];
  for (const [phrase, cn] of phraseCn) {
    if (lower.includes(phrase) && items.length < 4) items.push(`${phrase} ${cn}`);
  }
  const seen = new Set(items.map((item) => item.split(' ')[0]));
  for (const token of contentWords(sentence)) {
    if (items.length >= 7 || seen.has(token)) continue;
    let cn = vocabCache.get(token);
    if (!cn) {
      cn = translateText(token).replace(/[。.!?]+$/g, '');
      vocabCache.set(token, cn);
    }
    items.push(`${token} ${cn}`);
    seen.add(token);
  }
  return `${items.join('； ')}；`;
}

function splitSentencesWithPositions(text) {
  const sentences = [];
  let start = 0;
  const abbreviations = new Set(['mr.', 'mrs.', 'dr.', 'st.', 'no.']);
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (!/[.?!]/.test(char)) continue;
    const before = text.slice(Math.max(0, index - 4), index + 1).toLowerCase();
    if (abbreviations.has(before.match(/[a-z]+\.$/)?.[0])) continue;
    let end = index + 1;
    while (end < text.length && /['")\]]/.test(text[end])) end += 1;
    const nextChar = text.slice(end).trimStart()[0] ?? '';
    if (nextChar && !/[A-Z'"]/.test(nextChar)) continue;
    const sentence = text.slice(start, end).trim();
    if (sentence) {
      const leading = text.slice(start).search(/\S/);
      sentences.push({ text: sentence, start: start + Math.max(0, leading), end });
    }
    start = end;
    while (start < text.length && /\s/.test(text[start])) start += 1;
  }
  const tail = text.slice(start).trim();
  if (tail) sentences.push({ text: tail, start, end: text.length });
  return sentences;
}

function parseLrc(file) {
  const content = fs.readFileSync(path.join(srcDir, file), 'utf8');
  const title = content.match(/^\[ti:(.+?)\]/m)?.[1]?.replace(/[?]$/, '') ?? file.replace(/\.lrc$/, '').replace(/^\d+－/, '');
  const timedLines = content
    .split(/\r?\n/)
    .map((raw) => {
      const match = raw.match(/^\[(\d{2}):(\d{2})\.(\d{2})\](.*)$/);
      if (!match) return null;
      return {
        time: Number(match[1]) * 60 + Number(match[2]) + Number(match[3]) / 100,
        text: cleanLine(match[4]),
      };
    })
    .filter((entry) => entry && entry.text);
  const lessonNo = Number(file.match(/^(\d+)/)?.[1] ?? 0);
  const firstBodyIndex = timedLines.findIndex((entry) => {
    const text = entry.text.toLowerCase();
    return !/^lesson\s+\d+$/i.test(entry.text)
      && normalizeText(entry.text) !== normalizeText(title)
      && !text.endsWith('?');
  });
  const questionEntry = timedLines
    .slice(0, firstBodyIndex === -1 ? timedLines.length : firstBodyIndex)
    .find((entry) => entry.text.endsWith('?'));
  const question = questionEntry?.text ?? '';
  const bodyEntries = timedLines.slice(firstBodyIndex === -1 ? 0 : firstBodyIndex);
  const fullTextParts = [];
  const segments = [];
  let cursor = 0;
  bodyEntries.forEach((entry, index) => {
    if (index > 0) {
      fullTextParts.push(' ');
      cursor += 1;
    }
    const start = cursor;
    fullTextParts.push(entry.text);
    cursor += entry.text.length;
    segments.push({
      startChar: start,
      endChar: cursor,
      startTime: entry.time,
      endTime: bodyEntries[index + 1]?.time ?? entry.time + Math.max(3, entry.text.length / 12),
      text: entry.text,
    });
  });
  const fullText = fullTextParts.join('');
  const sentences = splitSentencesWithPositions(fullText).map((item, index) => ({
    index: index + 1,
    text: item.text,
    startChar: item.start,
    endChar: item.end,
  }));

  function timeAt(position) {
    const segment = segments.find((entry) => position >= entry.startChar && position <= entry.endChar)
      ?? segments.find((entry) => position < entry.endChar)
      ?? segments[segments.length - 1];
    const span = Math.max(1, segment.endChar - segment.startChar);
    const ratio = Math.min(1, Math.max(0, (position - segment.startChar) / span));
    return segment.startTime + (segment.endTime - segment.startTime) * ratio;
  }

  const subtitles = sentences.map((sentence, index) => {
    const next = sentences[index + 1];
    const start = timeAt(sentence.startChar);
    const end = next ? timeAt(next.startChar) : timeAt(sentence.endChar);
    return {
      index: sentence.index,
      start: Number(start.toFixed(2)),
      end: Number(Math.max(start + 0.5, end).toFixed(2)),
      text: sentence.text,
    };
  });

  return {
    file,
    lessonNo,
    title,
    question,
    audioFile: file.replace(/\.lrc$/, '.mp3'),
    sentences,
    subtitles,
  };
}

function markdownFor(lesson, analyses) {
  const blocks = analyses.map((item) => `${item.index}.
EN: ${item.index}. ${item.text}
美音发音: /${item.ipa}/
连读分析: ${item.liaison}
结构: ${item.structure}
时态: ${item.tense}
中: ${item.cn}
词: ${item.words}`).join('\n\n');

  return `# NCE4 Lesson ${String(lesson.lessonNo).padStart(2, '0')} - ${lesson.title}

问题: ${lesson.question}

${blocks}

词汇总结:
${summaryWords(analyses)}

句型总结:
${summaryPatterns(analyses)}

时态总结:
${summaryTenses(analyses)}

情态/语气总结:
${summaryModals(analyses)}

本课连读注意点:
${summaryLiaison(analyses)}
`;
}

function summaryWords(analyses) {
  const words = analyses.flatMap((item) => item.words.split('；').map((part) => part.trim()).filter(Boolean));
  return words.slice(0, 18).join('； ') + '；';
}

function summaryPatterns(analyses) {
  const patterns = [...new Set(analyses.flatMap((item) => item.structure.replace(/。$/, '').split('；')))]
    .filter(Boolean)
    .slice(0, 6);
  return patterns.join('； ') + '。';
}

function summaryTenses(analyses) {
  const tenses = [...new Set(analyses.flatMap((item) => item.tense.replace(/。$/, '').split('；')))]
    .filter(Boolean)
    .slice(0, 6);
  return tenses.join('； ') + '。';
}

function summaryModals(analyses) {
  const items = analyses
    .filter((item) => /\b(can|could|may|might|must|should|would|have to|had to|will)\b/i.test(item.text))
    .map((item) => `${item.index}. ${item.text}`)
    .slice(0, 4);
  return items.length ? items.join('； ') + '。' : '本课情态表达不多，重点放在叙事时态和从句关系。';
}

function summaryLiaison(analyses) {
  return analyses
    .map((item) => item.liaison.replace(/。$/, ''))
    .filter((item) => item.includes('连读'))
    .slice(0, 5)
    .join('； ') + '。';
}

function renderHtml(lesson, analyses) {
  const title = `NCE4 Lesson ${String(lesson.lessonNo).padStart(2, '0')} - ${lesson.title}`;
  const cards = analyses.map((item) => `    <article class="sentence-card" id="sentence-${item.index}" data-start="${lesson.subtitles[item.index - 1].start}" data-end="${lesson.subtitles[item.index - 1].end}">
      <div class="sentence-head"><button class="sentence-play" type="button" data-sentence="${item.index}" aria-label="Play sentence ${item.index}">▶</button><button class="sentence-toggle" type="button" data-sentence="${item.index}" aria-label="Pause or resume sentence ${item.index}">Ⅱ</button><span class="sentence-num">${item.index}</span><p class="en-text">${highlightEnglish(item.text)}</p></div>
      <div class="field ipa"><span>美音发音</span><p>${highlightIpa(item.ipa)}</p></div>
      <div class="field liaison"><span>连读分析</span><p>${escapeHtml(item.liaison)}</p></div>
      <div class="field structure"><span>结构</span><p>${escapeHtml(item.structure)}</p></div>
      <div class="field tense"><span>时态</span><p>${escapeHtml(item.tense)}</p></div>
      <div class="field cn"><span>中</span><p>${escapeHtml(item.cn)}</p></div>
      <div class="field words"><span>词</span><p>${escapeHtml(item.words)}</p></div>
    </article>`).join('\n');
  const toc = analyses.map((item) => `      <a href="#sentence-${item.index}">${item.index}</a>`).join('\n');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body { margin: 0; padding-bottom: 116px; font-family: "Microsoft YaHei", "PingFang SC", Arial, sans-serif; color: #1f2937; background: #f3f4f6; line-height: 1.65; }
    .page-header { background: #111827; color: #fff; padding: 28px 18px 24px; border-bottom: 4px solid #2563eb; }
    .page-header .inner, main { width: min(1080px, calc(100% - 32px)); margin: 0 auto; }
    .eyebrow { margin: 0 0 6px; color: #93c5fd; font-size: 13px; letter-spacing: 0; text-transform: uppercase; font-weight: 700; }
    h1 { margin: 0; font-size: clamp(26px, 4vw, 42px); line-height: 1.18; letter-spacing: 0; }
    .meta { margin: 10px 0 0; color: #d1d5db; font-size: 14px; }
    main { padding: 22px 0 40px; }
    .pron-note { margin: 0 0 18px; padding: 12px 14px; background: #f8fafc; border: 1px solid #dbeafe; border-left: 4px solid #0f766e; border-radius: 8px; color: #334155; font-size: 14px; }
    .pron-note strong { color: #0f766e; }
    .toc { display: flex; flex-wrap: wrap; gap: 8px; margin: 0 0 18px; padding: 14px; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05); }
    .toc a { color: #1d4ed8; text-decoration: none; font-size: 13px; padding: 4px 8px; border: 1px solid #bfdbfe; border-radius: 6px; background: #eff6ff; }
    .sentence-card { background: #fff; border: 1px solid #e5e7eb; border-left: 5px solid #2563eb; border-radius: 8px; padding: 16px 18px; margin: 14px 0; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08); }
    .sentence-head { display: grid; grid-template-columns: 34px 34px 38px 1fr; gap: 12px; align-items: start; margin-bottom: 12px; }
    .sentence-play, .sentence-toggle { display: inline-flex; width: 34px; height: 34px; align-items: center; justify-content: center; border: 0; border-radius: 50%; color: #fff; background: #0f766e; font-weight: 800; font-size: 13px; line-height: 1; cursor: pointer; box-shadow: 0 2px 8px rgba(15, 118, 110, 0.28); }
    .sentence-play:hover, .sentence-play:focus-visible { background: #115e59; outline: 3px solid rgba(15, 118, 110, 0.2); }
    .sentence-toggle { background: #2563eb; box-shadow: 0 2px 8px rgba(37, 99, 235, 0.24); }
    .sentence-toggle:hover, .sentence-toggle:focus-visible { background: #1d4ed8; outline: 3px solid rgba(37, 99, 235, 0.2); }
    .sentence-card.is-active { border-left-color: #0f766e; background: #f0fdfa; }
    .sentence-num { display: inline-flex; width: 34px; height: 34px; align-items: center; justify-content: center; border-radius: 50%; color: #fff; background: #2563eb; font-weight: 700; font-size: 14px; line-height: 1; flex: 0 0 auto; }
    .en-text { margin: 0; color: #111827; font-size: 18px; font-weight: 700; line-height: 1.45; }
    .field { display: grid; grid-template-columns: 76px 1fr; gap: 10px; padding: 9px 0; border-top: 1px solid #f1f5f9; }
    .field span { color: #4b5563; font-size: 13px; font-weight: 700; white-space: nowrap; }
    .field p { margin: 0; color: #374151; font-size: 15px; }
    .ipa p { color: #0f766e; font-family: "Charis SIL", "Doulos SIL", "Times New Roman", serif; font-size: 16px; }
    .linking { color: #15803d; font-weight: 700; }
    .weak { color: #92400e; font-weight: 700; }
    .weak.linking { color: #92400e; text-decoration: underline; text-decoration-color: #15803d; text-decoration-thickness: 2px; text-underline-offset: 3px; }
    .cn p { color: #7c2d12; font-weight: 600; }
    .words p { color: #581c87; }
    .summary-section { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 18px; margin: 16px 0; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08); }
    .summary-section h2 { margin: 0 0 10px; color: #111827; font-size: 21px; line-height: 1.3; }
    .summary-section p { margin: 8px 0; color: #374151; }
    code { color: #0f766e; background: #ecfdf5; border: 1px solid #ccfbf1; border-radius: 4px; padding: 1px 4px; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 0.92em; }
    .back-top { position: fixed; right: 16px; bottom: 132px; z-index: 30; color: #fff; background: #111827; text-decoration: none; border-radius: 8px; padding: 8px 10px; font-size: 13px; box-shadow: 0 8px 20px rgba(15, 23, 42, 0.2); }
    .audio-dock { position: fixed; left: 0; right: 0; bottom: 0; z-index: 20; border-top: 1px solid #1f2937; background: rgba(17, 24, 39, 0.96); color: #fff; box-shadow: 0 -10px 30px rgba(15, 23, 42, 0.25); backdrop-filter: blur(10px); }
    .audio-dock .inner { width: min(1080px, calc(100% - 24px)); margin: 0 auto; padding: 10px 0 12px; }
    .player-row { display: grid; grid-template-columns: auto 1fr auto; gap: 12px; align-items: center; }
    .player-btn { display: inline-flex; width: 40px; height: 40px; align-items: center; justify-content: center; border: 0; border-radius: 50%; color: #111827; background: #93c5fd; font-size: 15px; font-weight: 800; cursor: pointer; }
    .player-btn:hover, .player-btn:focus-visible { background: #bfdbfe; outline: 3px solid rgba(147, 197, 253, 0.28); }
    .progress-wrap { display: grid; gap: 5px; min-width: 0; }
    .subtitle-line { min-height: 22px; color: #f8fafc; font-size: 15px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .progress-line { display: grid; grid-template-columns: auto 1fr auto; gap: 8px; align-items: center; color: #cbd5e1; font-size: 12px; }
    .progress-track { position: relative; height: 8px; overflow: hidden; border-radius: 999px; background: #334155; cursor: pointer; }
    .progress-fill { position: absolute; inset: 0 auto 0 0; width: 0%; border-radius: inherit; background: #22c55e; }
    .dock-title { color: #cbd5e1; font-size: 12px; white-space: nowrap; }
    @media (max-width: 640px) { body { padding-bottom: 132px; } .page-header .inner, main { width: min(100% - 20px, 1080px); } .sentence-card, .summary-section { padding: 14px; } .sentence-head { grid-template-columns: 30px 30px 30px 1fr; gap: 8px; } .sentence-play, .sentence-toggle, .sentence-num { width: 30px; height: 30px; } .en-text { font-size: 16px; } .field { grid-template-columns: 1fr; gap: 2px; } .back-top { right: 10px; bottom: 140px; min-width: 40px; min-height: 40px; display: inline-flex; align-items: center; justify-content: center; padding: 8px; } .player-row { grid-template-columns: auto 1fr; } .dock-title { display: none; } .subtitle-line { white-space: normal; line-height: 1.3; } }
  </style>
</head>
<body id="top">
  <header class="page-header">
    <div class="inner">
      <p class="eyebrow">New Concept English 4</p>
      <h1>${escapeHtml(title)}</h1>
      <p class="meta">问题: ${escapeHtml(lesson.question)}</p>
    </div>
  </header>
  <main>
    <p class="pron-note"><strong>发音说明:</strong> 美音发音以 macOS Dictionary 的 AmE 单词读音为基础，并保留句子里的 connected speech：连读、弱读和美式闪音。</p>
    <nav class="toc" aria-label="Sentence navigation">
${toc}
    </nav>
${cards}
    <section class="summary-section"><h2>词汇总结</h2><p>${escapeHtml(summaryWords(analyses))}</p></section>
    <section class="summary-section"><h2>句型总结</h2><p>${escapeHtml(summaryPatterns(analyses))}</p></section>
    <section class="summary-section"><h2>时态总结</h2><p>${escapeHtml(summaryTenses(analyses))}</p></section>
    <section class="summary-section"><h2>情态/语气总结</h2><p>${escapeHtml(summaryModals(analyses))}</p></section>
    <section class="summary-section"><h2>本课连读注意点</h2><p>${escapeHtml(summaryLiaison(analyses))}</p></section>
  </main>
  <a class="back-top" href="#top">Top</a>
  <div class="audio-dock" role="region" aria-label="Lesson audio player">
    <div class="inner">
      <div class="player-row">
        <button class="player-btn" type="button" id="dock-play" aria-label="Play or pause">▶</button>
        <div class="progress-wrap">
          <div class="subtitle-line" id="dock-subtitle">点击句子开头的播放按钮，从当前句开始播放。</div>
          <div class="progress-line">
            <span id="dock-current">0:00</span>
            <div class="progress-track" id="dock-track"><div class="progress-fill" id="dock-fill"></div></div>
            <span id="dock-duration">0:00</span>
          </div>
        </div>
        <div class="dock-title">${escapeHtml(lesson.title)}</div>
      </div>
      <audio id="lesson-audio" preload="auto" src="../${escapeHtml(lesson.audioFile)}"></audio>
    </div>
  </div>
  <script>
    const subtitles = ${JSON.stringify(lesson.subtitles)};
    const audio = document.getElementById("lesson-audio");
    const dockPlay = document.getElementById("dock-play");
    const subtitleEl = document.getElementById("dock-subtitle");
    const currentEl = document.getElementById("dock-current");
    const durationEl = document.getElementById("dock-duration");
    const trackEl = document.getElementById("dock-track");
    const fillEl = document.getElementById("dock-fill");
    const sentenceCards = Array.from(document.querySelectorAll(".sentence-card"));
    const sentenceToggleButtons = Array.from(document.querySelectorAll(".sentence-toggle"));
    function formatTime(value) { if (!Number.isFinite(value)) return "0:00"; const minutes = Math.floor(value / 60); const seconds = Math.floor(value % 60).toString().padStart(2, "0"); return minutes + ":" + seconds; }
    function activeSubtitle(time) { return subtitles.find((item) => time >= item.start && time < item.end) ?? subtitles[subtitles.length - 1]; }
    function setActiveSentence(item) { sentenceCards.forEach((card) => card.classList.toggle("is-active", card.id === "sentence-" + item?.index)); if (item) subtitleEl.textContent = item.text; }
    function updateProgress(time) { const duration = audio.duration || subtitles[subtitles.length - 1]?.end || 0; currentEl.textContent = formatTime(time); durationEl.textContent = formatTime(duration); fillEl.style.width = duration ? Math.min(100, (time / duration) * 100) + "%" : "0%"; const item = activeSubtitle(time); if (item) setActiveSentence(item); }
    function seekTo(time) { audio.currentTime = time; updateProgress(time); }
    function whenAudioReady(callback) { if (audio.readyState >= 2) { callback(); return; } let done = false; const runOnce = () => { if (done) return; done = true; callback(); }; audio.addEventListener("canplay", runOnce, { once: true }); audio.addEventListener("loadedmetadata", runOnce, { once: true }); }
    function isTimeInSentence(item) { const time = audio.currentTime; return item && time >= item.start && time < item.end; }
    function refreshSentenceToggleButtons() { const current = activeSubtitle(audio.currentTime); sentenceToggleButtons.forEach((button) => { const isCurrent = current && Number(button.dataset.sentence) === current.index; const isPause = isCurrent && !audio.paused; button.textContent = isPause ? "Ⅱ" : "▶"; button.setAttribute("aria-label", (isPause ? "Pause" : "Resume") + " sentence " + button.dataset.sentence); }); }
    function toggleSentence(index) { const item = subtitles.find((entry) => entry.index === index); if (!item) return; if (!audio.paused && isTimeInSentence(item)) { audio.pause(); refreshSentenceToggleButtons(); return; } if (audio.paused && isTimeInSentence(item)) { setActiveSentence(item); audio.play().catch(() => {}); return; } setActiveSentence(item); whenAudioReady(() => { seekTo(item.start); audio.play().catch(() => {}); }); }
    function playFrom(index) { const item = subtitles.find((entry) => entry.index === index); if (!item) return; setActiveSentence(item); whenAudioReady(() => { seekTo(item.start); audio.play().catch(() => {}); }); }
    document.querySelectorAll(".sentence-play").forEach((button) => { button.addEventListener("click", () => playFrom(Number(button.dataset.sentence))); });
    sentenceToggleButtons.forEach((button) => { button.addEventListener("click", () => toggleSentence(Number(button.dataset.sentence))); });
    dockPlay.addEventListener("click", () => { if (audio.paused) audio.play(); else audio.pause(); });
    audio.addEventListener("play", () => { dockPlay.textContent = "Ⅱ"; refreshSentenceToggleButtons(); });
    audio.addEventListener("pause", () => { dockPlay.textContent = "▶"; refreshSentenceToggleButtons(); });
    audio.addEventListener("loadedmetadata", () => { durationEl.textContent = formatTime(audio.duration); });
    audio.addEventListener("timeupdate", () => { updateProgress(audio.currentTime); refreshSentenceToggleButtons(); });
    trackEl.addEventListener("click", (event) => { const rect = trackEl.getBoundingClientRect(); const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)); const duration = audio.duration || subtitles[subtitles.length - 1]?.end || 0; audio.currentTime = ratio * duration; updateProgress(audio.currentTime); });
  </script>
</body>
</html>
`;
}

function analyseLesson(lesson) {
  return lesson.sentences.map((sentence) => {
    const ipa = ipaForSentence(sentence.text);
    const cn = translateText(sentence.text);
    return {
      index: sentence.index,
      text: sentence.text,
      ipa,
      liaison: liaisonFor(sentence.text, ipa),
      structure: structureFor(sentence.text),
      tense: tenseFor(sentence.text),
      cn,
      words: wordsFor(sentence.text),
    };
  });
}

function generatedLessons() {
  return fs.readdirSync(srcDir)
    .filter((name) => name.endsWith('.lrc'))
    .filter((name) => fs.existsSync(path.join(outDir, name.replace(/\.lrc$/, '.analysis.html'))))
    .sort()
    .map(parseLrc);
}

function renderIndex(lessons = generatedLessons()) {
  const items = lessons.map((lesson) => {
    const htmlName = lesson.file.replace(/\.lrc$/, '.analysis.html');
    return `      <a class="lesson-card" href="${escapeHtml(htmlName)}">
        <span class="lesson-no">Lesson ${String(lesson.lessonNo).padStart(2, '0')}</span>
        <strong>${escapeHtml(lesson.title)}</strong>
        <span>已生成</span>
      </a>`;
  }).join('\n');
  fs.writeFileSync(path.join(outDir, 'index.html'), `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>NCE4 HTML 分析</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif; color: #f8fafc; background: #050505; }
    .shell { width: min(1120px, calc(100% - 28px)); margin: 0 auto; padding: 28px 0 54px; }
    .topbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 24px; }
    h1 { margin: 0; font-size: clamp(28px, 5vw, 46px); letter-spacing: 0; }
    p { color: #a1a1aa; }
    a { color: inherit; text-decoration: none; }
    .home-link { border: 1px solid rgba(255,255,255,.14); border-radius: 999px; padding: 9px 14px; color: #e5e7eb; }
    .lesson-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
    .lesson-card { display: grid; gap: 8px; min-height: 112px; padding: 16px; border: 1px solid rgba(255,255,255,.12); border-radius: 12px; background: #171717; }
    .lesson-card:hover { border-color: rgba(124,147,255,.72); background: #1f1f24; }
    .lesson-card.pending { opacity: .55; pointer-events: none; }
    .lesson-no { color: #7c93ff; font-size: 13px; font-weight: 700; }
    strong { font-size: 17px; line-height: 1.28; }
    .lesson-card span:last-child { color: #86efac; font-size: 13px; }
  </style>
</head>
<body>
  <main class="shell">
    <div class="topbar">
      <div>
        <h1>NCE4 HTML 分析</h1>
        <p>第四册已生成 ${lessons.length} 课，美音发音、连读分析、句首播放和底部字幕播放器。生成过程逐课更新。</p>
      </div>
      <a class="home-link" href="../../index.html">首页</a>
    </div>
    <div class="lesson-grid">
${items}
    </div>
  </main>
</body>
</html>
`);
}

const lessons = fs.readdirSync(srcDir)
  .filter((name) => name.endsWith('.lrc'))
  .filter((name) => {
    const lessonNo = Number(name.match(/^(\d+)/)?.[1] ?? 0);
    return lessonNo >= startLesson && lessonNo <= endLesson;
  })
  .sort()
  .map(parseLrc);

if (!lessons.length) throw new Error(`No NCE4 lessons found for ${startLesson}-${endLesson}`);

renderIndex();
let written = 0;
try {
  for (const lesson of lessons) {
  const analyses = analyseLesson(lesson);
  const mdName = lesson.file.replace(/\.lrc$/, '.analysis.md');
  const htmlName = lesson.file.replace(/\.lrc$/, '.analysis.html');
  fs.writeFileSync(path.join(srcDir, mdName), markdownFor(lesson, analyses));
  fs.writeFileSync(path.join(outDir, htmlName), renderHtml(lesson, analyses));
  written += 1;
  renderIndex();
  saveCaches();
  console.log(`generated NCE4 ${String(lesson.lessonNo).padStart(2, '0')}/${String(endLesson).padStart(2, '0')}: ${lesson.title} (${analyses.length} sentences)`);
  if (lesson.lessonNo >= endLesson) break;
  }
} finally {
  renderIndex();
  saveCaches();
}

console.log(`generated ${written} NCE4 lessons in ${outDir}`);
