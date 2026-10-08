registerScene({
  id: "01",
  html: `
    <style>
      .scene-01 .statement { left: 80px; top: 330px; width: 1500px; font: 400 128px/1.02 var(--serif); letter-spacing: -0.026em; }
      .scene-01 .statement em { font-style: italic; }
      .scene-01 .statement-sub { left: 84px; top: 610px; font: 400 34px/1.4 var(--sans); color: rgba(20, 20, 19, 0.62); }
      .scene-01 .pillar { top: 228px; width: 540px; height: 300px; display: flex; flex-direction: column; }
      .scene-01 .pillar .name { margin: 18px 0 14px; }
      .scene-01 .pillar .body { font-size: 24px; color: rgba(20, 20, 19, 0.72); }
      .scene-01 .pillar .sketch { margin-top: auto; font: 400 27px/1 var(--mono); letter-spacing: 0.01em; }
      .scene-01 .feature { top: 578px; width: 405px; height: 132px; padding: 24px 28px; }
      .scene-01 .feature code { display: block; margin-top: 18px; font: 500 34px/1 var(--mono); }
      .scene-01 .feature .label + code + .muted { margin-top: 14px; font: 400 21px/1.2 var(--sans); }
      .scene-01 .questions { left: 80px; right: 80px; top: 780px; display: flex; gap: 14px; align-items: center; }
      .scene-01 .questions .label { margin-right: 10px; }
      .scene-01 .q { flex: 1; padding: 13px 0 12px; border: 1px solid var(--hair-strong); border-radius: 8px; text-align: center; font: 500 21px/1 var(--mono); background: var(--cream); }
    </style>
    <p class="kicker">C++ / Functional style</p>
    <p class="qindex">00 / 07</p>

    <h1 class="statement">A style, <em>not</em> a separate language.</h1>
    <p class="statement-sub">Functional programming, the C++ way.</p>

    <h2 class="title">Functions as values</h2>
    <div class="rule"></div>

    <article class="card pillar p1" style="left:80px">
      <p class="label">01 · Pillar</p>
      <p class="name">Pure functions</p>
      <p class="body">Same input, same output. No side effects.</p>
      <p class="sketch">f(3) → 9 &nbsp;·&nbsp; f(3) → 9</p>
    </article>
    <article class="card pillar p2" style="left:690px">
      <p class="label">02 · Pillar</p>
      <p class="name">Immutability</p>
      <p class="body">Transform into new values; never modify in place.</p>
      <p class="sketch">v &nbsp;→&nbsp; v′ &nbsp;<span class="muted">(v unchanged)</span></p>
    </article>
    <article class="card pillar p3" style="left:1300px">
      <p class="label">03 · Pillar</p>
      <p class="name">Higher-order functions</p>
      <p class="body">Functions that take or return functions.</p>
      <p class="sketch">g(f) → h</p>
    </article>

    <div class="card paper feature f1" style="left:80px"><p class="label">C++11</p><code>[](int x){…}</code></div>
    <div class="card paper feature f2" style="left:525px"><p class="label">Type erasure</p><code>std::function</code></div>
    <div class="card paper feature f3" style="left:970px"><p class="label">Map · filter · reduce</p><code>&lt;algorithm&gt;</code></div>
    <div class="card paper feature f4" style="left:1415px"><p class="label">Compile-time purity</p><code>constexpr</code></div>

    <div class="questions">
      <span class="label">Seven questions</span>
      <span class="q">Q1 · FP</span><span class="q">Q2 · lock</span><span class="q">Q3 · function</span><span class="q">Q4 · capture</span><span class="q">Q5 · mutable</span><span class="q">Q6 · recurse</span><span class="q">Q7 · generic</span>
    </div>
  `,
  build({ fx, q, cue }) {
    fx.in(q(".kicker"), 0.1, { y: -10 })
      .in(q(".statement"), 0.25, { y: 26, dur: 0.9 })
      .in(q(".statement-sub"), 1.0, { y: 12 })
      .out([...q(".statement"), ...q(".statement-sub")], cue("pillars") - 0.6, { y: -30 })
      .in([...q(".title"), ...q(".rule"), ...q(".qindex")], cue("pillars") - 0.15, { y: -12, stagger: 0.1 })
      .in(q(".p1"), cue("pure"), { y: 26 })
      .in(q(".p2"), cue("immutable"), { y: 26 })
      .in(q(".p3"), cue("higher-order"), { y: 26 })
      .in(q(".f1"), cue("lambdas"), { y: 20 })
      .in(q(".f2"), cue("std::function"), { y: 20 })
      .in(q(".f3"), cue("algorithm"), { y: 20 })
      .in(q(".f4"), cue("constexpr"), { y: 20 })
      .in(q(".questions .label"), cue("seven") - 0.2, { y: 10 })
      .in(q(".q"), cue("seven"), { y: 12, stagger: 0.12, dur: 0.45 });
  },
});
