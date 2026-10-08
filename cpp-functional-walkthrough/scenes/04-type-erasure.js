registerScene({
  id: "04",
  html: `
    <style>
      .scene-04 .sig { left: 80px; top: 222px; font: 500 34px/1 var(--mono); padding: 16px 26px; border-radius: 9999px; border: 1px solid var(--hair-strong); background: var(--cream); }
      .scene-04 .sig .muted { font-size: 24px; margin-left: 14px; }
      .scene-04 .wrap { left: 80px; top: 300px; width: 820px; }
      .scene-04 .wrap .code-body { font-size: 23px; padding: 16px 28px; }
      .scene-04 .tier { left: 80px; width: 820px; padding: 20px 28px; }
      .scene-04 .tier .label { margin-bottom: 12px; }
      .scene-04 .tier pre { font: 400 23px/1.55 var(--mono); }
      .scene-04 .base { top: 470px; }
      .scene-04 .holder { top: 680px; height: 170px; }
      .scene-04 .tier pre .ln { border-radius: 6px; margin: 0 -8px; padding: 0 8px; display: block; }
      .scene-04 .badge { font: 500 18px/1 var(--mono); padding: 8px 12px 7px; border-radius: 9999px; border: 1px solid var(--hair-strong); background: var(--cream); }
      .scene-04 .b-clone { left: 190px; top: 626px; }
      .scene-04 .b-decay { left: 600px; top: 798px; }
      .scene-04 .callable { left: 1410px; width: 430px; height: 64px; padding: 0 24px; display: flex; align-items: center; justify-content: space-between; border: 1px solid var(--hair); border-radius: 8px; background: var(--tile); font: 500 24px/1 var(--mono); }
      .scene-04 .callable .label { font-size: 16px; }
      .scene-04 .c1 { top: 680px; } .scene-04 .c2 { top: 752px; } .scene-04 .c3 { top: 824px; }
      .scene-04 .cost { left: 1240px; top: 222px; width: 600px; height: 200px; }
      .scene-04 .cost .name { font-size: 44px; margin: 14px 0 12px; }
      .scene-04 .cost .body { font-size: 22px; }
      .scene-04 .use { top: 446px; width: 290px; height: 190px; padding: 22px 24px; }
      .scene-04 .use code { display: block; margin: 14px 0 12px; font: 500 21px/1.2 var(--mono); white-space: nowrap; }
      .scene-04 .use .body { font-size: 21px; line-height: 1.35; }
      .scene-04 .u1 { left: 1240px; } .scene-04 .u2 { left: 1550px; border-color: var(--coral); }
    </style>
    <p class="kicker">Q3 · std::function</p>
    <p class="qindex">03 / 07</p>
    <h2 class="title">Type erasure, <em>by hand</em></h2>
    <div class="rule"></div>

    <svg class="wires" viewBox="0 0 1920 1080">
      <path class="wire w1" d="M 160 432 L 160 470" />
      <path class="wire w2" d="M 160 640 L 160 680" />
      <path class="wire w3" d="M 1410 712 C 1200 712, 1130 760, 900 760" />
      <path class="wire w4" d="M 1410 784 C 1200 784, 1130 768, 900 766" />
      <path class="wire w5" d="M 1410 856 C 1200 856, 1130 776, 900 772" />
    </svg>

    <p class="sig">std::function&lt;int(int)&gt;<span class="muted">any callable, one signature</span></p>
    <section class="code wrap">
      <div class="code-head"><span>MyFunction&lt;R(Args...)&gt;</span><span>one concrete type</span></div>
      <div class="code-body"><span class="ln l-own">std::unique_ptr&lt;Base&gt; holder_;</span></div>
    </section>
    <article class="card tier base">
      <p class="label">Non-template · abstract</p>
      <pre><span class="ln b-inv">virtual R invoke(Args...) const = 0;</span><span class="ln b-clo">virtual unique_ptr&lt;Base&gt; clone() const = 0;</span></pre>
    </article>
    <article class="card tier holder">
      <p class="label">template &lt;typename F&gt; · Holder&lt;F&gt; : Base</p>
      <pre><span class="ln">F callable_;  <span class="muted">// knows the real type</span></span><span class="ln">invoke → callable_(args...)</span></pre>
    </article>
    <span class="badge b-clone">clone() → value semantics</span>
    <span class="badge b-decay">decay_t&lt;F&gt; → clean copy</span>

    <div class="callable c1">[](int a){…}<span class="label">lambda</span></div>
    <div class="callable c2">int (*)(int)<span class="label">fn pointer</span></div>
    <div class="callable c3">Multiply{3}<span class="label">functor</span></div>

    <article class="card paper cost">
      <p class="label">The price</p>
      <p class="name">heap alloc + virtual call</p>
      <p class="body muted sbo">Softened by small buffer optimization: tiny callables live inline.</p>
    </article>
    <article class="card paper use u1">
      <p class="label">Stored callbacks</p>
      <code>std::function</code>
      <p class="body muted">containers, APIs, event handlers</p>
    </article>
    <article class="card paper use u2">
      <p class="label">Hot paths</p>
      <code>template &lt;class F&gt;</code>
      <p class="body muted">inlined, zero overhead</p>
    </article>
  `,
  build({ fx, q, cue }) {
    fx.in([...q(".kicker"), ...q(".qindex"), ...q(".title"), ...q(".rule")], 0.05, { y: -12, stagger: 0.08 })
      .in(q(".sig"), cue("type-erased"), { y: 12 })
      .in(q(".base"), cue("non-template"), { y: 18 })
      .to(q(".b-inv"), cue("invoke"), { backgroundColor: "#faf9f5", duration: 0.4 })
      .to(q(".b-clo"), cue("clone"), { backgroundColor: "#faf9f5", duration: 0.4 })
      .draw(q(".w2"), cue("templated") - 0.2, 0.4)
      .in(q(".holder"), cue("templated"), { y: 18 })
      .in(q(".c1"), cue("lambda"), { x: 22, y: 0 })
      .draw(q(".w3"), cue("lambda") + 0.2)
      .in(q(".c2"), cue("pointer"), { x: 22, y: 0 })
      .draw(q(".w4"), cue("pointer") + 0.2)
      .in(q(".c3"), cue("functor"), { x: 22, y: 0 })
      .draw(q(".w5"), cue("functor") + 0.2)
      .in(q(".wrap"), cue("wrapper", 2) - 0.2, { y: 18 })
      .hl(q(".l-own"), cue("unique"))
      .draw(q(".w1"), cue("base", 2), 0.4)
      .in(q(".b-clone"), cue("clone", 2), { x: -12, y: 0 })
      .in(q(".b-decay"), cue("decay"), { x: -12, y: 0 })
      .in(q(".cost"), cue("price") - 0.2, { y: 18 })
      .in(q(".sbo"), cue("softened"), { y: 8 })
      .in(q(".u1"), cue("stored") - 0.2, { y: 18 })
      .in(q(".u2"), cue("templates"), { y: 18 });
  },
});
