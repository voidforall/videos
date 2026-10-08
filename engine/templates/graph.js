// Graph walk: Dijkstra, BFS/DFS, topological sort, union-find forests.
// Nodes sit at frame coordinates; edges are SVG lines (arrowed when directed) that follow
// nodes when they move. Side panels show a per-node table (dist, in-degree, parent) and
// lists (heap, queue, order). Steps change node/edge states, panels, and structure.
// props: {
//   title, directed?: true,
//   nodes: [{ id, label?, x, y, w?, h?, hidden? }],     // centers, frame px; w/h make a box (memory layouts)
//   edges: [{ from, to, w? }],                           // key "from-to"
//   panels: [{ key, label, type: "table" | "list", initial: {id: v} | [..] }],
//   steps: [{ at, note?,
//             nodes?: { id: "active" | "done" | "queued" | "dim" | "base" },
//             edges?: { "u-v": "relax" | "tree" | "dim" | "base" },
//             panels?: { key: { id: v } (table, merged) | [..] (list, replaced) },
//             show?: [id], add?: [{ from, to, w? }], remove?: ["u-v"], move?: { id: [x, y] } }] }
// List panels take rows? (default 1) for taller content; table panels take columns? (default: sorted ids).
registerTemplate("graph", {
  render(props, { esc }) {
    const R = GRAPH_R;
    const edgeKeys = new Set();
    const allEdges = [...props.edges, ...props.steps.flatMap((s) => s.add ?? [])];
    const edgeSvg = allEdges.map((e) => {
      const key = `${e.from}-${e.to}`;
      if (edgeKeys.has(key)) return "";
      edgeKeys.add(key);
      return `<g class="gr-edge" data-key="${esc(key)}"><line /><polygon /></g>`;
    }).join("");
    const labels = allEdges.filter((e) => e.w != null).map((e) => `<span class="gr-w" data-key="${esc(`${e.from}-${e.to}`)}">${esc(e.w)}</span>`).join("");
    const panelHtml = props.panels.map((p) => {
      if (p.type === "table") {
        const ids = p.columns ?? props.nodes.map((n) => n.id).sort((x, y) => x.localeCompare(y, undefined, { numeric: true }));
        const cells = ids.map((id) => {
          const values = [p.initial?.[id] ?? "", ...props.steps.map((s) => s.panels?.[p.key]?.[id])];
          return `<div class="gr-col"><span class="gr-th">${esc(props.nodes.find((n) => n.id === id)?.label ?? id)}</span><span class="gr-td">${
            values.map((v, i) => (v == null ? "" : `<b class="gr-v" data-step="${i - 1}" data-id="${esc(id)}">${esc(v)}</b>`)).join("")}</span></div>`;
        }).join("");
        return `<div class="card paper gr-panel" data-panel="${esc(p.key)}"><p class="label">${esc(p.label)}</p><div class="gr-table">${cells}</div></div>`;
      }
      const lists = [p.initial ?? [], ...props.steps.map((s) => s.panels?.[p.key])];
      return `<div class="card paper gr-panel" data-panel="${esc(p.key)}"><p class="label">${esc(p.label)}</p><div class="gr-lists" style="height:${(p.rows ?? 1) * 50 + 6}px">${
        lists.map((items, i) => (items == null ? "" : `<div class="gr-list" data-step="${i - 1}">${
          items.length ? items.map((it) => `<span class="gr-chip">${esc(it)}</span>`).join("") : `<span class="gr-empty">empty</span>`}</div>`)).join("")}</div></div>`;
    }).join("");
    return `
      <svg class="gr-svg" viewBox="0 0 1920 1080" aria-hidden="true">
        ${edgeSvg}
      </svg>
      ${labels}
      ${props.nodes.map((n) => {
        const [hw, hh] = graphHalf(n);
        return `<div class="gr-node gr-base${n.w ? " gr-box" : ""}" data-id="${esc(n.id)}" style="left:${n.x - hw}px;top:${n.y - hh}px;width:${hw * 2}px;height:${hh * 2}px">${
          esc(n.label ?? n.id).replace(/\n/g, "<br>")}</div>`;
      }).join("")}
      <div class="gr-side">${panelHtml}</div>
      <div class="card gr-note"><p class="label">Step</p><div class="ar-slot gr-note-slot">${
        props.steps.map((s, i) => (s.note ? `<span class="ar-swap gr-note-${i}">${esc(s.note)}</span>` : "")).join("")}</div></div>`;
  },
  build({ tl, fx, q, cue, props, el }) {
    const R = GRAPH_R;
    const MIN_GAP = 0.5;
    const pos = Object.fromEntries(props.nodes.map((n) => [n.id, [n.x, n.y]]));
    const nodeEl = (id) => {
      const node = el.querySelector(`.gr-node[data-id="${CSS.escape(id)}"]`);
      if (!node) throw new Error(`graph: unknown node "${id}"`);
      return node;
    };
    const edgeEl = (key) => {
      const g = el.querySelector(`.gr-edge[data-key="${CSS.escape(key)}"]`);
      if (!g) throw new Error(`graph: unknown edge "${key}"`);
      return { g, line: g.querySelector("line"), head: g.querySelector("polygon"), w: el.querySelector(`.gr-w[data-key="${CSS.escape(key)}"]`) };
    };
    const directed = props.directed !== false;
    const live = new Set(props.edges.map((e) => `${e.from}-${e.to}`));
    const EDGE_STYLE = {
      base: { stroke: "rgba(20,20,19,0.34)", strokeWidth: 3 },
      relax: { stroke: "#cc785c", strokeWidth: 5 },
      tree: { stroke: "rgba(20,20,19,0.86)", strokeWidth: 5 },
      dim: { stroke: "rgba(20,20,19,0.12)", strokeWidth: 3 },
    };

    const spec = Object.fromEntries(props.nodes.map((n) => [n.id, n]));
    // distance from a node's center to its border along direction (ux, uy): circle or box
    const reach = (id, ux, uy) => {
      const n = spec[id];
      if (!n.w) return R;
      const [hw, hh] = graphHalf(n);
      return Math.min(ux ? hw / Math.abs(ux) : Infinity, uy ? hh / Math.abs(uy) : Infinity);
    };
    // geometry of edge u→v between node borders, plus arrowhead + weight label anchor
    const geom = (key) => {
      const [u, v] = key.split("-");
      const [x1, y1] = pos[u];
      const [x2, y2] = pos[v];
      const len = Math.hypot(x2 - x1, y2 - y1) || 1;
      const [ux, uy] = [(x2 - x1) / len, (y2 - y1) / len];
      const ru = reach(u, ux, uy);
      const rv = reach(v, ux, uy);
      const a = [x1 + ux * ru, y1 + uy * ru];
      const tip = [x2 - ux * (rv + 2), y2 - uy * (rv + 2)];
      const b = directed ? [tip[0] - ux * 14, tip[1] - uy * 14] : [x2 - ux * rv, y2 - uy * rv];
      const [px, py] = [-uy, ux];
      const head = directed
        ? `${tip[0]},${tip[1]} ${tip[0] - ux * 22 + px * 11},${tip[1] - uy * 22 + py * 11} ${tip[0] - ux * 22 - px * 11},${tip[1] - uy * 22 - py * 11}`
        : `${tip[0]},${tip[1]} ${tip[0]},${tip[1]} ${tip[0]},${tip[1]}`;
      return { x1: a[0], y1: a[1], x2: b[0], y2: b[1], head, label: [(x1 + x2) / 2 + px * 26, (y1 + y2) / 2 + py * 26] };
    };
    const placeEdge = (key, at, dur) => {
      const { line, head, w } = edgeEl(key);
      const g = geom(key);
      const vars = { attr: { x1: g.x1, y1: g.y1, x2: g.x2, y2: g.y2 } };
      if (at == null) {
        gsap.set(line, vars);
        gsap.set(head, { attr: { points: g.head } });
        if (w) gsap.set(w, { left: g.label[0], top: g.label[1], xPercent: -50, yPercent: -50 });
      } else {
        tl.to(line, { ...vars, duration: dur, ease: "power2.inOut" }, at);
        tl.to(head, { attr: { points: g.head }, duration: dur, ease: "power2.inOut" }, at);
        if (w) tl.to(w, { left: g.label[0], top: g.label[1], duration: dur, ease: "power2.inOut" }, at);
      }
    };
    const styleEdge = (key, state, at) => {
      const style = EDGE_STYLE[state];
      if (!style) throw new Error(`graph: unknown edge state "${state}"`);
      const { line, head } = edgeEl(key);
      tl.to(line, { ...style, duration: 0.35 }, at);
      tl.to(head, { fill: style.stroke, duration: 0.35 }, at);
    };

    // initial layout (nodes and labels use left/top, so entrance transforms never move them);
    // every edge is placed up front, only the starting edges visible
    el.querySelectorAll(".gr-edge").forEach((g) => {
      placeEdge(g.dataset.key);
      gsap.set(g.querySelector("line"), EDGE_STYLE.base);
      gsap.set(g.querySelector("polygon"), { fill: EDGE_STYLE.base.stroke });
      if (!live.has(g.dataset.key)) gsap.set(g, { autoAlpha: 0 });
    });
    el.querySelectorAll(".gr-w").forEach((w) => { if (!live.has(w.dataset.key)) gsap.set(w, { autoAlpha: 0 }); });

    const hidden = new Set(props.nodes.filter((n) => n.hidden).map((n) => n.id));
    hidden.forEach((id) => gsap.set(nodeEl(id), { autoAlpha: 0 }));
    fx.in([...q(".gr-node")].filter((n) => !hidden.has(n.dataset.id)), 0.4, { y: 0, scale: 0.8, stagger: 0.06, dur: 0.45 })
      .in([...q(".gr-edge")].filter((g) => live.has(g.dataset.key)), 0.8, { y: 0, scale: 1, dur: 0.5 })
      .in([...q(".gr-w")].filter((w) => live.has(w.dataset.key)), 0.9, { y: 0, scale: 1, dur: 0.4 })
      .in([...q(".gr-panel"), ...q(".gr-note")], 1.0, { y: 16, stagger: 0.1 });
    // initial panel values
    q('.gr-v[data-step="-1"], .gr-list[data-step="-1"]').forEach((v) => gsap.set(v, { autoAlpha: 1 }));

    const shownTable = {};
    const shownList = {};
    q('.gr-v[data-step="-1"]').forEach((v) => (shownTable[`${v.closest(".gr-panel").dataset.panel}/${v.dataset.id}`] = v));
    q('.gr-list[data-step="-1"]').forEach((v) => (shownList[v.closest(".gr-panel").dataset.panel] = v));
    let shownNote = null;
    let prevAt = -Infinity;

    props.steps.forEach((s, i) => {
      const at = cue(s.at);
      if (at - prevAt < MIN_GAP) throw new Error(`graph: step "${s.at}" is ${(at - prevAt).toFixed(2)}s after the previous step (min ${MIN_GAP}s)`);
      prevAt = at;

      for (const id of s.show ?? []) {
        if (!hidden.delete(id)) throw new Error(`graph: step "${s.at}" shows "${id}", which is not hidden`);
        tl.fromTo(nodeEl(id), { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.4, ease: "back.out(1.6)", immediateRender: false }, at);
      }
      for (const key of s.remove ?? []) {
        if (!live.delete(key)) throw new Error(`graph: step "${s.at}" removes missing edge "${key}"`);
        const { g, w } = edgeEl(key);
        tl.to([g, w].filter(Boolean), { autoAlpha: 0, duration: 0.35 }, at);
      }
      const moved = Object.entries(s.move ?? {});
      for (const [id, [x, y]] of moved) {
        nodeEl(id);
        pos[id] = [x, y];
        const [hw, hh] = graphHalf(spec[id]);
        tl.to(nodeEl(id), { left: x - hw, top: y - hh, duration: 0.6, ease: "power2.inOut" }, at);
      }
      if (moved.length) {
        const touched = new Set(moved.map(([id]) => id));
        [...live].filter((k) => k.split("-").some((id) => touched.has(id))).forEach((k) => placeEdge(k, at, 0.6));
      }
      for (const e of s.add ?? []) {
        const key = `${e.from}-${e.to}`;
        if (live.has(key)) throw new Error(`graph: step "${s.at}" adds existing edge "${key}"`);
        live.add(key);
        const { g, line, w } = edgeEl(key);
        placeEdge(key, at + (moved.length ? 0.6 : 0), 0.01);
        const t = at + (moved.length ? 0.6 : 0);
        tl.fromTo(g, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01, immediateRender: false }, t);
        const g2 = geom(key);
        const len = Math.ceil(Math.hypot(g2.x2 - g2.x1, g2.y2 - g2.y1)) + 4;
        tl.fromTo(line, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 0.5, ease: "power2.out", immediateRender: false }, t);
        tl.set(line, { strokeDasharray: "none" }, t + 0.5);  // later moves may lengthen the edge
        if (w) tl.fromTo(w, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, immediateRender: false }, t + 0.3);
      }

      for (const [id, state] of Object.entries(s.nodes ?? {})) {
        if (!["active", "done", "queued", "dim", "base"].includes(state)) throw new Error(`graph: unknown node state "${state}"`);
        const node = nodeEl(id);
        tl.set(node, { className: `gr-node gr-${state}${spec[id].w ? " gr-box" : ""}` }, at);
        // opacity is tweened, not classed: entrance animations leave an inline opacity behind
        tl.to(node, { opacity: state === "dim" ? 0.35 : 1, duration: 0.3 }, at);
        tl.fromTo(node, { scale: 1.08 }, { scale: 1, duration: 0.35, ease: "power2.out", immediateRender: false }, at);
      }
      for (const [key, state] of Object.entries(s.edges ?? {})) styleEdge(key, state, at);

      for (const [panel, update] of Object.entries(s.panels ?? {})) {
        const spec = props.panels.find((p) => p.key === panel);
        if (!spec) throw new Error(`graph: step "${s.at}" updates unknown panel "${panel}"`);
        if (spec.type === "table") {
          for (const id of Object.keys(update)) {
            const cell = el.querySelector(`.gr-panel[data-panel="${CSS.escape(panel)}"] .gr-v[data-step="${i}"][data-id="${CSS.escape(id)}"]`);
            if (!cell) throw new Error(`graph: panel "${panel}" has no column "${id}"`);
            const k = `${panel}/${id}`;
            if (shownTable[k]) fx.out(shownTable[k], at - 0.05, { dur: 0.15 });
            fx.in(cell, at + 0.1, { y: -10, scale: 1, dur: 0.3 });
            tl.fromTo(cell, { color: "#cc785c" }, { color: "#141413", duration: 0.8, immediateRender: false }, at + 0.4);
            shownTable[k] = cell;
          }
        } else {
          const list = el.querySelector(`.gr-panel[data-panel="${CSS.escape(panel)}"] .gr-list[data-step="${i}"]`);
          if (shownList[panel]) fx.out(shownList[panel], at - 0.05, { dur: 0.15 });
          fx.in(list, at + 0.1, { y: 8, scale: 1, dur: 0.3 });
          shownList[panel] = list;
        }
      }

      if (s.note) {
        if (shownNote) fx.out(shownNote, at - 0.05, { dur: 0.15 });
        shownNote = q(`.gr-note-${i}`);
        fx.in(shownNote, at + 0.1, { y: 10, dur: 0.35 });
      }
    });
  },
});

const GRAPH_R = 44;
const graphHalf = (n) => (n.w ? [n.w / 2, (n.h ?? 64) / 2] : [GRAPH_R, GRAPH_R]);
