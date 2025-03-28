"use strict";

ace.define("ace/keyboard/vim/registers", ["require", "exports", "module"], function (e, t, n) {
  "never use strict";
  n.exports = { _default: { text: "", isLine: !1 } };
}), ace.define("ace/keyboard/vim/maps/util", ["require", "exports", "module", "ace/keyboard/vim/registers", "ace/lib/dom"], function (e, t, n) {
  var r = e("../registers"),
      i = e("../../../lib/dom");i.importCssString(".insert-mode .ace_cursor{    border-left: 2px solid #333333;}.ace_dark.insert-mode .ace_cursor{    border-left: 2px solid #eeeeee;}.normal-mode .ace_cursor{    border: 0!important;    background-color: red;    opacity: 0.5;}", "vimMode"), n.exports = { onVisualMode: !1, onVisualLineMode: !1, currentMode: "normal", noMode: function noMode(e) {
      e.unsetStyle("insert-mode"), e.unsetStyle("normal-mode"), e.commands.recording && e.commands.toggleRecording(e), e.setOverwrite(!1);
    }, insertMode: function insertMode(e) {
      this.currentMode = "insert", e.setStyle("insert-mode"), e.unsetStyle("normal-mode"), e.setOverwrite(!1), e.keyBinding.$data.buffer = "", e.keyBinding.$data.vimState = "insertMode", this.onVisualMode = !1, this.onVisualLineMode = !1, this.onInsertReplaySequence ? (e.commands.macro = this.onInsertReplaySequence, e.commands.replay(e), this.onInsertReplaySequence = null, this.normalMode(e)) : (e._emit("changeStatus"), e.commands.recording || e.commands.toggleRecording(e));
    }, normalMode: function normalMode(e) {
      this.currentMode = "normal", e.unsetStyle("insert-mode"), e.setStyle("normal-mode"), e.clearSelection();var t;return e.getOverwrite() || (t = e.getCursorPosition(), t.column > 0 && e.navigateLeft()), e.setOverwrite(!0), e.keyBinding.$data.buffer = "", e.keyBinding.$data.vimState = "start", this.onVisualMode = !1, this.onVisualLineMode = !1, e._emit("changeStatus"), e.commands.recording ? (e.commands.toggleRecording(e), e.commands.macro) : [];
    }, visualMode: function visualMode(e, t) {
      if (this.onVisualLineMode && t || this.onVisualMode && !t) {
        this.normalMode(e);return;
      }e.setStyle("insert-mode"), e.unsetStyle("normal-mode"), e._emit("changeStatus"), t ? this.onVisualLineMode = !0 : (this.onVisualMode = !0, this.onVisualLineMode = !1);
    }, getRightNthChar: function getRightNthChar(e, t, n, r) {
      var i = e.getSession().getLine(t.row),
          s = i.substr(t.column + 1).split(n);return r < s.length ? s.slice(0, r).join(n).length : null;
    }, getLeftNthChar: function getLeftNthChar(e, t, n, r) {
      var i = e.getSession().getLine(t.row),
          s = i.substr(0, t.column).split(n);return r < s.length ? s.slice(-1 * r).join(n).length : null;
    }, toRealChar: function toRealChar(e) {
      return e.length === 1 ? e : /^shift-./.test(e) ? e[e.length - 1].toUpperCase() : "";
    }, copyLine: function copyLine(e) {
      var t = e.getCursorPosition();e.selection.moveTo(t.row, t.column), e.selection.selectLine(), r._default.isLine = !0, r._default.text = e.getCopyText().replace(/\n$/, ""), e.selection.moveTo(t.row, t.column);
    } };
}), ace.define("ace/keyboard/vim/maps/motions", ["require", "exports", "module", "ace/keyboard/vim/maps/util", "ace/search", "ace/range"], function (e, t, n) {
  "use strict";
  function s(e) {
    if (typeof e == "function") {
      var t = e;e = this;
    } else var t = e.getPos;return e.nav = function (e, n, r, i) {
      var s = t(e, n, r, i, !1);if (!s) return;e.selection.moveTo(s.row, s.column);
    }, e.sel = function (e, n, r, i) {
      var s = t(e, n, r, i, !0);if (!s) return;e.selection.selectTo(s.row, s.column);
    }, e;
  }function h(e, t, n) {
    return c.$options.needle = t, c.$options.backwards = n == -1, c.find(e.session);
  }var r = e("./util"),
      i = function i(e, t) {
    var n = e.renderer.getScrollTopRow(),
        r = e.getCursorPosition().row,
        i = r - n;t && t.call(e), e.renderer.scrollToRow(e.getCursorPosition().row - i);
  },
      o = /[\s.\/\\()\"'-:,.;<>~!@#$%^&*|+=\[\]{}`~?]/,
      u = /[.\/\\()\"'-:,.;<>~!@#$%^&*|+=\[\]{}`~?]/,
      a = /\s/,
      f = function f(e, t) {
    var n = e.selection;this.range = n.getRange(), t = t || n.selectionLead, this.row = t.row, this.col = t.column;var r = e.session.getLine(this.row),
        i = e.session.getLength();this.ch = r[this.col] || "\n", this.skippedLines = 0, this.next = function () {
      return this.ch = r[++this.col] || this.handleNewLine(1), this.ch;
    }, this.prev = function () {
      return this.ch = r[--this.col] || this.handleNewLine(-1), this.ch;
    }, this.peek = function (t) {
      var n = r[this.col + t];return n ? n : t == -1 ? "\n" : this.col == r.length - 1 ? "\n" : e.session.getLine(this.row + 1)[0] || "\n";
    }, this.handleNewLine = function (t) {
      if (t == 1) return this.col == r.length ? "\n" : this.row == i - 1 ? "" : (this.col = 0, this.row++, r = e.session.getLine(this.row), this.skippedLines++, r[0] || "\n");if (t == -1) return this.row === 0 ? "" : (this.row--, r = e.session.getLine(this.row), this.col = r.length, this.skippedLines--, "\n");
    }, this.debug = function () {
      console.log(r.substring(0, this.col) + "|" + this.ch + "'" + this.col + "'" + r.substr(this.col + 1));
    };
  },
      l = e("../../../search").Search,
      c = new l(),
      p = e("../../../range").Range,
      d = {};n.exports = { w: new s(function (e) {
      var t = new f(e);if (t.ch && u.test(t.ch)) while (t.ch && u.test(t.ch)) {
        t.next();
      } else while (t.ch && !o.test(t.ch)) {
        t.next();
      }while (t.ch && a.test(t.ch) && t.skippedLines < 2) {
        t.next();
      }return t.skippedLines == 2 && t.prev(), { column: t.col, row: t.row };
    }), W: new s(function (e) {
      var t = new f(e);while (t.ch && (!a.test(t.ch) || !!a.test(t.peek(1))) && t.skippedLines < 2) {
        t.next();
      }return t.skippedLines == 2 ? t.prev() : t.next(), { column: t.col, row: t.row };
    }), b: new s(function (e) {
      var t = new f(e);t.prev();while (t.ch && a.test(t.ch) && t.skippedLines > -2) {
        t.prev();
      }if (t.ch && u.test(t.ch)) while (t.ch && u.test(t.ch)) {
        t.prev();
      } else while (t.ch && !o.test(t.ch)) {
        t.prev();
      }return t.ch && t.next(), { column: t.col, row: t.row };
    }), B: new s(function (e) {
      var t = new f(e);t.prev();while (t.ch && (!!a.test(t.ch) || !a.test(t.peek(-1))) && t.skippedLines > -2) {
        t.prev();
      }return t.skippedLines == -2 && t.next(), { column: t.col, row: t.row };
    }), e: new s(function (e) {
      var t = new f(e);t.next();while (t.ch && a.test(t.ch)) {
        t.next();
      }if (t.ch && u.test(t.ch)) while (t.ch && u.test(t.ch)) {
        t.next();
      } else while (t.ch && !o.test(t.ch)) {
        t.next();
      }return t.ch && t.prev(), { column: t.col, row: t.row };
    }), E: new s(function (e) {
      var t = new f(e);t.next();while (t.ch && (!!a.test(t.ch) || !a.test(t.peek(1)))) {
        t.next();
      }return { column: t.col, row: t.row };
    }), l: { nav: function nav(e) {
        var t = e.getCursorPosition(),
            n = t.column,
            r = e.session.getLine(t.row).length;r && n !== r && e.navigateRight();
      }, sel: function sel(e) {
        var t = e.getCursorPosition(),
            n = t.column,
            r = e.session.getLine(t.row).length;r && n !== r && e.selection.selectRight();
      } }, h: { nav: function nav(e) {
        var t = e.getCursorPosition();t.column > 0 && e.navigateLeft();
      }, sel: function sel(e) {
        var t = e.getCursorPosition();t.column > 0 && e.selection.selectLeft();
      } }, H: { nav: function nav(e) {
        var t = e.renderer.getScrollTopRow();e.moveCursorTo(t);
      }, sel: function sel(e) {
        var t = e.renderer.getScrollTopRow();e.selection.selectTo(t);
      } }, M: { nav: function nav(e) {
        var t = e.renderer.getScrollTopRow(),
            n = e.renderer.getScrollBottomRow(),
            r = t + (n - t) / 2;e.moveCursorTo(r);
      }, sel: function sel(e) {
        var t = e.renderer.getScrollTopRow(),
            n = e.renderer.getScrollBottomRow(),
            r = t + (n - t) / 2;e.selection.selectTo(r);
      } }, L: { nav: function nav(e) {
        var t = e.renderer.getScrollBottomRow();e.moveCursorTo(t);
      }, sel: function sel(e) {
        var t = e.renderer.getScrollBottomRow();e.selection.selectTo(t);
      } }, k: { nav: function nav(e) {
        e.navigateUp();
      }, sel: function sel(e) {
        e.selection.selectUp();
      } }, j: { nav: function nav(e) {
        e.navigateDown();
      }, sel: function sel(e) {
        e.selection.selectDown();
      } }, i: { param: !0, sel: function sel(e, t, n, r) {
        switch (r) {case "w":
            e.selection.selectWord();break;case "W":
            e.selection.selectAWord();break;case "(":case "{":case "[":
            var i = e.getCursorPosition(),
                s = e.session.$findClosingBracket(r, i, /paren/);if (!s) return;var o = e.session.$findOpeningBracket(e.session.$brackets[r], i, /paren/);if (!o) return;o.column++, e.selection.setSelectionRange(p.fromPoints(o, s));break;case "'":case '"':case "/":
            var s = h(e, r, 1);if (!s) return;var o = h(e, r, -1);if (!o) return;e.selection.setSelectionRange(p.fromPoints(o.end, s.start));}
      } }, a: { param: !0, sel: function sel(e, t, n, r) {
        switch (r) {case "w":
            e.selection.selectAWord();break;case "W":
            e.selection.selectAWord();break;case ")":case "}":case "]":
            r = e.session.$brackets[r];case "(":case "{":case "[":
            var i = e.getCursorPosition(),
                s = e.session.$findClosingBracket(r, i, /paren/);if (!s) return;var o = e.session.$findOpeningBracket(e.session.$brackets[r], i, /paren/);if (!o) return;s.column++, e.selection.setSelectionRange(p.fromPoints(o, s));break;case "'":case '"':case "/":
            var s = h(e, r, 1);if (!s) return;var o = h(e, r, -1);if (!o) return;s.column++, e.selection.setSelectionRange(p.fromPoints(o.start, s.end));}
      } }, f: new s({ param: !0, handlesCount: !0, getPos: function getPos(e, t, n, i, s, o) {
        i == "space" && (i = " "), o || (d = { ch: "f", param: i });var u = e.getCursorPosition(),
            a = r.getRightNthChar(e, u, i, n || 1);if (typeof a == "number") return u.column += a + (s ? 2 : 1), u;
      } }), F: new s({ param: !0, handlesCount: !0, getPos: function getPos(e, t, n, i, s, o) {
        i == "space" && (i = " "), o || (d = { ch: "F", param: i });var u = e.getCursorPosition(),
            a = r.getLeftNthChar(e, u, i, n || 1);if (typeof a == "number") return u.column -= a + 1, u;
      } }), t: new s({ param: !0, handlesCount: !0, getPos: function getPos(e, t, n, i, s, o) {
        i == "space" && (i = " "), o || (d = { ch: "t", param: i });var u = e.getCursorPosition(),
            a = r.getRightNthChar(e, u, i, n || 1);o && a == 0 && !(n > 1) && (a = r.getRightNthChar(e, u, i, 2));if (typeof a == "number") return u.column += a + (s ? 1 : 0), u;
      } }), T: new s({ param: !0, handlesCount: !0, getPos: function getPos(e, t, n, i, s, o) {
        i == "space" && (i = " "), o || (d = { ch: "T", param: i });var u = e.getCursorPosition(),
            a = r.getLeftNthChar(e, u, i, n || 1);o && a === 0 && !(n > 1) && (a = r.getLeftNthChar(e, u, i, 2));if (typeof a == "number") return u.column -= a, u;
      } }), ";": new s({ handlesCount: !0, getPos: function getPos(e, t, r, i, s) {
        var o = d.ch;if (!o) return;return n.exports[o].getPos(e, t, r, d.param, s, !0);
      } }), ",": new s({ handlesCount: !0, getPos: function getPos(e, t, r, i, s) {
        var o = d.ch;if (!o) return;var u = o.toUpperCase();return o = o === u ? o.toLowerCase() : u, n.exports[o].getPos(e, t, r, d.param, s, !0);
      } }), "^": { nav: function nav(e) {
        e.navigateLineStart();
      }, sel: function sel(e) {
        e.selection.selectLineStart();
      } }, $: { handlesCount: !0, nav: function nav(e, t, n, r) {
        n > 1 && e.navigateDown(n - 1), e.navigateLineEnd();
      }, sel: function sel(e, t, n, r) {
        n > 1 && e.selection.moveCursorBy(n - 1, 0), e.selection.selectLineEnd();
      } }, 0: new s(function (e) {
      return { row: e.selection.lead.row, column: 0 };
    }), G: { nav: function nav(e, t, n, r) {
        !n && n !== 0 && (n = e.session.getLength()), e.gotoLine(n);
      }, sel: function sel(e, t, n, r) {
        !n && n !== 0 && (n = e.session.getLength()), e.selection.selectTo(n, 0);
      } }, g: { param: !0, nav: function nav(e, t, n, r) {
        switch (r) {case "m":
            console.log("Middle line");break;case "e":
            console.log("End of prev word");break;case "g":
            e.gotoLine(n || 0);case "u":
            e.gotoLine(n || 0);case "U":
            e.gotoLine(n || 0);}
      }, sel: function sel(e, t, n, r) {
        switch (r) {case "m":
            console.log("Middle line");break;case "e":
            console.log("End of prev word");break;case "g":
            e.selection.selectTo(n || 0, 0);}
      } }, o: { nav: function nav(e, t, n, i) {
        n = n || 1;var s = "";while (0 < n--) {
          s += "\n";
        }s.length && (e.navigateLineEnd(), e.insert(s), r.insertMode(e));
      } }, O: { nav: function nav(e, t, n, i) {
        var s = e.getCursorPosition().row;n = n || 1;var o = "";while (0 < n--) {
          o += "\n";
        }o.length && (s > 0 ? (e.navigateUp(), e.navigateLineEnd(), e.insert(o)) : (e.session.insert({ row: 0, column: 0 }, o), e.navigateUp()), r.insertMode(e));
      } }, "%": new s(function (e) {
      var t = /[\[\]{}()]/g,
          n = e.getCursorPosition(),
          r = e.session.getLine(n.row)[n.column];if (!t.test(r)) {
        var i = h(e, t);if (!i) return;n = i.start;
      }var s = e.session.findMatchingBracket({ row: n.row, column: n.column + 1 });return s;
    }), "{": new s(function (e) {
      var t = e.session,
          n = t.selection.lead.row;while (n > 0 && !/\S/.test(t.getLine(n))) {
        n--;
      }while (/\S/.test(t.getLine(n))) {
        n--;
      }return { column: 0, row: n };
    }), "}": new s(function (e) {
      var t = e.session,
          n = t.getLength(),
          r = t.selection.lead.row;while (r < n && !/\S/.test(t.getLine(r))) {
        r++;
      }while (/\S/.test(t.getLine(r))) {
        r++;
      }return { column: 0, row: r };
    }), "ctrl-d": { nav: function nav(e, t, n, r) {
        e.selection.clearSelection(), i(e, e.gotoPageDown);
      }, sel: function sel(e, t, n, r) {
        i(e, e.selectPageDown);
      } }, "ctrl-u": { nav: function nav(e, t, n, r) {
        e.selection.clearSelection(), i(e, e.gotoPageUp);
      }, sel: function sel(e, t, n, r) {
        i(e, e.selectPageUp);
      } }, "`": new s({ param: !0, handlesCount: !0, getPos: function getPos(e, t, n, r, i) {
        var s = e.session,
            o = s.vimMarkers && s.vimMarkers[r];if (o) return o.getPosition();
      } }), "'": new s({ param: !0, handlesCount: !0, getPos: function getPos(e, t, n, r, i) {
        var s = e.session,
            o = s.vimMarkers && s.vimMarkers[r];if (o) {
          var u = o.getPosition(),
              a = e.session.getLine(u.row);return u.column = a.search(/\S/), u.column == -1 && (u.column = a.length), u;
        }
      }, isLine: !0 }) }, n.exports.backspace = n.exports.left = n.exports.h, n.exports.space = n.exports["return"] = n.exports.right = n.exports.l, n.exports.up = n.exports.k, n.exports.down = n.exports.j, n.exports.pagedown = n.exports["ctrl-d"], n.exports.pageup = n.exports["ctrl-u"], n.exports.home = n.exports[0], n.exports.end = n.exports.$;
}), ace.define("ace/keyboard/vim/maps/operators", ["require", "exports", "module", "ace/keyboard/vim/maps/util", "ace/keyboard/vim/registers", "ace/range"], function (e, t, n) {
  "use strict";
  var r = e("./util"),
      i = e("../registers"),
      s = e("../../../range").Range;n.exports = { d: { selFn: function selFn(e, t, n, s) {
        i._default.text = e.getCopyText(), i._default.isLine = r.onVisualLineMode, r.onVisualLineMode ? e.removeLines() : e.session.remove(t), r.normalMode(e);
      }, fn: function fn(e, t, n, r) {
        n = n || 1;switch (r) {case "d":
            i._default.text = "", i._default.isLine = !0;for (var s = 0; s < n; s++) {
              e.selection.selectLine(), i._default.text += e.getCopyText();var o = e.getSelectionRange();if (!o.isMultiLine()) {
                var u = o.start.row - 1,
                    a = e.session.getLine(u).length;o.setStart(u, a), e.session.remove(o), e.selection.clearSelection();break;
              }e.session.remove(o), e.selection.clearSelection();
            }i._default.text = i._default.text.replace(/\n$/, "");break;default:
            t && (e.selection.setSelectionRange(t), i._default.text = e.getCopyText(), i._default.isLine = !1, e.session.remove(t), e.selection.clearSelection());}
      } }, c: { selFn: function selFn(e, t, n, i) {
        e.session.remove(t), r.insertMode(e);
      }, fn: function fn(e, t, n, i) {
        n = n || 1;switch (i) {case "c":
            e.$blockScrolling++, e.selection.$moveSelection(function () {
              e.selection.moveCursorBy(n - 1, 0);
            });var o = e.$getSelectedRows();t = new s(o.first, 0, o.last, Infinity), e.session.remove(t), e.$blockScrolling--, r.insertMode(e);break;default:
            t && (e.session.remove(t), r.insertMode(e));}
      } }, y: { selFn: function selFn(e, t, n, s) {
        i._default.text = e.getCopyText(), i._default.isLine = r.onVisualLineMode, e.selection.clearSelection(), r.normalMode(e);
      }, fn: function fn(e, t, n, r) {
        n = n || 1, r && r.isLine && (r = "y");switch (r) {case "y":
            var s = e.getCursorPosition();e.selection.selectLine();for (var o = 0; o < n - 1; o++) {
              e.selection.moveCursorDown();
            }i._default.text = e.getCopyText().replace(/\n$/, ""), e.selection.clearSelection(), i._default.isLine = !0, e.moveCursorToPosition(s);break;default:
            if (t) {
              var s = e.getCursorPosition();e.selection.setSelectionRange(t), i._default.text = e.getCopyText(), i._default.isLine = !1, e.selection.clearSelection(), e.moveCursorTo(s.row, s.column);
            }}
      } }, ">": { selFn: function selFn(e, t, n, i) {
        n = n || 1;for (var s = 0; s < n; s++) {
          e.indent();
        }r.normalMode(e);
      }, fn: function fn(e, t, n, r) {
        n = parseInt(n || 1, 10);switch (r) {case ">":
            var i = e.getCursorPosition();e.selection.selectLine();for (var s = 0; s < n - 1; s++) {
              e.selection.moveCursorDown();
            }e.indent(), e.selection.clearSelection(), e.moveCursorToPosition(i), e.navigateLineEnd(), e.navigateLineStart();}
      } }, "<": { selFn: function selFn(e, t, n, i) {
        n = n || 1;for (var s = 0; s < n; s++) {
          e.blockOutdent();
        }r.normalMode(e);
      }, fn: function fn(e, t, n, r) {
        n = n || 1;switch (r) {case "<":
            var i = e.getCursorPosition();e.selection.selectLine();for (var s = 0; s < n - 1; s++) {
              e.selection.moveCursorDown();
            }e.blockOutdent(), e.selection.clearSelection(), e.moveCursorToPosition(i), e.navigateLineEnd(), e.navigateLineStart();}
      } } };
}), "use strict", ace.define("ace/keyboard/vim/maps/aliases", ["require", "exports", "module"], function (e, t, n) {
  n.exports = { x: { operator: { ch: "d", count: 1 }, motion: { ch: "l", count: 1 } }, X: { operator: { ch: "d", count: 1 }, motion: { ch: "h", count: 1 } }, D: { operator: { ch: "d", count: 1 }, motion: { ch: "$", count: 1 } }, C: { operator: { ch: "c", count: 1 }, motion: { ch: "$", count: 1 } }, s: { operator: { ch: "c", count: 1 }, motion: { ch: "l", count: 1 } }, S: { operator: { ch: "c", count: 1 }, param: "c" } };
}), ace.define("ace/keyboard/vim/commands", ["require", "exports", "module", "ace/lib/lang", "ace/keyboard/vim/maps/util", "ace/keyboard/vim/maps/motions", "ace/keyboard/vim/maps/operators", "ace/keyboard/vim/maps/aliases", "ace/keyboard/vim/registers"], function (e, t, n) {
  "never use strict";
  function y(e) {
    g.previous = { action: { action: { fn: e } } };
  }var r = e("../../lib/lang"),
      i = e("./maps/util"),
      s = e("./maps/motions"),
      o = e("./maps/operators"),
      u = e("./maps/aliases"),
      a = e("./registers"),
      f = 1,
      l = 2,
      c = 3,
      h = 4,
      p = 8,
      d = function d(t, n, r) {
    while (0 < n--) {
      t.apply(this, r);
    }
  },
      v = function v(e) {
    var t = e.renderer,
        n = t.$cursorLayer.getPixelPosition(),
        r = n.top,
        i = p * t.layerConfig.lineHeight;2 * i > t.$size.scrollerHeight && (i = t.$size.scrollerHeight / 2), t.scrollTop > r - i && t.session.setScrollTop(r - i), t.scrollTop + t.$size.scrollerHeight < r + i + t.lineHeight && t.session.setScrollTop(r + i + t.lineHeight - t.$size.scrollerHeight);
  },
      m = t.actions = { z: { param: !0, fn: function fn(e, t, n, r) {
        switch (r) {case "z":
            e.renderer.alignCursor(null, .5);break;case "t":
            e.renderer.alignCursor(null, 0);break;case "b":
            e.renderer.alignCursor(null, 1);break;case "c":
            e.session.onFoldWidgetClick(t.start.row, { domEvent: { target: {} } });break;case "o":
            e.session.onFoldWidgetClick(t.start.row, { domEvent: { target: {} } });break;case "C":
            e.session.foldAll();break;case "O":
            e.session.unfold();}
      } }, r: { param: !0, fn: function fn(e, t, n, r) {
        r && r.length && (r.length > 1 && (r = r == "return" ? "\n" : r == "tab" ? "	" : r), d(function () {
          e.insert(r);
        }, n || 1), e.navigateLeft());
      } }, R: { fn: function fn(e, t, n, r) {
        i.insertMode(e), e.setOverwrite(!0);
      } }, "~": { fn: function fn(e, t, n) {
        d(function () {
          var t = e.selection.getRange();t.isEmpty() && t.end.column++;var n = e.session.getTextRange(t),
              r = n.toUpperCase();r != n ? e.session.replace(t, r) : n.toLowerCase() != n ? e.session.replace(t, n.toLowerCase()) : e.navigateRight();
        }, n || 1);
      } }, "*": { fn: function fn(e, t, n, r) {
        e.selection.selectWord(), e.findNext(), v(e);var i = e.selection.getRange();e.selection.setSelectionRange(i, !0);
      } }, "#": { fn: function fn(e, t, n, r) {
        e.selection.selectWord(), e.findPrevious(), v(e);var i = e.selection.getRange();e.selection.setSelectionRange(i, !0);
      } }, m: { param: !0, fn: function fn(e, t, n, r) {
        var i = e.session,
            s = i.vimMarkers || (i.vimMarkers = {}),
            o = e.getCursorPosition();s[r] || (s[r] = e.session.doc.createAnchor(o)), s[r].setPosition(o.row, o.column, !0);
      } }, n: { fn: function fn(e, t, n, r) {
        var i = e.getLastSearchOptions();i.backwards = !1, i.start = null, e.selection.moveCursorRight(), e.selection.clearSelection(), e.findNext(i), v(e);var s = e.selection.getRange();s.end.row = s.start.row, s.end.column = s.start.column, e.selection.setSelectionRange(s, !0);
      } }, N: { fn: function fn(e, t, n, r) {
        var i = e.getLastSearchOptions();i.backwards = !0, i.start = null, e.findPrevious(i), v(e);var s = e.selection.getRange();s.end.row = s.start.row, s.end.column = s.start.column, e.selection.setSelectionRange(s, !0);
      } }, v: { fn: function fn(e, t, n, r) {
        e.selection.selectRight(), i.visualMode(e, !1);
      }, acceptsMotion: !0 }, V: { fn: function fn(e, t, n, r) {
        var s = e.getCursorPosition().row;e.selection.moveTo(s, 0), e.selection.selectLineEnd(), e.selection.visualLineStart = s, i.visualMode(e, !0);
      }, acceptsMotion: !0 }, Y: { fn: function fn(e, t, n, r) {
        i.copyLine(e);
      } }, p: { fn: function fn(e, t, n, i) {
        var s = a._default;e.setOverwrite(!1);if (s.isLine) {
          var o = e.getCursorPosition();o.column = e.session.getLine(o.row).length;var u = r.stringRepeat("\n" + s.text, n || 1);e.session.insert(o, u), e.moveCursorTo(o.row + 1, 0);
        } else e.navigateRight(), e.insert(r.stringRepeat(s.text, n || 1)), e.navigateLeft();e.setOverwrite(!0), e.selection.clearSelection();
      } }, P: { fn: function fn(e, t, n, i) {
        var s = a._default;e.setOverwrite(!1);if (s.isLine) {
          var o = e.getCursorPosition();o.column = 0;var u = r.stringRepeat(s.text + "\n", n || 1);e.session.insert(o, u), e.moveCursorToPosition(o);
        } else e.insert(r.stringRepeat(s.text, n || 1));e.setOverwrite(!0), e.selection.clearSelection();
      } }, J: { fn: function fn(e, t, n, r) {
        var i = e.session;t = e.getSelectionRange();var s = { row: t.start.row, column: t.start.column };n = n || t.end.row - t.start.row;var o = Math.min(s.row + (n || 1), i.getLength() - 1);t.start.column = i.getLine(s.row).length, t.end.column = i.getLine(o).length, t.end.row = o;var u = "";for (var a = s.row; a < o; a++) {
          var f = i.getLine(a + 1);u += " " + /^\s*(.*)$/.exec(f)[1] || "";
        }i.replace(t, u), e.moveCursorTo(s.row, s.column);
      } }, u: { fn: function fn(e, t, n, r) {
        n = parseInt(n || 1, 10);for (var i = 0; i < n; i++) {
          e.undo();
        }e.selection.clearSelection();
      } }, "ctrl-r": { fn: function fn(e, t, n, r) {
        n = parseInt(n || 1, 10);for (var i = 0; i < n; i++) {
          e.redo();
        }e.selection.clearSelection();
      } }, ":": { fn: function fn(e, t, n, r) {
        var i = ":";n > 1 && (i = ".,.+" + n + i), e.showCommandLine && e.showCommandLine(i);
      } }, "/": { fn: function fn(e, t, n, r) {
        e.showCommandLine && e.showCommandLine("/");
      } }, "?": { fn: function fn(e, t, n, r) {
        e.showCommandLine && e.showCommandLine("?");
      } }, ".": { fn: function fn(e, t, n, r) {
        i.onInsertReplaySequence = g.lastInsertCommands;var s = g.previous;s && g.exec(e, s.action, s.param);
      } }, "ctrl-x": { fn: function fn(e, t, n, r) {
        e.modifyNumber(-(n || 1));
      } }, "ctrl-a": { fn: function fn(e, t, n, r) {
        e.modifyNumber(n || 1);
      } } },
      g = t.inputBuffer = { accepting: [f, l, c, h], currentCmd: null, currentCount: "", pendingCount: "", status: "", operator: null, motion: null, lastInsertCommands: [], push: function push(e, t, n) {
      var r = this.status,
          i = !0;this.idle = !1;var a = this.waitingForParam;/^numpad\d+$/i.test(t) && (t = t.substr(6));if (a) this.exec(e, a, t);else if (t === "0" && !this.currentCount.length || !/^\d+$/.test(t) || !this.isAccepting(f)) {
        if (!this.operator && this.isAccepting(l) && o[t]) this.operator = { ch: t, count: this.getCount() }, this.currentCmd = l, this.accepting = [f, c, h], this.exec(e, { operator: this.operator });else if (s[t] && this.isAccepting(c)) {
          this.currentCmd = c;var p = { operator: this.operator, motion: { ch: t, count: this.getCount() } };s[t].param ? this.waitForParam(p) : this.exec(e, p);
        } else if (u[t] && this.isAccepting(c)) u[t].operator.count = this.getCount(), this.exec(e, u[t]);else if (m[t] && this.isAccepting(h)) {
          var d = { action: { fn: m[t].fn, count: this.getCount() } };m[t].param ? this.waitForParam(d) : this.exec(e, d), m[t].acceptsMotion && (this.idle = !1);
        } else this.operator ? (this.operator.count = this.getCount(), this.exec(e, { operator: this.operator }, t)) : (i = t.length == 1, this.reset());
      } else this.currentCount += t, this.currentCmd = f, this.accepting = [f, l, c, h];return this.waitingForParam || this.motion || this.operator ? this.status += t : this.currentCount ? this.status = this.currentCount : this.status && (this.status = ""), this.status != r && e._emit("changeStatus"), i;
    }, waitForParam: function waitForParam(e) {
      this.waitingForParam = e;
    }, getCount: function getCount() {
      var e = this.currentCount || this.pendingCount;return this.currentCount = "", this.pendingCount = e, e && parseInt(e, 10);
    }, exec: function exec(e, t, n) {
      var r = t.motion,
          u = t.operator,
          a = t.action;n || (n = t.param), u && (this.previous = { action: t, param: n });if (u && !e.selection.isEmpty()) {
        o[u.ch].selFn && (o[u.ch].selFn(e, e.getSelectionRange(), u.count, n), this.reset());return;
      }if (!r && !a && u && n) o[u.ch].fn(e, null, u.count, n), this.reset();else if (r) {
        var f = function f(t) {
          t && typeof t == "function" && (r.count && !l.handlesCount ? d(t, r.count, [e, null, r.count, n]) : t(e, null, r.count, n));
        },
            l = s[r.ch],
            c = l.sel;u ? c && d(function () {
          f(l.sel), o[u.ch].fn(e, e.getSelectionRange(), u.count, l.param ? l : n);
        }, u.count || 1) : (i.onVisualMode || i.onVisualLineMode) && c ? f(l.sel) : f(l.nav), this.reset();
      } else a && (a.fn(e, e.getSelectionRange(), a.count, n), this.reset());b(e);
    }, isAccepting: function isAccepting(e) {
      return this.accepting.indexOf(e) !== -1;
    }, reset: function reset() {
      this.operator = null, this.motion = null, this.currentCount = "", this.pendingCount = "", this.status = "", this.accepting = [f, l, c, h], this.idle = !0, this.waitingForParam = null;
    } };t.coreCommands = { start: { exec: function w(e) {
        i.insertMode(e), y(w);
      } }, startBeginning: { exec: function E(e) {
        e.navigateLineStart(), i.insertMode(e), y(E);
      } }, stop: { exec: function exec(t) {
        g.reset(), i.onVisualMode = !1, i.onVisualLineMode = !1, g.lastInsertCommands = i.normalMode(t);
      } }, append: { exec: function S(e) {
        var t = e.getCursorPosition(),
            n = e.session.getLine(t.row).length;n && e.navigateRight(), i.insertMode(e), y(S);
      } }, appendEnd: { exec: function x(e) {
        e.navigateLineEnd(), i.insertMode(e), y(x);
      } } };var b = t.onCursorMove = function (e, t) {
    if (i.currentMode === "insert" || b.running) return;if (!e.selection.isEmpty()) {
      b.running = !0;if (i.onVisualLineMode) {
        var n = e.selection.visualLineStart,
            r = e.getCursorPosition().row;if (n <= r) {
          var s = e.session.getLine(r);e.selection.moveTo(n, 0), e.selection.selectTo(r, s.length);
        } else {
          var s = e.session.getLine(n);e.selection.moveTo(n, s.length), e.selection.selectTo(r, 0);
        }
      }b.running = !1;return;
    }t && (i.onVisualLineMode || i.onVisualMode) && (e.selection.clearSelection(), i.normalMode(e)), b.running = !0;var o = e.getCursorPosition(),
        u = e.session.getLine(o.row).length;u && o.column === u && e.navigateLeft(), b.running = !1;
  };
}), ace.define("ace/keyboard/vim", ["require", "exports", "module", "ace/keyboard/vim/commands", "ace/keyboard/vim/maps/util", "ace/lib/useragent"], function (e, t, n) {
  "use strict";
  var r = e("./vim/commands"),
      i = r.coreCommands,
      s = e("./vim/maps/util"),
      o = e("../lib/useragent"),
      u = { i: { command: i.start }, I: { command: i.startBeginning }, a: { command: i.append }, A: { command: i.appendEnd }, "ctrl-f": { command: "gotopagedown" }, "ctrl-b": { command: "gotopageup" } };t.handler = { $id: "ace/keyboard/vim", handleMacRepeat: function handleMacRepeat(e, t, n) {
      if (t == -1) e.inputChar = n, e.lastEvent = "input";else if (e.inputChar && e.$lastHash == t && e.$lastKey == n) {
        if (e.lastEvent == "input") e.lastEvent = "input1";else if (e.lastEvent == "input1") return !0;
      } else e.$lastHash = t, e.$lastKey = n, e.lastEvent = "keypress";
    }, updateMacCompositionHandlers: function updateMacCompositionHandlers(e, t) {
      var n = function n(e) {
        if (s.currentMode !== "insert") {
          var t = this.textInput.getElement();t.blur(), t.focus(), t.value = e;
        } else this.onCompositionUpdateOrig(e);
      },
          r = function r(e) {
        s.currentMode === "insert" && this.onCompositionStartOrig(e);
      };t ? e.onCompositionUpdateOrig || (e.onCompositionUpdateOrig = e.onCompositionUpdate, e.onCompositionUpdate = n, e.onCompositionStartOrig = e.onCompositionStart, e.onCompositionStart = r) : e.onCompositionUpdateOrig && (e.onCompositionUpdate = e.onCompositionUpdateOrig, e.onCompositionUpdateOrig = null, e.onCompositionStart = e.onCompositionStartOrig, e.onCompositionStartOrig = null);
    }, handleKeyboard: function handleKeyboard(e, t, n, s, a) {
      if (t !== 0 && (!n || s == -1)) return null;var f = e.editor,
          l = e.vimState || "start";t == 1 && (n = "ctrl-" + n);if (n == "ctrl-c") return !o.isMac && f.getCopyText() ? (f.once("copy", function () {
        l == "start" ? i.stop.exec(f) : f.selection.clearSelection();
      }), { command: "null", passEvent: !0 }) : { command: i.stop };if (n == "esc" && t === 0 || n == "ctrl-[") return { command: i.stop };if (l == "start") {
        o.isMac && this.handleMacRepeat(e, t, n) && (t = -1, n = e.inputChar);if (t == -1 || t == 1 || t === 0 && n.length > 1) {
          if (r.inputBuffer.idle && u[n]) return u[n];var c = r.inputBuffer.push(f, n);if (!c && t !== -1) return;return { command: "null", passEvent: !c };
        }if (n == "esc" && t === 0) return { command: i.stop };if (t === 0 || t == 4) return { command: "null", passEvent: !0 };
      } else if (n == "ctrl-w") return { command: "removewordleft" };
    }, attach: function attach(e) {
      e.on("click", t.onCursorMove), s.currentMode !== "insert" && r.coreCommands.stop.exec(e), e.$vimModeHandler = this, this.updateMacCompositionHandlers(e, !0);
    }, detach: function detach(e) {
      e.removeListener("click", t.onCursorMove), s.noMode(e), s.currentMode = "normal", this.updateMacCompositionHandlers(e, !1);
    }, actions: r.actions, getStatusText: function getStatusText() {
      return s.currentMode == "insert" ? "INSERT" : s.onVisualMode ? (s.onVisualLineMode ? "VISUAL LINE " : "VISUAL ") + r.inputBuffer.status : r.inputBuffer.status;
    } }, t.onCursorMove = function (e) {
    r.onCursorMove(e.editor, e), t.onCursorMove.scheduled = !1;
  };
});