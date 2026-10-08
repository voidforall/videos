registerScene({
  id: "08",
  html: `
    <style>
      .scene-08 .phase { position: absolute; inset: 0; }
      .scene-08 .phase > * { position: absolute; }
      .scene-08 .code-body { font-size: 22px; padding: 16px 26px; }
      .scene-08 .gen { left: 80px; top: 222px; width: 640px; }
      .scene-08 .arrow { left: 744px; top: 300px; font: 400 54px/1 var(--serif); color: rgba(20, 20, 19, 0.4); }
      .scene-08 .desugar { left: 820px; top: 222px; width: 1020px; }
      .scene-08 .insts { left: 820px; top: 470px; display: flex; gap: 14px; }
      .scene-08 .c20 { left: 80px; top: 560px; width: 860px; height: 290px; }
      .scene-08 .sorting { left: 980px; top: 560px; width: 860px; height: 290px; }
      .scene-08 .pane { padding: 24px 30px; }
      .scene-08 .pane pre { margin: 16px 0 20px; font: 400 22px/1.5 var(--mono); }
      .scene-08 .pane .row { display: flex; gap: 14px; flex-wrap: wrap; }
      .scene-08 .pane .chip { font-size: 19px; padding: 10px 16px 9px; }
      .scene-08 .recap-title { left: 80px; top: 94px; }
      .scene-08 .habit { top: 260px; width: 336px; height: 400px; display: flex; flex-direction: column; }
      .scene-08 .habit .num { font: 400 96px/1 var(--serif); letter-spacing: -0.02em; color: rgba(20, 20, 19, 0.3); }
      .scene-08 .habit .name { margin-top: auto; font-size: 42px; }
      .scene-08 .habit code { margin-top: 16px; font: 400 19px/1.3 var(--mono); color: rgba(20, 20, 19, 0.62); }
      .scene-08 .h1 { left: 80px; } .scene-08 .h2 { left: 436px; } .scene-08 .h3 { left: 792px; } .scene-08 .h4 { left: 1148px; } .scene-08 .h5 { left: 1504px; }
      .scene-08 .sign { left: 80px; right: 80px; top: 720px; display: flex; justify-content: space-between; align-items: center; padding-top: 26px; border-top: 1px solid var(--hair); }
      .scene-08 .sign .spike { color: var(--coral); font-size: 40px; }
    </style>
    <p class="kicker">Q7 · Generic lambdas</p>
    <p class="qindex">07 / 07</p>
    <div class="rule"></div>

    <div class="phase pa">
      <h2 class="title">auto makes a <em>template</em></h2>
      <section class="code gen">
        <div class="code-head"><span>you write</span><span>C++14</span></div>
        <div class="code-body"><span class="ln l-auto"><span class="k">auto</span> print = [](<span class="k">auto</span> x) {</span><span class="ln">  std::cout &lt;&lt; x &lt;&lt; <span class="s">'\\n'</span>;</span><span class="ln">};</span></div>
      </section>
      <p class="arrow">→</p>
      <section class="code desugar">
        <div class="code-head"><span>the compiler writes</span><span>closure type</span></div>
        <div class="code-body"><span class="ln"><span class="k">struct</span> __lambda {</span><span class="ln l-tpl">  <span class="k">template</span> &lt;<span class="k">typename</span> T&gt;</span><span class="ln l-op">  <span class="k">auto operator</span>()(T x) <span class="k">const</span> { … }</span><span class="ln">};</span></div>
      </section>
      <div class="insts">
        <span class="chip i1">print&lt;int&gt;</span><span class="chip i2">print&lt;double&gt;</span><span class="chip i3">print&lt;const char*&gt;</span><span class="chip ok i4">fully inlined</span>
      </div>

      <article class="card c20 pane">
        <p class="label">C++20 · explicit template parameters</p>
        <pre>auto typed_add = []&lt;typename T&gt;(T a, T b) {
  return a + b;
};</pre>
        <div class="row"><span class="chip ok t1">typed_add(1, 2) · T = int</span><span class="chip warn t2">typed_add(1, 2.0) ✕</span></div>
      </article>

      <article class="card sorting pane">
        <p class="label">Comparators on a hot path</p>
        <pre>auto by_price = [](const auto& a, const auto& b)
  { return a.price &lt; b.price; };
std::sort(orders.begin(), orders.end(), by_price);</pre>
        <div class="row"><span class="chip ok s1">generic lambda · inlined</span><span class="chip warn s2">std::function · virtual call per compare</span></div>
      </article>
    </div>

    <div class="phase pb">
      <h2 class="title recap-title">Five habits, <em>one style</em></h2>
      <article class="card habit h1"><span class="num">01</span><p class="name">Keep functions pure</p><code>same input → same output</code></article>
      <article class="card habit h2"><span class="num">02</span><p class="name">Pass behavior as values</p><code>lambdas · transform · sort</code></article>
      <article class="card habit h3"><span class="num">03</span><p class="name">Scope resources with HOFs</p><code>with_lock(m, [&amp;]{ … })</code></article>
      <article class="card habit h4"><span class="num">04</span><p class="name">Name your captures</p><code>[&amp;book, id]</code></article>
      <article class="card habit h5"><span class="num">05</span><p class="name">Erase types only to store</p><code>std::function · callbacks</code></article>
      <div class="sign"><span class="label">C++ functional programming · interview walkthrough</span><span class="spike">✱</span></div>
    </div>
  `,
  build({ fx, q, cue }) {
    const recap = cue("walkthrough") - 0.4;
    fx.in([...q(".kicker"), ...q(".qindex"), ...q(".pa .title"), ...q(".rule")], 0.05, { y: -12, stagger: 0.08 })
      .in(q(".gen"), cue("auto") - 0.3, { y: 18 })
      .hl(q(".l-auto"), cue("auto"))
      .in(q(".arrow"), cue("template") - 0.6, { x: -12, y: 0 })
      .in(q(".desugar"), cue("template") - 0.4, { x: 22, y: 0 })
      .unhl(q(".l-auto"), cue("template"))
      .hl(q(".l-tpl"), cue("template"))
      .in([...q(".i1"), ...q(".i2"), ...q(".i3")], cue("version"), { y: 12, stagger: 0.25 })
      .in(q(".i4"), cue("inlined"), { y: 12 })
      .unhl(q(".l-tpl"), cue("c++20"))
      .in(q(".c20"), cue("c++20"), { y: 18 })
      .in(q(".t1"), cue("share") - 0.4, { y: 10 })
      .in(q(".t2"), cue("type", 2) - 0.1, { y: 10 })
      .in(q(".sorting"), cue("comparator") - 0.3, { y: 18 })
      .in(q(".s1"), cue("inlines"), { y: 10 })
      .in(q(".s2"), cue("virtual"), { y: 10 })
      .out(q(".pa"), recap, { dur: 0.45, y: -16 })
      .to(q(".kicker"), recap, { autoAlpha: 0, duration: 0.3 })
      .to(q(".qindex"), recap, { autoAlpha: 0, duration: 0.3 })
      .in(q(".recap-title"), recap + 0.4, { y: 14 })
      .in(q(".h1"), cue("pure") - 0.4, { y: 22 })
      .in(q(".h2"), cue("behavior") - 0.3, { y: 22 })
      .in(q(".h3"), cue("scope resources") - 0.2, { y: 22 })
      .in(q(".h4"), cue("name") - 0.2, { y: 22 })
      .in(q(".h5"), cue("save") - 0.2, { y: 22 })
      .in(q(".sign"), cue("storage") + 0.3, { y: 10 });
  },
});
