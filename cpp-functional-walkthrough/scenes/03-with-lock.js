registerScene({
  id: "03",
  html: `
    <style>
      .scene-03 .bad { left: 80px; top: 226px; width: 720px; }
      .scene-03 .good { left: 860px; top: 226px; width: 980px; }
      .scene-03 .code-body { font-size: 24px; }
      .scene-03 .x-text { position: relative; }
      .scene-03 .strike { position: absolute; left: -6px; right: -6px; top: 52%; height: 3px; background: var(--warn); transform-origin: 0 50%; }
      .scene-03 .stuck { left: 80px; top: 506px; }
      .scene-03 .lane { left: 260px; top: 640px; width: 1400px; height: 64px; border-radius: 9999px; border: 1px solid var(--hair-strong); background: var(--cream); }
      .scene-03 .lane-fill { left: 260px; top: 640px; width: 1400px; height: 64px; border-radius: 9999px; background: var(--tile-strong); transform-origin: 0 50%; }
      .scene-03 .lane-text { left: 260px; top: 640px; width: 1400px; height: 64px; text-align: center; font: 400 34px/64px var(--serif); }
      .scene-03 .lane-text em { font-style: italic; }
      .scene-03 .node { top: 612px; width: 200px; height: 120px; border-radius: 12px; border: 1px solid var(--hair-strong); background: var(--cream); box-shadow: var(--shadow); display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 12px; }
      .scene-03 .node code { font: 500 22px/1 var(--mono); }
      .scene-03 .acq { left: 80px; }
      .scene-03 .rel { left: 1640px; }
      .scene-03 .rel.done { border-color: var(--coral); }
      .scene-03 .throw { left: 900px; top: 740px; }
      .scene-03 .always { left: 1488px; top: 750px; }
      .scene-03 .try { left: 80px; top: 800px; }
    </style>
    <p class="kicker">Q2 · Higher-order locking</p>
    <p class="qindex">02 / 07</p>
    <h2 class="title">Scope the lock to a <em>lambda</em></h2>
    <div class="rule"></div>

    <section class="code bad">
      <div class="code-head"><span>manual.cpp</span><span>fragile</span></div>
      <div class="code-body"><span class="ln"><span class="k">void</span> dangerous() {</span><span class="ln">  m.lock();</span><span class="ln l-work">  do_work();  <span class="cm">// may throw</span></span><span class="ln l-unlock">  <span class="x-text">m.unlock();<i class="strike"></i></span></span><span class="ln">}</span></div>
    </section>
    <span class="chip warn stuck">✕ mutex stays locked forever</span>

    <section class="code good">
      <div class="code-head"><span>with_lock.hpp</span><span>higher-order</span></div>
      <div class="code-body"><span class="ln"><span class="k">template</span> &lt;<span class="k">typename</span> Mutex, <span class="k">typename</span> F&gt;</span><span class="ln l-sig"><span class="k">auto</span> with_lock(Mutex&amp; m, F&amp;&amp; fn) -&gt; <span class="k">decltype</span>(fn()) {</span><span class="ln l-guard">  std::lock_guard&lt;Mutex&gt; guard(m);</span><span class="ln l-ret">  <span class="k">return</span> std::forward&lt;F&gt;(fn)();</span><span class="ln">}</span></div>
    </section>

    <div class="lane"></div>
    <div class="lane-fill"></div>
    <p class="lane-text">critical section = <em>&nbsp;the lambda body</em></p>
    <div class="node acq"><span class="label">acquire</span><code>guard(m)</code></div>
    <div class="node rel"><span class="label">release</span><code>~guard()</code></div>
    <span class="chip warn throw">throw ↯</span>
    <span class="chip ok always">✓ always released</span>
    <span class="chip try">try_with_lock(m, fn) → std::optional&lt;R&gt; &nbsp;<span class="muted">· nullopt when busy</span></span>
  `,
  build({ fx, q, cue }) {
    fx.in([...q(".kicker"), ...q(".qindex"), ...q(".title"), ...q(".rule")], 0.05, { y: -12, stagger: 0.08 })
      .in(q(".bad"), cue("manual") - 0.2, { y: 22 })
      .hl(q(".l-work"), cue("throws"))
      .to(q(".l-unlock"), cue("throws") + 0.6, { opacity: 0.35 })
      .grow(q(".strike"), cue("throws") + 0.6, { dur: 0.45 })
      .in(q(".stuck"), cue("forever"), { y: 12 })
      .in(q(".good"), cue("instead"), { y: 22 })
      .hl(q(".l-sig"), cue("mutex"))
      .unhl(q(".l-sig"), cue("lock_guard"))
      .hl(q(".l-guard"), cue("lock_guard"))
      .unhl(q(".l-guard"), cue("invokes"))
      .hl(q(".l-ret"), cue("invokes"))
      .unhl(q(".l-ret"), cue("critical"))
      .in(q(".acq"), cue("critical") - 0.4, { x: -16, y: 0 })
      .in(q(".lane"), cue("critical") - 0.2, { y: 0, scale: 1 })
      .grow(q(".lane-fill"), cue("critical"), { dur: 1.2 })
      .in(q(".lane-text"), cue("lambda") - 0.2, { y: 10 })
      .in(q(".rel"), cue("released"), { x: 16, y: 0 })
      .in(q(".throw"), cue("exceptions") - 0.2, { y: -14 })
      .in(q(".always"), cue("exceptions") + 0.5, { y: 12 })
      .to(q(".rel"), cue("forget"), { borderColor: "#cc785c", duration: 0.4 })
      .in(q(".try"), cue("try_with_lock"), { y: 14 });
  },
});
