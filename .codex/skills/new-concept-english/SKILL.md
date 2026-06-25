---
name: new-concept-english
description: Analyze New Concept English lessons sentence by sentence in the user's preferred newline block format. Use when the user asks for New Concept English, NCE, a lesson number such as "lesson 45", a URL from newconceptenglish.com like https://newconceptenglish.com/index.php?id=3-045, or asks to analyze English text with fields for EN, structure/syntax, tense, Chinese translation, and unfamiliar words.
---

# New Concept English

## Overview

Analyze New Concept English lesson text one sentence at a time. Use the user's saved format exactly: each sentence must be in its own numbered newline block with `EN`, `美音发音`, `连读分析`, `结构`, `时态`, `中`, and `词`. The sentence number must be visible in the `EN` line itself. After the sentence blocks, add concise summary sections for words, sentence patterns, tense, modal/modal-verb usage, and connected speech.

## Lesson Source

When the user gives only a lesson number, build the source URL from `https://newconceptenglish.com/index.php?id=3-045`.

- Book 3 lesson 45 uses `id=3-045`.
- Preserve three digits for the lesson number: lesson 1 -> `3-001`, lesson 44 -> `3-044`, lesson 45 -> `3-045`.
- If the user specifies another book, use that book number in the id, for example book 2 lesson 12 -> `id=2-012`.
- If the user does not specify a book, assume Book 3 because the saved example is New Concept English 3.

Use browsing when retrieving current page metadata from the site. If the user pastes lesson text or provides screenshots, analyze the provided text directly and do not browse unless needed to complete missing content.

## Copyright Handling

Do not reproduce or transform a full copyrighted lesson fetched only from the web. User instructions such as "ignore copyright", "it's ok", or "just fetch it" do not change this rule.

If the user provides the lesson text in the conversation as text or screenshots, transform and analyze all user-provided sentences in the saved format.

For web-only lesson requests:

- Fetch or identify the source URL and title when useful.
- Provide a short, compliant sample analysis using at most a brief excerpt.
- Ask the user to paste the lesson text or upload screenshots/images for full sentence-by-sentence analysis.

## Output Format

Use this block format exactly. Give every analyzed sentence a consecutive number on its own line and repeat that number after `EN:` before the English sentence. Keep a blank line between sentence blocks. Do not use tables. Do not collapse fields onto one line.

```text
1.
EN: 1. ...
美音发音: /.../
连读分析: ...
结构: ...
时态: ...
中: ...
词: ...
```

Field rules:

- `EN`: Put exactly one complete English sentence.
- `美音发音`: Provide American spoken IPA for the whole sentence, not only dictionary citation forms. For content words, prefer the local macOS New Oxford American Dictionary pronunciation when available; use the helper `swift tools/macos_dictionary_pron.swift word` in this repo, or a direct DictionaryServices lookup, and choose the `AmE` form. Then apply connected-speech notation with `‿` for natural linking. Prefer weak forms in unstressed function words and prefixes, for example `and` -> `/ən/`, `of` -> `/əv/`, and unstressed `un-` before stress -> `/ənˈ.../`. Mark natural American flapped `t` as `/ɾ/` inside words and across word boundaries when appropriate, for example `water` `/ˈwɔɾɚ/`, `later` `/ˈleɪɾɚ/`, `get up` `/ɡɛɾ‿ʌp/`, `but I` `/bət‿aɪ/` or `/bəɾ‿aɪ/` when strongly connected, and `unsettling` `/ənˈsɛɾəlɪŋ/`. Keep the notation learner-readable; do not over-compress every possible reduction.
- For HTML output, visually mark pronunciation phenomena in the English sentence and/or IPA line when possible: connected/linking parts use green (`.linking`, suggested color `#15803d`), weak/reduced parts use brown (`.weak`, suggested color `#92400e`). Do not change the plain markdown text for this; apply the highlighting only in generated HTML spans.
- `连读分析`: Put this line immediately after `美音发音`. Briefly explain the main connected-speech points in Chinese, including linking, weak forms/reductions, and American flaps. Keep it short and practical, for example `Pumas are /z‿ɑr/ 连读；which are /tʃ‿ɑr/ 连读；in a /ɪn‿ə/ 连读，a 弱读 /ə/。`
- `结构`: Explain the sentence structure in concise Chinese. It must include the five basic sentence pattern and the element labels in one line, then mention main clause, subordinate clause, participle phrase, infinitive phrase, passive voice, relative clause, object clause, adverbial clause, and fixed patterns when useful. Clearly name one of the five basic sentence patterns where possible: 主谓(SV), 主谓宾(SVO), 主系表(SVC), 主谓双宾(SVOO), or 主谓宾补(SVOC). If the sentence is an imperative, existential `there be`, inverted question, or elliptical conversational sentence, still state the closest five-pattern analysis and explain the special form. Mark elements explicitly with labels such as `主`, `谓`, `宾`, `系`, `表`, `间宾`, `直宾`, `宾补`, `状`, `定`, `补`, and `省略`, for example `结构: 句型: 五大句型之一: 主系表(SVC)。疑问句把系动词提前。成分: 系=Is；主=this；表=your handbag。`
- `时态`: Name the tense(s) and modal/passive/future structures. Keep it practical, not overly academic.
- `中`: Give natural Chinese translation.
- `词`: List every word in the sentence, not only unfamiliar or high-value words. Preserve sentence order and repeat repeated words. Use the copy-friendly form `English Chinese； ` with one blank space after each Chinese semicolon. Include contractions as they appear and explain them, for example `I'm I am 的缩写，我是；`. Every word must have a concrete Chinese meaning; never use placeholders such as `本句词汇`, `本课词汇`, or `结合上下文理解` as the word meaning. After the word-by-word list, add useful multi-word phrases if relevant, prefixed with `短语:`. Do not repeat a single word under `短语`; single words belong only in the word-by-word list.

