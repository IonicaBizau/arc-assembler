"use strict";

define("ace/ext/menu_tools/overlay_page", ["require", "exports", "module", "ace/lib/dom"], function (e, t, n) {
    "use strict";
    var r = e("../../lib/dom"),
        i = "#ace_settingsmenu, #kbshortcutmenu {background-color: #F7F7F7;color: black;box-shadow: -5px 4px 5px rgba(126, 126, 126, 0.55);padding: 1em 0.5em 2em 1em;overflow: auto;position: absolute;margin: 0;bottom: 0;right: 0;top: 0;z-index: 9991;cursor: default;}.ace_dark #ace_settingsmenu, .ace_dark #kbshortcutmenu {box-shadow: -20px 10px 25px rgba(126, 126, 126, 0.25);background-color: rgba(255, 255, 255, 0.6);color: black;}.ace_optionsMenuEntry:hover {background-color: rgba(100, 100, 100, 0.1);-webkit-transition: all 0.5s;transition: all 0.3s}.ace_closeButton {background: rgba(245, 146, 146, 0.5);border: 1px solid #F48A8A;border-radius: 50%;padding: 7px;position: absolute;right: -8px;top: -8px;z-index: 1000;}.ace_closeButton{background: rgba(245, 146, 146, 0.9);}.ace_optionsMenuKey {color: darkslateblue;font-weight: bold;}.ace_optionsMenuCommand {color: darkcyan;font-weight: normal;}";r.importCssString(i), n.exports.overlayPage = function (t, n, i, s, o, u) {
        function l(e) {
            e.keyCode === 27 && a.click();
        }i = i ? "top: " + i + ";" : "", o = o ? "bottom: " + o + ";" : "", s = s ? "right: " + s + ";" : "", u = u ? "left: " + u + ";" : "";var a = document.createElement("div"),
            f = document.createElement("div");a.style.cssText = "margin: 0; padding: 0; position: fixed; top:0; bottom:0; left:0; right:0;z-index: 9990; background-color: rgba(0, 0, 0, 0.3);", a.addEventListener("click", function () {
            document.removeEventListener("keydown", l), a.parentNode.removeChild(a), t.focus(), a = null;
        }), document.addEventListener("keydown", l), f.style.cssText = i + s + o + u, f.addEventListener("click", function (e) {
            e.stopPropagation();
        });var c = r.createElement("div");c.style.position = "relative";var h = r.createElement("div");h.className = "ace_closeButton", h.addEventListener("click", function () {
            a.click();
        }), c.appendChild(h), f.appendChild(c), f.appendChild(n), a.appendChild(f), document.body.appendChild(a), t.blur();
    };
}), define("ace/ext/menu_tools/get_editor_keyboard_shortcuts", ["require", "exports", "module", "ace/lib/keys"], function (e, t, n) {
    "use strict";
    var r = e("../../lib/keys");n.exports.getEditorKeybordShortcuts = function (e) {
        var t = r.KEY_MODS,
            n = [],
            i = {};return e.keyBinding.$handlers.forEach(function (e) {
            var t = e.commandKeyBinding;for (var r in t) {
                var s = r.replace(/(^|-)\w/g, function (e) {
                    return e.toUpperCase();
                }),
                    o = t[r];Array.isArray(o) || (o = [o]), o.forEach(function (e) {
                    typeof e != "string" && (e = e.name), i[e] ? i[e].key += "|" + s : (i[e] = { key: s, command: e }, n.push(i[e]));
                });
            }
        }), n;
    };
}), define("ace/ext/keybinding_menu", ["require", "exports", "module", "ace/editor", "ace/ext/menu_tools/overlay_page", "ace/ext/menu_tools/get_editor_keyboard_shortcuts"], function (e, t, n) {
    "use strict";
    function i(t) {
        if (!document.getElementById("kbshortcutmenu")) {
            var n = e("./menu_tools/overlay_page").overlayPage,
                r = e("./menu_tools/get_editor_keyboard_shortcuts").getEditorKeybordShortcuts,
                i = r(t),
                s = document.createElement("div"),
                o = i.reduce(function (e, t) {
                return e + '<div class="ace_optionsMenuEntry"><span class="ace_optionsMenuCommand">' + t.command + "</span> : " + '<span class="ace_optionsMenuKey">' + t.key + "</span></div>";
            }, "");s.id = "kbshortcutmenu", s.innerHTML = "<h1>Keyboard Shortcuts</h1>" + o + "</div>", n(t, s, "0", "0", "0", null);
        }
    }var r = e("ace/editor").Editor;n.exports.init = function (e) {
        r.prototype.showKeyboardShortcuts = function () {
            i(this);
        }, e.commands.addCommands([{ name: "showKeyboardShortcuts", bindKey: { win: "Ctrl-Alt-h", mac: "Command-Alt-h" }, exec: function exec(e, t) {
                e.showKeyboardShortcuts();
            } }]);
    };
});
(function () {
    window.require(["ace/ext/keybinding_menu"], function () {});
})();