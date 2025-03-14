"use strict";

ace.define("ace/mode/elm_highlight_rules", ["require", "exports", "module", "ace/lib/oop", "ace/mode/text_highlight_rules"], function (require, exports, module) {
    "use strict";

    var oop = require("../lib/oop");
    var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;

    var ElmHighlightRules = function ElmHighlightRules() {
        var keywordMapper = this.createKeywordMapper({
            "keyword": "as|case|class|data|default|deriving|do|else|export|foreign|" + "hiding|jsevent|if|import|in|infix|infixl|infixr|instance|let|" + "module|newtype|of|open|then|type|where|_|port|\u03BB"
        }, "identifier");

        var escapeRe = /\\(\d+|['"\\&trnbvf])/;

        var smallRe = /[a-z_]/.source;
        var largeRe = /[A-Z]/.source;
        var idRe = /[a-z_A-Z0-9\']/.source;

        this.$rules = {
            start: [{
                token: "string.start",
                regex: '"',
                next: "string"
            }, {
                token: "string.character",
                regex: "'(?:" + escapeRe.source + "|.)'?"
            }, {
                regex: /0(?:[xX][0-9A-Fa-f]+|[oO][0-7]+)|\d+(\.\d+)?([eE][-+]?\d*)?/,
                token: "constant.numeric"
            }, {
                token: "keyword",
                regex: /\.\.|\||:|=|\\|\"|->|<-|\u2192/
            }, {
                token: "keyword.operator",
                regex: /[-!#$%&*+.\/<=>?@\\^|~:\u03BB\u2192]+/
            }, {
                token: "operator.punctuation",
                regex: /[,;`]/
            }, {
                regex: largeRe + idRe + "+\\.?",
                token: function token(value) {
                    if (value[value.length - 1] == ".") return "entity.name.function";
                    return "constant.language";
                }
            }, {
                regex: "^" + smallRe + idRe + "+",
                token: function token(value) {
                    return "constant.language";
                }
            }, {
                token: keywordMapper,
                regex: "[\\w\\xff-\\u218e\\u2455-\\uffff]+\\b"
            }, {
                regex: "{-#?",
                token: "comment.start",
                onMatch: function onMatch(value, currentState, stack) {
                    this.next = value.length == 2 ? "blockComment" : "docComment";
                    return this.token;
                }
            }, {
                token: "variable.language",
                regex: /\[markdown\|/,
                next: "markdown"
            }, {
                token: "paren.lparen",
                regex: /[\[({]/
            }, {
                token: "paren.rparen",
                regex: /[\])}]/
            }],
            markdown: [{
                regex: /\|\]/,
                next: "start"
            }, {
                defaultToken: "string"
            }],
            blockComment: [{
                regex: "{-",
                token: "comment.start",
                push: "blockComment"
            }, {
                regex: "-}",
                token: "comment.end",
                next: "pop"
            }, {
                defaultToken: "comment"
            }],
            docComment: [{
                regex: "{-",
                token: "comment.start",
                push: "docComment"
            }, {
                regex: "-}",
                token: "comment.end",
                next: "pop"
            }, {
                defaultToken: "doc.comment"
            }],
            string: [{
                token: "constant.language.escape",
                regex: escapeRe
            }, {
                token: "text",
                regex: /\\(\s|$)/,
                next: "stringGap"
            }, {
                token: "string.end",
                regex: '"',
                next: "start"
            }],
            stringGap: [{
                token: "text",
                regex: /\\/,
                next: "string"
            }, {
                token: "error",
                regex: "",
                next: "start"
            }]
        };

        this.normalizeRules();
    };

    oop.inherits(ElmHighlightRules, TextHighlightRules);

    exports.ElmHighlightRules = ElmHighlightRules;
});

ace.define("ace/mode/folding/cstyle", ["require", "exports", "module", "ace/lib/oop", "ace/range", "ace/mode/folding/fold_mode"], function (require, exports, module) {
    "use strict";

    var oop = require("../../lib/oop");
    var Range = require("../../range").Range;
    var BaseFoldMode = require("./fold_mode").FoldMode;

    var FoldMode = exports.FoldMode = function (commentRegex) {
        if (commentRegex) {
            this.foldingStartMarker = new RegExp(this.foldingStartMarker.source.replace(/\|[^|]*?$/, "|" + commentRegex.start));
            this.foldingStopMarker = new RegExp(this.foldingStopMarker.source.replace(/\|[^|]*?$/, "|" + commentRegex.end));
        }
    };
    oop.inherits(FoldMode, BaseFoldMode);

    (function () {

        this.foldingStartMarker = /(\{|\[)[^\}\]]*$|^\s*(\/\*)/;
        this.foldingStopMarker = /^[^\[\{]*(\}|\])|^[\s\*]*(\*\/)/;

        this.getFoldWidgetRange = function (session, foldStyle, row, forceMultiline) {
            var line = session.getLine(row);
            var match = line.match(this.foldingStartMarker);
            if (match) {
                var i = match.index;

                if (match[1]) return this.openingBracketBlock(session, match[1], row, i);

                var range = session.getCommentFoldRange(row, i + match[0].length, 1);

                if (range && !range.isMultiLine()) {
                    if (forceMultiline) {
                        range = this.getSectionRange(session, row);
                    } else if (foldStyle != "all") range = null;
                }

                return range;
            }

            if (foldStyle === "markbegin") return;

            var match = line.match(this.foldingStopMarker);
            if (match) {
                var i = match.index + match[0].length;

                if (match[1]) return this.closingBracketBlock(session, match[1], row, i);

                return session.getCommentFoldRange(row, i, -1);
            }
        };

        this.getSectionRange = function (session, row) {
            var line = session.getLine(row);
            var startIndent = line.search(/\S/);
            var startRow = row;
            var startColumn = line.length;
            row = row + 1;
            var endRow = row;
            var maxRow = session.getLength();
            while (++row < maxRow) {
                line = session.getLine(row);
                var indent = line.search(/\S/);
                if (indent === -1) continue;
                if (startIndent > indent) break;
                var subRange = this.getFoldWidgetRange(session, "all", row);

                if (subRange) {
                    if (subRange.start.row <= startRow) {
                        break;
                    } else if (subRange.isMultiLine()) {
                        row = subRange.end.row;
                    } else if (startIndent == indent) {
                        break;
                    }
                }
                endRow = row;
            }

            return new Range(startRow, startColumn, endRow, session.getLine(endRow).length);
        };
    }).call(FoldMode.prototype);
});

ace.define("ace/mode/elm", ["require", "exports", "module", "ace/lib/oop", "ace/mode/text", "ace/mode/elm_highlight_rules", "ace/mode/folding/cstyle"], function (require, exports, module) {
    "use strict";

    var oop = require("../lib/oop");
    var TextMode = require("./text").Mode;
    var HighlightRules = require("./elm_highlight_rules").ElmHighlightRules;
    var FoldMode = require("./folding/cstyle").FoldMode;

    var Mode = function Mode() {
        this.HighlightRules = HighlightRules;
        this.foldingRules = new FoldMode();
    };
    oop.inherits(Mode, TextMode);

    (function () {
        this.lineCommentStart = "--";
        this.blockComment = { start: "{-", end: "-}" };
        this.$id = "ace/mode/elm";
    }).call(Mode.prototype);

    exports.Mode = Mode;
});