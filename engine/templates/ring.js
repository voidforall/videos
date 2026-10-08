// Consistent-hashing ring. Servers (and their virtual nodes) and keys sit on a hash ring at
// positions 0–100 (clockwise from the top). The template computes ownership itself: each key
// belongs to the first live server clockwise, takes its group's colour, and the load panel
// counts keys per group. Steps add or remove servers, reveal keys, and trace lookups.
// props: {
//   title,
//   servers: [{ id, pos, group?, label?, hidden? }],   // group defaults to id (virtual nodes share one)
//   keys: [{ id, pos, label?, hidden? }],
//   load?: { label? },                                  // per-group key counts as bars
//   steps: [{ at, note?, show?: [serverOrKeyId], remove?: [serverId | group], lookup?: [keyId] }] }
// A group name removes all its live servers (virtual nodes); a server id never doubles as a multi-server group.
// Steps ≥ 0.5 s apart. Ownership changes recolour the moved keys and report "moved" in the panel.
registerTemplate("ring", {
  render(props, { esc }) {
    const g = RING;
    const sim = ringSimulate(props);
    const tick = ringPoint(0, g.r - 34);
    const counts = (grp) => [sim.initial, ...sim.steps].map((st, i) => (i === 0 || st.changed
      ? `<b class="rg-count" data-step="${i - 1}">${st.loads[grp]}</b>` : "")).join("");
    return `
      <svg class="rg-svg" viewBox="0 0 1920 1080" aria-hidden="true">
        <circle class="rg-track" cx="${g.cx}" cy="${g.cy}" r="${g.r}" />
        <path class="rg-dir" d="${ringArc(4, 38, 92)}" />
        <polygon class="rg-dir-head" points="${ringArrowHead(38, 92)}" />
        ${props.keys.map((k) => `<path class="rg-arc" data-key="${esc(k.id)}" />`).join("")}
      </svg>
      <span class="rg-zero" style="left:${tick[0]}px;top:${tick[1]}px">0</span>
      <span class="label rg-center" style="left:${g.cx}px;top:${g.cy}px">clockwise</span>
      ${props.keys.map((k) => {
        const [x, y] = ringPoint(k.pos, g.r);
        const [lx, ly] = ringPoint(k.pos, g.r - 48);
        return `<span class="rg-key" data-id="${esc(k.id)}" style="left:${x - 11}px;top:${y - 11}px"></span>
          <span class="rg-key-label" data-id="${esc(k.id)}" style="left:${lx}px;top:${ly}px">${esc(k.label ?? k.id)}</span>`;
      }).join("")}
      ${props.servers.map((s) => {
        const [x, y] = ringPoint(s.pos, g.r);
        const [lx, ly] = ringPoint(s.pos, g.r + 58);
        const color = sim.colorOf(sim.server[s.id].group);
        return `<span class="rg-server" data-id="${esc(s.id)}" style="left:${x - 19}px;top:${y - 19}px;background:${color}"></span>
          <span class="rg-server-label" data-id="${esc(s.id)}" style="left:${lx}px;top:${ly}px;border-color:${color}">${esc(s.label ?? s.id)}</span>`;
      }).join("")}
      <div class="rg-side">
      ${props.load ? `<div class="card paper rg-load"><p class="label">${esc(props.load.label ?? "Keys per server")}</p>
        ${sim.groups.map((grp) => `<div class="rg-row" data-group="${esc(grp)}"><span class="rg-name">${esc(grp)}</span>
          <span class="rg-bar"><i style="background:${sim.colorOf(grp)}"></i></span><span class="rg-num">${counts(grp)}</span></div>`).join("")}
        <p class="rg-moved">${sim.steps.map((st, i) => (st.moved.length
          ? `<span data-step="${i}">moved: ${st.moved.length} of ${st.liveKeys} keys</span>` : "")).join("")}</p></div>` : ""}
      <div class="card rg-note"><p class="label">Step</p><div class="ar-slot rg-note-slot">${
        props.steps.map((s, i) => (s.note ? `<span class="ar-swap rg-note-${i}">${esc(s.note)}</span>` : "")).join("")}</div></div>
      </div>`;
  },
  build({ tl, fx, q, cue, props, el }) {
    const MIN_GAP = 0.5;
    const sim = ringSimulate(props);
    const GREY = "rgba(20,20,19,0.28)";
    const keyColor = (sid) => (sid ? sim.colorOf(sim.server[sid].group) : GREY);
    const one = (sel, id) => el.querySelector(`${sel}[data-id="${CSS.escape(id)}"]`);
    const serverEls = (id) => [one(".rg-server", id), one(".rg-server-label", id)];
    const keyEls = (id) => [one(".rg-key", id), one(".rg-key-label", id)];
    const pulse = (target, at) => tl.fromTo(target, { scale: 1.6 }, { scale: 1, duration: 0.5, ease: "power2.out", immediateRender: false }, at);
    const barWidth = (n) => `${(n / sim.maxLoad) * 100}%`;
    const row = (grp) => el.querySelector(`.rg-row[data-group="${CSS.escape(grp)}"]`);

    // initial state (labels centre on their anchor; xPercent survives entrance transforms)
    gsap.set([...q(".rg-zero"), ...q(".rg-center"), ...q(".rg-key-label"), ...q(".rg-server-label")], { xPercent: -50, yPercent: -50 });
    props.servers.filter((s) => s.hidden).forEach((s) => gsap.set(serverEls(s.id), { autoAlpha: 0 }));
    props.keys.forEach((k) => {
      gsap.set(one(".rg-key", k.id), { backgroundColor: keyColor(sim.initial.owners[k.id]) });
      if (k.hidden) gsap.set(keyEls(k.id), { autoAlpha: 0 });
    });
    gsap.set(q(".rg-arc"), { autoAlpha: 0 });
    if (props.load) {
      sim.groups.forEach((grp) => {
        gsap.set(row(grp).querySelector("i"), { width: barWidth(sim.initial.loads[grp]) });
        gsap.set(row(grp), { autoAlpha: sim.initial.liveGroups.has(grp) ? 1 : 0 });
      });
      q('.rg-count[data-step="-1"]').forEach((c) => gsap.set(c, { autoAlpha: 1 }));
    }

    const live0 = props.servers.filter((s) => !s.hidden).map((s) => s.id);
    const keys0 = props.keys.filter((k) => !k.hidden).map((k) => k.id);
    fx.in([...q(".rg-track"), ...q(".rg-dir"), ...q(".rg-dir-head"), ...q(".rg-zero"), ...q(".rg-center")], 0.3, { y: 0, scale: 0.97, dur: 0.6 })
      .in(live0.flatMap(serverEls), 0.55, { y: 0, scale: 0.6, stagger: 0.05, dur: 0.45 })
      .in(keys0.flatMap(keyEls), 0.8, { y: 0, scale: 0.6, stagger: 0.03, dur: 0.4 })
      .in([...q(".rg-load"), ...q(".rg-note")], 1.0, { y: 16, stagger: 0.1 });

    let prevAt = -Infinity;
    let shownNote = null;
    let shownMoved = null;
    let shownArcs = [];
    const shownCount = Object.fromEntries(sim.groups.map((grp) => [grp, el.querySelector(`.rg-row[data-group="${CSS.escape(grp)}"] .rg-count[data-step="-1"]`)]));
    let prev = sim.initial;

    props.steps.forEach((s, i) => {
      const at = cue(s.at);
      if (at - prevAt < MIN_GAP) throw new Error(`ring: step "${s.at}" is ${(at - prevAt).toFixed(2)}s after the previous step (min ${MIN_GAP}s)`);
      prevAt = at;
      const st = sim.steps[i];

      if (shownArcs.length) tl.to(shownArcs, { autoAlpha: 0, duration: 0.25 }, at - 0.05);
      shownArcs = [];

      (s.show ?? []).forEach((id) => {
        tl.fromTo(sim.server[id] ? serverEls(id) : keyEls(id), { autoAlpha: 0, scale: 0.4 },
          { autoAlpha: 1, scale: 1, duration: 0.45, ease: "back.out(1.8)", immediateRender: false }, at);
      });
      st.removed.forEach((sid) => tl.to(serverEls(sid), { autoAlpha: 0.12, scale: 0.8, duration: 0.4 }, at));

      Object.entries(st.owners).forEach(([id, sid]) => {
        if (prev.owners[id] === sid || !(id in prev.owners)) return;
        tl.to(one(".rg-key", id), { backgroundColor: keyColor(sid), duration: 0.4 }, at + 0.25);
        if (st.moved.includes(id)) pulse(one(".rg-key", id), at + 0.25);
      });
      (s.show ?? []).filter((id) => !sim.server[id]).forEach((id) => gsap.set(one(".rg-key", id), { backgroundColor: keyColor(st.owners[id]) }));

      if (props.load && st.changed) {
        sim.groups.forEach((grp) => {
          tl.to(row(grp).querySelector("i"), { width: barWidth(st.loads[grp]), duration: 0.6, ease: "power2.inOut" }, at + 0.2);
          const live = st.liveGroups.has(grp);
          if (live !== prev.liveGroups.has(grp) || !live) tl.to(row(grp), { autoAlpha: live ? 1 : 0.35, duration: 0.35 }, at);
          const cell = row(grp).querySelector(`.rg-count[data-step="${i}"]`);
          fx.out(shownCount[grp], at + 0.15, { dur: 0.15 });
          fx.in(cell, at + 0.3, { y: -8, scale: 1, dur: 0.3 });
          shownCount[grp] = cell;
        });
        if (shownMoved) fx.out(shownMoved, at - 0.05, { dur: 0.15 });
        shownMoved = el.querySelector(`.rg-moved [data-step="${i}"]`);
        if (shownMoved) fx.in(shownMoved, at + 0.3, { y: 6, dur: 0.3 });
      }

      for (const id of s.lookup ?? []) {
        const sid = st.owners[id];
        const arc = el.querySelector(`.rg-arc[data-key="${CSS.escape(id)}"]`);
        const from = sim.key[id].pos;
        const to = sim.server[sid].pos < from ? sim.server[sid].pos + 100 : sim.server[sid].pos;
        arc.setAttribute("d", ringArc(from, to, RING.r));
        const len = (2 * Math.PI * RING.r * (to - from)) / 100 + 4;
        tl.fromTo(arc, { autoAlpha: 1, strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 0.7, ease: "power2.inOut", immediateRender: false }, at);
        pulse(one(".rg-key", id), at);
        pulse(one(".rg-server", sid), at + 0.65);
        shownArcs.push(arc);
      }

      if (s.note) {
        if (shownNote) fx.out(shownNote, at - 0.05, { dur: 0.15 });
        shownNote = q(`.rg-note-${i}`);
        fx.in(shownNote, at + 0.1, { y: 10, dur: 0.35 });
      }
      prev = st;
    });
  },
});

