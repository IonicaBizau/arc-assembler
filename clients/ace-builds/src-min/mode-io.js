"use strict";

define("ace/mode/io_highlight_rules", ["require", "exports", "module", "ace/lib/oop", "ace/mode/text_highlight_rules"], function (e, t, n) {
  "use strict";
  var r = e("../lib/oop"),
      i = e("./text_highlight_rules").TextHighlightRules,
      s = function s() {
    this.$rules = { start: [{ token: ["text", "meta.empty-parenthesis.io"], regex: "(\\()(\\))", comment: "we match this to overload return inside () --Allan; scoping rules for what gets the scope have changed, so we now group the ) instead of the ( -- Rob" }, { token: ["text", "meta.comma-parenthesis.io"], regex: "(\\,)(\\))", comment: "We want to do the same for ,) -- Seckar; same as above -- Rob" }, { token: "keyword.control.io", regex: "\\b(?:if|ifTrue|ifFalse|ifTrueIfFalse|for|loop|reverseForeach|foreach|map|continue|break|while|do|return)\\b" }, { token: "punctuation.definition.comment.io", regex: "/\\*", push: [{ token: "punctuation.definition.comment.io", regex: "\\*/", next: "pop" }, { defaultToken: "comment.block.io" }] }, { token: "punctuation.definition.comment.io", regex: "//", push: [{ token: "comment.line.double-slash.io", regex: "$", next: "pop" }, { defaultToken: "comment.line.double-slash.io" }] }, { token: "punctuation.definition.comment.io", regex: "#", push: [{ token: "comment.line.number-sign.io", regex: "$", next: "pop" }, { defaultToken: "comment.line.number-sign.io" }] }, { token: "variable.language.io", regex: "\\b(?:self|sender|target|proto|protos|parent)\\b", comment: "I wonder if some of this isn't variable.other.language? --Allan; scoping this as variable.language to match Objective-C's handling of 'self', which is inconsistent with C++'s handling of 'this' but perhaps intentionally so -- Rob" }, { token: "keyword.operator.io", regex: "<=|>=|=|:=|\\*|\\||\\|\\||\\+|-|/|&|&&|>|<|\\?|@|@@|\\b(?:and|or)\\b" }, { token: "constant.other.io", regex: "\\bGL[\\w_]+\\b" }, { token: "support.class.io", regex: "\\b[A-Z](?:\\w+)?\\b" }, { token: "support.function.io", regex: "\\b(?:clone|call|init|method|list|vector|block|\\w+(?=\\s*\\())\\b" }, { token: "support.function.open-gl.io", regex: "\\bgl(?:u|ut)?[A-Z]\\w+\\b" }, { token: "punctuation.definition.string.begin.io", regex: '"""', push: [{ token: "punctuation.definition.string.end.io", regex: '"""', next: "pop" }, { token: "constant.character.escape.io", regex: "\\\\." }, { defaultToken: "string.quoted.triple.io" }] }, { token: "punctuation.definition.string.begin.io", regex: '"', push: [{ token: "punctuation.definition.string.end.io", regex: '"', next: "pop" }, { token: "constant.character.escape.io", regex: "\\\\." }, { defaultToken: "string.quoted.double.io" }] }, { token: "constant.numeric.io", regex: "\\b(?:0(?:x|X)[0-9a-fA-F]*|(?:[0-9]+\\.?[0-9]*|\\.[0-9]+)(?:(?:e|E)(?:\\+|-)?[0-9]+)?)(?:L|l|UL|ul|u|U|F|f)?\\b" }, { token: "variable.other.global.io", regex: "Lobby\\b" }, { token: "constant.language.io", regex: "\\b(?:TRUE|true|FALSE|false|NULL|null|Null|Nil|nil|YES|NO)\\b" }] }, this.normalizeRules();
  };s.metaData = { fileTypes: ["io"], keyEquivalent: "^~I", name: "Io", scopeName: "source.io" }, r.inherits(s, i), t.IoHighlightRules = s;
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
}), define("ace/mode/io", ["require", "exports", "module", "ace/lib/oop", "ace/mode/text", "ace/tokenizer", "ace/mode/io_highlight_rules", "ace/mode/folding/cstyle"], function (e, t, n) {
  "use strict";
  var r = e("../lib/oop"),
      i = e("./text").Mode,
      s = e("../tokenizer").Tokenizer,
      o = e("./io_highlight_rules").IoHighlightRules,
      u = e("./folding/cstyle").FoldMode,
      a = function a() {
    this.HighlightRules = o, this.foldingRules = new u();
  };r.inherits(a, i), function () {
    this.lineCommentStart = "//", this.blockComment = { start: "/*", end: "*/" }, this.$id = "ace/mode/io";
  }.call(a.prototype), t.Mode = a;
});