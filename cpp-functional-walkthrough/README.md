# C++ functional programming walkthrough

A ~4 minute explainer built from [`interview/cpp-functional.md`](https://github.com/voidforall/ai-docs/blob/main/interview/cpp-functional.md),
in the same editorial style as `../cpp-oop-walkthrough` but with a plain HTML + GSAP pipeline (no HyperFrames).

## Pipeline

| Step | Command | Output |
|:---|:---|:---|
| Narration (Kokoro `bf_emma`, local) | `npm run tts [-- 03]` | `assets/voice/NN.wav` |
| Word timings + schedule (whisper-cli) | `npm run timeline` | `timing.js`, `build/narration.wav` |
| Preview with audio + scrubber | `npm run dev` | http://127.0.0.1:4410/ (`?t=90` jumps) |
| Stills for review | `node tools/snap.mjs 12 57.5` | `build/snaps/` |
| Final MP4 | `npm run render` | `renders/cpp-functional-walkthrough.mp4` |

- `script.json` is the narration source of truth; each line maps to one scene in `scenes/`.
- `caption-fixes.json` corrects whisper's spelling for on-screen captions (e.g. `std::function`).
- Scenes animate on narration cues: `cue("word", n)` returns the scene-local time of the n-th
  occurrence of a spoken word, so re-generating audio keeps animation in sync. A missing cue throws.
- `runtime.js` owns the master timeline, transitions, and karaoke captions; `styles/base.css` holds
  the shared tokens (cream / ink / coral, EB Garamond · Inter · JetBrains Mono, warm-navy code surface).

Requires Node 22, `ffmpeg`, `whisper-cli` with `~/.cache/hyperframes/whisper/models/ggml-small.en.bin`,
and the Kokoro ONNX model + voices under `~/.cache/hyperframes/tts/` (shared with the OOP project's `.venv`).
