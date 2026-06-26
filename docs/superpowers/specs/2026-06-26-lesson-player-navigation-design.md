# Lesson Player Navigation Design

## Goal

Add course-order navigation and playback modes to generated New Concept English lesson analysis pages across NCE1, NCE2, NCE3, and NCE4.

## Confirmed Behavior

- Previous and next controls mean previous lesson and next lesson, not browser history.
- The existing Back control remains responsible for returning to the originating page or book index.
- Continuous playback is opt-in. When enabled, a lesson ending navigates to the next lesson and the next page starts playback automatically.
- Loop playback means loop the current lesson. When the lesson ends, playback restarts from the beginning of the same lesson.
- If loop playback and continuous playback are both enabled, loop playback wins and the page does not navigate away.
- Playback speed uses native `HTMLAudioElement.playbackRate`; no third-party JavaScript library is needed for the first implementation.

## Recommended Architecture

Move the reusable bottom-player behavior out of generated inline scripts into `static/lesson-player.js`. Each generated analysis page will provide only page-specific data through `window.NCE_LESSON_PLAYER`, including subtitles, previous lesson href, and next lesson href, then load the shared script.

Keep styling either in generated CSS or a small shared stylesheet. The implementation should prefer shared CSS if it can be introduced without disrupting the existing generated page appearance.

## Player UI

The bottom dock keeps the existing play/pause button, subtitle line, progress track, current time, duration, and lesson title. It adds:

- Previous lesson button, disabled on the first lesson in that book.
- Next lesson button, disabled on the last lesson in that book.
- Continuous playback checkbox.
- Loop playback checkbox.
- Speed select with `0.75x`, `1x`, `1.25x`, `1.5x`, and `2x`.

The controls must fit on desktop and mobile without overlapping text. Mobile may wrap controls to a second row.

## State Persistence

Use `localStorage` for user preferences:

- Continuous playback enabled/disabled.
- Loop playback enabled/disabled.
- Selected playback speed.

Use `sessionStorage` only for the transient auto-start signal when continuous playback navigates to the next lesson. This avoids starting unrelated lessons later.

## Page Data

Each generated page should define:

```js
window.NCE_LESSON_PLAYER = {
  subtitles: [{ index: 1, start: 0, end: 2.5, text: "Example sentence." }],
  previousHref: "001&002-Example.analysis.html",
  nextHref: "005&006-Example.analysis.html"
};
```

`previousHref` and `nextHref` are relative hrefs inside the same book HTML directory. First and last lessons use `null` for the missing side.

## Generator Scope

Update all generation/update paths that produce analysis pages:

- `tools/generate_nce1_1_20_html.mjs`
- `tools/generate_nce2_html.mjs`
- `tools/generate_nce4_html.mjs`
- `tools/update_nce3_html_player.mjs`

Regenerate or update all existing committed analysis pages after changing the templates:

- `NCE1/html/*.analysis.html`
- `NCE2/html/*.analysis.html`
- `NCE3/html/*.analysis.html`
- `NCE4/html/*.analysis.html`

Do not commit `.ipa-cache.json` or `.translation-cache.json` files.

## Verification

Extend `tools/verify_html_players.mjs` so it verifies every analysis page has:

- Shared player script reference.
- Page-specific `window.NCE_LESSON_PLAYER` data.
- Previous and next lesson controls.
- Continuous playback checkbox.
- Loop playback checkbox.
- Playback speed select.
- End-of-audio behavior for loop and continuous playback.
- Valid previous/next hrefs for first, middle, and last lessons.

Keep the existing checks that protect sentence play buttons, sentence pause/resume buttons, subtitle counts, `whenAudioReady`, and avoiding `audio.load()` resets.

Run relevant verification after regeneration:

```bash
node tools/verify_html_players.mjs
node tools/verify_nce1_player.mjs
node tools/verify_nce1_analysis_fields.mjs
```

## Out Of Scope

- Replacing the audio UI with a third-party player library.
- Sentence-level loop mode.
- Whole-book loop mode.
- Changing analysis text or grammar output.
