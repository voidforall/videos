// Revision episodes index. Hash routes:
//   #/                      home: series cards (+ continue where you left off)
//   #/s/<series>            series: episode cards
//   #/e/<slug>[/<clip>]     episode: player + clip list
// Legacy links (#<slug>/<clip>, used in ai-docs) redirect to #/e/<slug>/<clip>.
(() => {
  const view = document.getElementById("view");
  const crumbs = document.querySelector(".crumbs");
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

  // — per-viewer progress (browser storage; the page works without it) —
  const store = {
    get(key, fallback) {
      try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
    },
  };
  let reviewed = new Set(store.get("reviewed-clips", []));
  const clipKey = (ep, clip) => `${ep.slug}/${clip.id}`;
  const isDone = (ep, clip) => reviewed.has(clipKey(ep, clip));
  const setDone = (ep, clip, on) => {
    reviewed = new Set(reviewed);
    on ? reviewed.add(clipKey(ep, clip)) : reviewed.delete(clipKey(ep, clip));
    store.set("reviewed-clips", [...reviewed]);
  };

  const totals = (episodes) => {
    const clips = episodes.flatMap((ep) => ep.clips.map((c) => ({ ep, c })));
    return {
      clips: clips.length,
      seconds: clips.reduce((n, x) => n + x.c.duration, 0),
      done: clips.filter((x) => isDone(x.ep, x.c)).length,
    };
  };
  const meter = (done, total) => `<div class="meter" role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${done}"><i style="width:${total ? (100 * done) / total : 0}%"></i></div>`;
  const progressText = (t) => (t.done === t.clips ? `<span class="done-tag">✓ all reviewed</span>` : `${t.done} / ${t.clips} reviewed`);

  function setCrumbs(parts) {
    crumbs.innerHTML = parts.map((p, i) => (i < parts.length - 1
      ? `<a href="${p.href}">${esc(p.label)}</a><span aria-hidden="true">/</span>`
      : `<span aria-current="page">${esc(p.label)}</span>`)).join("");
  }

  // — views —
  function home(catalog) {
    document.title = "Revision episodes";
    setCrumbs([{ label: "Revision episodes" }]);
    const last = store.get("last-played", null);
    const lastEp = last && catalog.episodes.find((e) => e.slug === last.slug);
    const lastClip = lastEp && lastEp.clips.find((c) => c.id === last.clip);
    view.innerHTML = `
      <p class="eyebrow">Technical field notes</p>
      <h1>Revision episodes</h1>
      <p class="lede">One short clip per question. Each opens with the question and a pause—answer out loud first, then watch the explanation.</p>
      ${lastClip ? `
        <a class="resume" href="#/e/${esc(lastEp.slug)}/${esc(lastClip.id)}">
          <img src="${esc(lastClip.poster)}" alt="" loading="lazy" />
          <div><span class="stats">Continue · ${esc(lastEp.title)} · clip ${esc(lastClip.id)}</span><strong>${esc(lastClip.title)}</strong><p>${esc(lastClip.question)}</p></div>
        </a>` : ""}
      <div class="section-head"><h2>Series</h2><span class="stats">${catalog.series.length} series · ${plural(catalog.episodes.length, "episode")}</span></div>
      <div class="grid">
        ${catalog.series.map((s) => {
          const eps = catalog.episodes.filter((e) => e.series === s.id);
          const t = totals(eps);
          const cover = eps[0] ? `<img src="${esc(eps[0].clips[0].poster)}" alt="" loading="lazy" />` : "";
          return `
            <a class="card series-card" href="#/s/${esc(s.id)}">
              <div class="thumb">${cover}</div>
              <div class="card-body">
                <span class="stats">${plural(eps.length, "episode")} · ${plural(t.clips, "clip")} · ${mmss(t.seconds)}</span>
                <h2>${esc(s.title)}</h2>
                <p>${esc(s.blurb)}</p>
                <div class="card-foot stats"><span>${progressText(t)}</span></div>
                ${meter(t.done, t.clips)}
              </div>
            </a>`;
        }).join("")}
      </div>`;
  }

  function series(catalog, s) {
    document.title = `${s.title} · Revision episodes`;
    setCrumbs([{ label: "Revision episodes", href: "#/" }, { label: s.title }]);
    const eps = catalog.episodes.filter((e) => e.series === s.id);
    const t = totals(eps);
    view.innerHTML = `
      <p class="eyebrow">Series</p>
      <h1>${esc(s.title)}</h1>
      <p class="lede">${esc(s.blurb)}</p>
      <div class="section-head"><h2>Episodes</h2><span class="stats">${plural(eps.length, "episode")} · ${progressText(t)}</span></div>
      <div class="grid">
        ${eps.map((ep) => {
          const et = totals([ep]);
          return `
            <a class="card" href="#/e/${esc(ep.slug)}">
              <div class="thumb"><img src="${esc(ep.clips[0].poster)}" alt="" loading="lazy" /><span class="badge">${plural(ep.clips.length, "clip")} · ${mmss(et.seconds)}</span></div>
              <div class="card-body">
                <span class="stats">${esc(ep.kicker)}</span>
                <h2>${esc(ep.title)}</h2>
                <p>${esc(ep.summary)}</p>
                <div class="card-foot stats"><span>${progressText(et)}</span></div>
                ${meter(et.done, et.clips)}
              </div>
            </a>`;
        }).join("")}
      </div>`;
  }

  function episode(catalog, ep, clipId) {
    const s = catalog.series.find((x) => x.id === ep.series);
    const siblings = catalog.episodes.filter((e) => e.series === ep.series);
    const idx = siblings.indexOf(ep);
    const [prev, next] = [siblings[idx - 1], siblings[idx + 1]];
    const multi = ep.clips.length > 1;
    let current = ep.clips.find((c) => c.id === clipId) ?? ep.clips[0];
    document.title = `${ep.title} · Revision episodes`;
    setCrumbs([{ label: "Revision episodes", href: "#/" }, { label: s ? s.title : ep.series, href: `#/s/${ep.series}` }, { label: ep.title }]);

    view.innerHTML = `
      <div class="episode-head">
        <div><p class="eyebrow">${esc(ep.kicker)}</p><h1>${esc(ep.title)}</h1></div>
        <div class="stats ep-progress"></div>
      </div>
      <p class="lede">${esc(ep.summary)}</p>
      <div class="layout ${multi ? "multi" : ""}">
        <div>
          <div class="player">
            <video controls playsinline preload="metadata"></video>
            <div class="now"><small></small><span></span></div>
          </div>
          <div class="under">
            <label><input type="checkbox" class="mark" /> Mark this clip reviewed</label>
            <span>Source notes: <a href="${esc(ep.source)}">${esc(ep.source.split("/").slice(-2).join("/"))}</a></span>
          </div>
        </div>
        ${multi ? `<ol class="clips">${ep.clips.map((c) => `
          <li><button class="clip" data-id="${esc(c.id)}">
            <span class="clip-num">${esc(c.id)}</span><span class="clip-title">${esc(c.title)}</span><span class="clip-meta">${mmss(c.duration)}</span>
            <span class="clip-q">${esc(c.question)}</span>
          </button></li>`).join("")}</ol>` : ""}
      </div>
      <nav class="pager" aria-label="More in this series">
        ${prev ? `<a class="prev" href="#/e/${esc(prev.slug)}"><small>← Previous episode</small><span>${esc(prev.title)}</span></a>` : ""}
        ${next ? `<a class="next" href="#/e/${esc(next.slug)}"><small>Next episode →</small><span>${esc(next.title)}</span></a>` : ""}
      </nav>`;

    const video = view.querySelector("video");
    const box = view.querySelector(".mark");
    const refresh = () => {
      view.querySelectorAll(".clip").forEach((b) => {
        b.setAttribute("aria-current", String(b.dataset.id === current.id));
        b.classList.toggle("done", isDone(ep, ep.clips.find((c) => c.id === b.dataset.id)));
      });
      const t = totals([ep]);
      view.querySelector(".ep-progress").innerHTML = multi ? `${progressText(t)}${meter(t.done, t.clips)}` : "";
      box.checked = isDone(ep, current);
    };
    const select = (clip, autoplay) => {
      current = clip;
      video.poster = clip.poster;
      video.src = clip.video;
      view.querySelector(".now small").textContent = multi ? `Clip ${clip.id} of ${ep.clips.length} · ${mmss(clip.duration)}` : `Duration · ${mmss(clip.duration)}`;
      view.querySelector(".now span").textContent = clip.question;
      history.replaceState(null, "", `#/e/${ep.slug}/${clip.id}`);
      store.set("last-played", { slug: ep.slug, clip: clip.id });
      if (autoplay) video.play().catch(() => {});
      refresh();
    };

    view.querySelectorAll(".clip").forEach((b) =>
      b.addEventListener("click", () => select(ep.clips.find((c) => c.id === b.dataset.id), true)));
    box.addEventListener("change", () => { setDone(ep, current, box.checked); refresh(); });
    video.addEventListener("ended", () => {
      setDone(ep, current, true);
      const following = ep.clips[ep.clips.indexOf(current) + 1];
      following ? select(following, true) : refresh();
    });
    select(current, false);
  }

  function notFound(message) {
    setCrumbs([{ label: "Revision episodes", href: "#/" }, { label: "Not found" }]);
    view.innerHTML = `<p class="error">${esc(message)} <a href="#/">Back to all series</a>.</p>`;
  }

  // — routing —
  function route(catalog) {
    const hash = decodeURIComponent(location.hash.replace(/^#\/?/, ""));
    const parts = hash.split("/").filter(Boolean);
    if (parts.length && parts[0] !== "s" && parts[0] !== "e") {
      location.replace(`#/e/${parts.join("/")}`); // legacy #<slug>/<clip>
      return;
    }
    window.scrollTo(0, 0);
    if (!parts.length) return home(catalog);
    if (parts[0] === "s") {
      const s = catalog.series.find((x) => x.id === parts[1]);
      return s ? series(catalog, s) : notFound(`No series "${parts[1]}".`);
    }
    const ep = catalog.episodes.find((e) => e.slug === parts[1]);
    return ep ? episode(catalog, ep, parts[2]) : notFound(`No episode "${parts[1]}".`);
  }

  async function main() {
    try {
      const res = await fetch("catalog.json", { cache: "no-cache" });
      if (!res.ok) throw new Error(`catalog.json: HTTP ${res.status}`);
      const catalog = await res.json();
      addEventListener("hashchange", () => route(catalog));
      route(catalog);
    } catch (e) {
      view.innerHTML = `<p class="error">Could not load the episode catalog. ${esc(e.message)}</p>`;
    }
  }
  main();
})();
