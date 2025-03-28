"use strict";

ace.define("ace/mode/matching_brace_outdent", ["require", "exports", "module", "ace/range"], function (e, t, n) {
  "use strict";
  var r = e("../range").Range,
      i = function i() {};(function () {
    this.checkOutdent = function (e, t) {
      return (/^\s+$/.test(e) ? /^\s*\}/.test(t) : !1
      );
    }, this.autoOutdent = function (e, t) {
      var n = e.getLine(t),
          i = n.match(/^(\s*\})/);if (!i) return 0;var s = i[1].length,
          o = e.findMatchingBracket({ row: t, column: s });if (!o || o.row == t) return 0;var u = this.$getIndent(e.getLine(o.row));e.replace(new r(t, 0, t, s - 1), u);
    }, this.$getIndent = function (e) {
      return e.match(/^\s*/)[0];
    };
  }).call(i.prototype), t.MatchingBraceOutdent = i;
}), ace.define("ace/mode/livescript", ["require", "exports", "module", "ace/tokenizer", "ace/mode/matching_brace_outdent", "ace/range", "ace/mode/text"], function (e, t, n) {
  function u(e, t) {
    function n() {}return n.prototype = (e.superclass = t).prototype, (e.prototype = new n()).constructor = e, typeof t.extended == "function" && t.extended(e), e;
  }function a(e, t) {
    var n = {}.hasOwnProperty;for (var r in t) {
      n.call(t, r) && (e[r] = t[r]);
    }return e;
  }var r, i, s, o;r = "(?![\\d\\s])[$\\w\\xAA-\\uFFDC](?:(?!\\s)[$\\w\\xAA-\\uFFDC]|-[A-Za-z])*", t.Mode = i = function (t) {
    function o() {
      var t;this.$tokenizer = new (e("../tokenizer").Tokenizer)(o.Rules);if (t = e("../mode/matching_brace_outdent")) this.$outdent = new t.MatchingBraceOutdent();this.$id = "ace/mode/livescript";
    }var n,
        i = u((a(o, t).displayName = "LiveScriptMode", o), t).prototype,
        s = o;return n = RegExp("(?:[({[=:]|[-~]>|\\b(?:e(?:lse|xport)|d(?:o|efault)|t(?:ry|hen)|finally|import(?:\\s*all)?|const|var|let|new|catch(?:\\s*" + r + ")?))\\s*$"), i.getNextLineIndent = function (e, t, r) {
      var i, s;return i = this.$getIndent(t), s = this.$tokenizer.getLineTokens(t, e).tokens, (!s.length || s[s.length - 1].type !== "comment") && e === "start" && n.test(t) && (i += r), i;
    }, i.toggleCommentLines = function (t, n, r, i) {
      var s, o, u, a, f, l;s = /^(\s*)#/, o = new (e("../range").Range)(0, 0, 0, 0);for (u = r; u <= i; ++u) {
        a = u, (f = s.test(l = n.getLine(a))) ? l = l.replace(s, "$1") : l = l.replace(/^\s*/, "$&#"), o.end.row = o.start.row = a, o.end.column = l.length + 1, n.replace(o, l);
      }return 1 - f * 2;
    }, i.checkOutdent = function (e, t, n) {
      var r;return (r = this.$outdent) != null ? r.checkOutdent(t, n) : void 8;
    }, i.autoOutdent = function (e, t, n) {
      var r;return (r = this.$outdent) != null ? r.autoOutdent(t, n) : void 8;
    }, o;
  }(e("../mode/text").Mode), s = "(?![$\\w]|-[A-Za-z]|\\s*:(?![:=]))", o = { token: "string", regex: ".+" }, i.Rules = { start: [{ token: "keyword", regex: "(?:t(?:h(?:is|row|en)|ry|ypeof!?)|c(?:on(?:tinue|st)|a(?:se|tch)|lass)|i(?:n(?:stanceof)?|mp(?:ort(?:\\s+all)?|lements)|[fs])|d(?:e(?:fault|lete|bugger)|o)|f(?:or(?:\\s+own)?|inally|unction)|s(?:uper|witch)|e(?:lse|x(?:tends|port)|val)|a(?:nd|rguments)|n(?:ew|ot)|un(?:less|til)|w(?:hile|ith)|o[fr]|return|break|let|var|loop)" + s }, { token: "constant.language", regex: "(?:true|false|yes|no|on|off|null|void|undefined)" + s }, { token: "invalid.illegal", regex: "(?:p(?:ackage|r(?:ivate|otected)|ublic)|i(?:mplements|nterface)|enum|static|yield)" + s }, { token: "language.support.class", regex: "(?:R(?:e(?:gExp|ferenceError)|angeError)|S(?:tring|yntaxError)|E(?:rror|valError)|Array|Boolean|Date|Function|Number|Object|TypeError|URIError)" + s }, { token: "language.support.function", regex: "(?:is(?:NaN|Finite)|parse(?:Int|Float)|Math|JSON|(?:en|de)codeURI(?:Component)?)" + s }, { token: "variable.language", regex: "(?:t(?:hat|il|o)|f(?:rom|allthrough)|it|by|e)" + s }, { token: "identifier", regex: r + "\\s*:(?![:=])" }, { token: "variable", regex: r }, { token: "keyword.operator", regex: "(?:\\.{3}|\\s+\\?)" }, { token: "keyword.variable", regex: "(?:@+|::|\\.\\.)", next: "key" }, { token: "keyword.operator", regex: "\\.\\s*", next: "key" }, { token: "string", regex: "\\\\\\S[^\\s,;)}\\]]*" }, { token: "string.doc", regex: "'''", next: "qdoc" }, { token: "string.doc", regex: '"""', next: "qqdoc" }, { token: "string", regex: "'", next: "qstring" }, { token: "string", regex: '"', next: "qqstring" }, { token: "string", regex: "`", next: "js" }, { token: "string", regex: "<\\[", next: "words" }, { token: "string.regex", regex: "//", next: "heregex" }, { token: "comment.doc", regex: "/\\*", next: "comment" }, { token: "comment", regex: "#.*" }, { token: "string.regex", regex: "\\/(?:[^[\\/\\n\\\\]*(?:(?:\\\\.|\\[[^\\]\\n\\\\]*(?:\\\\.[^\\]\\n\\\\]*)*\\])[^[\\/\\n\\\\]*)*)\\/[gimy$]{0,4}", next: "key" }, { token: "constant.numeric", regex: "(?:0x[\\da-fA-F][\\da-fA-F_]*|(?:[2-9]|[12]\\d|3[0-6])r[\\da-zA-Z][\\da-zA-Z_]*|(?:\\d[\\d_]*(?:\\.\\d[\\d_]*)?|\\.\\d[\\d_]*)(?:e[+-]?\\d[\\d_]*)?[\\w$]*)" }, { token: "lparen", regex: "[({[]" }, { token: "rparen", regex: "[)}\\]]", next: "key" }, { token: "keyword.operator", regex: "\\S+" }, { token: "text", regex: "\\s+" }], heregex: [{ token: "string.regex", regex: ".*?//[gimy$?]{0,4}", next: "start" }, { token: "string.regex", regex: "\\s*#{" }, { token: "comment.regex", regex: "\\s+(?:#.*)?" }, { token: "string.regex", regex: "\\S+" }], key: [{ token: "keyword.operator", regex: "[.?@!]+" }, { token: "identifier", regex: r, next: "start" }, { token: "text", regex: ".", next: "start" }], comment: [{ token: "comment.doc", regex: ".*?\\*/", next: "start" }, { token: "comment.doc", regex: ".+" }], qdoc: [{ token: "string", regex: ".*?'''", next: "key" }, o], qqdoc: [{ token: "string", regex: '.*?"""', next: "key" }, o], qstring: [{ token: "string", regex: "[^\\\\']*(?:\\\\.[^\\\\']*)*'", next: "key" }, o], qqstring: [{ token: "string", regex: '[^\\\\"]*(?:\\\\.[^\\\\"]*)*"', next: "key" }, o], js: [{ token: "string", regex: "[^\\\\`]*(?:\\\\.[^\\\\`]*)*`", next: "key" }, o], words: [{ token: "string", regex: ".*?\\]>", next: "key" }, o] };
});