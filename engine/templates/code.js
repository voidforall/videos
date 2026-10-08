// A code surface with a numbered note rail; each highlight lights its lines and adds a note.
// props: { title, file, tag?, code, size?, width?, highlights: [{ at, lines: "2-3" | "2,6", note }] }
registerTemplate("code", {
  render(props, { esc }) {
    const width = props.width ?? 1060;
    const lines = highlightCode(props.code);
    return `
      <section class="code cd-panel" style="width:${width}px">
        <div class="code-head"><span>${esc(props.file)}</span>${props.tag ? `<span>${esc(props.tag)}</span>` : ""}</div>
        <div class="code-body" style="font-size:${props.size ?? 23}px">${lines.map((l, i) =>
          `<span class="ln cd-l${i + 1}"><i class="cd-num">${i + 1}</i>${l || " "}</span>`).join("")}</div>
      </section>
      <ol class="cd-notes" style="left:${80 + width + 40}px">
        ${props.highlights.map((h, i) => `
          <li class="cd-note cd-n${i}"><span class="cd-badge">${i + 1}</span><span>${h.note}</span>
          <code>${esc(h.lines.includes(",") || h.lines.includes("-") ? `lines ${h.lines}` : `line ${h.lines}`)}</code></li>`).join("")}
      </ol>`;
  },
  build({ fx, q, cue, props }) {
    const total = props.code.split("\n").length;
    const select = (spec) => spec.split(",").flatMap((part) => {
      const [a, b = a] = part.split("-").map(Number);
      if (!(a >= 1 && b <= total && a <= b)) throw new Error(`code: bad line range "${spec}"`);
      return Array.from({ length: b - a + 1 }, (_, k) => q(`.cd-l${a + k}`)[0]);
    });
    fx.in(q(".cd-panel"), 0.35, { y: 22 });
    let prev = null;
    props.highlights.forEach((h, i) => {
      const at = cue(h.at);
      const lines = select(h.lines);
      if (prev) fx.unhl(prev.lines, at - 0.1).to(q(`.cd-n${prev.i}`), at - 0.1, { opacity: 0.45, duration: 0.3 });
      fx.hl(lines, at).in(q(`.cd-n${i}`), at - 0.05, { x: 18, y: 0 });
      prev = { lines, i };
    });
  },
});
