// Limit order book. A price ladder (highest price on top) where each row holds a FIFO queue of
// order chips; bids are teal, asks coral. The template runs price-time matching itself: an incoming
// order sweeps the opposite side while prices cross, filling the oldest order at the best level first;
// partial fills update quantities, emptied orders leave, and any remainder rests at its limit.
// props: {
//   title,
//   book: [{ id, side: "buy" | "sell", price, qty }],      // resting at the start, FIFO order per price
//   prices?: [..],                                           // ladder rows (default: every price used), high → low
//   cancel?: "eager" | "lazy",                               // lazy = tombstone, popped when matching reaches it
//   steps: [{ at, note?, order?: { id, side, price, qty }, pace?: seconds per fill (0.8), fills?: [cue, ..], cancel?: id }] }
// `fills` pins each fill (or tombstone pop) to a narration cue; otherwise fills run `pace` s apart.
// The next step must start after the previous step's animation ends (checked).
registerTemplate("book", {
  render(props, { esc }) {
    const sim = bookSimulate(props);
    const g = bookGeometry(sim.prices.length);
    const qty = (versions) => versions.map((v, i) => `<b class="bk-v" data-v="${i}">${v}</b>`).join("");
    const chips = Object.values(sim.chips).map((c) => {
      const [x, y] = g.chipAt(sim.prices.indexOf(c.price), c.slot0);
      return `<div class="bk-chip bk-${c.side}" data-id="${esc(c.id)}" style="left:${x}px;top:${y}px">
        <span class="bk-id">#${esc(c.id)}</span><span class="bk-qty">${qty(c.qtys)}</span><i class="bk-x">✕</i></div>`;
    }).join("");
    const incoming = sim.steps.map((st, i) => (st.order ? `
      <div class="bk-in-card" data-step="${i}">
        <p class="bk-in-head"><b class="bk-tag bk-${st.order.side}">${st.order.side.toUpperCase()}</b>
          <span>${st.order.qty} @ ${st.order.price}</span><span class="bk-in-id">#${esc(st.order.id)}</span></p>
        <p class="bk-in-left">left to fill <span class="bk-num">${qty(st.leftVersions)}</span></p>
      </div>` : "")).join("");
    const trades = sim.trades.map((t, k) => `
      <div class="bk-trade" data-k="${k}"><span>#${esc(t.agg)} × #${esc(t.rest)}</span><b>${t.qty} @ ${t.price}</b></div>`).join("");
    return `
      ${sim.prices.map((p, i) => `<div class="bk-row" style="top:${g.rowTop(i)}px;height:${g.rowH}px"></div>
        <span class="bk-price" style="top:${g.rowY(i)}px">${p}</span>`).join("")}
      <span class="bk-limit"></span>
      <span class="bk-best bk-best-ask">best ask</span><span class="bk-best bk-best-bid">best bid</span>
      ${chips}
      <div class="bk-side-panels">
        <div class="card paper bk-in"><p class="label">Incoming</p><div class="bk-in-slot">${incoming}
          <p class="bk-in-idle">waiting for an order</p></div></div>
        <div class="card paper bk-trades"><p class="label">Trades · filled <span class="bk-num">${qty(sim.totals)}</span></p>
          <div class="bk-trade-list">${trades}</div></div>
      </div>
      <div class="card bk-note"><p class="label">Step</p><div class="ar-slot bk-note-slot">${
        props.steps.map((s, i) => (s.note ? `<span class="ar-swap bk-note-${i}">${esc(s.note)}</span>` : "")).join("")}</div></div>`;
  },
  build({ tl, fx, q, cue, props, el }) {
    const sim = bookSimulate(props);
    const g = bookGeometry(sim.prices.length);
    const chip = (id) => el.querySelector(`.bk-chip[data-id="${CSS.escape(String(id))}"]`);
    const row = (price) => sim.prices.indexOf(price);
    // a "versioned" number: one <b> per value, exactly one visible at a time
    const showVersion = (scope, v, at) => {
      const all = scope.querySelectorAll(".bk-v");
      all.forEach((b) => { if (Number(b.dataset.v) !== v) tl.set(b, { autoAlpha: 0 }, at); });
      tl.set(all[v], { autoAlpha: 1 }, at);
    };
    const SLOTS = 5;

    // initial state
    gsap.set(q(".bk-v"), { autoAlpha: 0 });
    q('.bk-v[data-v="0"]').forEach((b) => gsap.set(b, { autoAlpha: 1 }));
    gsap.set([...q(".bk-in-card"), ...q(".bk-trade"), ...q(".bk-x"), ...q(".bk-limit")], { autoAlpha: 0 });
    gsap.set([...q(".bk-price"), ...q(".bk-best"), ...q(".bk-limit")], { yPercent: -50 });
    Object.values(sim.chips).forEach((c) => { if (!c.initial) gsap.set(chip(c.id), { autoAlpha: 0 }); });
    const placeBest = (best, at) => {
      for (const side of ["ask", "bid"]) {
        const m = q(`.bk-best-${side}`)[0];
        const price = best[side];
        const vars = price == null ? { autoAlpha: 0 } : { autoAlpha: 1, top: g.rowY(row(price)) };
        if (at == null) gsap.set(m, vars);
        else tl.to(m, { ...vars, duration: 0.45, ease: "power2.inOut" }, at);
      }
    };
    placeBest(sim.initialBest);

    fx.in([...q(".bk-row"), ...q(".bk-price")], 0.3, { y: 0, x: -12, stagger: 0.03, dur: 0.45 })
      .in(Object.values(sim.chips).filter((c) => c.initial).map((c) => chip(c.id)), 0.6, { y: 0, scale: 0.85, stagger: 0.04, dur: 0.4 })
      .in([...q(".bk-in"), ...q(".bk-trades"), ...q(".bk-note")], 0.9, { y: 16, stagger: 0.1 });

    let prevEnd = -Infinity;
    let shownNote = null;
    props.steps.forEach((s, i) => {
      const at = cue(s.at);
      if (at < prevEnd) throw new Error(`book: step "${s.at}" starts at ${at.toFixed(2)}s, before the previous step's animation ends (${prevEnd.toFixed(2)}s)`);
      const st = sim.steps[i];
      // sim time → frame time: offsets from the step cue, re-anchored at each cued fill
      const anchors = [[0, at]];
      if (s.fills) {
        if (!st.anchors || s.fills.length !== st.anchors.length) {
          throw new Error(`book: step "${s.at}" lists ${s.fills.length} fill cues, but the order makes ${st.anchors?.length ?? 0} fills / tombstone pops`);
        }
        s.fills.forEach((c, k) => {
          const real = cue(c);
          const [simT, realT] = anchors[anchors.length - 1];
          if (real - realT < 0.8) throw new Error(`book: fill cue "${c}" is ${(real - realT).toFixed(2)}s after the previous action (min 0.8s)`);
          anchors.push([st.anchors[k], real]);
        });
      }
      const when = (simT) => {
        const [aSim, aReal] = anchors.filter(([x]) => x <= simT + 1e-9).pop();
        return aReal + (simT - aSim);
      };
      prevEnd = when(st.duration);
      const idle = q(".bk-in-idle")[0];
      const card = el.querySelector(`.bk-in-card[data-step="${i}"]`);

      for (const a of st.actions) {
        const t = when(a.t);
        switch (a.type) {
          case "incoming":
            tl.to(idle, { autoAlpha: 0, duration: 0.2 }, t);
            tl.fromTo(card, { autoAlpha: 0, x: 24 }, { autoAlpha: 1, x: 0, duration: 0.4, ease: "power3.out", immediateRender: false }, t);
            tl.fromTo(q(".bk-limit"), { autoAlpha: 0, top: g.rowY(row(a.price)) },
              { autoAlpha: 1, top: g.rowY(row(a.price)), duration: 0.3, immediateRender: false }, t + 0.2);
            break;
          case "fill": {
            const c = chip(a.id);
            tl.fromTo(c, { scale: 1.12 }, { scale: 1, duration: 0.5, ease: "power2.out", immediateRender: false }, t);
            tl.fromTo(c, { borderColor: "#141413" }, { borderColor: a.side === "buy" ? "#5db8a6" : "#cc785c", duration: 0.7, immediateRender: false }, t);
            showVersion(c, a.ver, t + 0.15);
            showVersion(card.querySelector(".bk-in-left"), a.leftVer, t + 0.15);
            showVersion(q(".bk-trades .label")[0], a.totalVer, t + 0.15);
            // trades log: newest on top, five rows visible
            for (let k = 0; k <= a.trade; k++) {
              const slot = a.trade - k;
              const tr = el.querySelector(`.bk-trade[data-k="${k}"]`);
              if (k === a.trade) tl.fromTo(tr, { autoAlpha: 0, top: 0, x: -16 }, { autoAlpha: 1, x: 0, duration: 0.35, immediateRender: false }, t + 0.1);
              else if (slot < SLOTS) tl.to(tr, { top: slot * 52, duration: 0.35, ease: "power2.out" }, t + 0.1);
              else if (slot === SLOTS) tl.to(tr, { autoAlpha: 0, duration: 0.25 }, t + 0.1);
            }
            break;
          }
          case "skip":
          case "remove":
            tl.to(chip(a.id), { autoAlpha: 0, scale: 0.8, duration: 0.3, ease: "power2.in" }, t);
            break;
          case "layout":
            for (const [id, slot] of a.slots) {
              const [x] = g.chipAt(row(a.price), slot);
              tl.to(chip(id), { left: x, duration: 0.4, ease: "power2.inOut" }, t);
            }
            break;
          case "rest": {
            const [x, y] = g.chipAt(row(a.price), a.slot);
            tl.fromTo(chip(a.id), { autoAlpha: 0, scale: 0.6, left: x, top: y }, { autoAlpha: 1, scale: 1, duration: 0.45, ease: "back.out(1.7)", immediateRender: false }, t);
            break;
          }
          case "cancel":
            tl.to(chip(a.id), { opacity: 0.45, duration: 0.3 }, t);
            tl.fromTo(chip(a.id).querySelector(".bk-x"), { autoAlpha: 0, scale: 1.6 }, { autoAlpha: 1, scale: 1, duration: 0.35, immediateRender: false }, t);
            break;
          case "best":
            placeBest(a.best, t);
            break;
          case "done":
            tl.to([card, ...q(".bk-limit")], { autoAlpha: 0, duration: 0.3 }, t);
            tl.to(idle, { autoAlpha: 1, duration: 0.3 }, t + 0.2);
            break;
          default:
            throw new Error(`book: unknown action ${a.type}`);
        }
      }

      if (s.note) {
        if (shownNote) fx.out(shownNote, at - 0.05, { dur: 0.15 });
        shownNote = q(`.bk-note-${i}`);
        fx.in(shownNote, at + 0.1, { y: 10, dur: 0.35 });
      }
    });
  },
});

