// One large serif line (a stance or key fact) with an optional supporting sentence.
// props: { text, at?, sub?, subAt? }
registerTemplate("statement", {
  chrome: "minimal",
  render(props) {
    return `
      <h1 class="st-text">${props.text}</h1>
      ${props.sub ? `<p class="st-sub">${props.sub}</p>` : ""}`;
  },
  build({ fx, q, cue, props }) {
    fx.in(q(".st-text"), props.at ? cue(props.at) : cue("start"), { y: 26, dur: 0.9 });
    if (props.sub) fx.in(q(".st-sub"), props.subAt ? cue(props.subAt) : cue("start") + 1.2, { y: 12 });
  },
});