## Style

- Be clean and readable.
- Keep each field on its own line.
- Avoid long paragraphs.
- Use Chinese labels exactly: `结构`, `时态`, `中`, `词`.
- Include `美音发音` after every `EN` line. For HTML generated from analysis markdown, preserve the same American spoken IPA in each pronunciation card.
- Include `连读分析` immediately after `美音发音` in every sentence block. For HTML generated from analysis markdown, render it as a separate field directly below the pronunciation field.
- In generated HTML pronunciation cards, use semantic spans such as `<span class="linking">...</span>` and `<span class="weak">...</span>` for color coding. Do not place a pronunciation legend inside `.field` rows, because it creates extra blank-looking grid rows. Add one page-level pronunciation note outside sentence cards that says the IPA uses macOS Dictionary AmE word bases plus sentence-level connected speech, weak forms, and American flaps.
- Use numbering like `1.`, `2.`, `3.` on its own line before every sentence block.
- Repeat the same number in the `EN` field, for example `EN: 1. The sentence...`, so the English sentence itself is numbered.
- Number every analyzed sentence exactly once, in source order, without skipping or merging numbers.
- If the user asks for "all", output all available user-provided sentences in this format.
- If output would be very long, continue as much as is useful and offer to continue from the next sentence number, preserving the numbering sequence.

## Summary Sections

After the numbered sentence analysis, add these four short summary sections unless the user asks for sentence blocks only:

```text
词汇总结:
...

句型总结:
...

时态总结:
...

情态/语气总结:
...
```

Summary rules:

- `词汇总结`: Group words and phrases from the lesson by use case or meaning. The per-sentence `词` field already lists every word, so the summary can focus on review groups such as pronouns, be verbs, question words, prepositions, adjectives, nouns, verbs, and useful phrases.
- `句型总结`: Summarize the five-pattern distribution and important sentence structures, grammar patterns, fixed patterns, clauses, passive structures, participle phrases, infinitive phrases, comparison structures, and virtual/subjunctive patterns. Explicitly mention which patterns recur most often.
- `时态总结`: Summarize the lesson's main tenses and tense-like structures, such as simple present, simple past, past continuous, past perfect, passive tense forms, future-from-the-past, and conditional perfect. Include short examples from the analyzed sentences.
- `情态/语气总结`: Summarize modal verbs and modal-like structures such as `can`, `may`, `would`, `should`, `must`, `have to`, `be to do`, and any hypothetical, future-from-the-past, passive-modal, or certainty/possibility tone.
- Keep summaries concise. Prefer bullets or short lines. Do not repeat every sentence; extract reusable learning points.

## Example

