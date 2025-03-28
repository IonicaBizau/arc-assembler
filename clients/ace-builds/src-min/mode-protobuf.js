"use strict";

define("ace/mode/doc_comment_highlight_rules", ["require", "exports", "module", "ace/lib/oop", "ace/mode/text_highlight_rules"], function (e, t, n) {
  "use strict";
  var r = e("../lib/oop"),
      i = e("./text_highlight_rules").TextHighlightRules,
      s = function s() {
    this.$rules = { start: [{ token: "comment.doc.tag", regex: "@[\\w\\d_]+" }, s.getTagRule(), { defaultToken: "comment.doc", caseInsensitive: !0 }] };
  };r.inherits(s, i), s.getTagRule = function (e) {
    return { token: "comment.doc.tag.storage.type", regex: "\\b(?:TODO|FIXME|XXX|HACK)\\b" };
  }, s.getStartRule = function (e) {
    return { token: "comment.doc", regex: "\\/\\*(?=\\*)", next: e };
  }, s.getEndRule = function (e) {
    return { token: "comment.doc", regex: "\\*\\/", next: e };
  }, t.DocCommentHighlightRules = s;
}), define("ace/mode/c_cpp_highlight_rules", ["require", "exports", "module", "ace/lib/oop", "ace/mode/doc_comment_highlight_rules", "ace/mode/text_highlight_rules"], function (e, t, n) {
  "use strict";
  var r = e("../lib/oop"),
      i = e("./doc_comment_highlight_rules").DocCommentHighlightRules,
      s = e("./text_highlight_rules").TextHighlightRules,
      o = t.cFunctions = "\\b(?:hypot(?:f|l)?|s(?:scanf|ystem|nprintf|ca(?:nf|lb(?:n(?:f|l)?|ln(?:f|l)?))|i(?:n(?:h(?:f|l)?|f|l)?|gn(?:al|bit))|tr(?:s(?:tr|pn)|nc(?:py|at|mp)|c(?:spn|hr|oll|py|at|mp)|to(?:imax|d|u(?:l(?:l)?|max)|k|f|l(?:d|l)?)|error|pbrk|ftime|len|rchr|xfrm)|printf|et(?:jmp|vbuf|locale|buf)|qrt(?:f|l)?|w(?:scanf|printf)|rand)|n(?:e(?:arbyint(?:f|l)?|xt(?:toward(?:f|l)?|after(?:f|l)?))|an(?:f|l)?)|c(?:s(?:in(?:h(?:f|l)?|f|l)?|qrt(?:f|l)?)|cos(?:h(?:f)?|f|l)?|imag(?:f|l)?|t(?:ime|an(?:h(?:f|l)?|f|l)?)|o(?:s(?:h(?:f|l)?|f|l)?|nj(?:f|l)?|pysign(?:f|l)?)|p(?:ow(?:f|l)?|roj(?:f|l)?)|e(?:il(?:f|l)?|xp(?:f|l)?)|l(?:o(?:ck|g(?:f|l)?)|earerr)|a(?:sin(?:h(?:f|l)?|f|l)?|cos(?:h(?:f|l)?|f|l)?|tan(?:h(?:f|l)?|f|l)?|lloc|rg(?:f|l)?|bs(?:f|l)?)|real(?:f|l)?|brt(?:f|l)?)|t(?:ime|o(?:upper|lower)|an(?:h(?:f|l)?|f|l)?|runc(?:f|l)?|gamma(?:f|l)?|mp(?:nam|file))|i(?:s(?:space|n(?:ormal|an)|cntrl|inf|digit|u(?:nordered|pper)|p(?:unct|rint)|finite|w(?:space|c(?:ntrl|type)|digit|upper|p(?:unct|rint)|lower|al(?:num|pha)|graph|xdigit|blank)|l(?:ower|ess(?:equal|greater)?)|al(?:num|pha)|gr(?:eater(?:equal)?|aph)|xdigit|blank)|logb(?:f|l)?|max(?:div|abs))|di(?:v|fftime)|_Exit|unget(?:c|wc)|p(?:ow(?:f|l)?|ut(?:s|c(?:har)?|wc(?:har)?)|error|rintf)|e(?:rf(?:c(?:f|l)?|f|l)?|x(?:it|p(?:2(?:f|l)?|f|l|m1(?:f|l)?)?))|v(?:s(?:scanf|nprintf|canf|printf|w(?:scanf|printf))|printf|f(?:scanf|printf|w(?:scanf|printf))|w(?:scanf|printf)|a_(?:start|copy|end|arg))|qsort|f(?:s(?:canf|e(?:tpos|ek))|close|tell|open|dim(?:f|l)?|p(?:classify|ut(?:s|c|w(?:s|c))|rintf)|e(?:holdexcept|set(?:e(?:nv|xceptflag)|round)|clearexcept|testexcept|of|updateenv|r(?:aiseexcept|ror)|get(?:e(?:nv|xceptflag)|round))|flush|w(?:scanf|ide|printf|rite)|loor(?:f|l)?|abs(?:f|l)?|get(?:s|c|pos|w(?:s|c))|re(?:open|e|ad|xp(?:f|l)?)|m(?:in(?:f|l)?|od(?:f|l)?|a(?:f|l|x(?:f|l)?)?))|l(?:d(?:iv|exp(?:f|l)?)|o(?:ngjmp|cal(?:time|econv)|g(?:1(?:p(?:f|l)?|0(?:f|l)?)|2(?:f|l)?|f|l|b(?:f|l)?)?)|abs|l(?:div|abs|r(?:int(?:f|l)?|ound(?:f|l)?))|r(?:int(?:f|l)?|ound(?:f|l)?)|gamma(?:f|l)?)|w(?:scanf|c(?:s(?:s(?:tr|pn)|nc(?:py|at|mp)|c(?:spn|hr|oll|py|at|mp)|to(?:imax|d|u(?:l(?:l)?|max)|k|f|l(?:d|l)?|mbs)|pbrk|ftime|len|r(?:chr|tombs)|xfrm)|to(?:b|mb)|rtomb)|printf|mem(?:set|c(?:hr|py|mp)|move))|a(?:s(?:sert|ctime|in(?:h(?:f|l)?|f|l)?)|cos(?:h(?:f|l)?|f|l)?|t(?:o(?:i|f|l(?:l)?)|exit|an(?:h(?:f|l)?|2(?:f|l)?|f|l)?)|b(?:s|ort))|g(?:et(?:s|c(?:har)?|env|wc(?:har)?)|mtime)|r(?:int(?:f|l)?|ound(?:f|l)?|e(?:name|alloc|wind|m(?:ove|quo(?:f|l)?|ainder(?:f|l)?))|a(?:nd|ise))|b(?:search|towc)|m(?:odf(?:f|l)?|em(?:set|c(?:hr|py|mp)|move)|ktime|alloc|b(?:s(?:init|towcs|rtowcs)|towc|len|r(?:towc|len))))\\b",
      u = function u() {
    var e = "break|case|continue|default|do|else|for|goto|if|_Pragma|return|switch|while|catch|operator|try|throw|using",
        t = "asm|__asm__|auto|bool|_Bool|char|_Complex|double|enum|float|_Imaginary|int|long|short|signed|struct|typedef|union|unsigned|void|class|wchar_t|template",
        n = "const|extern|register|restrict|static|volatile|inline|private|protected|public|friend|explicit|virtual|export|mutable|typename|constexpr|new|delete",
        r = "and|and_eq|bitand|bitor|compl|not|not_eq|or|or_eq|typeid|xor|xor_eqconst_cast|dynamic_cast|reinterpret_cast|static_cast|sizeof|namespace",
        s = "NULL|true|false|TRUE|FALSE",
        u = this.$keywords = this.createKeywordMapper({ "keyword.control": e, "storage.type": t, "storage.modifier": n, "keyword.operator": r, "variable.language": "this", "constant.language": s }, "identifier"),
        a = "[a-zA-Z\\$_\xA1-\uFFFF][a-zA-Zd\\$_\xA1-\uFFFF]*\\b";this.$rules = { start: [{ token: "comment", regex: "//", next: "singleLineComment" }, i.getStartRule("doc-start"), { token: "comment", regex: "\\/\\*", next: "comment" }, { token: "string", regex: '["](?:(?:\\\\.)|(?:[^"\\\\]))*?["]' }, { token: "string", regex: '["].*\\\\$', next: "qqstring" }, { token: "string", regex: "['](?:(?:\\\\.)|(?:[^'\\\\]))*?[']" }, { token: "string", regex: "['].*\\\\$", next: "qstring" }, { token: "constant.numeric", regex: "0[xX][0-9a-fA-F]+(L|l|UL|ul|u|U|F|f|ll|LL|ull|ULL)?\\b" }, { token: "constant.numeric", regex: "[+-]?\\d+(?:(?:\\.\\d*)?(?:[eE][+-]?\\d+)?)?(L|l|UL|ul|u|U|F|f|ll|LL|ull|ULL)?\\b" }, { token: "keyword", regex: "#\\s*(?:include|import|pragma|line|define|undef|if|ifdef|else|elif|ifndef)\\b", next: "directive" }, { token: "keyword", regex: "(?:#\\s*endif)\\b" }, { token: "support.function.C99.c", regex: o }, { token: u, regex: "[a-zA-Z_$][a-zA-Z0-9_$]*\\b" }, { token: "keyword.operator", regex: "!|\\$|%|&|\\*|\\-\\-|\\-|\\+\\+|\\+|~|==|=|!=|<=|>=|<<=|>>=|>>>=|<>|<|>|!|&&|\\|\\||\\?\\:|\\*=|%=|\\+=|\\-=|&=|\\^=|\\b(?:in|new|delete|typeof|void)" }, { token: "punctuation.operator", regex: "\\?|\\:|\\,|\\;|\\." }, { token: "paren.lparen", regex: "[[({]" }, { token: "paren.rparen", regex: "[\\])}]" }, { token: "text", regex: "\\s+" }], comment: [{ token: "comment", regex: ".*?\\*\\/", next: "start" }, { token: "comment", regex: ".+" }], singleLineComment: [{ token: "comment", regex: /\\$/, next: "singleLineComment" }, { token: "comment", regex: /$/, next: "start" }, { defaultToken: "comment" }], qqstring: [{ token: "string", regex: '(?:(?:\\\\.)|(?:[^"\\\\]))*?"', next: "start" }, { defaultToken: "string" }], qstring: [{ token: "string", regex: "(?:(?:\\\\.)|(?:[^'\\\\]))*?'", next: "start" }, { defaultToken: "string" }], directive: [{ token: "constant.other.multiline", regex: /\\/ }, { token: "constant.other.multiline", regex: /.*\\/ }, { token: "constant.other", regex: "\\s*<.+?>", next: "start" }, { token: "constant.other", regex: '\\s*["](?:(?:\\\\.)|(?:[^"\\\\]))*?["]', next: "start" }, { token: "constant.other", regex: "\\s*['](?:(?:\\\\.)|(?:[^'\\\\]))*?[']", next: "start" }, { token: "constant.other", regex: /[^\\\/]+/, next: "start" }] }, this.embedRules(i, "doc-", [i.getEndRule("start")]);
  };r.inherits(u, s), t.c_cppHighlightRules = u;
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
}), define("ace/mode/folding/cstyle", ["require", "exports", "module", "ace/lib/oop", "ace/range", "ace/mode/folding/fold_mode"], function (e, t, n) {
  "use strict";
  var r = e("../../lib/oop"),
      i = e("../../range").Range,
      s = e("./fold_mode").FoldMode,
      o = t.FoldMode = function (e) {
    e && (this.foldingStartMarker = new RegExp(this.foldingStartMarker.source.replace(/\|[^|]*?$/, "|" + e.start)), this.foldingStopMarker = new RegExp(this.foldingStopMarker.source.replace(/\|[^|]*?$/, "|" + e.end)));
  };r.inherits(o, s), function () {
    this.foldingStartMarker = /(\{|\[)[^\}\]]*$|^\s*(\/\*)/, this.foldingStopMarker = /^[^\[\{]*(\}|\])|^[\s\*]*(\*\/)/, this.getFoldWidgetRange = function (e, t, n, r) {
      var i = e.getLine(n),
          s = i.match(this.foldingStartMarker);if (s) {
        var o = s.index;if (s[1]) return this.openingBracketBlock(e, s[1], n, o);var u = e.getCommentFoldRange(n, o + s[0].length, 1);return u && !u.isMultiLine() && (r ? u = this.getSectionRange(e, n) : t != "all" && (u = null)), u;
      }if (t === "markbegin") return;var s = i.match(this.foldingStopMarker);if (s) {
        var o = s.index + s[0].length;return s[1] ? this.closingBracketBlock(e, s[1], n, o) : e.getCommentFoldRange(n, o, -1);
      }
    }, this.getSectionRange = function (e, t) {
      var n = e.getLine(t),
          r = n.search(/\S/),
          s = t,
          o = n.length;t += 1;var u = t,
          a = e.getLength();while (++t < a) {
        n = e.getLine(t);var f = n.search(/\S/);if (f === -1) continue;if (r > f) break;var l = this.getFoldWidgetRange(e, "all", t);if (l) {
          if (l.start.row <= s) break;if (l.isMultiLine()) t = l.end.row;else if (r == f) break;
        }u = t;
      }return new i(s, o, u, e.getLine(u).length);
    };
  }.call(o.prototype);
}), define("ace/mode/c_cpp", ["require", "exports", "module", "ace/lib/oop", "ace/mode/text", "ace/mode/c_cpp_highlight_rules", "ace/mode/matching_brace_outdent", "ace/range", "ace/mode/behaviour/cstyle", "ace/mode/folding/cstyle"], function (e, t, n) {
  "use strict";
  var r = e("../lib/oop"),
      i = e("./text").Mode,
      s = e("./c_cpp_highlight_rules").c_cppHighlightRules,
      o = e("./matching_brace_outdent").MatchingBraceOutdent,
      u = e("../range").Range,
      a = e("./behaviour/cstyle").CstyleBehaviour,
      f = e("./folding/cstyle").FoldMode,
      l = function l() {
    this.HighlightRules = s, this.$outdent = new o(), this.$behaviour = new a(), this.foldingRules = new f();
  };r.inherits(l, i), function () {
    this.lineCommentStart = "//", this.blockComment = { start: "/*", end: "*/" }, this.getNextLineIndent = function (e, t, n) {
      var r = this.$getIndent(t),
          i = this.getTokenizer().getLineTokens(t, e),
          s = i.tokens,
          o = i.state;if (s.length && s[s.length - 1].type == "comment") return r;if (e == "start") {
        var u = t.match(/^.*[\{\(\[]\s*$/);u && (r += n);
      } else if (e == "doc-start") {
        if (o == "start") return "";var u = t.match(/^\s*(\/?)\*/);u && (u[1] && (r += " "), r += "* ");
      }return r;
    }, this.checkOutdent = function (e, t, n) {
      return this.$outdent.checkOutdent(t, n);
    }, this.autoOutdent = function (e, t, n) {
      this.$outdent.autoOutdent(t, n);
    }, this.$id = "ace/mode/c_cpp";
  }.call(l.prototype), t.Mode = l;
}), define("ace/mode/protobuf_highlight_rules", ["require", "exports", "module", "ace/lib/oop", "ace/mode/text_highlight_rules"], function (e, t, n) {
  "use strict";
  var r = e("../lib/oop"),
      i = e("./text_highlight_rules").TextHighlightRules,
      s = function s() {
    var e = "double|float|int32|int64|uint32|uint64|sint32|sint64|fixed32|fixed64|sfixed32|sfixed64|bool|string|bytes",
        t = "message|required|optional|repeated|package|import|option|enum",
        n = this.createKeywordMapper({ "keyword.declaration.protobuf": t, "support.type": e }, "identifier");this.$rules = { start: [{ token: "comment", regex: /\/\/.*$/ }, { token: "comment", regex: /\/\*/, next: "comment" }, { token: "constant", regex: "<[^>]+>" }, { regex: "=", token: "keyword.operator.assignment.protobuf" }, { token: "string", regex: '["](?:(?:\\\\.)|(?:[^"\\\\]))*?["]' }, { token: "string", regex: "['](?:(?:\\\\.)|(?:[^'\\\\]))*?[']" }, { token: "constant.numeric", regex: "0[xX][0-9a-fA-F]+\\b" }, { token: "constant.numeric", regex: "[+-]?\\d+(?:(?:\\.\\d*)?(?:[eE][+-]?\\d+)?)?\\b" }, { token: n, regex: "[a-zA-Z_$][a-zA-Z0-9_$]*\\b" }], comment: [{ token: "comment", regex: ".*?\\*\\/", next: "start" }, { token: "comment", regex: ".+" }] }, this.normalizeRules();
  };r.inherits(s, i), t.ProtobufHighlightRules = s;
}), define("ace/mode/protobuf", ["require", "exports", "module", "ace/lib/oop", "ace/mode/c_cpp", "ace/mode/protobuf_highlight_rules", "ace/mode/folding/cstyle"], function (e, t, n) {
  "use strict";
  var r = e("../lib/oop"),
      i = e("./c_cpp").Mode,
      s = e("./protobuf_highlight_rules").ProtobufHighlightRules,
      o = e("./folding/cstyle").FoldMode,
      u = function u() {
    i.call(this), this.foldingRules = new o(), this.HighlightRules = s;
  };r.inherits(u, i), function () {
    this.lineCommentStart = "//", this.blockComment = { start: "/*", end: "*/" }, this.$id = "ace/mode/protobuf";
  }.call(u.prototype), t.Mode = u;
});