// Pointer walk over an array: sliding windows, two pointers, binary search.
// The range box spans [l, r]; pointer chips (l, r, optional m) glide between cells and
// spread out when they share a cell. l = r + 1 shows crossed pointers with no box.
// props: { title, problem?, values: [...], stateLabel, resultLabel,
//          pointers?: { l: "left", r: "right", m: "mid" },
//          steps: [{ at, l?, r?, m?, mark?: "ok" | "bad", state?, note?, result? }] }
registerTemplate("array", {
  render(props, { esc }) {
    const g = arrayGeometry(props.values.length);
    const names = { l: "left", r: "right", m: "mid", ...props.pointers };
    const swaps = (key) => props.steps.map((s, i) => (s[key] != null ? `<span class="ar-swap ar-${key}-${i}">${esc(s[key])}</span>` : "")).join("");
    return `
      ${props.problem ? `<p class="ar-problem">${esc(props.problem)}</p>` : ""}
      ${props.values.map((v, i) => `
        <span class="ar-idx" style="left:${g.cellX(i)}px">${i}</span>
        <span class="ar-cell ar-c${i}" style="left:${g.cellX(i)}px">${esc(v)}</span>`).join("")}
      <div class="ar-window" style="left:${g.cellX(0) - g.pad}px"></div>
      ${["l", "r", "m"].map((k) => `<span class="ar-ptr ar-ptr-${k}" style="left:${g.cellX(0)}px">▲ ${esc(names[k])}</span>`).join("")}
      <div class="card ar-panel ar-state"><p class="label">${esc(props.stateLabel ?? "Window")}</p><div class="ar-slot">${swaps("state")}</div></div>
      <div class="card paper ar-panel ar-note"><p class="label">Step</p><div class="ar-slot">${swaps("note")}</div></div>
      <div class="card paper ar-panel ar-result"><p class="label">${esc(props.resultLabel ?? "Result")}</p><div class="ar-slot">${swaps("result")}</div></div>`;
  },
  build({ tl, fx, q, cue, props }) {
    const n = props.values.length;
    const g = arrayGeometry(n);
    const COLORS = { ok: "#5db872", bad: "#c64545", none: "#cc785c" };
    const MIN_GAP = 0.5; // panel swaps need this long to finish before the next one starts
    const win = q(".ar-window")[0];
    const chips = { l: q(".ar-ptr-l")[0], r: q(".ar-ptr-r")[0], m: q(".ar-ptr-m")[0] };
    const pos = { l: null, r: null, m: null };
    const dimmed = props.values.map(() => false);
    const shown = {};
    let boxShown = false;
    let prevAt = -Infinity;

    if (props.problem) fx.in(q(".ar-problem"), 0.3, { y: 10 });
    fx.in(q(".ar-cell"), 0.45, { y: 16, stagger: 0.05, dur: 0.45 })
      .in(q(".ar-idx"), 0.7, { y: 0, dur: 0.4 })
      .in(q(".ar-panel"), 0.9, { y: 18, stagger: 0.1 });
    gsap.set([win, ...Object.values(chips)], { autoAlpha: 0 });

    props.steps.forEach((s, i) => {
      const at = cue(s.at);
      if (at - prevAt < MIN_GAP) throw new Error(`array: step "${s.at}" is ${(at - prevAt).toFixed(2)}s after the previous step (min ${MIN_GAP}s)`);
      prevAt = at;

      const rangeChanged = s.l != null || s.r != null;
      const next = { l: s.l ?? pos.l, r: s.r ?? pos.r, m: s.m ?? pos.m };
      if (rangeChanged && (next.l == null || next.r == null)) throw new Error(`array: step "${s.at}" needs both l and r the first time`);
      for (const k of ["l", "r", "m"]) {
        if (next[k] != null && !(next[k] >= 0 && next[k] < n)) throw new Error(`array: step "${s.at}": ${k} = ${next[k]} out of range`);
      }
      if (next.l != null && next.l > next.r + 1) throw new Error(`array: step "${s.at}": l may exceed r by at most 1`);

      // range box: visible while l <= r, hidden once the pointers have crossed
      if (rangeChanged) {
        const open = next.l <= next.r;
        if (open) {
          const box = { x: g.step * next.l, width: g.step * (next.r - next.l + 1) - g.gap + g.pad * 2 };
          if (!boxShown) tl.fromTo(win, { autoAlpha: 0, ...box, scale: 1.04 }, { autoAlpha: 1, scale: 1, duration: 0.4, ease: "power2.out", immediateRender: false }, at);
          else tl.to(win, { ...box, duration: 0.45, ease: "power2.inOut" }, at);
        } else if (boxShown) {
          tl.to(win, { autoAlpha: 0, duration: 0.3 }, at);
        }
        boxShown = open;
        props.values.forEach((_, k) => {
          const dim = k < next.l || k > next.r;
          if (dim !== dimmed[k]) tl.to(q(`.ar-c${k}`), { opacity: dim ? 0.32 : 1, duration: 0.35 }, at);
          dimmed[k] = dim;
        });
      }
      if (rangeChanged || s.mark) tl.to(win, { borderColor: COLORS[s.mark ?? "none"], duration: 0.25 }, at);

      // pointer chips: chips that share a cell stack downward in l, m, r order
      const before = arrayPointerPos(g, pos);
      const after = arrayPointerPos(g, next);
      for (const k of ["l", "r", "m"]) {
        if (next[k] == null) continue;
        if (pos[k] == null) {
          tl.fromTo(chips[k], { autoAlpha: 0, x: after[k].x, y: after[k].y + 10 }, { autoAlpha: 1, y: after[k].y, duration: 0.4, immediateRender: false }, at);
        } else if (after[k].x !== before[k].x || after[k].y !== before[k].y) {
          tl.to(chips[k], { x: after[k].x, y: after[k].y, duration: 0.45, ease: "power2.inOut" }, at);
        }
      }
      Object.assign(pos, next);

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

// chip offsets relative to cell 0; chips sharing a cell stack downward in l, m, r order
function arrayPointerPos(g, pos) {
  const CHIP = 100;
  const ROW = 30;
  const byCell = {};
  for (const k of ["l", "m", "r"]) if (pos[k] != null) (byCell[pos[k]] ??= []).push(k);
  const out = {};
  for (const [cell, keys] of Object.entries(byCell)) {
    keys.forEach((k, j) => (out[k] = { x: Number(cell) * g.step + g.cell / 2 - CHIP / 2, y: j * ROW }));
  }
  return out;
}
