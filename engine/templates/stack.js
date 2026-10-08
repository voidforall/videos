// Monotonic-stack walk. The template simulates the stack from the steps, so the spec only
// says when to move i, push, or pop; results fill in automatically on each pop.
// props: { title, problem?, values: [...], resultMode: "value" | "distance", resultDefault?,
//          stackLabel?, steps: [{ at, i?, ops?: ["pop" | "push", ...], note? }] }
// Several ops in one step run 0.6 s apart.
registerTemplate("stack", {
  render(props, { esc }) {
    const g = stackGeometry(props.values.length);
    const fallback = props.resultDefault ?? -1;
    return `
      ${props.problem ? `<p class="sk-problem">${esc(props.problem)}</p>` : ""}
      ${props.values.map((v, i) => `
        <span class="ar-idx sk-idx" style="left:${g.cellX(i)}px">${i}</span>
        <span class="ar-cell sk-cell sk-c${i}" style="left:${g.cellX(i)}px">${esc(v)}</span>
        <span class="sk-res sk-r${i}" style="left:${g.cellX(i)}px"><b class="sk-res-default">${esc(fallback)}</b></span>`).join("")}
      <span class="label sk-res-label" style="left:${g.cellX(0)}px">result</span>
      <span class="ar-ptr sk-ptr" style="left:${g.cellX(0)}px">▲ i</span>
      <div class="card sk-column"><p class="label">${esc(props.stackLabel ?? "Stack · top ↑")}</p></div>
      ${props.values.map((v, i) => `<div class="sk-item sk-item-${i}"><b>${esc(v)}</b><span>idx ${i}</span></div>`).join("")}
      <div class="card paper sk-note"><p class="label">Step</p><div class="ar-slot">${props.steps.map((s, i) => (s.note ? `<span class="ar-swap sk-note-${i}">${esc(s.note)}</span>` : "")).join("")}</div></div>`;
  },
  build({ tl, fx, q, cue, props }) {
    const n = props.values.length;
    const g = stackGeometry(n);
    const MIN_GAP = 0.5;
    const OP_GAP = 0.6;
    const stack = [];
    let i = null;
    let prevAt = -Infinity;
    let shownNote = null;
    const resultOf = (j, at) => (props.resultMode === "distance" ? at - j : props.values[at]);

    if (props.problem) fx.in(q(".sk-problem"), 0.3, { y: 10 });
    fx.in(q(".sk-cell"), 0.45, { y: 16, stagger: 0.05, dur: 0.45 })
      .in([...q(".sk-idx"), ...q(".sk-res"), ...q(".sk-res-label")], 0.7, { y: 0, dur: 0.4 })
      .in([...q(".sk-column"), ...q(".sk-note")], 0.9, { y: 18, stagger: 0.1 });
    gsap.set([...q(".sk-ptr"), ...q(".sk-item")], { autoAlpha: 0 });

    props.steps.forEach((s, k) => {
      const at = cue(s.at);
      if (at - prevAt < MIN_GAP) throw new Error(`stack: step "${s.at}" is ${(at - prevAt).toFixed(2)}s after the previous step (min ${MIN_GAP}s)`);
      prevAt = at + Math.max(0, (s.ops?.length ?? 0) - 1) * OP_GAP;

      if (s.i != null) {
        if (!(s.i >= 0 && s.i < n)) throw new Error(`stack: step "${s.at}": i = ${s.i} out of range`);
        const x = g.step * s.i + g.cell / 2 - 50;
        if (i == null) tl.fromTo(q(".sk-ptr"), { autoAlpha: 0, x, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.4, immediateRender: false }, at);
        else tl.to(q(".sk-ptr"), { x, duration: 0.45, ease: "power2.inOut" }, at);
        if (i != null) tl.to(q(`.sk-c${i}`), { borderColor: "rgba(20,20,19,0.2)", duration: 0.3 }, at);
        tl.to(q(`.sk-c${s.i}`), { borderColor: "#141413", duration: 0.3 }, at);
        i = s.i;
      }

      (s.ops ?? []).forEach((op, j) => {
        const t = at + j * OP_GAP;
        if (i == null) throw new Error(`stack: step "${s.at}": ${op} before any i`);
        if (op === "push") {
          if (stack.includes(i)) throw new Error(`stack: index ${i} pushed twice`);
          const y = g.itemY(stack.length);
          tl.fromTo(q(`.sk-item-${i}`), { autoAlpha: 0, y: y - 60 }, { autoAlpha: 1, y, duration: 0.45, ease: "power3.out", immediateRender: false }, t);
          stack.push(i);
        } else if (op === "pop") {
          const top = stack.pop();
          if (top == null) throw new Error(`stack: step "${s.at}": pop from an empty stack`);
          tl.to(q(`.sk-item-${top}`), { autoAlpha: 0, x: -60, duration: 0.4, ease: "power2.in" }, t);
          tl.to(q(`.sk-r${top} .sk-res-default`), { autoAlpha: 0, duration: 0.2 }, t + 0.15);
          const value = document.createElement("b");
          value.className = "sk-res-value";
          value.textContent = resultOf(top, i);
          q(`.sk-r${top}`)[0].appendChild(value);
          tl.fromTo(value, { autoAlpha: 0, y: -14 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: "power3.out" }, t + 0.25);
          tl.to(q(`.sk-r${top}`), { borderColor: "#cc785c", duration: 0.3 }, t + 0.25);
        } else {
          throw new Error(`stack: unknown op "${op}"`);
        }
      });

      if (s.note) {
        if (shownNote) fx.out(shownNote, at - 0.05, { dur: 0.15 });
        shownNote = q(`.sk-note-${k}`);
        fx.in(shownNote, at + 0.1, { y: 10, dur: 0.35 });
      }
    });
  },
});

function stackGeometry(n) {
  const cell = 124;
  const gap = 16;
  const step = cell + gap;
  const area = { left: 80, width: 1280 }; // the stack column owns the right side of the frame
  const startX = Math.round(area.left + (area.width - (n * step - gap)) / 2);
  // stack items: absolutely positioned in the column, bottom-up from y = 760
  return { cell, gap, step, startX, cellX: (i) => startX + i * step, itemY: (depth) => 760 - depth * 84 };
}