// Pure price-time matching over the steps. Returns ladder prices, every chip that ever rests (with
// its quantity after each fill), the trade log, and per step a list of timed actions for the build.
function bookSimulate(props) {
  const lazy = (props.cancel ?? "eager") === "lazy";
  if (!["eager", "lazy"].includes(props.cancel ?? "eager")) throw new Error(`book: cancel must be "eager" or "lazy"`);
  const levels = new Map(); // price → { side, queue: [{ id, qty, cancelled }] }
  const chips = {};
  const trades = [];
  const totals = [0];
  const used = new Set();
  const checkOrder = (o) => {
    if (!["buy", "sell"].includes(o.side)) throw new Error(`book: order ${o.id} side must be "buy" or "sell"`);
    if (!(o.qty > 0) || !Number.isFinite(o.price)) throw new Error(`book: order ${o.id} needs a positive qty and a numeric price`);
    if (used.has(String(o.id))) throw new Error(`book: duplicate order id ${o.id}`);
    used.add(String(o.id));
  };
  const live = (lvl) => lvl.queue.filter((e) => !e.cancelled);
  const bestOf = () => {
    const best = { bid: null, ask: null };
    for (const [price, lvl] of levels) {
      if (!live(lvl).length) continue;
      if (lvl.side === "buy" && (best.bid == null || price > best.bid)) best.bid = price;
      if (lvl.side === "sell" && (best.ask == null || price < best.ask)) best.ask = price;
    }
    return best;
  };
  const rest = (o, qty, initial) => {
    const lvl = levels.get(o.price) ?? { side: o.side, queue: [] };
    if (lvl.side !== o.side && lvl.queue.length) throw new Error(`book: order ${o.id} would rest at ${o.price}, which holds the other side`);
    lvl.side = o.side;
    lvl.queue.push({ id: String(o.id), qty, cancelled: false });
    levels.set(o.price, lvl);
    const slot = lvl.queue.length - 1;
    if (slot >= 5) throw new Error(`book: more than 5 orders at price ${o.price}`);
    chips[o.id] = { id: String(o.id), side: o.side, price: o.price, qtys: [qty], initial, slot0: slot };
    return slot;
  };

  for (const o of props.book ?? []) {
    checkOrder(o);
    const b = bestOf();
    if ((o.side === "buy" && b.ask != null && o.price >= b.ask) || (o.side === "sell" && b.bid != null && o.price <= b.bid)) {
      throw new Error(`book: initial order ${o.id} crosses the book; start from a book with no crossing prices`);
    }
    rest(o, o.qty, true);
  }
  const initialBest = bestOf();

  const steps = props.steps.map((s) => {
    const actions = [];
    let t = 0;
    let best = JSON.stringify(bestOf());
    const bestChanged = (when) => {
      const now = bestOf();
      if (JSON.stringify(now) !== best) { best = JSON.stringify(now); actions.push({ t: when, type: "best", best: now }); }
    };
    if (s.order && s.cancel != null) throw new Error(`book: step "${s.at}" has both an order and a cancel`);

    if (s.order) {
      const o = s.order;
      const GAP = s.pace ?? 0.8;
      if (!(GAP >= 0.8)) throw new Error(`book: step "${s.at}" pace must be ≥ 0.8 s`);
      checkOrder(o);
      const leftVersions = [o.qty];
      const anchors = [];  // sim time at which each fill / tombstone pop starts
      let left = o.qty;
      actions.push({ t: 0, type: "incoming", price: o.price });
      t = 0.7;
      const crosses = (price) => (o.side === "buy" ? price <= o.price : price >= o.price);
      while (left > 0) {
        const candidates = [...levels].filter(([p, l]) => l.side !== o.side && l.queue.length && crosses(p))
          .sort(([a], [b]) => (o.side === "buy" ? a - b : b - a));
        if (!candidates.length) break;
        const [price, lvl] = candidates[0];
        const front = lvl.queue[0];
        anchors.push(t);
        if (front.cancelled) { // lazy deletion: the tombstone is popped only when matching reaches it
          lvl.queue.shift();
          actions.push({ t, type: "skip", id: front.id });
          actions.push({ t: t + 0.3, type: "layout", price, slots: lvl.queue.map((e, k) => [e.id, k]) });
          if (!lvl.queue.length) levels.delete(price);
          t += GAP * 0.7;
          continue;
        }
        const filled = Math.min(left, front.qty);
        front.qty -= filled;
        left -= filled;
        chips[front.id].qtys.push(front.qty);
        leftVersions.push(left);
        trades.push({ agg: String(o.id), rest: front.id, price, qty: filled });
        totals.push(totals[totals.length - 1] + filled);
        actions.push({ t, type: "fill", id: front.id, side: lvl.side, ver: chips[front.id].qtys.length - 1,
          leftVer: leftVersions.length - 1, totalVer: totals.length - 1, trade: trades.length - 1 });
        if (front.qty === 0) {
          lvl.queue.shift();
          actions.push({ t: t + 0.45, type: "remove", id: front.id });
          actions.push({ t: t + 0.7, type: "layout", price, slots: lvl.queue.map((e, k) => [e.id, k]) });
          if (!lvl.queue.length) levels.delete(price);
          bestChanged(t + 0.7);
        }
        t += GAP;
      }
      if (left > 0) {
        const slot = rest(o, left, false);
        actions.push({ t, type: "rest", id: String(o.id), price: o.price, slot });
        bestChanged(t);
        t += 0.6;
      }
      actions.push({ t, type: "done" });
      t += 0.4;
      return { order: o, leftVersions, actions, duration: t, anchors };
    }

    if (s.cancel != null) {
      const id = String(s.cancel);
      const entry = [...levels].map(([p, l]) => [p, l, l.queue.findIndex((e) => e.id === id)]).find(([, , k]) => k >= 0);
      if (!entry || entry[1].queue[entry[2]].cancelled) throw new Error(`book: step "${s.at}" cancels ${id}, which is not resting`);
      const [price, lvl, k] = entry;
      if (lazy) {
        lvl.queue[k].cancelled = true;
        actions.push({ t: 0, type: "cancel", id });
      } else {
        lvl.queue.splice(k, 1);
        actions.push({ t: 0, type: "remove", id });
        actions.push({ t: 0.25, type: "layout", price, slots: lvl.queue.map((e, j) => [e.id, j]) });
        if (!lvl.queue.length) levels.delete(price);
      }
      bestChanged(0.3);
      return { actions, duration: 0.8 };
    }
    return { actions, duration: 0.5 };
  });

  const prices = props.prices ?? [...new Set([...(props.book ?? []), ...props.steps.filter((s) => s.order).map((s) => s.order)].map((o) => o.price))]
    .sort((a, b) => b - a);
  for (const c of Object.values(chips)) if (!prices.includes(c.price)) throw new Error(`book: price ${c.price} missing from props.prices`);
  for (const tr of trades) if (!prices.includes(tr.price)) throw new Error(`book: price ${tr.price} missing from props.prices`);
  return { prices, chips, trades, totals, steps, initialBest };
}

// Ladder in x 80–1180, y 232–740; chips queue to the right of the price column.
function bookGeometry(rows) {
  const top = 232;
  const rowH = Math.min(78, Math.floor(508 / rows));
  const CW = 150;
  const CH = 50;
  const rowTop = (i) => top + i * rowH;
  const rowY = (i) => rowTop(i) + rowH / 2;
  return { rowH, rowTop, rowY, chipAt: (i, slot) => [372 + slot * (CW + 14), rowY(i) - CH / 2] };
}
