registerScene({
  id: "02",
  html: `
    <style>
      .scene-02 .row { left: 80px; width: 1000px; height: 110px; display: flex; align-items: center; gap: 22px; }
      .scene-02 .op { width: 350px; flex: none; }
      .scene-02 .op code { display: block; font: 500 30px/1 var(--mono); }
      .scene-02 .op .lam { margin-top: 10px; font: 400 18px/1.2 var(--mono); color: rgba(20, 20, 19, 0.62); white-space: nowrap; }
      .scene-02 .arrow { font: 400 34px/1 var(--sans); color: rgba(20, 20, 19, 0.4); }
      .scene-02 .cells { display: flex; gap: 12px; }
      .scene-02 .cell {
        width: 92px; height: 82px; display: grid; place-items: center;
        border: 1px solid var(--hair-strong); border-radius: 8px; background: var(--cream);
        font: 400 40px/1 var(--serif);
      }
      .scene-02 .src .cell { background: var(--tile); }
      .scene-02 .cell.sum { width: 140px; background: var(--ink); color: var(--cream); border-color: var(--ink); font-size: 48px; }
      .scene-02 .src .op code { font-size: 28px; }
      .scene-02 .divider { left: 80px; width: 1000px; top: 345px; height: 1px; background: var(--hair); }
      .scene-02 .cx { left: 1160px; top: 228px; width: 680px; }
      .scene-02 .cx .code-body { font-size: 21px; padding: 20px 26px; }
      .scene-02 .proof { left: 1160px; top: 470px; }
      .scene-02 .curry { left: 1160px; top: 540px; width: 680px; height: 226px; }
      .scene-02 .curry .label { margin-bottom: 16px; }
      .scene-02 .curry pre { font: 400 22px/1.55 var(--mono); }
      .scene-02 .curry .call { margin-top: 14px; font: 500 30px/1 var(--mono); }
      .scene-02 .curry .call b { font-weight: 500; color: var(--coral); }
      .scene-02 .paradigm { left: 80px; right: 80px; top: 800px; display: flex; justify-content: center; align-items: center; gap: 22px; }
      .scene-02 .paradigm .x { font: italic 400 40px/1 var(--serif); }
    </style>
    <p class="kicker">Q1 · The toolkit</p>
    <p class="qindex">01 / 07</p>
    <h2 class="title">Map, filter, reduce</h2>
    <div class="rule"></div>

    <div class="row src" style="top:220px">
      <div class="op"><span class="label">input</span><code>std::vector v</code></div>
      <span class="arrow">&nbsp;</span>
      <div class="cells"><span class="cell">1</span><span class="cell">2</span><span class="cell">3</span><span class="cell">4</span><span class="cell">5</span></div>
    </div>
    <div class="divider"></div>
    <div class="row r-map" style="top:372px">
      <div class="op"><span class="label">map</span><code>transform</code><p class="lam">[](int x){ return x*x; }</p></div>
      <span class="arrow">→</span>
      <div class="cells"><span class="cell">1</span><span class="cell">4</span><span class="cell">9</span><span class="cell">16</span><span class="cell">25</span></div>
    </div>
    <div class="row r-filter" style="top:510px">
      <div class="op"><span class="label">filter</span><code>copy_if</code><p class="lam">[](int x){ return x%2==0; }</p></div>
      <span class="arrow">→</span>
      <div class="cells"><span class="cell">2</span><span class="cell">4</span></div>
    </div>
    <div class="row r-reduce" style="top:648px">
      <div class="op"><span class="label">reduce</span><code>accumulate</code><p class="lam">[](int a, int x){ return a+x; }</p></div>
      <span class="arrow">→</span>
      <div class="cells"><span class="cell sum">15</span></div>
    </div>

    <section class="code cx">
      <div class="code-head"><span>factorial.hpp</span><span>compile time</span></div>
      <div class="code-body"><span class="ln"><span class="k">constexpr int</span> factorial(<span class="k">int</span> n) {</span><span class="ln">  <span class="k">return</span> n &lt;= <span class="n">1</span> ? <span class="n">1</span> : n * factorial(n - <span class="n">1</span>);</span><span class="ln">}</span><span class="ln l-assert"><span class="k">static_assert</span>(factorial(<span class="n">5</span>) == <span class="n">120</span>);</span></div>
    </section>
    <span class="chip ok proof">✓ proven by the compiler</span>

    <article class="card curry">
      <p class="label">Currying · a lambda that returns a lambda</p>
      <pre>auto multiply_by = [](int f) {
  return [f](int x) { return x * f; };
};</pre>
      <p class="call">multiply_by(2)(7) → <b>14</b></p>
    </article>

    <div class="paradigm">
      <span class="chip">Functional · values &amp; higher-order functions</span>
      <span class="x">and</span>
      <span class="chip">OOP · encapsulated state &amp; virtual dispatch</span>
      <span class="label" style="margin-left:18px">= multi-paradigm C++</span>
    </div>
  `,
  build({ fx, q, cue }) {
    fx.in([...q(".kicker"), ...q(".qindex"), ...q(".title"), ...q(".rule")], 0.05, { y: -12, stagger: 0.08 })
      .in(q(".src .op"), 0.5, { x: -16, y: 0 })
      .in(q(".src .cell"), 0.7, { y: 14, stagger: 0.07, dur: 0.45 })
      .in(q(".divider"), 1.0, { y: 0 });
    [["r-map", "transform"], ["r-filter", "copy_if"], ["r-reduce", "accumulate"]].forEach(([row, word]) => {
      const at = cue(word);
      fx.in(q(`.${row} .op`), at - 0.1, { x: -16, y: 0 })
        .in(q(`.${row} .arrow`), at + 0.2, { x: -10, y: 0, dur: 0.4 })
        .in(q(`.${row} .cell`), at + 0.35, { y: -26, stagger: 0.08, dur: 0.5 });
    });
    fx.in(q(".cx"), cue("constexpr") - 0.1, { y: 22 })
      .hl(q(".l-assert"), cue("static_assert"))
      .in(q(".proof"), cue("120"), { y: 10, scale: 0.94 })
      .in(q(".curry"), cue("currying") - 0.5, { y: 22 })
      .in(q(".curry .call"), cue("multiply"), { x: -12, y: 0 })
      .in(q(".paradigm > *"), cue("object-oriented") - 0.2, { y: 14, stagger: 0.35 });
  },
});
