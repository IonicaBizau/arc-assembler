"use strict";

define("ace/mode/gitignore_highlight_rules", ["require", "exports", "module", "ace/lib/oop", "ace/mode/text_highlight_rules"], function (e, t, n) {
  "use strict";
  var r = e("../lib/oop"),
      i = e("./text_highlight_rules").TextHighlightRules,
      s = function s() {
    this.$rules = { start: [{ token: "comment", regex: /^\s*#.*$/ }, { token: "keyword", regex: /^\s*!.*$/ }] }, this.normalizeRules();
  };s.metaData = { fileTypes: ["gitignore"], name: "Gitignore" }, r.inherits(s, i), t.GitignoreHighlightRules = s;
}), define("ace/mode/gitignore", ["require", "exports", "module", "ace/lib/oop", "ace/mode/text", "ace/mode/gitignore_highlight_rules"], function (e, t, n) {
  "use strict";
  var r = e("../lib/oop"),
      i = e("./text").Mode,
      s = e("./gitignore_highlight_rules").GitignoreHighlightRules,
      o = function o() {
    this.HighlightRules = s;
  };r.inherits(o, i), function () {
    this.lineCommentStart = "#", this.$id = "ace/mode/gitignore";
  }.call(o.prototype), t.Mode = o;
});