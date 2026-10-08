// A row of 2–4 cards revealed on cues.
// props: { title, items: [{ at, label?, title, body?, code? }] }
registerTemplate("points", {
  render(props, { esc }) {
    const n = props.items.length;
    if (n < 1 || n > 4) throw new Error(`points: expected 1–4 items, got ${n}`);
    return `
      <div class="pt-grid" style="--cols:${n}">
        ${props.items.map((it, i) => `
          <article class="card pt-card pt-${i}">
            ${it.label ? `<p class="label">${esc(it.label)}</p>` : ""}
            <p class="pt-title">${it.title}</p>
            ${it.body ? `<p class="pt-body">${it.body}</p>` : ""}
            ${it.code ? `<code class="pt-code">${esc(it.code)}</code>` : ""}
          </article>`).join("")}
      </div>`;
  },
  build({ fx, q, cue, props }) {
    props.items.forEach((it, i) => fx.in(q(`.pt-${i}`), cue(it.at) - 0.15, { y: 24 }));
  },
});
