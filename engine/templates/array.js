// Two-pointer / sliding-window walk over an array. The window box and the left/right
// pointers glide between cells; state, note, and result panels swap on each step.
// props: { title, problem?, values: [...], stateLabel, resultLabel,
//          steps: [{ at, l?, r?, mark?: "ok" | "bad", state?, note?, result? }] }
registerTemplate("array", {
  render(props, { esc }) {
    const g = arrayGeometry(props.values.length);
    const swaps = (key) => props.steps.map((s, i) => (s[key] != null ? `<span class="ar-swap ar-${key}-${i}">${esc(s[key])}</span>` : "")).join("");
    return `
      ${props.problem ? `<p class="ar-problem">${esc(props.problem)}</p>` : ""}
      ${props.values.map((v, i) => `
        <span class="ar-idx" style="left:${g.cellX(i)}px">${i}</span>
        <span class="ar-cell ar-c${i}" style="left:${g.cellX(i)}px">${esc(v)}</span>`).join("")}
      <div class="ar-window" style="left:${g.cellX(0) - g.pad}px"></div>
      <span class="ar-ptr ar-left" style="left:${g.cellX(0)}px">▲ left</span>
      <span class="ar-ptr ar-right" style="left:${g.cellX(0)}px">▲ right</span>
      <div class="card ar-panel ar-state"><p class="label">${esc(props.stateLabel ?? "Window")}</p><div class="ar-slot">${swaps("state")}</div></div>
      <div class="card paper ar-panel ar-note"><p class="label">Step</p><div class="ar-slot">${swaps("note")}</div></div>
      <div class="card paper ar-panel ar-result"><p class="label">${esc(props.resultLabel ?? "Result")}</p><div class="ar-slot">${swaps("result")}</div></div>`;
  },
  build({ tl, fx, q, cue, props }) {
    const g = arrayGeometry(props.values.length);
    const COLORS = { ok: "#5db872", bad: "#c64545", none: "#cc785c" };
    const win = q(".ar-window")[0];
    const [ptrL, ptrR] = [q(".ar-left")[0], q(".ar-right")[0]];
    const dimmed = props.values.map(() => false);
    const shown = {};
    let placed = false;

    if (props.problem) fx.in(q(".ar-problem"), 0.3, { y: 10 });
    fx.in(q(".ar-cell"), 0.45, { y: 16, stagger: 0.05, dur: 0.45 })
      .in(q(".ar-idx"), 0.7, { y: 0, dur: 0.4 })
      .in(q(".ar-panel"), 0.9, { y: 18, stagger: 0.1 });

    const MIN_GAP = 0.5; // panel swaps need this long to finish before the next one starts
    let prevAt = -Infinity;
    props.steps.forEach((s, i) => {
      const at = cue(s.at);
      if (at - prevAt < MIN_GAP) throw new Error(`array: step "${s.at}" is ${(at - prevAt).toFixed(2)}s after the previous step (min ${MIN_GAP}s)`);
      prevAt = at;
      if (s.l != null && s.r != null) {
        if (!(s.l >= 0 && s.r < props.values.length && s.l <= s.r)) throw new Error(`array: bad window [${s.l}, ${s.r}]`);
        const box = { x: g.step * s.l, width: g.step * (s.r - s.l + 1) - g.gap + g.pad * 2 };
        const ptr = arrayPointerX(g, s.l, s.r);
        if (!placed) {
          tl.fromTo(win, { autoAlpha: 0, ...box, scale: 1.04 }, { autoAlpha: 1, scale: 1, duration: 0.4, ease: "power2.out" }, at);
          tl.fromTo([ptrL, ptrR], { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.4 }, at);
          tl.set(ptrL, { x: ptr.l }, at);
          tl.set(ptrR, { x: ptr.r }, at);
          placed = true;
        } else {
          tl.to(win, { ...box, duration: 0.45, ease: "power2.inOut" }, at);
          tl.to(ptrL, { x: ptr.l, duration: 0.45, ease: "power2.inOut" }, at);
          tl.to(ptrR, { x: ptr.r, duration: 0.45, ease: "power2.inOut" }, at);
        }
        props.values.forEach((_, k) => {
          const dim = k < s.l;
          if (dim !== dimmed[k]) tl.to(q(`.ar-c${k}`), { opacity: dim ? 0.32 : 1, duration: 0.35 }, at);
          dimmed[k] = dim;
        });
        tl.to(win, { borderColor: COLORS[s.mark ?? "none"], duration: 0.25 }, at);
      } else if (s.mark) {
        tl.to(win, { borderColor: COLORS[s.mark], duration: 0.25 }, at);
      }
      ["state", "note", "result"].forEach((key) => {
        if (s[key] == null) return;
        if (shown[key]) fx.out(shown[key], at - 0.05, { dur: 0.15 });
        shown[key] = q(`.ar-${key}-${i}`);
        fx.in(shown[key], at + 0.1, { y: 10, scale: key === "result" ? 0.9 : 1, dur: 0.35 });
      });
    });
  },
});

function arrayGeometry(n) {
  const cell = 124;
  const gap = 16;
  const step = cell + gap;
  const startX = Math.round((1920 - (n * step - gap)) / 2);
  return { cell, gap, step, pad: 10, startX, cellX: (i) => startX + i * step };
}

// pointer chips are 100px wide; when both sit on one cell they split around its center
function arrayPointerX(g, l, r) {
  const center = (i) => i * g.step + g.cell / 2;
  if (l === r) return { l: center(l) - 104, r: center(r) + 4 };
  return { l: center(l) - 50, r: center(r) - 50 };
}
