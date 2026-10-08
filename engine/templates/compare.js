// Two side-by-side panels (each may carry a code block) and an optional verdict bar.
// props: { title, left: Panel, right: Panel, verdict?: { at, text, code? } }
// Panel: { at, label, title, tone?: "good" | "bad", code?, body? }
registerTemplate("compare", {
  render(props, { esc }) {
    const panel = (p, side) => `
      <article class="card paper cmp-panel cmp-${side}">
        <p class="label">${esc(p.label)}</p>
        <p class="cmp-title ${p.tone ? `tone-${p.tone}` : ""}">${p.title}</p>
        ${p.code ? `<div class="code cmp-code"><div class="code-body">${highlightCode(p.code).map((l) => `<span class="ln">${l || " "}</span>`).join("")}</div></div>` : ""}
        ${p.body ? `<p class="cmp-body">${p.body}</p>` : ""}
      </article>`;
    const v = props.verdict;
    return `
      <div class="cmp-row">${panel(props.left, "left")}${panel(props.right, "right")}</div>
      ${v ? `<div class="card paper cmp-verdict"><p class="cmp-verdict-text">${v.text}</p>${v.code ? `<code>${esc(v.code)}</code>` : ""}</div>` : ""}`;
  },
  build({ fx, q, cue, props }) {
    fx.in(q(".cmp-left"), cue(props.left.at) - 0.2, { y: 24 })
      .in(q(".cmp-right"), cue(props.right.at) - 0.2, { y: 24 });
    if (props.verdict) fx.in(q(".cmp-verdict"), cue(props.verdict.at) - 0.2, { y: 16 });
  },
});
