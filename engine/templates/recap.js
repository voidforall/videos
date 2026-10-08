// Numbered takeaways, one row per cue, closing with the ✱ sign-off.
// props: { title, items: [{ at, text, code? }] }
registerTemplate("recap", {
  render(props, { esc }) {
    if (props.items.length > 5) throw new Error("recap: at most 5 items");
    return `
      <ol class="rc-list">
        ${props.items.map((it, i) => `
          <li class="card paper rc-row rc-${i}">
            <span class="rc-num">${String(i + 1).padStart(2, "0")}</span>
            <span class="rc-text">${it.text}</span>
            ${it.code ? `<code class="rc-code">${esc(it.code)}</code>` : ""}
          </li>`).join("")}
      </ol>
      <p class="rc-sign">✱</p>`;
  },
  build({ fx, q, cue, props }) {
    props.items.forEach((it, i) => fx.in(q(`.rc-${i}`), cue(it.at) - 0.2, { x: -18, y: 0 }));
    fx.in(q(".rc-sign"), cue("end") + 0.2, { y: 0, scale: 0.92 });
  },
});
