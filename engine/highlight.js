// Minimal C/C++-ish highlighter → one HTML string per line, using the code-surface classes
// (.k keyword, .n number, .s string, .cm comment). Input is plain text; output is escaped.
window.highlightCode = (() => {
  const KEYWORDS = new Set(("int char bool void auto const constexpr for while if else return struct class " +
    "template typename using static_assert true false nullptr break continue new delete operator this " +
    "unsigned long double float size_t static inline virtual override public private protected").split(" "));
  const TOKEN = /(\/\/.*$)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_]\w*)|([^A-Za-z_\d"'/]+|\/)/g;
  const esc = (s) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);

  function line(text) {
    let out = "";
    for (const m of text.matchAll(TOKEN)) {
      const [tok, comment, str, num, word] = m;
      if (comment) out += `<span class="cm">${esc(comment)}</span>`;
      else if (str) out += `<span class="s">${esc(str)}</span>`;
      else if (num) out += `<span class="n">${esc(num)}</span>`;
      else if (word && KEYWORDS.has(word)) out += `<span class="k">${esc(word)}</span>`;
      else out += esc(tok);
    }
    return out;
  }

  return (code) => code.split("\n").map(line);
})();
