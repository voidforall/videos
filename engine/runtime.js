// Builds one clip from episodes/<ep>/episode.json + build/<clip>/timing.json into a paused
// GSAP master timeline. URL: player.html?ep=<slug>&clip=<id>[&render][&t=seconds]
// Render mode exposes window.__seek(t) / window.__duration for frame capture.
(() => {
  const TRANSITION = 0.5;
  const LEAD = 0.6; // a scene arrives this long before its narration starts
  const CAPTION_MAX_WORDS = 7;
  const CAPTION_MAX_CHARS = 44;
  const NUMBER_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
    "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"];

  const templates = {};
  window.registerTemplate = (type, def) => (templates[type] = def);

  const params = new URLSearchParams(location.search);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  // lowercase, trim punctuation, and fold number words to digits so "8" and "eight" match
  function normalize(word) {
    const w = word.toLowerCase().replace(/^[^\w+:<*&\[]+|[^\w+]+$/g, "");
    const n = NUMBER_WORDS.indexOf(w);
    return n >= 0 ? String(n) : w;
  }

  // cue("word"), cue("word#2"), cue("word+0.4"), cue("end"), cue(1.5) → scene-local seconds
  function makeCue(line, sceneStart) {
    const speechStart = line.start - sceneStart;
    return (spec) => {
      if (typeof spec === "number") return speechStart + spec;
      if (spec === "start") return speechStart;
      if (spec === "end") return speechStart + line.duration;
      const m = /^(.+?)(?:#(\d+))?([+-]\d*\.?\d+)?$/.exec(spec);
      if (!m) throw new Error(`bad cue "${spec}"`);
      const target = normalize(m[1]);
      const nth = Number(m[2] ?? 1);
      let seen = 0;
      for (const w of line.words) {
        if (normalize(w.text) === target && ++seen === nth) return speechStart + w.start + Number(m[3] ?? 0);
      }
      throw new Error(`cue "${spec}" not found in: ${line.words.map((w) => w.text).join(" ")}`);
    };
  }

  function makeFx(tl) {
    const fx = {
      in(targets, at, { x = 0, y = 18, scale = 0.985, dur = 0.6, stagger = 0, ease = "power3.out" } = {}) {
        tl.fromTo(targets, { autoAlpha: 0, x, y, scale }, { autoAlpha: 1, x: 0, y: 0, scale: 1, duration: dur, stagger, ease }, at);
        return fx;
      },
      out(targets, at, { dur = 0.35, y = 0 } = {}) {
        tl.to(targets, { autoAlpha: 0, y, duration: dur, ease: "power2.in" }, at);
        return fx;
      },
      to(targets, at, vars) {
        tl.to(targets, { duration: 0.5, ease: "power2.out", ...vars }, at);
        return fx;
      },
      grow(targets, at, { dur = 0.6, ease = "power2.inOut" } = {}) {
        tl.fromTo(targets, { autoAlpha: 1, scaleX: 0 }, { scaleX: 1, duration: dur, ease }, at);
        return fx;
      },
      // --hl (0..1) blends a code line into the ink-on-tile highlight band
      hl(lines, at, dur = 0.45) {
        tl.fromTo(lines, { "--hl": 0 }, { "--hl": 1, duration: dur, ease: "power2.out", immediateRender: false }, at);
        return fx;
      },
      unhl(lines, at, dur = 0.4) {
        tl.to(lines, { "--hl": 0, duration: dur, ease: "power2.out" }, at);
        return fx;
      },
    };
    return fx;
  }

  function chrome(episode, clip, total, props, kind) {
    const head = `<p class="kicker">${esc(episode.kicker)}</p><p class="qindex">${clip.id} / ${String(total).padStart(2, "0")}</p>`;
    if (kind === "minimal" || !props.title) return head;
    return `${head}<h2 class="title">${props.title}</h2><div class="rule"></div>`;
  }

  function captionGroups(words) {
    const groups = [];
    let cur = [];
    words.forEach((w, i) => {
      const chars = cur.reduce((n, x) => n + x.text.length + 1, 0) + w.text.length;
      if (cur.length && (cur.length >= CAPTION_MAX_WORDS || chars > CAPTION_MAX_CHARS)) groups.push(cur.splice(0));
      cur.push(w);
      const next = words[i + 1];
      if (/[.?!:]$/.test(w.text) || (next && next.start - w.end > 0.45)) groups.push(cur.splice(0));
    });
    if (cur.length) groups.push(cur);
    return groups;
  }

  function buildCaptions(master, lines) {
    const root = document.getElementById("captions");
    lines.forEach((line) => {
      const groups = captionGroups(line.words);
      groups.forEach((group, gi) => {
        const el = document.createElement("div");
        el.className = "cap-group";
        el.innerHTML = `<div class="cap-pill">${group.map((w) => `<span class="cap-word">${esc(w.text)}</span>`).join("")}</div>`;
        root.appendChild(el);
        const spans = [...el.querySelectorAll(".cap-word")];
        const start = line.start + group[0].start;
        const linger = line.start + group[group.length - 1].end + 0.3;
        const end = gi + 1 < groups.length ? Math.min(linger, line.start + groups[gi + 1][0].start) : linger;
        master.set(el, { opacity: 1 }, start);
        master.set(el, { opacity: 0 }, end);
        group.forEach((w, i) => {
          master.set(spans[i], { className: "cap-word" }, start);
          master.set(spans[i], { className: "cap-word is-active" }, line.start + w.start);
          if (i > 0) master.set(spans[i - 1], { className: "cap-word is-spoken" }, line.start + w.start);
        });
        master.set(spans[spans.length - 1], { className: "cap-word is-spoken" }, end - 0.2);
      });
    });
  }

  function transition(master, prev, next, at, kind) {
    if (kind === "push") {
      master.fromTo(next, { autoAlpha: 1, x: 1920 }, { x: 0, duration: TRANSITION, ease: "power3.inOut" }, at);
      master.to(prev, { x: -1920, duration: TRANSITION, ease: "power3.inOut" }, at);
    } else {
      // fade through cream: the outgoing scene clears before the incoming one appears
      master.to(prev, { autoAlpha: 0, duration: TRANSITION * 0.5, ease: "power2.in" }, at);
      master.fromTo(next, { autoAlpha: 0, x: 0 }, { autoAlpha: 1, duration: TRANSITION * 0.6, ease: "power2.out" }, at + TRANSITION * 0.4);
    }
    master.set(prev, { autoAlpha: 0 }, at + TRANSITION);
  }

  function build(episode, clip, timing) {
    if (clip.scenes.length !== timing.lines.length) {
      throw new Error(`clip ${clip.id}: ${clip.scenes.length} scenes but ${timing.lines.length} narration lines — rerun build`);
    }
    const stage = document.getElementById("stage");
    const captions = document.getElementById("captions");
    const master = gsap.timeline({ paused: true });
    const total = episode.clips.length;
    const views = clip.scenes.map((scene, i) => {
      const tpl = templates[scene.type];
      if (!tpl) throw new Error(`clip ${clip.id} scene ${i + 1}: unknown template "${scene.type}"`);
      const props = scene.props ?? {};
      const el = document.createElement("section");
      el.className = `scene tpl-${scene.type}`;
      el.innerHTML = chrome(episode, clip, total, props, tpl.chrome) + tpl.render(props, { esc, scene });
      stage.insertBefore(el, captions);
      gsap.set(el, { autoAlpha: i === 0 ? 1 : 0 });
      return { el, tpl, props, scene };
    });
    views.forEach(({ el, tpl, props, scene }, i) => {
      const line = timing.lines[i];
      const sceneStart = i === 0 ? 0 : line.start - LEAD;
      const tl = gsap.timeline();
      const fx = makeFx(tl);
      const q = gsap.utils.selector(el);
      const chromeEls = [...q(".kicker"), ...q(".qindex"), ...q(".title"), ...q(".rule")];
      fx.in(chromeEls, 0.05, { y: -12, stagger: 0.08 });
      tpl.build({ tl, fx, q, cue: makeCue(line, sceneStart), props, scene, line, el });
      master.add(tl, sceneStart);
      if (i > 0) transition(master, views[i - 1].el, el, sceneStart, i % 2 ? "push" : "fade");
    });
    buildCaptions(master, timing.lines);
    master.set({}, {}, timing.duration);
    master.time(0);
    return master;
  }

  function preview(master, audioUrl) {
    const audio = new Audio(audioUrl);
    const bar = document.getElementById("controls");
    const play = bar.querySelector("button");
    const scrub = bar.querySelector("input");
    const clock = bar.querySelector("output");
    scrub.max = master.duration();
    const fit = () => {
      const s = Math.min(innerWidth / 1920, (innerHeight - 64) / 1080);
      document.getElementById("stage").style.transform = `scale(${s})`;
      document.getElementById("frame").style.cssText = `width:${1920 * s}px;height:${1080 * s}px`;
    };
    const show = (t) => {
      master.time(t);
      scrub.value = t;
      clock.textContent = `${t.toFixed(2)}s / ${master.duration().toFixed(2)}s`;
    };
    const loop = () => {
      show(audio.currentTime);
      if (!audio.paused) requestAnimationFrame(loop);
    };
    play.onclick = () => (audio.paused ? audio.play().then(loop) : audio.pause());
    audio.onplay = () => (play.textContent = "Pause");
    audio.onpause = () => (play.textContent = "Play");
    scrub.oninput = () => {
      audio.currentTime = Number(scrub.value);
      show(Number(scrub.value));
    };
    addEventListener("resize", fit);
    fit();
    const t = Number(params.get("t") ?? 0);
    audio.currentTime = t;
    show(t);
  }

  async function fetchJson(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
    return res.json();
  }

  async function main() {
    const ep = params.get("ep");
    const clipId = params.get("clip");
    if (!ep || !clipId) throw new Error("usage: player.html?ep=<episode-slug>&clip=<id>");
    const base = `../episodes/${ep}`;
    const [episode, timing] = await Promise.all([
      fetchJson(`${base}/episode.json`),
      fetchJson(`${base}/build/${clipId}/timing.json`),
      document.fonts.ready,
    ]);
    const clip = episode.clips.find((c) => c.id === clipId);
    if (!clip) throw new Error(`episode ${ep} has no clip ${clipId}`);
    document.title = `${episode.title} · ${clip.title}`;
    const master = build(episode, clip, timing);
    window.__duration = master.duration();
    window.__seek = (t) => void master.time(t);
    if (params.has("render")) document.body.classList.add("render");
    else preview(master, `${base}/build/${clipId}/narration.wav`);
    return master.duration();
  }

  window.__ready = main();
  window.__ready.catch((e) => {
    document.body.insertAdjacentHTML("afterbegin", `<pre class="fatal">${esc(e.message)}</pre>`);
    throw e;
  });
})();
