"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

ace.define("ace/ext/static_highlight", ["require", "exports", "module", "ace/edit_session", "ace/layer/text", "ace/config", "ace/lib/dom"], function (e, t, n) {
    "use strict";
    var r = e("../edit_session").EditSession,
        i = e("../layer/text").Text,
        s = ".ace_static_highlight {font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', 'Droid Sans Mono', monospace;font-size: 12px;}.ace_static_highlight .ace_gutter {width: 25px !important;float: left;text-align: right;padding: 0 3px 0 0;margin-right: 3px;position: static !important;}.ace_static_highlight .ace_line { clear: both; }.ace_static_highlight .ace_gutter-cell {-moz-user-select: -moz-none;-khtml-user-select: none;-webkit-user-select: none;user-select: none;}.ace_static_highlight .ace_gutter-cell:before {content: counter(ace_line, decimal);counter-increment: ace_line;}.ace_static_highlight {counter-reset: ace_line;}",
        o = e("../config"),
        u = e("../lib/dom"),
        a = function a(e, t, n) {
        var r = e.className.match(/lang-(\w+)/),
            i = t.mode || r && "ace/mode/" + r[1];if (!i) return !1;var s = t.theme || "ace/theme/textmate",
            o = "",
            f = [];if (e.firstElementChild) {
            var l = 0;for (var c = 0; c < e.childNodes.length; c++) {
                var h = e.childNodes[c];h.nodeType == 3 ? (l += h.data.length, o += h.data) : f.push(l, h);
            }
        } else o = u.getInnerText(e), t.trim && (o = o.trim());a.render(o, i, s, t.firstLineNumber, !t.showGutter, function (t) {
            u.importCssString(t.css, "ace_highlight"), e.innerHTML = t.html;var r = e.firstChild.firstChild;for (var i = 0; i < f.length; i += 2) {
                var s = t.session.doc.indexToPosition(f[i]),
                    o = f[i + 1],
                    a = r.children[s.row];a && a.appendChild(o);
            }n && n();
        });
    };a.render = function (e, t, n, i, s, u) {
        function h() {
            var r = a.renderSync(e, t, n, i, s);return u ? u(r) : r;
        }var f = 1,
            l = r.prototype.$modes;typeof n == "string" && (f++, o.loadModule(["theme", n], function (e) {
            n = e, --f || h();
        }));var c;return t && (typeof t === "undefined" ? "undefined" : _typeof(t)) == "object" && !t.getTokenizer && (c = t, t = c.path), typeof t == "string" && (f++, o.loadModule(["mode", t], function (e) {
            if (!l[t] || c) l[t] = new e.Mode(c);t = l[t], --f || h();
        })), --f || h();
    }, a.renderSync = function (e, t, n, o, u) {
        o = parseInt(o || 1, 10);var a = new r("");a.setUseWorker(!1), a.setMode(t);var f = new i(document.createElement("div"));f.setSession(a), f.config = { characterWidth: 10, lineHeight: 20 }, a.setValue(e);var l = [],
            c = a.getLength();for (var h = 0; h < c; h++) {
            l.push("<div class='ace_line'>"), u || l.push("<span class='ace_gutter ace_gutter-cell' unselectable='on'></span>"), f.$renderLine(l, h, !0, !1), l.push("\n</div>");
        }var p = "<div class='" + n.cssClass + "'>" + "<div class='ace_static_highlight' style='counter-reset:ace_line " + (o - 1) + "'>" + l.join("") + "</div>" + "</div>";return f.destroy(), { css: s + n.cssText, html: p, session: a };
    }, n.exports = a, n.exports.highlight = a;
});
(function () {
    ace.require(["ace/ext/static_highlight"], function () {});
})();