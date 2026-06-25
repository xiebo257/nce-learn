# Repository Guidelines

## Project Structure

This repository is a static New Concept English learning site. Lesson assets are grouped by book:

- `NCE1/`, `NCE2/`, `NCE3/`, `NCE4/`: lesson `.lrc`, `.mp3`, and generated analysis files.
- `NCE*/html/`: generated lesson analysis pages and per-book index pages.
- `tools/`: Node.js and Swift generation/verification scripts.
- `static/`: shared site CSS, JavaScript, and data.
- `.codex/skills/`: project-local Codex skills that should travel with this repo.

## Commands

- `node tools/generate_nce1_1_20_html.mjs 1 144` regenerates all NCE1 analysis HTML pages.
- `node tools/verify_nce1_analysis_fields.mjs` checks that NCE1 sentence cards include `句型`, `成分`, `结构`, and per-sentence word coverage.
- `node tools/verify_nce1_player.mjs` validates NCE1 HTML audio-player wiring.
- `node tools/generate_nce2_html.mjs`, `node tools/generate_nce4_html.mjs`, and related scripts regenerate other book pages.

## NCE Analysis Rules

Use the project-local skill at `.codex/skills/new-concept-english/SKILL.md` for NCE lesson analysis. For NCE1 HTML output, every sentence card must include:

- `美音发音`
- `连读分析`
- `句型`
- `成分`
- `结构`
- `时态`
- `中`
- `词`

`句型` must identify the relevant five basic sentence pattern where possible: `主谓(SV)`, `主谓宾(SVO)`, `主系表(SVC)`, `主谓双宾(SVOO)`, or `主谓宾补(SVOC)`. `成分` must explicitly mark sentence elements such as `主`, `谓`, `宾`, `系`, `表`, `间宾`, `直宾`, `宾补`, `状`, and `省略`. `词` must list every word in sentence order, not only high-value words.

## Generated Files

HTML analysis files are generated artifacts but are intentionally committed because the site is static. When changing a generator, regenerate the affected `NCE*/html/*.analysis.html` files and run the relevant verification script before committing.

Do not commit transient cache files such as `.ipa-cache.json` or `.translation-cache.json` unless the change explicitly requires them.

## Git Hygiene

The repository may contain unrelated local generated files. Stage exact paths instead of using `git add .`. Prefer conventional commit subjects such as `feat(nce1): enrich sentence analysis`.
