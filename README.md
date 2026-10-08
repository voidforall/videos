# Videos

Short technical explainers generated with code-driven animation and local text-to-speech.

## Published videos

- **C++ functional programming walkthrough** — a 4:12 review of pure functions, higher-order locking, `std::function` type erasure, lambda captures, mutable, recursive, and generic lambdas. Built with plain HTML + GSAP; see [`cpp-functional-walkthrough/`](cpp-functional-walkthrough/).
- **C++ OOP interview walkthrough** — a 3:27 review of ownership, interfaces, inheritance, composition, PImpl, initialization, object traits, and covariant returns.

The public player is deployed from [`docs/`](docs/) with GitHub Pages. The OOP video's editable HyperFrames project lives in [`cpp-oop-walkthrough/`](cpp-oop-walkthrough/).

## Local development

The project expects Node.js 22 and a Python environment at `.venv/` with the local Kokoro TTS dependencies.

```bash
cd cpp-oop-walkthrough
npm install
npm run dev
```
