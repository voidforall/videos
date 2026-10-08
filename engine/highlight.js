// Minimal syntax highlighter → one HTML string per line, using the code-surface classes
// (.k keyword, .n number, .s string, .cm comment). Input is plain text; output is escaped.
// highlightCode(code, lang = "cpp"), lang ∈ "cpp" | "python".
window.highlightCode = (() => {
  const LANGS = {
    cpp: {
      comment: "\\/\\/.*$",
      keywords: "int char bool void auto const constexpr for while if else return struct class " +
        "template typename using static_assert true false nullptr break continue new delete operator this " +
        "unsigned long double float size_t static inline virtual override public private protected noexcept",
    },
    python: {
      comment: "#.*$",
      keywords: "def class return yield async await with as for in if elif else while try except finally " +
        "raise import from lambda None True False is not and or pass break continue global nonlocal del assert",
    },
  };
  const esc = (s) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
  const compiled = Object.fromEntries(Object.entries(LANGS).map(([name, l]) => [name, {
    keywords: new Set(l.keywords.split(" ")),
    // comment | string | number | @decorator | identifier | other
    token: new RegExp(`(${l.comment})|((?:[rfb]|rb|fr)?"(?:\\\\.|[^"\\\\])*"|(?:[rfb]|rb|fr)?'(?:\\\\.|[^'\\\\])*')|(\\b\\d[\\d_]*(?:\\.\\d+)?\\b)|(@[A-Za-z_][\\w.]*)|([A-Za-z_]\\w*)|([^A-Za-z_\\d"'@#/]+|[#/@])`, "g"),
  }]));

  function line(text, lang) {
    let out = "";
    for (const m of text.matchAll(lang.token)) {
      const [tok, comment, str, num, deco, word] = m;
      if (comment) out += `<span class="cm">${esc(comment)}</span>`;
      else if (str) out += `<span class="s">${esc(str)}</span>`;
      else if (num) out += `<span class="n">${esc(num)}</span>`;
      else if (deco) out += `<span class="k">${esc(deco)}</span>`;
      else if (word && lang.keywords.has(word)) out += `<span class="k">${esc(word)}</span>`;
      else out += esc(tok);
    }
    return out;
  }

  return (code, lang = "cpp") => {
    const l = compiled[lang];
    if (!l) throw new Error(`highlight: unknown language "${lang}"`);
    return code.split("\n").map((text) => line(text, l));
  };
})();