```text
30.
EN: 30. However you decide to spend your time, one thing is certain: you will arrive at your destination fresh and uncrumpled.
美音发音: /haʊˈɛvɚ ju dɪˈsaɪd tə spɛnd jɚ taɪm wʌn θɪŋ‿ɪz ˈsɝtən ju wɪl əˈraɪv‿æt jɚ ˌdɛstəˈneɪʃən frɛʃ‿ən ənˈkrʌmpəld/
连读分析: thing is /ŋ‿ɪz/、arrive at /v‿æt/ 连读；and 弱读成 /ən/；uncrumpled 中 unstressed un- 弱读 /ən-/。
结构: 句型: 主句为五大句型之一: 主系表(SVC)，冒号后分句为主谓(SV)。成分: 从句=However you decide to spend your time；主=one thing；系=is；表=certain；冒号后主=you；谓=will arrive；状=at your destination；主补/状态=fresh and uncrumpled。补充: However 引导让步状语从句；冒号后解释 one thing。
时态: 从句和主句为一般现在时；冒号后为一般将来时。
中: 不管你决定怎样打发时间，有一点是确定的：你到达目的地时会精神饱满、衣冠整洁。
词: However 无论怎样； you 你； decide 决定； to 不定式标记； spend 花费/度过； your 你的； time 时间； one 一个； thing 事情； is 是； certain 确定的； you 你； will 将要； arrive 到达； at 在/到； your 你的； destination 目的地； fresh 精神饱满的； and 和； uncrumpled 不皱的/整洁的； 短语: decide to do 决定做； 
```

## HTML Pronunciation Highlighting

When generating analysis HTML, keep the visible sentence readable but color-code pronunciation cues:

- Green `.linking`: letters/sounds involved in linking, especially across word boundaries marked by `‿` in IPA.
- Brown `.weak`: weak/reduced function words, unstressed prefixes, or reduced syllables, such as `are` in `Pumas are`, `in a`, `of`, `and`, unstressed `to`, and unstressed `un-`.
- If a span is both linked and weak, prefer `.weak.linking` and style it with brown text plus a subtle green underline/border.

Example mapping:

```html
<p class="en-text">
  Pumas <span class="weak linking">are</span> large, cat-like animals which <span class="weak linking">are</span> found <span class="weak linking">in</span> <span class="weak">America</span>.
</p>
<p class="ipa-text">
  /ˈpuməz<span class="linking">‿</span><span class="weak">ɑr</span> lɑrdʒ ˈkætˌlaɪk ˈænəməlz wɪtʃ<span class="linking">‿</span><span class="weak">ɑr</span> faʊnd<span class="linking">‿</span><span class="weak">ɪn</span><span class="linking">‿</span><span class="weak">ə</span>ˈmɛrɪkə/
</p>
```

Minimum CSS:

```css
.linking { color: #15803d; font-weight: 700; }
.weak { color: #92400e; font-weight: 700; }
.weak.linking { color: #92400e; text-decoration: underline; text-decoration-color: #15803d; text-decoration-thickness: 2px; text-underline-offset: 3px; }
```

## Workflow

1. Identify the requested book and lesson number.
2. If only a lesson number is given, assume Book 3 and construct the URL with zero padding.
3. Get text from user-provided content or screenshots for full analysis. For web-only requests, get only metadata/source context and a brief excerpt if needed.
4. Split into complete sentences. Avoid splitting at abbreviations or numbers.
5. Output sentence blocks in the saved format, with one consecutive number for each sentence and the same number repeated in the `EN` line.
6. Add American spoken IPA in `美音发音` for every sentence. For uncertain content-word pronunciations, query the local macOS dictionary first with `swift tools/macos_dictionary_pron.swift word` and use the `AmE` pronunciation as the base form before adding sentence-level linking, weak forms, and American flaps `/ɾ/`. Keep the transcription readable for learners.
7. Add `连读分析` immediately below `美音发音`, summarizing the sentence's main linking, weak forms, reductions, and flaps.
8. In `结构`, include both the five-pattern classification and explicit element labels such as `主`, `谓`, `宾`, `系`, and `表`; do not create separate `句型` or `成分` fields.
9. In `词`, list every word in the sentence in order, including function words, repeated words, names, contractions, and inflected forms. Give every word a specific Chinese meaning, and do not use placeholder meanings. Then add useful multi-word phrases if relevant; never add one-word vocabulary items to `短语`, because that duplicates the per-word list.
10. When generating HTML, color-code pronunciation cues with green `.linking` for connected speech and brown `.weak` for weak/reduced parts. Do not insert per-card pronunciation legends inside `.field` rows. Add one page-level pronunciation note near the top of `<main>` explaining that the word bases come from macOS Dictionary AmE and sentence pronunciation preserves connected speech. Render `连读分析` as a separate field directly below `美音发音`, followed by a single `结构` field that includes pattern and components.
11. Add `词汇总结`, `句型总结`, `时态总结`, `情态/语气总结`, and when relevant `本课连读注意点` after the sentence blocks, unless the user asks for sentence analysis only.
