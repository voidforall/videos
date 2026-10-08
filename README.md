# Videos

Short revision episodes (algorithms, C++, Python, system design) for the notes in [ai-docs](https://github.com/voidforall/ai-docs): one clip per
question, each opening with the question and a pause to answer out loud before the explanation.

**Watch:** https://voidforall.github.io/videos/

## Layout

| Path | What |
|:---|:---|
| [`engine/`](engine/) | Shared episode engine: templates, runtime, build / render / publish tools. Start with its README. |
| [`episodes/<slug>/episode.json`](episodes/) | One spec per ai-docs note. The only file you write for a new episode. |
| [`docs/`](docs/) | GitHub Pages index, rendered from `docs/catalog.json`. |
| [`cpp-oop-walkthrough/`](cpp-oop-walkthrough/), [`cpp-functional-walkthrough/`](cpp-functional-walkthrough/) | Earlier long-form videos (HyperFrames and a standalone HTML project). |

Videos and posters are **not** stored in git: each episode is a GitHub Release (`ep-<slug>`), and the
catalog links to its assets. `npm run publish -- <slug>` uploads them and updates the catalog.

## Quick start

```bash
npm install
npm run build   -- algorithm-sliding-window   # narration + timings (Kokoro TTS, whisper)
npm run dev                                   # preview: /engine/player.html?ep=algorithm-sliding-window&clip=01
npm run render  -- algorithm-sliding-window
npm run publish -- algorithm-sliding-window
```

Requires Node.js 22, `ffmpeg`, `whisper-cli`, and a Python environment at `.venv/` with `kokoro-onnx`.
