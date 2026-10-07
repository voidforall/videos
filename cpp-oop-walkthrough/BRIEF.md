---
workflow: faceless-explainer
flow: automation
storyboard: no
message: "C++ OOP interview readiness comes from eight practical mental models and knowing when each one applies"
destination: github-pages
aspect: 1920x1080
language: en
audience: software engineers preparing for C++ interviews
length: 3m
angle: listicle
narration: yes
voice: bf_emma
---

## Intent

Create a brief walkthrough of the supplied C++ OOP interview document. Cover
the full shape of the material without reciting every code sample: orient the
viewer to the eight questions, state the decision rule behind each, and make
the result useful as a final interview-prep refresher.

## Assets

- `capture/extracted/visible-text.txt` — verbatim source document from `voidforall/ai-docs`, used as the factual source.

## Customizations

- Offline local Kokoro narration using the British English `bf_emma` voice.
- Captions for desktop and mobile viewing.
- Publish the final MP4 and a responsive player page to the `voidforall/videos` GitHub Pages site.

## Notes

- Keep the finished duration at approximately three minutes; the selected workflow has an approximately three-minute cap.
- No background music: prioritize speech clarity and keep the offline dependency footprint small.
- Do not turn the source into an exhaustive lecture. Favor memorable rules, contrasts, and interview-ready phrasing.
