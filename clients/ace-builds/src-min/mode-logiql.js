"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

define("ace/mode/logiql_highlight_rules", ["require", "exports", "module", "ace/lib/oop", "ace/mode/text_highlight_rules"], function (e, t, n) {
  "use strict";
  var r = e("../lib/oop"),
      i = e("./text_highlight_rules").TextHighlightRules,
      s = function s() {
    this.$rules = { start: [{ token: "comment.block", regex: "/\\*", push: [{ token: "comment.block", regex: "\\*/", next: "pop" }, { defaultToken: "comment.block" }] }, { token: "comment.single", regex: "//.*" }, { token: "constant.numeric", regex: "\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?[fd]?" }, { token: "string", regex: '"', push: [{ token: "string", regex: '"', next: "pop" }, { defaultToken: "string" }] }, { token: "constant.language", regex: "\\b(true|false)\\b" }, { token: "entity.name.type.logicblox", regex: "`[a-zA-Z_:]+(\\d|\\a)*\\b" }, { token: "keyword.start", regex: "->", comment: "Constraint" }, { token: "keyword.start", regex: "-->", comment: "Level 1 Constraint" }, { token: "keyword.start", regex: "<-", comment: "Rule" }, { token: "keyword.start", regex: "<--", comment: "Level 1 Rule" }, { token: "keyword.end", regex: "\\.", comment: "Terminator" }, { token: "keyword.other", regex: "!", comment: "Negation" }, { token: "keyword.other", regex: ",", comment: "Conjunction" }, { token: "keyword.other", regex: ";", comment: "Disjunction" }, { token: "keyword.operator", regex: "<=|>=|!=|<|>", comment: "Equality" }, { token: "keyword.other", regex: "@", comment: "Equality" }, { token: "keyword.operator", regex: "\\+|-|\\*|/", comment: "Arithmetic operations" }, { token: "keyword", regex: "::", comment: "Colon colon" }, { token: "support.function", regex: "\\b(agg\\s*<<)", push: [{ include: "$self" }, { token: "support.function", regex: ">>", next: "pop" }] }, { token: "storage.modifier", regex: "\\b(lang:[\\w:]*)" }, { token: ["storage.type", "text"], regex: "(export|sealed|clauses|block|alias|alias_all)(\\s*\\()(?=`)" }, { token: "entity.name", regex: "[a-zA-Z_][a-zA-Z_0-9:]*(@prev|@init|@final)?(?=(\\(|\\[))" }, { token: "variable.parameter", regex: "([a-zA-Z][a-zA-Z_0-9]*|_)\\s*(?=(,|\\.|<-|->|\\)|\\]|=))" }] }, this.normalizeRules();
  };r.inherits(s, i), t.LogiQLHighlightRules = s;
}), define("ace/mode/folding/coffee", ["require", "exports", "module", "ace/lib/oop", "ace/mode/folding/fold_mode", "ace/range"], function (e, t, n) {
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
}), define("ace/mode/behaviour/cstyle", ["require", "exports", "module", "ace/lib/oop", "ace/mode/behaviour", "ace/token_iterator", "ace/lib/lang"], function (e, t, n) {
  "use strict";
  var r = e("../../lib/oop"),
      i = e("../behaviour").Behaviour,
      s = e("../../token_iterator").TokenIterator,
      o = e("../../lib/lang"),
      u = ["text", "paren.rparen", "punctuation.operator"],
      a = ["text", "paren.rparen", "punctuation.operator", "comment"],
      f,
      l = {},
      c = function c(e) {
    var t = -1;e.multiSelect && (t = e.selection.index, l.rangeCount != e.multiSelect.rangeCount && (l = { rangeCount: e.multiSelect.rangeCount }));if (l[t]) return f = l[t];f = l[t] = { autoInsertedBrackets: 0, autoInsertedRow: -1, autoInsertedLineEnd: "", maybeInsertedBrackets: 0, maybeInsertedRow: -1, maybeInsertedLineStart: "", maybeInsertedLineEnd: "" };
  },
      h = function h() {
    this.add("braces", "insertion", function (e, t, n, r, i) {
      var s = n.getCursorPosition(),
          u = r.doc.getLine(s.row);if (i == "{") {
        c(n);var a = n.getSelectionRange(),
            l = r.doc.getTextRange(a);if (l !== "" && l !== "{" && n.getWrapBehavioursEnabled()) return { text: "{" + l + "}", selection: !1 };if (h.isSaneInsertion(n, r)) return (/[\]\}\)]/.test(u[s.column]) || n.inMultiSelectMode ? (h.recordAutoInsert(n, r, "}"), { text: "{}", selection: [1, 1] }) : (h.recordMaybeInsert(n, r, "{"), { text: "{", selection: [1, 1] })
        );
      } else if (i == "}") {
        c(n);var p = u.substring(s.column, s.column + 1);if (p == "}") {
          var d = r.$findOpeningBracket("}", { column: s.column + 1, row: s.row });if (d !== null && h.isAutoInsertedClosing(s, u, i)) return h.popAutoInsertedClosing(), { text: "", selection: [1, 1] };
        }
      } else {
        if (i == "\n" || i == "\r\n") {
          c(n);var v = "";h.isMaybeInsertedClosing(s, u) && (v = o.stringRepeat("}", f.maybeInsertedBrackets), h.clearMaybeInsertedClosing());var p = u.substring(s.column, s.column + 1);if (p === "}") {
            var m = r.findMatchingBracket({ row: s.row, column: s.column + 1 }, "}");if (!m) return null;var g = this.$getIndent(r.getLine(m.row));
          } else {
            if (!v) {
              h.clearMaybeInsertedClosing();return;
            }var g = this.$getIndent(u);
          }var y = g + r.getTabString();return { text: "\n" + y + "\n" + g + v, selection: [1, y.length, 1, y.length] };
        }h.clearMaybeInsertedClosing();
      }
    }), this.add("braces", "deletion", function (e, t, n, r, i) {
      var s = r.doc.getTextRange(i);if (!i.isMultiLine() && s == "{") {
        c(n);var o = r.doc.getLine(i.start.row),
            u = o.substring(i.end.column, i.end.column + 1);if (u == "}") return i.end.column++, i;f.maybeInsertedBrackets--;
      }
    }), this.add("parens", "insertion", function (e, t, n, r, i) {
      if (i == "(") {
        c(n);var s = n.getSelectionRange(),
            o = r.doc.getTextRange(s);if (o !== "" && n.getWrapBehavioursEnabled()) return { text: "(" + o + ")", selection: !1 };if (h.isSaneInsertion(n, r)) return h.recordAutoInsert(n, r, ")"), { text: "()", selection: [1, 1] };
      } else if (i == ")") {
        c(n);var u = n.getCursorPosition(),
            a = r.doc.getLine(u.row),
            f = a.substring(u.column, u.column + 1);if (f == ")") {
          var l = r.$findOpeningBracket(")", { column: u.column + 1, row: u.row });if (l !== null && h.isAutoInsertedClosing(u, a, i)) return h.popAutoInsertedClosing(), { text: "", selection: [1, 1] };
        }
      }
    }), this.add("parens", "deletion", function (e, t, n, r, i) {
      var s = r.doc.getTextRange(i);if (!i.isMultiLine() && s == "(") {
        c(n);var o = r.doc.getLine(i.start.row),
            u = o.substring(i.start.column + 1, i.start.column + 2);if (u == ")") return i.end.column++, i;
      }
    }), this.add("brackets", "insertion", function (e, t, n, r, i) {
      if (i == "[") {
        c(n);var s = n.getSelectionRange(),
            o = r.doc.getTextRange(s);if (o !== "" && n.getWrapBehavioursEnabled()) return { text: "[" + o + "]", selection: !1 };if (h.isSaneInsertion(n, r)) return h.recordAutoInsert(n, r, "]"), { text: "[]", selection: [1, 1] };
      } else if (i == "]") {
        c(n);var u = n.getCursorPosition(),
            a = r.doc.getLine(u.row),
            f = a.substring(u.column, u.column + 1);if (f == "]") {
          var l = r.$findOpeningBracket("]", { column: u.column + 1, row: u.row });if (l !== null && h.isAutoInsertedClosing(u, a, i)) return h.popAutoInsertedClosing(), { text: "", selection: [1, 1] };
        }
      }
    }), this.add("brackets", "deletion", function (e, t, n, r, i) {
      var s = r.doc.getTextRange(i);if (!i.isMultiLine() && s == "[") {
        c(n);var o = r.doc.getLine(i.start.row),
            u = o.substring(i.start.column + 1, i.start.column + 2);if (u == "]") return i.end.column++, i;
      }
    }), this.add("string_dquotes", "insertion", function (e, t, n, r, i) {
      if (i == '"' || i == "'") {
        c(n);var s = i,
            o = n.getSelectionRange(),
            u = r.doc.getTextRange(o);if (u !== "" && u !== "'" && u != '"' && n.getWrapBehavioursEnabled()) return { text: s + u + s, selection: !1 };var a = n.getCursorPosition(),
            f = r.doc.getLine(a.row),
            l = f.substring(a.column - 1, a.column);if (l == "\\") return null;var p = r.getTokens(o.start.row),
            d = 0,
            v,
            m = -1;for (var g = 0; g < p.length; g++) {
          v = p[g], v.type == "string" ? m = -1 : m < 0 && (m = v.value.indexOf(s));if (v.value.length + d > o.start.column) break;d += p[g].value.length;
        }if (!v || m < 0 && v.type !== "comment" && (v.type !== "string" || o.start.column !== v.value.length + d - 1 && v.value.lastIndexOf(s) === v.value.length - 1)) {
          if (!h.isSaneInsertion(n, r)) return;return { text: s + s, selection: [1, 1] };
        }if (v && v.type === "string") {
          var y = f.substring(a.column, a.column + 1);if (y == s) return { text: "", selection: [1, 1] };
        }
      }
    }), this.add("string_dquotes", "deletion", function (e, t, n, r, i) {
      var s = r.doc.getTextRange(i);if (!i.isMultiLine() && (s == '"' || s == "'")) {
        c(n);var o = r.doc.getLine(i.start.row),
            u = o.substring(i.start.column + 1, i.start.column + 2);if (u == s) return i.end.column++, i;
      }
    });
  };h.isSaneInsertion = function (e, t) {
    var n = e.getCursorPosition(),
        r = new s(t, n.row, n.column);if (!this.$matchTokenType(r.getCurrentToken() || "text", u)) {
      var i = new s(t, n.row, n.column + 1);if (!this.$matchTokenType(i.getCurrentToken() || "text", u)) return !1;
    }return r.stepForward(), r.getCurrentTokenRow() !== n.row || this.$matchTokenType(r.getCurrentToken() || "text", a);
  }, h.$matchTokenType = function (e, t) {
    return t.indexOf(e.type || e) > -1;
  }, h.recordAutoInsert = function (e, t, n) {
    var r = e.getCursorPosition(),
        i = t.doc.getLine(r.row);this.isAutoInsertedClosing(r, i, f.autoInsertedLineEnd[0]) || (f.autoInsertedBrackets = 0), f.autoInsertedRow = r.row, f.autoInsertedLineEnd = n + i.substr(r.column), f.autoInsertedBrackets++;
  }, h.recordMaybeInsert = function (e, t, n) {
    var r = e.getCursorPosition(),
        i = t.doc.getLine(r.row);this.isMaybeInsertedClosing(r, i) || (f.maybeInsertedBrackets = 0), f.maybeInsertedRow = r.row, f.maybeInsertedLineStart = i.substr(0, r.column) + n, f.maybeInsertedLineEnd = i.substr(r.column), f.maybeInsertedBrackets++;
  }, h.isAutoInsertedClosing = function (e, t, n) {
    return f.autoInsertedBrackets > 0 && e.row === f.autoInsertedRow && n === f.autoInsertedLineEnd[0] && t.substr(e.column) === f.autoInsertedLineEnd;
  }, h.isMaybeInsertedClosing = function (e, t) {
    return f.maybeInsertedBrackets > 0 && e.row === f.maybeInsertedRow && t.substr(e.column) === f.maybeInsertedLineEnd && t.substr(0, e.column) == f.maybeInsertedLineStart;
  }, h.popAutoInsertedClosing = function () {
    f.autoInsertedLineEnd = f.autoInsertedLineEnd.substr(1), f.autoInsertedBrackets--;
  }, h.clearMaybeInsertedClosing = function () {
    f && (f.maybeInsertedBrackets = 0, f.maybeInsertedRow = -1);
  }, r.inherits(h, i), t.CstyleBehaviour = h;
}), define("ace/mode/matching_brace_outdent", ["require", "exports", "module", "ace/range"], function (e, t, n) {
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
}), define("ace/mode/logiql", ["require", "exports", "module", "ace/lib/oop", "ace/mode/text", "ace/mode/logiql_highlight_rules", "ace/mode/folding/coffee", "ace/token_iterator", "ace/range", "ace/mode/behaviour/cstyle", "ace/mode/matching_brace_outdent"], function (e, t, n) {
  "use strict";
  var r = e("../lib/oop"),
      i = e("./text").Mode,
      s = e("./logiql_highlight_rules").LogiQLHighlightRules,
      o = e("./folding/coffee").FoldMode,
      u = e("../token_iterator").TokenIterator,
      a = e("../range").Range,
      f = e("./behaviour/cstyle").CstyleBehaviour,
      l = e("./matching_brace_outdent").MatchingBraceOutdent,
      c = function c() {
    this.HighlightRules = s, this.foldingRules = new o(), this.$outdent = new l(), this.$behaviour = new f();
  };r.inherits(c, i), function () {
    this.lineCommentStart = "//", this.blockComment = { start: "/*", end: "*/" }, this.getNextLineIndent = function (e, t, n) {
      var r = this.$getIndent(t),
          i = this.getTokenizer().getLineTokens(t, e),
          s = i.tokens,
          o = i.state;if (/comment|string/.test(o)) return r;if (s.length && s[s.length - 1].type == "comment.single") return r;var u = t.match();return (/(-->|<--|<-|->|{)\s*$/.test(t) && (r += n), r
      );
    }, this.checkOutdent = function (e, t, n) {
      return this.$outdent.checkOutdent(t, n) ? !0 : n !== "\n" && n !== "\r\n" ? !1 : /^\s+/.test(t) ? !0 : !1;
    }, this.autoOutdent = function (e, t, n) {
      if (this.$outdent.autoOutdent(t, n)) return;var r = t.getLine(n),
          i = r.match(/^\s+/),
          s = r.lastIndexOf(".") + 1;if (!i || !n || !s) return 0;var o = t.getLine(n + 1),
          u = this.getMatching(t, { row: n, column: s });if (!u || u.start.row == n) return 0;s = i[0].length;var f = this.$getIndent(t.getLine(u.start.row));t.replace(new a(n + 1, 0, n + 1, s), f);
    }, this.getMatching = function (e, t, n) {
      t == undefined && (t = e.selection.lead), (typeof t === "undefined" ? "undefined" : _typeof(t)) == "object" && (n = t.column, t = t.row);var r = e.getTokenAt(t, n),
          i = "keyword.start",
          s = "keyword.end",
          o;if (!r) return;if (r.type == i) {
        var f = new u(e, t, n);f.step = f.stepForward;
      } else {
        if (r.type != s) return;var f = new u(e, t, n);f.step = f.stepBackward;
      }while (o = f.step()) {
        if (o.type == i || o.type == s) break;
      }if (!o || o.type == r.type) return;var l = f.getCurrentTokenColumn(),
          t = f.getCurrentTokenRow();return new a(t, l, t, l + o.value.length);
    }, this.$id = "ace/mode/logiql";
  }.call(c.prototype), t.Mode = c;
});