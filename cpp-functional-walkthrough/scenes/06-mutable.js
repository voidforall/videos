registerScene({
  id: "06",
  html: `
    <style>
      .scene-06 .src { left: 80px; top: 222px; width: 1000px; }
      .scene-06 .src .code-body { font-size: 27px; }
      .scene-06 .mut { display: inline-block; overflow: hidden; vertical-align: bottom; white-space: pre; }
      .scene-06 .err { left: 80px; top: 500px; }
      .scene-06 .fine { left: 80px; top: 500px; }
      .scene-06 .closure { left: 1160px; top: 222px; width: 680px; }
      .scene-06 .closure .fields { display: flex; gap: 22px; margin-top: 24px; }
      .scene-06 .field { flex: 1; height: 130px; padding: 18px 22px; border: 1px solid var(--hair-strong); border-radius: 10px; background: var(--cream); }
      .scene-06 .field code { font: 500 22px/1 var(--mono); }
      .scene-06 .field .val { position: relative; height: 66px; margin-top: 8px; }
      .scene-06 .field .val b { position: absolute; left: 0; top: 0; font: 400 66px/1 var(--serif); }
      .scene-06 .call { top: 580px; width: 540px; height: 180px; display: flex; align-items: center; justify-content: space-between; padding: 0 40px; }
      .scene-06 .call code { font: 500 34px/1 var(--mono); }
      .scene-06 .call b { font: 400 120px/1 var(--serif); letter-spacing: -0.02em; }
      .scene-06 .k1 { left: 80px; } .scene-06 .k2 { left: 690px; } .scene-06 .k3 { left: 1300px; }
      .scene-06 .k3 b { color: var(--coral); }
      .scene-06 .k3 .label { position: absolute; left: 40px; top: 24px; }
      .scene-06 .uses { left: 80px; right: 80px; top: 800px; display: flex; gap: 18px; }
      .scene-06 .uses .chip { font-size: 21px; }
      .scene-06 .uses .chip .label { font-size: 15px; }
    </style>
    <p class="kicker">Q5 · mutable</p>
    <p class="qindex">05 / 07</p>
    <h2 class="title">State inside the <em>lambda</em></h2>
    <div class="rule"></div>

    <section class="code src">
      <div class="code-head"><span>counter.cpp</span><span>call operator</span></div>
      <div class="code-body"><span class="ln"><span class="k">int</span> count = <span class="n">0</span>;</span><span class="ln l-head"><span class="k">auto</span> counter = [count]() <span class="mut k">mutable </span>{</span><span class="ln l-inc">  <span class="k">return</span> ++count;</span><span class="ln">};</span></div>
    </section>
    <span class="chip warn err">✕ operator() is const · count is read-only</span>
    <span class="chip ok fine">✓ mutable · operator() is non-const</span>

    <article class="card closure">
      <p class="label">Two variables named count</p>
      <div class="fields">
        <div class="field"><code>closure.count</code><div class="val inner"><b class="v0">0</b><b class="v1">1</b><b class="v2">2</b></div></div>
        <div class="field"><code>outer count</code><div class="val"><b>0</b></div></div>
      </div>
    </article>

    <div class="card paper call k1"><code>counter()</code><b>1</b></div>
    <div class="card paper call k2"><code>counter()</code><b>2</b></div>
    <div class="card paper call k3"><span class="label">original</span><code>count</code><b>0</b></div>

    <div class="uses">
      <span class="chip u1"><span class="label">generator</span>[n = 0]() mutable { return n++; }</span>
      <span class="chip u2"><span class="label">round-robin</span>idx++ % n</span>
      <span class="chip u3"><span class="label">owns</span>[buf = std::move(buf)]</span>
    </div>
  `,
  build({ tl, fx, q, cue }) {
    const mut = q(".mut")[0];
    const mutWidth = mut.scrollWidth;
    fx.in([...q(".kicker"), ...q(".qindex"), ...q(".title"), ...q(".rule")], 0.05, { y: -12, stagger: 0.08 })
      .in(q(".src"), cue("mutable") + 0.3, { y: 18 });
    tl.fromTo(mut, { width: 0, autoAlpha: 0 }, { width: mutWidth, autoAlpha: 1, duration: 0.6, ease: "power2.inOut" }, cue("mutable", 2));
    fx.hl(q(".l-inc"), cue("const"))
      .in(q(".err"), cue("const") + 0.3, { y: 10 })
      .unhl(q(".l-inc"), cue("mutable", 2))
      .out(q(".err"), cue("mutable", 2))
      .hl(q(".l-head"), cue("mutable", 2) + 0.2)
      .in(q(".fine"), cue("modify"), { y: 10 })
      .unhl(q(".l-head"), cue("counter") - 0.2)
      .in(q(".closure"), cue("counter") - 0.3, { y: 18 })
      .in(q(".k1"), cue("1") - 0.2, { y: 18 })
      .in(q(".k2"), cue("2") - 0.2, { y: 18 })
      .in(q(".k3"), cue("0") - 0.3, { y: 18 })
      .in(q(".v0"), cue("counter") - 0.3, { y: 0, dur: 0.01 })
      .out(q(".v0"), cue("1") - 0.2, { y: -24, dur: 0.3 })
      .in(q(".v1"), cue("1") - 0.1, { y: 24, dur: 0.35 })
      .out(q(".v1"), cue("2") - 0.2, { y: -24, dur: 0.3 })
      .in(q(".v2"), cue("2") - 0.1, { y: 24, dur: 0.35 })
      .in(q(".u1"), cue("generators"), { y: 14 })
      .in(q(".u2"), cue("round"), { y: 14 })
      .in(q(".u3"), cue("unique") - 0.3, { y: 14 })
      .to(q(".closure"), cue("inside"), { borderColor: "rgba(20,20,19,0.45)", duration: 0.5 });
  },
});
