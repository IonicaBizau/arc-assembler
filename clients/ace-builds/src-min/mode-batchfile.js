"use strict";

define("ace/mode/batchfile_highlight_rules", ["require", "exports", "module", "ace/lib/oop", "ace/mode/text_highlight_rules"], function (e, t, n) {
  "use strict";
  var r = e("../lib/oop"),
      i = e("./text_highlight_rules").TextHighlightRules,
      s = function s() {
    this.$rules = { start: [{ token: "keyword.command.dosbatch", regex: "\\b(?:append|assoc|at|attrib|break|cacls|cd|chcp|chdir|chkdsk|chkntfs|cls|cmd|color|comp|compact|convert|copy|date|del|dir|diskcomp|diskcopy|doskey|echo|endlocal|erase|fc|find|findstr|format|ftype|graftabl|help|keyb|label|md|mkdir|mode|more|move|path|pause|popd|print|prompt|pushd|rd|recover|ren|rename|replace|restore|rmdir|set|setlocal|shift|sort|start|subst|time|title|tree|type|ver|verify|vol|xcopy)\\b", caseInsensitive: !0 }, { token: "keyword.control.statement.dosbatch", regex: "\\b(?:goto|call|exit)\\b", caseInsensitive: !0 }, { token: "keyword.control.conditional.if.dosbatch", regex: "\\bif\\s+not\\s+(?:exist|defined|errorlevel|cmdextversion)\\b", caseInsensitive: !0 }, { token: "keyword.control.conditional.dosbatch", regex: "\\b(?:if|else)\\b", caseInsensitive: !0 }, { token: "keyword.control.repeat.dosbatch", regex: "\\bfor\\b", caseInsensitive: !0 }, { token: "keyword.operator.dosbatch", regex: "\\b(?:EQU|NEQ|LSS|LEQ|GTR|GEQ)\\b" }, { token: ["doc.comment", "comment"], regex: "(?:^|\\b)(rem)($|\\s.*$)", caseInsensitive: !0 }, { token: "comment.line.colons.dosbatch", regex: "::.*$" }, { include: "variable" }, { token: "punctuation.definition.string.begin.shell", regex: '"', push: [{ token: "punctuation.definition.string.end.shell", regex: '"', next: "pop" }, { include: "variable" }, { defaultToken: "string.quoted.double.dosbatch" }] }, { token: "keyword.operator.pipe.dosbatch", regex: "[|]" }, { token: "keyword.operator.redirect.shell", regex: "&>|\\d*>&\\d*|\\d*(?:>>|>|<)|\\d*<&|\\d*<>" }], variable: [{ token: "constant.numeric", regex: "%%\\w+|%[*\\d]|%\\w+%" }, { token: "constant.numeric", regex: "%~\\d+" }, { token: ["markup.list", "constant.other", "markup.list"], regex: "(%)(\\w+)(%?)" }] }, this.normalizeRules();
  };s.metaData = { name: "Batch File", scopeName: "source.dosbatch", fileTypes: ["bat"] }, r.inherits(s, i), t.BatchFileHighlightRules = s;
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
}), define("ace/mode/batchfile", ["require", "exports", "module", "ace/lib/oop", "ace/mode/text", "ace/mode/batchfile_highlight_rules", "ace/mode/folding/cstyle"], function (e, t, n) {
  "use strict";
  var r = e("../lib/oop"),
      i = e("./text").Mode,
      s = e("./batchfile_highlight_rules").BatchFileHighlightRules,
      o = e("./folding/cstyle").FoldMode,
      u = function u() {
    this.HighlightRules = s, this.foldingRules = new o();
  };r.inherits(u, i), function () {
    this.lineCommentStart = "::", this.blockComment = "", this.$id = "ace/mode/batchfile";
  }.call(u.prototype), t.Mode = u;
});