# Episode engine

Turns an `episodes/<slug>/episode.json` spec into short revision clips (one per question).
Plain HTML + GSAP rendered in headless Chrome; narration is local Kokoro TTS; captions use whisper
word timings. Media is published to GitHub Releases — **never commit MP4s or posters**.

## Workflow

New series: add `{ id, title, blurb }` to `docs/catalog.json` → `series` first.

```bash
npm run build   -- <slug> [clip ...]        # TTS (cached per line) + whisper → build/<clip>/timing.json, narration.wav
npm run dev                                 # http://127.0.0.1:4410/engine/player.html?ep=<slug>&clip=01  (audio + scrubber, &t=12 jumps)
npm run snap    -- <slug> <clip> scenes     # end-of-scene stills → build/<clip>/snaps/  (or pass seconds)
npm run render  -- <slug> [clip ...]        # → build/<clip>/clip.mp4 + poster.jpg
npm run publish -- <slug>                   # upload to release ep-<slug>, upsert docs/catalog.json
```

Then commit the spec + `docs/catalog.json`. `episodes/*/build/` is gitignored and reproducible.

## Spec

```jsonc
{
  "slug": "algorithm-sliding-window",
  "series": "algorithm",                          // must exist in docs/catalog.json "series"
  "title": "Sliding window",
  "kicker": "Algorithm · Sliding window",          // top-left label on every scene
  "source": "https://github.com/voidforall/ai-docs/blob/main/…",
  "summary": "One sentence for the index page.",
  "captionFixes": [{ "match": ["O", "of", "n"], "display": "O(N)" }],  // whisper → on-screen text
  "clips": [{
    "id": "01", "title": "Why a window?", "question": "…",
    "scenes": [{ "type": "question", "say": "Narration…", "pauseAfter": 3, "props": { … } }]
  }]
}
```

Each scene has exactly one narration line (`say`). Scenes animate on **cues** — words in that line:
`"expand"`, `"expand#2"` (2nd occurrence), `"expand+0.5"` (offset seconds), `"start"`, `"end"`.
Number words and digits match each other (`"eight"` = `"8"`). A cue that is not in the transcript
throws, so a wording change can never silently desync a scene — the snap/render step fails loudly.

Caption fixes ignore case and punctuation. A display with the same word count (`"Right expands"`
for `["Write", "expands"]`) keeps per-word timing; otherwise the run collapses into one word.
Global fixes live in `engine/caption-fixes.json`.

## Templates (`engine/templates/`)

| type | props | use for |
|:---|:---|:---|
| `question` | `question` (HTML), `label?`, `pauseLabel?` · scene `pauseAfter` | Clip opener: ask, then a draining pause bar to answer out loud. For a "Your turn" before code: `label: "Your turn"`, `pauseLabel: "Pause · write it yourself"`, `pauseAfter: 10` |
| `statement` | `text`, `at?`, `sub?`, `subAt?` | One key fact or stance |
| `points` | `title`, `items[{ at, label?, title, body?, code? }]` (1–4) | Definitions, steps, options |
| `compare` | `title`, `lang?`, `left`/`right` `{ at, label, title, tone?, code?, body? }`, `verdict?{ at, text, code? }` | Before/after, A vs B |
| `code` | `title`, `file`, `tag?`, `code`, `lang?` (cpp\|python), `size?`, `width?`, `highlights[{ at, lines: "2-3" \| "2,6", note }]` | Walking through an implementation. Code taller than the frame scrolls automatically, centring each highlight |
| `array` | `title`, `problem?`, `values`, `stateLabel`, `resultLabel`, `pointers?{ l, r, m }` (labels), `steps[{ at, l?, r?, m?, mark?: ok\|bad, state?, note?, result? }]` | Sliding window, two pointers, binary search (`m` = mid; `l = r + 1` shows crossed pointers). Steps ≥ 0.5 s apart |
| `stack` | `title`, `problem?`, `values`, `resultMode: value\|distance`, `resultDefault?`, `stackLabel?`, `steps[{ at, i?, ops?: [push\|pop…], note? }]` | Monotonic stack: the template simulates pushes/pops and fills results on each pop |
| `graph` | `title`, `directed?`, `nodes[{ id, label?, x, y, w?, h?, hidden? }]` (w/h → box) (frame px; area x 80–1180, y 230–740), `edges[{ from, to, w? }]`, `panels[{ key, label, type: table\|list, initial }]`, `steps[{ at, note?, nodes?{ id: active\|done\|queued\|dim\|base }, edges?{ "u-v": relax\|tree\|dim\|base }, panels?{ key: {id: v} \| [..] }, show?[id], add?, remove?, move?{ id: [x, y] } }]` (list panels: `rows?`; table panels: `columns?`) | Dijkstra, BFS/DFS, topological sort, union-find forests, architecture diagrams (box nodes, empty `panels` for full width). Edges follow moved nodes; `u→v` + `v→u` draw side by side (request / response); steps ≥ 0.5 s apart |
| `ring` | `title`, `servers[{ id, pos, group?, label?, hidden? }]`, `keys[{ id, pos, label?, hidden? }]` (pos 0–100 clockwise from the top), `load?{ label? }`, `steps[{ at, note?, show?[id], remove?[serverId \| group], lookup?[keyId] }]` | Consistent hashing: the template computes key ownership (next server clockwise), recolours moved keys, and counts keys per group; virtual nodes share a `group`. Steps ≥ 0.5 s apart |
| `book` | `title`, `book[{ id, side: buy\|sell, price, qty }]` (resting, FIFO per price), `prices?`, `cancel?: eager\|lazy`, `steps[{ at, note?, order?{ id, side, price, qty }, fills?[cue…], pace?, cancel?: id }]` | Limit order books: the template runs price-time matching (fills, partial fills, remainder rests, tombstones) and drives the trades log, best bid/ask and incoming card. `fills` pins each fill to a narration cue |
| `recap` | `title`, `items[{ at, text, code? }]` (≤ 5) | Clip or episode close |

Titles accept inline `<em>` for the italic accent. Add a template by registering it in
`engine/templates/<type>.js` (`registerTemplate(type, { chrome?, render(props, { esc }), build({ tl, fx, q, cue, props }) })`),
styling it under `.tpl-<type>` in `styles/templates.css`, and loading it in `player.html`.

## Writing a clip

- Open with a `question` scene and `pauseAfter: 3–4` — the pause is the active-recall moment.
- Keep clips to 45–90 s; one idea per clip.
- Write narration for the ear: spell out symbols ("O of N", "C plus plus"), then fix captions.
- Cue on distinctive words, not on letters or list items whisper may spell differently.

Requires Node 22, `ffmpeg`, `whisper-cli`, the repo `.venv` (kokoro-onnx), and the Kokoro + whisper
models under `~/.cache/hyperframes/`.
