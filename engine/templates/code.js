// A code surface with a numbered note rail; each highlight lights its lines and adds a note.
// props: { title, file, tag?, code, lang?: "cpp" | "python", size?, width?, highlights: [{ at, lines: "2-3" | "2,6", note }] }
// Code taller than the frame scrolls: each highlight brings its lines to the middle of a fixed window.
registerTemplate("code", {
  render(props, { esc }) {
    const width = props.width ?? 1060;
    const lines = highlightCode(props.code, props.lang);
    const g = codeGeometry(props);
    const body = lines.map((l, i) => `<span class="ln cd-l${i + 1}"><i class="cd-num">${i + 1}</i>${l || " "}</span>`).join("");
    return `
      <section class="code cd-panel" style="width:${width}px">
        <div class="code-head"><span>${esc(props.file)}</span>${props.tag ? `<span>${esc(props.tag)}</span>` : ""}</div>
        <div class="code-body${g.scroll ? " cd-window" : ""}" style="font-size:${g.size}px${g.scroll ? `;height:${g.windowHeight}px` : ""}">${
          g.scroll ? `<div class="cd-scroll">${body}</div><div class="cd-track"><div class="cd-thumb" style="height:${g.thumb}%"></div></div>` : body}</div>
      </section>
      <ol class="cd-notes" style="left:${80 + width + 40}px">
        ${props.highlights.map((h, i) => `
          <li class="cd-note cd-n${i}"><span class="cd-badge">${i + 1}</span><span>${h.note}</span>
          <code>${esc(h.lines.includes(",") || h.lines.includes("-") ? `lines ${h.lines}` : `line ${h.lines}`)}</code></li>`).join("")}
      </ol>`;
  },
  build({ tl, fx, q, cue, props }) {
    const total = props.code.split("\n").length;
    const select = (spec) => spec.split(",").flatMap((part) => {
      const [a, b = a] = part.split("-").map(Number);
      if (!(a >= 1 && b <= total && a <= b)) throw new Error(`code: bad line range "${spec}"`);
      return Array.from({ length: b - a + 1 }, (_, k) => q(`.cd-l${a + k}`)[0]);
    });
    fx.in(q(".cd-panel"), 0.35, { y: 22 });
    const g = codeGeometry(props);
    const lineNos = (spec) => spec.split(",").flatMap((part) => part.split("-").map(Number));
    let top = 0;
    let prev = null;
    props.highlights.forEach((h, i) => {
      const at = cue(h.at);
      const lines = select(h.lines);
      if (g.scroll) {
        const nos = lineNos(h.lines);
        const mid = (Math.min(...nos) + Math.max(...nos)) / 2;
        const next = Math.max(0, Math.min(total - g.visible, Math.round(mid - g.visible / 2 - 0.5)));
        if (next !== top) {
          tl.to(q(".cd-scroll"), { y: -next * g.lineHeight, duration: 0.6, ease: "power2.inOut" }, at - 0.35);
          tl.to(q(".cd-thumb"), { y: (next / total) * g.trackHeight, duration: 0.6, ease: "power2.inOut" }, at - 0.35);
          top = next;
        }
      }
      if (prev) fx.unhl(prev.lines, at - 0.1).to(q(`.cd-n${prev.i}`), at - 0.1, { opacity: 0.45, duration: 0.3 });
      fx.hl(lines, at).in(q(`.cd-n${i}`), at - 0.05, { x: 18, y: 0 });
      prev = { lines, i };
    });
  },
});

// Lines fit between the panel top (y 222) and the caption band; beyond that the body scrolls.
function codeGeometry(props) {
  const size = props.size ?? 23;
  const lineHeight = size * 1.6;
  const total = props.code.split("\n").length;
  const visible = Math.floor((870 - 222 - 58 - 40) / lineHeight);
  const scroll = total > visible;
  const windowHeight = Math.round(visible * lineHeight + 40);
  const trackHeight = windowHeight - 40;
  return { size, lineHeight, total, visible, scroll, windowHeight, trackHeight, thumb: (visible / total) * 100 };
}
