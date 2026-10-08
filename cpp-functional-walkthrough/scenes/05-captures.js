registerScene({
  id: "05",
  html: `
    <style>
      .scene-05 .modes { left: 80px; top: 222px; width: 600px; padding: 10px 0; }
      .scene-05 .mode { display: flex; align-items: center; height: 74px; padding: 0 28px; border-radius: 8px; margin: 0 10px; }
      .scene-05 .mode + .mode { border-top: 1px solid var(--hair); }
      .scene-05 .mode code { width: 170px; font: 500 28px/1 var(--mono); }
      .scene-05 .mode span { font: 400 23px/1.2 var(--sans); }
      .scene-05 .trap { left: 740px; width: 780px; }
      .scene-05 .trap .code-body { font-size: 20px; padding: 16px 24px; }
      .scene-05 .t1 { top: 222px; }
      .scene-05 .t2 { top: 470px; }
      .scene-05 .frame { left: 1560px; top: 236px; width: 280px; height: 170px; padding: 22px 24px; border: 1px solid var(--hair-strong); border-radius: 12px; background: var(--tile); }
      .scene-05 .frame code { display: block; margin-top: 16px; font: 500 26px/1 var(--mono); }
      .scene-05 .frame .gone { margin-top: 18px; font: 500 19px/1 var(--mono); color: var(--warn); }
      .scene-05 .dangle { left: 1560px; top: 420px; font-size: 19px; }
      .scene-05 .copy { width: 130px; height: 112px; padding: 16px; border: 1px solid var(--hair-strong); border-radius: 10px; background: var(--tile); font: 500 19px/1.3 var(--mono); }
      .scene-05 .copy b { display: block; margin-top: 10px; font: 400 34px/1 var(--serif); }
      .scene-05 .b1 { left: 1560px; top: 484px; }
      .scene-05 .b2 { left: 1710px; top: 484px; background: var(--cream); border-style: dashed; }
      .scene-05 .thisrow { left: 740px; top: 680px; display: flex; gap: 16px; }
      .scene-05 .rulebar { left: 80px; right: 80px; top: 770px; height: 92px; display: flex; align-items: center; gap: 36px; padding: 0 34px; border-left: 3px solid var(--coral); }
      .scene-05 .rulebar .name { font-size: 44px; white-space: nowrap; }
      .scene-05 .rulebar code { font: 500 26px/1 var(--mono); }
    </style>
    <p class="kicker">Q4 · Lambda captures</p>
    <p class="qindex">04 / 07</p>
    <h2 class="title">Name every <em>capture</em></h2>
    <div class="rule"></div>

    <article class="card paper modes">
      <div class="mode m1"><code>[]</code><span>capture nothing</span></div>
      <div class="mode m2"><code>[=]</code><span>copy every used local</span></div>
      <div class="mode m3"><code>[&amp;]</code><span>reference every used local</span></div>
      <div class="mode m4"><code>[x, &amp;y]</code><span>copy x, reference y</span></div>
      <div class="mode m5"><code>[this]</code><span>capture the object pointer</span></div>
      <div class="mode m6"><code>[*this]</code><span>copy the object (C++17)</span></div>
    </article>

    <section class="code trap t1">
      <div class="code-head"><span>make_adder.cpp</span><span>trap 1 · lifetime</span></div>
      <div class="code-body"><span class="ln">std::function&lt;<span class="k">int</span>()&gt; make_adder(<span class="k">int</span> x) {</span><span class="ln">  <span class="k">int</span> local = x * <span class="n">2</span>;</span><span class="ln l-ref">  <span class="k">return</span> [&amp;]() { <span class="k">return</span> local; };</span><span class="ln">}</span></div>
    </section>
    <div class="frame"><p class="label">stack frame</p><code>local = 2x</code><p class="gone">✕ destroyed</p></div>
    <span class="chip warn dangle">dangling reference</span>

    <section class="code trap t2">
      <div class="code-head"><span>hot_path.cpp</span><span>trap 2 · cost</span></div>
      <div class="code-body"><span class="ln l-copy"><span class="k">auto</span> process = [=](<span class="k">int</span> id) { <span class="k">return</span> book.lookup(id); };</span><span class="ln l-fix"><span class="k">auto</span> process = [&amp;book](<span class="k">int</span> id) { <span class="k">return</span> book.lookup(id); };</span></div>
    </section>
    <div class="copy b1">OrderBook<b>book</b></div>
    <div class="copy b2">silent copy<b>book′</b></div>

    <div class="thisrow">
      <span class="chip warn this1">[this] · dangles if the object dies</span>
      <span class="chip ok this2">[*this] · C++17 snapshot copy</span>
    </div>

    <div class="card paper rulebar">
      <p class="name">Name every capture</p>
      <code>[&amp;oms, &amp;risk_engine, order_id](Fill f) { … }</code>
    </div>
  `,
  build({ fx, q, cue }) {
    const row = (sel, at) => fx.to(q(".mode"), at, { backgroundColor: "rgba(239,233,222,0)", duration: 0.3 })
      .to(q(sel), at, { backgroundColor: "#efe9de", duration: 0.3 });
    fx.in([...q(".kicker"), ...q(".qindex"), ...q(".title"), ...q(".rule")], 0.05, { y: -12, stagger: 0.08 })
      .in(q(".modes"), cue("capture") - 0.3, { y: 18 })
      .in(q(".mode"), cue("capture"), { x: -12, y: 0, stagger: 0.08, dur: 0.4 });
    row(".m1", cue("empty"));
    row(".m2", cue("equals"));
    row(".m3", cue("ampersand"));
    row(".m4", cue("mix"));
    fx.to(q(".mode"), cue("traps"), { backgroundColor: "rgba(239,233,222,0)", duration: 0.3 })
      .in(q(".t1"), cue("reference") - 0.6, { y: 18 })
      .hl(q(".l-ref"), cue("return"))
      .in(q(".frame"), cue("local"), { x: 16, y: 0 })
      .to(q(".frame"), cue("destroyed"), { borderStyle: "dashed", backgroundColor: "#faf9f5", duration: 0.4 })
      .in(q(".frame .gone"), cue("destroyed"), { y: 6 })
      .in(q(".dangle"), cue("dangling"), { y: 10 })
      .unhl(q(".l-ref"), cue("value") - 0.6)
      .in(q(".t2"), cue("value") - 0.4, { y: 18 })
      .hl(q(".l-copy"), cue("silently"))
      .in(q(".b1"), cue("silently"), { y: 12 })
      .in(q(".b2"), cue("copy"), { x: -40, y: 0, scale: 0.9 })
      .unhl(q(".l-copy"), cue("capturing"))
      .in(q(".this1"), cue("this"), { y: 12 });
    row(".m5", cue("this"));
    row(".m6", cue("star"));
    fx.in(q(".this2"), cue("snapshot"), { y: 12 })
      .to(q(".mode"), cue("name") - 0.4, { backgroundColor: "rgba(239,233,222,0)", duration: 0.3 })
      .in(q(".l-fix"), cue("name") - 0.5, { x: -10, y: 0 })
      .hl(q(".l-fix"), cue("name"))
      .in(q(".rulebar"), cue("name"), { y: 16 });
  },
});
