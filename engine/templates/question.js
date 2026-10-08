// Active-recall opener: the question, then a draining "pause and answer" bar during the
// silence that follows the narration (scene.pauseAfter seconds).
registerTemplate("question", {
  chrome: "minimal",
  render(props) {
    return `
      <p class="q-label">Question</p>
      <h1 class="q-text">${props.question}</h1>
      <div class="q-pause">
        <p class="q-pause-label">Pause · answer out loud</p>
        <div class="q-track"><div class="q-bar"></div></div>
      </div>`;
  },
  build({ tl, fx, q, cue, scene }) {
    const pause = scene.pauseAfter ?? 0;
    fx.in(q(".q-label"), 0.15, { y: 10 }).in(q(".q-text"), 0.3, { y: 24, dur: 0.8 });
    if (pause > 0) {
      fx.in(q(".q-pause"), cue("end") - 0.2, { y: 12 });
      tl.fromTo(q(".q-bar"), { scaleX: 1 }, { scaleX: 0, duration: pause, ease: "none" }, cue("end"));
    } else {
      tl.set(q(".q-pause"), { autoAlpha: 0 }, 0);
    }
  },
});
