"use strict";

ace.define("ace/mode/ruby_highlight_rules", ["require", "exports", "module", "ace/lib/oop", "ace/mode/text_highlight_rules"], function (e, t, n) {
  "use strict";
  var r = e("../lib/oop"),
      i = e("./text_highlight_rules").TextHighlightRules,
      s = t.constantOtherSymbol = { token: "constant.other.symbol.ruby", regex: "[:](?:[A-Za-z_]|[@$](?=[a-zA-Z0-9_]))[a-zA-Z0-9_]*[!=?]?" },
      o = t.qString = { token: "string", regex: "['](?:(?:\\\\.)|(?:[^'\\\\]))*?[']" },
      u = t.qqString = { token: "string", regex: '["](?:(?:\\\\.)|(?:[^"\\\\]))*?["]' },
      a = t.tString = { token: "string", regex: "[`](?:(?:\\\\.)|(?:[^'\\\\]))*?[`]" },
      f = t.constantNumericHex = { token: "constant.numeric", regex: "0[xX][0-9a-fA-F](?:[0-9a-fA-F]|_(?=[0-9a-fA-F]))*\\b" },
      l = t.constantNumericFloat = { token: "constant.numeric", regex: "[+-]?\\d(?:\\d|_(?=\\d))*(?:(?:\\.\\d(?:\\d|_(?=\\d))*)?(?:[eE][+-]?\\d+)?)?\\b" },
      c = function c() {
    var e = "abort|Array|assert|assert_equal|assert_not_equal|assert_same|assert_not_same|assert_nil|assert_not_nil|assert_match|assert_no_match|assert_in_delta|assert_throws|assert_raise|assert_nothing_raised|assert_instance_of|assert_kind_of|assert_respond_to|assert_operator|assert_send|assert_difference|assert_no_difference|assert_recognizes|assert_generates|assert_response|assert_redirected_to|assert_template|assert_select|assert_select_email|assert_select_rjs|assert_select_encoded|css_select|at_exit|attr|attr_writer|attr_reader|attr_accessor|attr_accessible|autoload|binding|block_given?|callcc|caller|catch|chomp|chomp!|chop|chop!|defined?|delete_via_redirect|eval|exec|exit|exit!|fail|Float|flunk|follow_redirect!|fork|form_for|form_tag|format|gets|global_variables|gsub|gsub!|get_via_redirect|host!|https?|https!|include|Integer|lambda|link_to|link_to_unless_current|link_to_function|link_to_remote|load|local_variables|loop|open|open_session|p|print|printf|proc|putc|puts|post_via_redirect|put_via_redirect|raise|rand|raw|readline|readlines|redirect?|request_via_redirect|require|scan|select|set_trace_func|sleep|split|sprintf|srand|String|stylesheet_link_tag|syscall|system|sub|sub!|test|throw|trace_var|trap|untrace_var|atan2|cos|exp|frexp|ldexp|log|log10|sin|sqrt|tan|render|javascript_include_tag|csrf_meta_tag|label_tag|text_field_tag|submit_tag|check_box_tag|content_tag|radio_button_tag|text_area_tag|password_field_tag|hidden_field_tag|fields_for|select_tag|options_for_select|options_from_collection_for_select|collection_select|time_zone_select|select_date|select_time|select_datetime|date_select|time_select|datetime_select|select_year|select_month|select_day|select_hour|select_minute|select_second|file_field_tag|file_field|respond_to|skip_before_filter|around_filter|after_filter|verify|protect_from_forgery|rescue_from|helper_method|redirect_to|before_filter|send_data|send_file|validates_presence_of|validates_uniqueness_of|validates_length_of|validates_format_of|validates_acceptance_of|validates_associated|validates_exclusion_of|validates_inclusion_of|validates_numericality_of|validates_with|validates_each|authenticate_or_request_with_http_basic|authenticate_or_request_with_http_digest|filter_parameter_logging|match|get|post|resources|redirect|scope|assert_routing|translate|localize|extract_locale_from_tld|caches_page|expire_page|caches_action|expire_action|cache|expire_fragment|expire_cache_for|observe|cache_sweeper|has_many|has_one|belongs_to|has_and_belongs_to_many",
        t = "alias|and|BEGIN|begin|break|case|class|def|defined|do|else|elsif|END|end|ensure|__FILE__|finally|for|gem|if|in|__LINE__|module|next|not|or|private|protected|public|redo|rescue|retry|return|super|then|undef|unless|until|when|while|yield",
        n = "true|TRUE|false|FALSE|nil|NIL|ARGF|ARGV|DATA|ENV|RUBY_PLATFORM|RUBY_RELEASE_DATE|RUBY_VERSION|STDERR|STDIN|STDOUT|TOPLEVEL_BINDING",
        r = "$DEBUG|$defout|$FILENAME|$LOAD_PATH|$SAFE|$stdin|$stdout|$stderr|$VERBOSE|$!|root_url|flash|session|cookies|params|request|response|logger|self",
        i = this.$keywords = this.createKeywordMapper({ keyword: t, "constant.language": n, "variable.language": r, "support.function": e, "invalid.deprecated": "debugger" }, "identifier");this.$rules = { start: [{ token: "comment", regex: "#.*$" }, { token: "comment", regex: "^=begin(?:$|\\s.*$)", next: "comment" }, { token: "string.regexp", regex: "[/](?:(?:\\[(?:\\\\]|[^\\]])+\\])|(?:\\\\/|[^\\]/]))*[/]\\w*\\s*(?=[).,;]|$)" }, [{ regex: "[{}]", onMatch: function onMatch(e, t, n) {
          this.next = e == "{" ? this.nextState : "";if (e == "{" && n.length) return n.unshift("start", t), "paren.lparen";if (e == "}" && n.length) {
            n.shift(), this.next = n.shift();if (this.next.indexOf("string") != -1) return "paren.end";
          }return e == "{" ? "paren.lparen" : "paren.rparen";
        }, nextState: "start" }, { token: "string.start", regex: /"/, push: [{ token: "constant.language.escape", regex: /\\(?:[nsrtvfbae'"\\]|c.|C-.|M-.(?:\\C-.)?|[0-7]{3}|x[\da-fA-F]{2}|u[\da-fA-F]{4})/ }, { token: "paren.start", regex: /\#{/, push: "start" }, { token: "string.end", regex: /"/, next: "pop" }, { defaultToken: "string" }] }, { token: "string.start", regex: /`/, push: [{ token: "constant.language.escape", regex: /\\(?:[nsrtvfbae'"\\]|c.|C-.|M-.(?:\\C-.)?|[0-7]{3}|x[\da-fA-F]{2}|u[\da-fA-F]{4})/ }, { token: "paren.start", regex: /\#{/, push: "start" }, { token: "string.end", regex: /`/, next: "pop" }, { defaultToken: "string" }] }, { token: "string.start", regex: /'/, push: [{ token: "constant.language.escape", regex: /\\['\\]/ }, { token: "string.end", regex: /'/, next: "pop" }, { defaultToken: "string" }] }], { token: "text", regex: "::" }, { token: "variable.instance", regex: "@{1,2}[a-zA-Z_\\d]+" }, { token: "support.class", regex: "[A-Z][a-zA-Z_\\d]+" }, s, f, l, { token: "constant.language.boolean", regex: "(?:true|false)\\b" }, { token: i, regex: "[a-zA-Z_$][a-zA-Z0-9_$]*\\b" }, { token: "punctuation.separator.key-value", regex: "=>" }, { stateName: "heredoc", onMatch: function onMatch(e, t, n) {
          var r = e[2] == "-" ? "indentedHeredoc" : "heredoc",
              i = e.split(this.splitRegex);return n.push(r, i[3]), [{ type: "constant", value: i[1] }, { type: "string", value: i[2] }, { type: "support.class", value: i[3] }, { type: "string", value: i[4] }];
        }, regex: "(<<-?)(['\"`]?)([\\w]+)(['\"`]?)", rules: { heredoc: [{ onMatch: function onMatch(e, t, n) {
              return e === n[1] ? (n.shift(), n.shift(), this.next = n[0] || "start", "support.class") : (this.next = "", "string");
            }, regex: ".*$", next: "start" }], indentedHeredoc: [{ token: "string", regex: "^ +" }, { onMatch: function onMatch(e, t, n) {
              return e === n[1] ? (n.shift(), n.shift(), this.next = n[0] || "start", "support.class") : (this.next = "", "string");
            }, regex: ".*$", next: "start" }] } }, { regex: "$", token: "empty", next: function next(e, t) {
          return t[0] === "heredoc" || t[0] === "indentedHeredoc" ? t[0] : e;
        } }, { token: "keyword.operator", regex: "!|\\$|%|&|\\*|\\-\\-|\\-|\\+\\+|\\+|~|===|==|=|!=|!==|<=|>=|<<=|>>=|>>>=|<>|<|>|!|&&|\\|\\||\\?\\:|\\*=|%=|\\+=|\\-=|&=|\\^=|\\b(?:in|instanceof|new|delete|typeof|void)" }, { token: "paren.lparen", regex: "[[({]" }, { token: "paren.rparen", regex: "[\\])}]" }, { token: "text", regex: "\\s+" }], comment: [{ token: "comment", regex: "^=end(?:$|\\s.*$)", next: "start" }, { token: "comment", regex: ".+" }] }, this.normalizeRules();
  };r.inherits(c, i), t.RubyHighlightRules = c;
}), ace.define("ace/mode/matching_brace_outdent", ["require", "exports", "module", "ace/range"], function (e, t, n) {
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
}), ace.define("ace/mode/behaviour/cstyle", ["require", "exports", "module", "ace/lib/oop", "ace/mode/behaviour", "ace/token_iterator", "ace/lib/lang"], function (e, t, n) {
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
}), ace.define("ace/mode/ruby", ["require", "exports", "module", "ace/lib/oop", "ace/mode/text", "ace/mode/ruby_highlight_rules", "ace/mode/matching_brace_outdent", "ace/range", "ace/mode/behaviour/cstyle", "ace/mode/folding/coffee"], function (e, t, n) {
  "use strict";
  var r = e("../lib/oop"),
      i = e("./text").Mode,
      s = e("./ruby_highlight_rules").RubyHighlightRules,
      o = e("./matching_brace_outdent").MatchingBraceOutdent,
      u = e("../range").Range,
      a = e("./behaviour/cstyle").CstyleBehaviour,
      f = e("./folding/coffee").FoldMode,
      l = function l() {
    this.HighlightRules = s, this.$outdent = new o(), this.$behaviour = new a(), this.foldingRules = new f();
  };r.inherits(l, i), function () {
    this.lineCommentStart = "#", this.getNextLineIndent = function (e, t, n) {
      var r = this.$getIndent(t),
          i = this.getTokenizer().getLineTokens(t, e),
          s = i.tokens;if (s.length && s[s.length - 1].type == "comment") return r;if (e == "start") {
        var o = t.match(/^.*[\{\(\[]\s*$/),
            u = t.match(/^\s*(class|def|module)\s.*$/),
            a = t.match(/.*do(\s*|\s+\|.*\|\s*)$/),
            f = t.match(/^\s*(if|else)\s*/);if (o || u || a || f) r += n;
      }return r;
    }, this.checkOutdent = function (e, t, n) {
      return (/^\s+(end|else)$/.test(t + n) || this.$outdent.checkOutdent(t, n)
      );
    }, this.autoOutdent = function (e, t, n) {
      var r = t.getLine(n);if (/}/.test(r)) return this.$outdent.autoOutdent(t, n);var i = this.$getIndent(r),
          s = t.getLine(n - 1),
          o = this.$getIndent(s),
          a = t.getTabString();o.length <= i.length && i.slice(-a.length) == a && t.remove(new u(n, i.length - a.length, n, i.length));
    }, this.$id = "ace/mode/ruby";
  }.call(l.prototype), t.Mode = l;
});