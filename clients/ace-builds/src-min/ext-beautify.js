"use strict";

define("ace/ext/beautify/php_rules", ["require", "exports", "module", "ace/token_iterator"], function (e, t, n) {
    "use strict";
    var r = e("ace/token_iterator").TokenIterator;t.newLines = [{ type: "support.php_tag", value: "<?php" }, { type: "support.php_tag", value: "<?" }, { type: "support.php_tag", value: "?>" }, { type: "paren.lparen", value: "{", indent: !0 }, { type: "paren.rparen", breakBefore: !0, value: "}", indent: !1 }, { type: "paren.rparen", breakBefore: !0, value: "})", indent: !1, dontBreak: !0 }, { type: "comment" }, { type: "text", value: ";" }, { type: "text", value: ":", context: "php" }, { type: "keyword", value: "case", indent: !0, dontBreak: !0 }, { type: "keyword", value: "default", indent: !0, dontBreak: !0 }, { type: "keyword", value: "break", indent: !1, dontBreak: !0 }, { type: "punctuation.doctype.end", value: ">" }, { type: "meta.tag.punctuation.end", value: ">" }, { type: "meta.tag.punctuation.begin", value: "<", blockTag: !0, indent: !0, dontBreak: !0 }, { type: "meta.tag.punctuation.begin", value: "</", indent: !1, breakBefore: !0, dontBreak: !0 }, { type: "punctuation.operator", value: ";" }], t.spaces = [{ type: "xml-pe", prepend: !0 }, { type: "entity.other.attribute-name", prepend: !0 }, { type: "storage.type", value: "var", append: !0 }, { type: "storage.type", value: "function", append: !0 }, { type: "keyword.operator", value: "=" }, { type: "keyword", value: "as", prepend: !0, append: !0 }, { type: "keyword", value: "function", append: !0 }, { type: "support.function", next: /[^\(]/, append: !0 }, { type: "keyword", value: "or", append: !0, prepend: !0 }, { type: "keyword", value: "and", append: !0, prepend: !0 }, { type: "keyword", value: "case", append: !0 }, { type: "keyword.operator", value: "||", append: !0, prepend: !0 }, { type: "keyword.operator", value: "&&", append: !0, prepend: !0 }], t.singleTags = ["!doctype", "area", "base", "br", "hr", "input", "img", "link", "meta"], t.transform = function (e, n, r) {
        var i = e.getCurrentToken(),
            s = t.newLines,
            o = t.spaces,
            u = t.singleTags,
            a = "",
            f = 0,
            l = !1,
            c,
            h,
            p = {},
            d,
            v = {},
            m = !1,
            g = "";while (i !== null) {
            console.log(i);if (!i) {
                i = e.stepForward();continue;
            }i.type == "support.php_tag" && i.value != "?>" ? r = "php" : i.type == "support.php_tag" && i.value == "?>" ? r = "html" : i.type == "meta.tag.name.style" && r != "css" ? r = "css" : i.type == "meta.tag.name.style" && r == "css" ? r = "html" : i.type == "meta.tag.name.script" && r != "js" ? r = "js" : i.type == "meta.tag.name.script" && r == "js" && (r = "html"), v = e.stepForward(), v && v.type.indexOf("meta.tag.name") == 0 && (d = v.value), p.type == "support.php_tag" && p.value == "<?=" && (l = !0), i.type == "meta.tag.name" && (i.value = i.value.toLowerCase()), i.type == "text" && (i.value = i.value.trim());if (!i.value) {
                i = v;continue;
            }g = i.value;for (var y in o) {
                i.type == o[y].type && (!o[y].value || i.value == o[y].value) && v && (!o[y].next || o[y].next.test(v.value)) && (o[y].prepend && (g = " " + i.value), o[y].append && (g += " "));
            }i.type.indexOf("meta.tag.name") == 0 && (c = i.value), m = !1;for (y in s) {
                if (i.type == s[y].type && (!s[y].value || i.value == s[y].value) && (!s[y].blockTag || u.indexOf(d) === -1) && (!s[y].context || s[y].context === r)) {
                    s[y].indent === !1 && f--;if (s[y].breakBefore && (!s[y].prev || s[y].prev.test(p.value))) {
                        a += "\n", m = !0;for (y = 0; y < f; y++) {
                            a += "	";
                        }
                    }break;
                }
            }if (l === !1) for (y in s) {
                if (p.type == s[y].type && (!s[y].value || p.value == s[y].value) && (!s[y].blockTag || u.indexOf(c) === -1) && (!s[y].context || s[y].context === r)) {
                    s[y].indent === !0 && f++;if (!s[y].dontBreak && !m) {
                        a += "\n";for (y = 0; y < f; y++) {
                            a += "	";
                        }
                    }break;
                }
            }a += g, p.type == "support.php_tag" && p.value == "?>" && (l = !1), h = c, p = i, i = v;if (i === null) break;
        }return a;
    };
}), define("ace/ext/beautify", ["require", "exports", "module", "ace/token_iterator", "ace/ext/beautify/php_rules"], function (e, t, n) {
    "use strict";
    var r = e("ace/token_iterator").TokenIterator,
        i = e("./beautify/php_rules").transform;t.beautify = function (e) {
        var t = new r(e, 0, 0),
            n = t.getCurrentToken(),
            s = e.$modeId.split("/").pop(),
            o = i(t, s);e.doc.setValue(o);
    }, t.commands = [{ name: "beautify", exec: function exec(e) {
            t.beautify(e.session);
        }, bindKey: "Ctrl-Shift-B" }];
});
(function () {
    window.require(["ace/ext/beautify"], function () {});
})();