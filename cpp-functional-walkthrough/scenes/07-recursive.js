registerScene({
  id: "07",
  html: `
    <style>
      .scene-07 .approach { top: 222px; width: 540px; height: 540px; display: flex; flex-direction: column; }
      .scene-07 .a1 { left: 80px; } .scene-07 .a2 { left: 690px; } .scene-07 .a3 { left: 1300px; }
      .scene-07 .approach .head { padding: 24px 28px 0; }
      .scene-07 .approach .name { font-size: 42px; margin-top: 12px; }
      .scene-07 .approach .code-body { flex: 1; font-size: 20px; line-height: 1.55; padding: 18px 28px; }
      .scene-07 .approach .head .label { color: rgba(250, 249, 245, 0.56); }
      .scene-07 .metrics { display: grid; grid-template-columns: repeat(3, 1fr); border-top: 1px solid var(--hair-dark); }
      .scene-07 .metrics div { padding: 14px 18px 16px; font: 500 15px/1 var(--mono); letter-spacing: 0.1em; text-transform: uppercase; color: rgba(250, 249, 245, 0.56); }
      .scene-07 .metrics div + div { border-left: 1px solid var(--hair-dark); }
      .scene-07 .metrics b { display: block; margin-top: 10px; font: 400 26px/1 var(--serif); white-space: nowrap; letter-spacing: 0; text-transform: none; color: var(--cream); }
      .scene-07 .metrics b.bad { color: #e07a6a; }
      .scene-07 .metrics b.good { color: #8fd3a0; }
      .scene-07 .bracket { left: 690px; top: 790px; width: 1150px; height: 22px; border: 2px solid var(--coral); border-top: 0; border-radius: 0 0 10px 10px; transform-origin: 50% 0; }
      .scene-07 .crit { left: 1130px; top: 826px; font: 500 22px/1 var(--mono); letter-spacing: 0.14em; text-transform: uppercase; }
      .scene-07 .noname { left: 80px; top: 790px; }
    </style>
    <p class="kicker">Q6 · Recursive lambdas</p>
    <p class="qindex">06 / 07</p>
    <h2 class="title">A lambda has <em>no name</em></h2>
    <div class="rule"></div>

    <section class="code approach a1">
      <div class="head"><p class="label">01 · simple, slow</p><p class="name">std::function</p></div>
      <div class="code-body"><span class="ln">std::function&lt;<span class="k">int</span>(<span class="k">int</span>)&gt; fib =</span><span class="ln l1">  [&amp;fib](<span class="k">int</span> n) -&gt; <span class="k">int</span> {</span><span class="ln">    <span class="k">if</span> (n &lt;= <span class="n">1</span>) <span class="k">return</span> n;</span><span class="ln">    <span class="k">return</span> fib(n-<span class="n">1</span>) + fib(n-<span class="n">2</span>);</span><span class="ln">  };</span></div>
      <div class="metrics"><div>overhead<b class="bad">virtual + heap</b></div><div>inlined<b class="bad">no</b></div><div>storable<b>yes</b></div></div>
    </section>
    <section class="code approach a2">
      <div class="head"><p class="label">02 · zero overhead</p><p class="name">self-passing</p></div>
      <div class="code-body"><span class="ln l2"><span class="k">auto</span> fib = [](<span class="k">auto</span>&amp; self, <span class="k">int</span> n)</span><span class="ln">    -&gt; <span class="k">int</span> {</span><span class="ln">  <span class="k">if</span> (n &lt;= <span class="n">1</span>) <span class="k">return</span> n;</span><span class="ln l2b">  <span class="k">return</span> self(self, n-<span class="n">1</span>)</span><span class="ln l2c">       + self(self, n-<span class="n">2</span>);</span><span class="ln">};</span><span class="ln"><span class="cm">fib(fib, 10);  // 55</span></span></div>
      <div class="metrics"><div>overhead<b class="good">zero</b></div><div>inlined<b class="good">yes</b></div><div>storable<b>via wrapper</b></div></div>
    </section>
    <section class="code approach a3">
      <div class="head"><p class="label">03 · most explicit</p><p class="name">functor struct</p></div>
      <div class="code-body"><span class="ln l3"><span class="k">struct</span> Fib {</span><span class="ln">  <span class="k">int operator</span>()(<span class="k">int</span> n) <span class="k">const</span> {</span><span class="ln">    <span class="k">if</span> (n &lt;= <span class="n">1</span>) <span class="k">return</span> n;</span><span class="ln">    <span class="k">return</span> (*<span class="k">this</span>)(n-<span class="n">1</span>)</span><span class="ln">         + (*<span class="k">this</span>)(n-<span class="n">2</span>);</span><span class="ln">  }</span><span class="ln">};</span></div>
      <div class="metrics"><div>overhead<b class="good">zero</b></div><div>inlined<b class="good">yes</b></div><div>storable<b class="good">yes</b></div></div>
    </section>

    <span class="chip noname">[](int n) { return ???(n - 1); }</span>
    <div class="bracket"></div>
    <p class="crit">critical path</p>
  `,
  build({ fx, q, cue }) {
    fx.in([...q(".kicker"), ...q(".qindex"), ...q(".title"), ...q(".rule")], 0.05, { y: -12, stagger: 0.08 })
      .in(q(".noname"), cue("name") - 0.2, { y: 12 })
      .out(q(".noname"), cue("std::function") - 0.6)
      .in(q(".a1"), cue("easy"), { y: 22 })
      .hl(q(".a1 .l1"), cue("captures"))
      .in(q(".a1 .metrics"), cue("erasure") - 0.4, { y: 8 })
      .unhl(q(".a1 .l1"), cue("zero"))
      .in(q(".a2"), cue("zero"), { y: 22 })
      .hl(q(".a2 .l2"), cue("auto"))
      .unhl(q(".a2 .l2"), cue("calls"))
      .hl([...q(".a2 .l2b"), ...q(".a2 .l2c")], cue("calls"))
      .unhl([...q(".a2 .l2b"), ...q(".a2 .l2c")], cue("named"))
      .in(q(".a3"), cue("named"), { y: 22 })
      .to(q(".a1"), cue("critical"), { opacity: 0.42, duration: 0.5 })
      .grow(q(".bracket"), cue("self-passing") - 0.2, { dur: 0.6 })
      .in(q(".crit"), cue("self-passing") + 0.2, { y: 8 });
  },
});
