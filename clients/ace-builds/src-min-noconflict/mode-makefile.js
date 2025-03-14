"use strict";

ace.define("ace/mode/sh_highlight_rules", ["require", "exports", "module", "ace/lib/oop", "ace/mode/text_highlight_rules"], function (e, t, n) {
  "use strict";
  var r = e("../lib/oop"),
      i = e("./text_highlight_rules").TextHighlightRules,
      s = t.reservedKeywords = "!|{|}|case|do|done|elif|else|esac|fi|for|if|in|then|until|while|&|;|export|local|read|typeset|unset|elif|select|set",
      o = t.languageConstructs = "[|]|alias|bg|bind|break|builtin|cd|command|compgen|complete|continue|dirs|disown|echo|enable|eval|exec|exit|fc|fg|getopts|hash|help|history|jobs|kill|let|logout|popd|printf|pushd|pwd|return|set|shift|shopt|source|suspend|test|times|trap|type|ulimit|umask|unalias|wait",
      u = function u() {
    var e = this.createKeywordMapper({ keyword: s, "support.function.builtin": o, "invalid.deprecated": "debugger" }, "identifier"),
        t = "(?:(?:[1-9]\\d*)|(?:0))",
        n = "(?:\\.\\d+)",
        r = "(?:\\d+)",
        i = "(?:(?:" + r + "?" + n + ")|(?:" + r + "\\.))",
        u = "(?:(?:" + i + "|" + r + ")" + ")",
        a = "(?:" + u + "|" + i + ")",
        f = "(?:&" + r + ")",
        l = "[a-zA-Z_][a-zA-Z0-9_]*",
        c = "(?:(?:\\$" + l + ")|(?:" + l + "=))",
        h = "(?:\\$(?:SHLVL|\\$|\\!|\\?))",
        p = "(?:" + l + "\\s*\\(\\))";this.$rules = { start: [{ token: "constant", regex: /\\./ }, { token: ["text", "comment"], regex: /(^|\s)(#.*)$/ }, { token: "string", regex: '"', push: [{ token: "constant.language.escape", regex: /\\(?:[$abeEfnrtv\\'"]|x[a-fA-F\d]{1,2}|u[a-fA-F\d]{4}([a-fA-F\d]{4})?|c.|\d{1,3})/ }, { token: "constant", regex: /\$\w+/ }, { token: "string", regex: '"', next: "pop" }, { defaultToken: "string" }] }, { regex: "<<<", token: "keyword.operator" }, { stateName: "heredoc", regex: "(<<)(\\s*)(['\"`]?)([\\w\\-]+)(['\"`]?)", onMatch: function onMatch(e, t, n) {
          var r = e[2] == "-" ? "indentedHeredoc" : "heredoc",
              i = e.split(this.splitRegex);return n.push(r, i[4]), [{ type: "constant", value: i[1] }, { type: "text", value: i[2] }, { type: "string", value: i[3] }, { type: "support.class", value: i[4] }, { type: "string", value: i[5] }];
        }, rules: { heredoc: [{ onMatch: function onMatch(e, t, n) {
              return e === n[1] ? (n.shift(), n.shift(), this.next = n[0] || "start", "support.class") : (this.next = "", "string");
            }, regex: ".*$", next: "start" }], indentedHeredoc: [{ token: "string", regex: "^	+" }, { onMatch: function onMatch(e, t, n) {
              return e === n[1] ? (n.shift(), n.shift(), this.next = n[0] || "start", "support.class") : (this.next = "", "string");
            }, regex: ".*$", next: "start" }] } }, { regex: "$", token: "empty", next: function next(e, t) {
          return t[0] === "heredoc" || t[0] === "indentedHeredoc" ? t[0] : e;
        } }, { token: "variable.language", regex: h }, { token: "variable", regex: c }, { token: "support.function", regex: p }, { token: "support.function", regex: f }, { token: "string", start: "'", end: "'" }, { token: "constant.numeric", regex: a }, { token: "constant.numeric", regex: t + "\\b" }, { token: e, regex: "[a-zA-Z_][a-zA-Z0-9_]*\\b" }, { token: "keyword.operator", regex: "\\+|\\-|\\*|\\*\\*|\\/|\\/\\/|~|<|>|<=|=>|=|!=" }, { token: "paren.lparen", regex: "[\\[\\(\\{]" }, { token: "paren.rparen", regex: "[\\]\\)\\}]" }] }, this.normalizeRules();
  };r.inherits(u, i), t.ShHighlightRules = u;
}), ace.define("ace/mode/makefile_highlight_rules", ["require", "exports", "module", "ace/lib/oop", "ace/mode/text_highlight_rules", "ace/mode/sh_highlight_rules"], function (e, t, n) {
  "use strict";
  var r = e("../lib/oop"),
      i = e("./text_highlight_rules").TextHighlightRules,
      s = e("./sh_highlight_rules"),
      o = function o() {
    var e = this.createKeywordMapper({ keyword: s.reservedKeywords, "support.function.builtin": s.languageConstructs, "invalid.deprecated": "debugger" }, "string");this.$rules = { start: [{ token: "string.interpolated.backtick.makefile", regex: "`", next: "shell-start" }, { token: "punctuation.definition.comment.makefile", regex: /#(?=.)/, next: "comment" }, { token: ["keyword.control.makefile"], regex: "^(?:\\s*\\b)(\\-??include|ifeq|ifneq|ifdef|ifndef|else|endif|vpath|export|unexport|define|endef|override)(?:\\b)" }, { token: ["entity.name.function.makefile", "text"], regex: "^([^\\t ]+(?:\\s[^\\t ]+)*:)(\\s*.*)" }], comment: [{ token: "punctuation.definition.comment.makefile", regex: /.+\\/ }, { token: "punctuation.definition.comment.makefile", regex: ".+", next: "start" }], "shell-start": [{ token: e, regex: "[a-zA-Z_$][a-zA-Z0-9_$]*\\b" }, { token: "string", regex: "\\w+" }, { token: "string.interpolated.backtick.makefile", regex: "`", next: "start" }] };
  };r.inherits(o, i), t.MakefileHighlightRules = o;
}), ace.define("ace/mode/folding/coffee", ["require", "exports", "module", "ace/lib/oop", "ace/mode/folding/fold_mode", "ace/range"], function (e, t, n) {
  "use strict";
  var r = e("../../lib/oop"),
      i = e("./fold_mode").FoldMode,
      s = e("../../range").Range,
      o = t.FoldMode = function () {};r.inherits(o, i), function () {
    this.getFoldWidgetRange = function (e, t, n) {
      var r = this.indentationBlock(e, n);if (r) return r;var i = /\S/,
          o = e.getLine(n),
          u = o.search(i);if (u == -1 || o[u] != "#") return;var a = o.length,
          f = e.getLength(),
          l = n,
          c = n;while (++n < f) {
        o = e.getLine(n);var h = o.search(i);if (h == -1) continue;if (o[h] != "#") break;c = n;
      }if (c > l) {
        var p = e.getLine(c).length;return new s(l, a, c, p);
      }
    }, this.getFoldWidget = function (e, t, n) {
      var r = e.getLine(n),
          i = r.search(/\S/),
          s = e.getLine(n + 1),
          o = e.getLine(n - 1),
          u = o.search(/\S/),
          a = s.search(/\S/);if (i == -1) return e.foldWidgets[n - 1] = u != -1 && u < a ? "start" : "", "";if (u == -1) {
        if (i == a && r[i] == "#" && s[i] == "#") return e.foldWidgets[n - 1] = "", e.foldWidgets[n + 1] = "", "start";
      } else if (u == i && r[i] == "#" && o[i] == "#" && e.getLine(n - 2).search(/\S/) == -1) return e.foldWidgets[n - 1] = "start", e.foldWidgets[n + 1] = "", "";return u != -1 && u < i ? e.foldWidgets[n - 1] = "start" : e.foldWidgets[n - 1] = "", i < a ? "start" : "";
    };
  }.call(o.prototype);
}), ace.define("ace/mode/makefile", ["require", "exports", "module", "ace/lib/oop", "ace/mode/text", "ace/mode/makefile_highlight_rules", "ace/mode/folding/coffee"], function (e, t, n) {
  "use strict";
  var r = e("../lib/oop"),
      i = e("./text").Mode,
      s = e("./makefile_highlight_rules").MakefileHighlightRules,
      o = e("./folding/coffee").FoldMode,
      u = function u() {
    this.HighlightRules = s, this.foldingRules = new o();
  };r.inherits(u, i), function () {
    this.lineCommentStart = "#", this.$indentWithTabs = !0, this.$id = "ace/mode/makefile";
  }.call(u.prototype), t.Mode = u;
});