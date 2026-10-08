// Assembles scenes into one paused GSAP master timeline driven by timing.js.
// Render mode (?render): exposes window.__seek(t) for frame capture.
// Preview mode (default): scaled stage + play/scrub bar synced to the narration.
(() => {
  const TRANSITION = 0.5; // seconds
  const LEAD = 0.6; // a scene arrives this long before its narration line starts
  const CAPTION_MAX_WORDS = 7;
  const CAPTION_MAX_CHARS = 44;

  const scenes = [];
  window.registerScene = (def) => scenes.push(def);

  const normalize = (w) => w.toLowerCase().replace(/^[^\w+:<*&\[]+|[^\w+]+$/g, "");

  // Returns a cue function: cue("word", n) → scene-local seconds of the n-th occurrence.
  function makeCue(line, sceneStart) {
    return (word, n = 1) => {
      const target = normalize(word);
      let seen = 0;
      for (const w of line.words) {
        if (normalize(w.text) === target && ++seen === n) return w.start + line.start - sceneStart;
      }
      throw new Error(`scene ${line.id}: cue "${word}" #${n} not found in narration`);
    };
  }

  function makeFx(tl) {
    const fx = {
      in(targets, at, { x = 0, y = 18, scale = 0.985, dur = 0.6, stagger = 0, ease = "power3.out" } = {}) {
        tl.fromTo(targets, { autoAlpha: 0, x, y, scale }, { autoAlpha: 1, x: 0, y: 0, scale: 1, duration: dur, stagger, ease }, at);
        return fx;
      },
      out(targets, at, { dur = 0.4, y = 0 } = {}) {
        tl.to(targets, { autoAlpha: 0, y, duration: dur, ease: "power2.in" }, at);
        return fx;
      },
      to(targets, at, vars) {
        tl.to(targets, { duration: 0.5, ease: "power2.out", ...vars }, at);
        return fx;
      },
      // scaleX 0 → 1 from the element's transform-origin (bars, strikes, rules)
      grow(targets, at, { dur = 0.6, ease = "power2.inOut" } = {}) {
        tl.fromTo(targets, { autoAlpha: 1, scaleX: 0 }, { scaleX: 1, duration: dur, ease }, at);
        return fx;
      },
      draw(paths, at, dur = 0.8) {
        gsap.utils.toArray(paths).forEach((p) => {
          const len = Math.ceil(p.getTotalLength()) + 2;
          tl.fromTo(p, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: dur, ease: "power2.out" }, at);
        });
        return fx;
      },
      // highlight a .ln inside a navy code card (tile band, ink text)
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

  function captionGroups(words) {
    const groups = [];
    let cur = [];
    const flush = () => cur.length && groups.push(cur) && (cur = []);
    words.forEach((w, i) => {
      const chars = cur.reduce((n, x) => n + x.text.length + 1, 0) + w.text.length;
      if (cur.length >= CAPTION_MAX_WORDS || chars > CAPTION_MAX_CHARS) flush();
      cur.push(w);
      const next = words[i + 1];
      if (/[.?!:]$/.test(w.text) || (next && next.start - w.end > 0.45)) flush();
    });
    flush();
    return groups;
  }

  function buildCaptions(master, lines) {
    const root = document.getElementById("captions");
    lines.forEach((line) => {
      const groups = captionGroups(line.words);
      groups.forEach((group, gi) => {
        const el = document.createElement("div");
        el.className = "cap-group";
        const pill = document.createElement("div");
        pill.className = "cap-pill";
        const spans = group.map((w) => {
          const s = document.createElement("span");
          s.className = "cap-word";
          s.textContent = w.text;
          pill.appendChild(s);
          return s;
        });
        el.appendChild(pill);
        root.appendChild(el);
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

  function build() {
    const { duration } = window.TIMING;
    const strict = !new URLSearchParams(location.search).has("draft");
    if (scenes.length !== window.TIMING.lines.length) {
      const msg = `${scenes.length} scenes for ${window.TIMING.lines.length} narration lines`;
      if (strict && new URLSearchParams(location.search).has("render")) throw new Error(msg);
      console.warn(msg);
    }
    const lines = window.TIMING.lines.slice(0, scenes.length);
    const stage = document.getElementById("stage");
    const master = gsap.timeline({ paused: true });
    const els = scenes.map((def, i) => {
      const el = document.createElement("section");
      el.className = `scene scene-${def.id}`;
      el.innerHTML = def.html;
      stage.insertBefore(el, document.getElementById("captions"));
      gsap.set(el, { autoAlpha: i === 0 ? 1 : 0 });
      return el;
    });
    scenes.forEach((def, i) => {
      const line = lines[i];
      const sceneStart = i === 0 ? 0 : line.start - LEAD;
      const tl = gsap.timeline();
      def.build({ tl, fx: makeFx(tl), q: gsap.utils.selector(els[i]), cue: makeCue(line, sceneStart), line, sceneStart });
      master.add(tl, sceneStart);
      if (i > 0) transition(master, els[i - 1], els[i], sceneStart, i % 2 ? "push" : "fade");
    });
    buildCaptions(master, lines);
    master.set({}, {}, duration);
    master.time(0);
    return master;
  }

  function preview(master) {
    const audio = new Audio("build/narration.wav");
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
    const t = Number(new URLSearchParams(location.search).get("t") ?? 0);
    audio.currentTime = t;
    show(t);
  }

  window.__ready = document.fonts.ready.then(() => {
    const master = build();
    window.__duration = master.duration();
    window.__seek = (t) => void master.time(t);
    if (new URLSearchParams(location.search).has("render")) document.body.classList.add("render");
    else preview(master);
    return master.duration();
  });
})();
