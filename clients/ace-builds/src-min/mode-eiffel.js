"use strict";

define("ace/mode/eiffel_highlight_rules", ["require", "exports", "module", "ace/lib/oop", "ace/mode/text_highlight_rules"], function (e, t, n) {
  "use strict";
  var r = e("../lib/oop"),
      i = e("./text_highlight_rules").TextHighlightRules,
      s = function s() {
    var e = "across|agent|alias|all|attached|as|assign|attribute|check|class|convert|create|debug|deferred|detachable|do|else|elseif|end|ensure|expanded|export|external|feature|from|frozen|if|inherit|inspect|invariant|like|local|loop|not|note|obsolete|old|once|Precursor|redefine|rename|require|rescue|retry|select|separate|some|then|undefine|until|variant|when",
        t = "and|implies|or|xor",
        n = "Void",
        r = "True|False",
        i = "Current|Result",
        s = this.createKeywordMapper({ "constant.language": n, "constant.language.boolean": r, "variable.language": i, "keyword.operator": t, keyword: e }, "identifier", !0);this.$rules = { start: [{ token: "comment.line.double-dash", regex: /--.*$/ }, { token: "string.quoted.double", regex: /"(?:%"|[^%])*?"/ }, { token: "string.quoted.other", regex: /"\[/, next: "aligned_verbatim_string" }, { token: "string.quoted.other", regex: /"\{/, next: "non-aligned_verbatim_string" }, { token: "constant.character", regex: /'(?:%%|%T|%R|%N|%F|%'|[^%])'/ }, { token: "constant.numeric", regex: /(?:\d(?:_?\d)*\.|\.\d)(?:\d*[eE][+-]?\d+)?\b/ }, { token: "constant.numeric", regex: /\d(?:_?\d)*\b/ }, { token: "constant.numeric", regex: /0[xX][a-fA-F\d](?:_?[a-fA-F\d])*\b/ }, { token: "constant.numeric", regex: /0[cC][0-7](?:_?[0-7])*\b/ }, { token: "constant.numeric", regex: /0[bB][01](?:_?[01])*\b/ }, { token: "keyword.operator", regex: /\+|\-|\*|\/|\\\\|\/\/|\^|~|\/~|<|>|<=|>=|\/=|=|:=|\|\.\.\||\.\./ }, { token: "keyword.operator", regex: /\.|:|,|;\b/ }, { token: function token(e) {
          var t = s(e);return t === "identifier" && e === e.toUpperCase() && (t = "entity.name.type"), t;
        }, regex: /[a-zA-Z][a-zA-Z\d_]*\b/ }, { token: "paren.lparen", regex: /[\[({]/ }, { token: "paren.rparen", regex: /[\])}]/ }, { token: "text", regex: /\s+/ }], aligned_verbatim_string: [{ token: "string", regex: /]"/, next: "start" }, { token: "string", regex: /[^(?:\]")]+/ }], "non-aligned_verbatim_string": [{ token: "string.quoted.other", regex: /}"/, next: "start" }, { token: "string.quoted.other", regex: /[^(?:\}")]+/ }] };
  };r.inherits(s, i), t.EiffelHighlightRules = s;
}), define("ace/mode/eiffel", ["require", "exports", "module", "ace/lib/oop", "ace/mode/text", "ace/mode/eiffel_highlight_rules", "ace/range"], function (e, t, n) {
  "use strict";
  var r = e("../lib/oop"),
      i = e("./text").Mode,
      s = e("./eiffel_highlight_rules").EiffelHighlightRules,
      o = e("../range").Range,
      u = function u() {
    this.HighlightRules = s;
  };r.inherits(u, i), function () {
    this.lineCommentStart = "--", this.$id = "ace/mode/eiffel";
  }.call(u.prototype), t.Mode = u;
});