// Pure walk over the steps: which servers and keys are live, who owns each key, load per group.
// Shared by render (per-step counts) and build (animation), and validates the spec.
function ringSimulate(props) {
  const groups = [...new Set(props.servers.map((s) => s.group ?? s.id))];
  const server = Object.fromEntries(props.servers.map((s) => [s.id, { ...s, group: s.group ?? s.id }]));
  const key = Object.fromEntries(props.keys.map((k) => [k.id, k]));
  const members = (grp) => props.servers.filter((s) => (s.group ?? s.id) === grp).map((s) => s.id);
  for (const p of [...props.servers, ...props.keys]) {
    if (!(p.pos >= 0 && p.pos < 100)) throw new Error(`ring: "${p.id}" pos ${p.pos} outside 0–100`);
    if (server[p.id] && key[p.id]) throw new Error(`ring: id "${p.id}" used for a server and a key`);
    // "remove: [X]" must mean one thing: a server id may only equal a group name if it is that group's sole member
    if (server[p.id] && members(p.id).some((sid) => sid !== p.id)) throw new Error(`ring: server id "${p.id}" is also the name of a multi-server group; rename the server (e.g. "${p.id}1")`);
  }
  const ownerOf = (servers, id) => {
    let best = null;
    let bestD = Infinity;
    for (const sid of servers) {
      const d = (server[sid].pos - key[id].pos + 100) % 100; // first server clockwise, ties own
      if (d < bestD) [best, bestD] = [sid, d];
    }
    return best;
  };
  const state = (servers, keys, extra) => {
    const owners = Object.fromEntries([...keys].map((id) => [id, ownerOf(servers, id)]));
    const loads = Object.fromEntries(groups.map((grp) => [grp, Object.values(owners).filter((sid) => sid && server[sid].group === grp).length]));
    const liveGroups = new Set([...servers].map((sid) => server[sid].group));
    return { servers, keys, owners, loads, liveGroups, liveKeys: keys.size, ...extra };
  };
  const initial = state(
    new Set(props.servers.filter((s) => !s.hidden).map((s) => s.id)),
    new Set(props.keys.filter((k) => !k.hidden).map((k) => k.id)),
    { moved: [], removed: [], changed: true },
  );
  let prev = initial;
  const steps = props.steps.map((s) => {
    const servers = new Set(prev.servers);
    const keys = new Set(prev.keys);
    for (const id of s.show ?? []) {
      const set = server[id] ? servers : key[id] ? keys : null;
      if (!set) throw new Error(`ring: step "${s.at}" shows unknown id "${id}"`);
      if (set.has(id)) throw new Error(`ring: step "${s.at}" shows "${id}", which is already live`);
      set.add(id);
    }
    const removed = (s.remove ?? []).flatMap((id) => {
      const ids = server[id] ? [id] : groups.includes(id) ? members(id).filter((sid) => servers.has(sid)) : [];
      if (!ids.length || !ids.every((sid) => servers.has(sid))) throw new Error(`ring: step "${s.at}" removes "${id}", which is not live`);
      ids.forEach((sid) => servers.delete(sid));
      return ids;
    });
    const next = state(servers, keys, { removed, changed: Boolean(s.show?.length || removed.length) });
    next.moved = [...keys].filter((id) => prev.owners[id] && next.owners[id]
      && server[prev.owners[id]].group !== server[next.owners[id]].group);
    for (const id of s.lookup ?? []) {
      if (!keys.has(id)) throw new Error(`ring: step "${s.at}" looks up "${id}", which is not live`);
      if (!next.owners[id]) throw new Error(`ring: step "${s.at}" looks up "${id}" with no live server`);
    }
    prev = next;
    return next;
  });
  const colorOf = (grp) => RING_COLORS[groups.indexOf(grp) % RING_COLORS.length];
  return { groups, server, key, initial, steps, colorOf, maxLoad: Math.max(props.keys.length, 1) };
}

const RING = { cx: 600, cy: 535, r: 250 };
const RING_COLORS = ["#cc785c", "#5db8a6", "#e8a55a", "#7b6fae", "#5b8fc9"];
// position 0–100 → frame point, 0 at the top, clockwise
function ringPoint(pos, r) {
  const a = (pos / 100) * 2 * Math.PI - Math.PI / 2;
  return [RING.cx + r * Math.cos(a), RING.cy + r * Math.sin(a)];
}
function ringArc(from, to, r) {
  const [x1, y1] = ringPoint(from, r);
  const [x2, y2] = ringPoint(to, r);
  return `M ${x1} ${y1} A ${r} ${r} 0 ${to - from > 50 ? 1 : 0} 1 ${x2} ${y2}`;
}
function ringArrowHead(pos, r) {
  const a = (pos / 100) * 2 * Math.PI - Math.PI / 2;
  const [x, y] = ringPoint(pos, r);
  const [tx, ty] = [-Math.sin(a), Math.cos(a)]; // clockwise tangent
  const [nx, ny] = [Math.cos(a), Math.sin(a)];
  return `${x + tx * 14},${y + ty * 14} ${x - nx * 8},${y - ny * 8} ${x + nx * 8},${y + ny * 8}`;
}
