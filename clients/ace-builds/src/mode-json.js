"use strict";

define("ace/mode/json_highlight_rules", ["require", "exports", "module", "ace/lib/oop", "ace/mode/text_highlight_rules"], function (require, exports, module) {
    "use strict";

    var oop = require("../lib/oop");
    var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;

    var JsonHighlightRules = function JsonHighlightRules() {
        this.$rules = {
            "start": [{
                token: "variable", // single line
                regex: '["](?:(?:\\\\.)|(?:[^"\\\\]))*?["]\\s*(?=:)'
            }, {
                token: "string", // single line
                regex: '"',
                next: "string"
            }, {
                token: "constant.numeric", // hex
                regex: "0[xX][0-9a-fA-F]+\\b"
            }, {
                token: "constant.numeric", // float
                regex: "[+-]?\\d+(?:(?:\\.\\d*)?(?:[eE][+-]?\\d+)?)?\\b"
            }, {
                token: "constant.language.boolean",
                regex: "(?:true|false)\\b"
            }, {
                token: "invalid.illegal", // single quoted strings are not allowed
                regex: "['](?:(?:\\\\.)|(?:[^'\\\\]))*?[']"
            }, {
                token: "invalid.illegal", // comments are not allowed
                regex: "\\/\\/.*$"
            }, {
                token: "paren.lparen",
                regex: "[[({]"
            }, {
                token: "paren.rparen",
                regex: "[\\])}]"
            }, {
                token: "text",
                regex: "\\s+"
            }],
            "string": [{
                token: "constant.language.escape",
                regex: /\\(?:x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4}|["\\\/bfnrt])/
            }, {
                token: "string",
                regex: '[^"\\\\]+'
            }, {
                token: "string",
                regex: '"',
                next: "start"
            }, {
                token: "string",
                regex: "",
                next: "start"
            }]
        };
    };

    oop.inherits(JsonHighlightRules, TextHighlightRules);

    exports.JsonHighlightRules = JsonHighlightRules;
});

define("ace/mode/matching_brace_outdent", ["require", "exports", "module", "ace/range"], function (require, exports, module) {
    "use strict";

    var Range = require("../range").Range;

    var MatchingBraceOutdent = function MatchingBraceOutdent() {};

    (function () {

        this.checkOutdent = function (line, input) {
            if (!/^\s+$/.test(line)) return false;

            return (/^\s*\}/.test(input)
            );
        };

        this.autoOutdent = function (doc, row) {
            var line = doc.getLine(row);
            var match = line.match(/^(\s*\})/);

            if (!match) return 0;

            var column = match[1].length;
            var openBracePos = doc.findMatchingBracket({ row: row, column: column });

            if (!openBracePos || openBracePos.row == row) return 0;

            var indent = this.$getIndent(doc.getLine(openBracePos.row));
            doc.replace(new Range(row, 0, row, column - 1), indent);
        };

        this.$getIndent = function (line) {
            return line.match(/^\s*/)[0];
        };
    }).call(MatchingBraceOutdent.prototype);

    exports.MatchingBraceOutdent = MatchingBraceOutdent;
});

define("ace/mode/behaviour/cstyle", ["require", "exports", "module", "ace/lib/oop", "ace/mode/behaviour", "ace/token_iterator", "ace/lib/lang"], function (require, exports, module) {
    "use strict";

    var oop = require("../../lib/oop");
    var Behaviour = require("../behaviour").Behaviour;
    var TokenIterator = require("../../token_iterator").TokenIterator;
    var lang = require("../../lib/lang");

    var SAFE_INSERT_IN_TOKENS = ["text", "paren.rparen", "punctuation.operator"];
    var SAFE_INSERT_BEFORE_TOKENS = ["text", "paren.rparen", "punctuation.operator", "comment"];

    var context;
    var contextCache = {};
    var initContext = function initContext(editor) {
        var id = -1;
        if (editor.multiSelect) {
            id = editor.selection.index;
            if (contextCache.rangeCount != editor.multiSelect.rangeCount) contextCache = { rangeCount: editor.multiSelect.rangeCount };
        }
        if (contextCache[id]) return context = contextCache[id];
        context = contextCache[id] = {
            autoInsertedBrackets: 0,
            autoInsertedRow: -1,
            autoInsertedLineEnd: "",
            maybeInsertedBrackets: 0,
            maybeInsertedRow: -1,
            maybeInsertedLineStart: "",
            maybeInsertedLineEnd: ""
        };
    };

    var CstyleBehaviour = function CstyleBehaviour() {
        this.add("braces", "insertion", function (state, action, editor, session, text) {
            var cursor = editor.getCursorPosition();
            var line = session.doc.getLine(cursor.row);
            if (text == '{') {
                initContext(editor);
                var selection = editor.getSelectionRange();
                var selected = session.doc.getTextRange(selection);
                if (selected !== "" && selected !== "{" && editor.getWrapBehavioursEnabled()) {
                    return {
                        text: '{' + selected + '}',
                        selection: false
                    };
                } else if (CstyleBehaviour.isSaneInsertion(editor, session)) {
                    if (/[\]\}\)]/.test(line[cursor.column]) || editor.inMultiSelectMode) {
                        CstyleBehaviour.recordAutoInsert(editor, session, "}");
                        return {
                            text: '{}',
                            selection: [1, 1]
                        };
                    } else {
                        CstyleBehaviour.recordMaybeInsert(editor, session, "{");
                        return {
                            text: '{',
                            selection: [1, 1]
                        };
                    }
                }
            } else if (text == '}') {
                initContext(editor);
                var rightChar = line.substring(cursor.column, cursor.column + 1);
                if (rightChar == '}') {
                    var matching = session.$findOpeningBracket('}', { column: cursor.column + 1, row: cursor.row });
                    if (matching !== null && CstyleBehaviour.isAutoInsertedClosing(cursor, line, text)) {
                        CstyleBehaviour.popAutoInsertedClosing();
                        return {
                            text: '',
                            selection: [1, 1]
                        };
                    }
                }
            } else if (text == "\n" || text == "\r\n") {
                initContext(editor);
                var closing = "";
                if (CstyleBehaviour.isMaybeInsertedClosing(cursor, line)) {
                    closing = lang.stringRepeat("}", context.maybeInsertedBrackets);
                    CstyleBehaviour.clearMaybeInsertedClosing();
                }
                var rightChar = line.substring(cursor.column, cursor.column + 1);
                if (rightChar === '}') {
                    var openBracePos = session.findMatchingBracket({ row: cursor.row, column: cursor.column + 1 }, '}');
                    if (!openBracePos) return null;
                    var next_indent = this.$getIndent(session.getLine(openBracePos.row));
                } else if (closing) {
                    var next_indent = this.$getIndent(line);
                } else {
                    CstyleBehaviour.clearMaybeInsertedClosing();
                    return;
                }
                var indent = next_indent + session.getTabString();

                return {
                    text: '\n' + indent + '\n' + next_indent + closing,
                    selection: [1, indent.length, 1, indent.length]
                };
            } else {
                CstyleBehaviour.clearMaybeInsertedClosing();
            }
        });

        this.add("braces", "deletion", function (state, action, editor, session, range) {
            var selected = session.doc.getTextRange(range);
            if (!range.isMultiLine() && selected == '{') {
                initContext(editor);
                var line = session.doc.getLine(range.start.row);
                var rightChar = line.substring(range.end.column, range.end.column + 1);
                if (rightChar == '}') {
                    range.end.column++;
                    return range;
                } else {
                    context.maybeInsertedBrackets--;
                }
            }
        });

        this.add("parens", "insertion", function (state, action, editor, session, text) {
            if (text == '(') {
                initContext(editor);
                var selection = editor.getSelectionRange();
                var selected = session.doc.getTextRange(selection);
                if (selected !== "" && editor.getWrapBehavioursEnabled()) {
                    return {
                        text: '(' + selected + ')',
                        selection: false
                    };
                } else if (CstyleBehaviour.isSaneInsertion(editor, session)) {
                    CstyleBehaviour.recordAutoInsert(editor, session, ")");
                    return {
                        text: '()',
                        selection: [1, 1]
                    };
                }
            } else if (text == ')') {
                initContext(editor);
                var cursor = editor.getCursorPosition();
                var line = session.doc.getLine(cursor.row);
                var rightChar = line.substring(cursor.column, cursor.column + 1);
                if (rightChar == ')') {
                    var matching = session.$findOpeningBracket(')', { column: cursor.column + 1, row: cursor.row });
                    if (matching !== null && CstyleBehaviour.isAutoInsertedClosing(cursor, line, text)) {
                        CstyleBehaviour.popAutoInsertedClosing();
                        return {
                            text: '',
                            selection: [1, 1]
                        };
                    }
                }
            }
        });

        this.add("parens", "deletion", function (state, action, editor, session, range) {
            var selected = session.doc.getTextRange(range);
            if (!range.isMultiLine() && selected == '(') {
                initContext(editor);
                var line = session.doc.getLine(range.start.row);
                var rightChar = line.substring(range.start.column + 1, range.start.column + 2);
                if (rightChar == ')') {
                    range.end.column++;
                    return range;
                }
            }
        });

        this.add("brackets", "insertion", function (state, action, editor, session, text) {
            if (text == '[') {
                initContext(editor);
                var selection = editor.getSelectionRange();
                var selected = session.doc.getTextRange(selection);
                if (selected !== "" && editor.getWrapBehavioursEnabled()) {
                    return {
                        text: '[' + selected + ']',
                        selection: false
                    };
                } else if (CstyleBehaviour.isSaneInsertion(editor, session)) {
                    CstyleBehaviour.recordAutoInsert(editor, session, "]");
                    return {
                        text: '[]',
                        selection: [1, 1]
                    };
                }
            } else if (text == ']') {
                initContext(editor);
                var cursor = editor.getCursorPosition();
                var line = session.doc.getLine(cursor.row);
                var rightChar = line.substring(cursor.column, cursor.column + 1);
                if (rightChar == ']') {
                    var matching = session.$findOpeningBracket(']', { column: cursor.column + 1, row: cursor.row });
                    if (matching !== null && CstyleBehaviour.isAutoInsertedClosing(cursor, line, text)) {
                        CstyleBehaviour.popAutoInsertedClosing();
                        return {
                            text: '',
                            selection: [1, 1]
                        };
                    }
                }
            }
        });

        this.add("brackets", "deletion", function (state, action, editor, session, range) {
            var selected = session.doc.getTextRange(range);
            if (!range.isMultiLine() && selected == '[') {
                initContext(editor);
                var line = session.doc.getLine(range.start.row);
                var rightChar = line.substring(range.start.column + 1, range.start.column + 2);
                if (rightChar == ']') {
                    range.end.column++;
                    return range;
                }
            }
        });

        this.add("string_dquotes", "insertion", function (state, action, editor, session, text) {
            if (text == '"' || text == "'") {
                initContext(editor);
                var quote = text;
                var selection = editor.getSelectionRange();
                var selected = session.doc.getTextRange(selection);
                if (selected !== "" && selected !== "'" && selected != '"' && editor.getWrapBehavioursEnabled()) {
                    return {
                        text: quote + selected + quote,
                        selection: false
                    };
                } else {
                    var cursor = editor.getCursorPosition();
                    var line = session.doc.getLine(cursor.row);
                    var leftChar = line.substring(cursor.column - 1, cursor.column);
                    if (leftChar == '\\') {
                        return null;
                    }
                    var tokens = session.getTokens(selection.start.row);
                    var col = 0,
                        token;
                    var quotepos = -1; // Track whether we're inside an open quote.

                    for (var x = 0; x < tokens.length; x++) {
                        token = tokens[x];
                        if (token.type == "string") {
                            quotepos = -1;
                        } else if (quotepos < 0) {
                            quotepos = token.value.indexOf(quote);
                        }
                        if (token.value.length + col > selection.start.column) {
                            break;
                        }
                        col += tokens[x].value.length;
                    }
                    if (!token || quotepos < 0 && token.type !== "comment" && (token.type !== "string" || selection.start.column !== token.value.length + col - 1 && token.value.lastIndexOf(quote) === token.value.length - 1)) {
                        if (!CstyleBehaviour.isSaneInsertion(editor, session)) return;
                        return {
                            text: quote + quote,
                            selection: [1, 1]
                        };
                    } else if (token && token.type === "string") {
                        var rightChar = line.substring(cursor.column, cursor.column + 1);
                        if (rightChar == quote) {
                            return {
                                text: '',
                                selection: [1, 1]
                            };
                        }
                    }
                }
            }
        });

        this.add("string_dquotes", "deletion", function (state, action, editor, session, range) {
            var selected = session.doc.getTextRange(range);
            if (!range.isMultiLine() && (selected == '"' || selected == "'")) {
                initContext(editor);
                var line = session.doc.getLine(range.start.row);
                var rightChar = line.substring(range.start.column + 1, range.start.column + 2);
                if (rightChar == selected) {
                    range.end.column++;
                    return range;
                }
            }
        });
    };

    CstyleBehaviour.isSaneInsertion = function (editor, session) {
        var cursor = editor.getCursorPosition();
        var iterator = new TokenIterator(session, cursor.row, cursor.column);
        if (!this.$matchTokenType(iterator.getCurrentToken() || "text", SAFE_INSERT_IN_TOKENS)) {
            var iterator2 = new TokenIterator(session, cursor.row, cursor.column + 1);
            if (!this.$matchTokenType(iterator2.getCurrentToken() || "text", SAFE_INSERT_IN_TOKENS)) return false;
        }
        iterator.stepForward();
        return iterator.getCurrentTokenRow() !== cursor.row || this.$matchTokenType(iterator.getCurrentToken() || "text", SAFE_INSERT_BEFORE_TOKENS);
    };

    CstyleBehaviour.$matchTokenType = function (token, types) {
        return types.indexOf(token.type || token) > -1;
    };

    CstyleBehaviour.recordAutoInsert = function (editor, session, bracket) {
        var cursor = editor.getCursorPosition();
        var line = session.doc.getLine(cursor.row);
        if (!this.isAutoInsertedClosing(cursor, line, context.autoInsertedLineEnd[0])) context.autoInsertedBrackets = 0;
        context.autoInsertedRow = cursor.row;
        context.autoInsertedLineEnd = bracket + line.substr(cursor.column);
        context.autoInsertedBrackets++;
    };

    CstyleBehaviour.recordMaybeInsert = function (editor, session, bracket) {
        var cursor = editor.getCursorPosition();
        var line = session.doc.getLine(cursor.row);
        if (!this.isMaybeInsertedClosing(cursor, line)) context.maybeInsertedBrackets = 0;
        context.maybeInsertedRow = cursor.row;
        context.maybeInsertedLineStart = line.substr(0, cursor.column) + bracket;
        context.maybeInsertedLineEnd = line.substr(cursor.column);
        context.maybeInsertedBrackets++;
    };

    CstyleBehaviour.isAutoInsertedClosing = function (cursor, line, bracket) {
        return context.autoInsertedBrackets > 0 && cursor.row === context.autoInsertedRow && bracket === context.autoInsertedLineEnd[0] && line.substr(cursor.column) === context.autoInsertedLineEnd;
    };

    CstyleBehaviour.isMaybeInsertedClosing = function (cursor, line) {
        return context.maybeInsertedBrackets > 0 && cursor.row === context.maybeInsertedRow && line.substr(cursor.column) === context.maybeInsertedLineEnd && line.substr(0, cursor.column) == context.maybeInsertedLineStart;
    };

    CstyleBehaviour.popAutoInsertedClosing = function () {
        context.autoInsertedLineEnd = context.autoInsertedLineEnd.substr(1);
        context.autoInsertedBrackets--;
    };

    CstyleBehaviour.clearMaybeInsertedClosing = function () {
        if (context) {
            context.maybeInsertedBrackets = 0;
            context.maybeInsertedRow = -1;
        }
    };

    oop.inherits(CstyleBehaviour, Behaviour);

    exports.CstyleBehaviour = CstyleBehaviour;
});

define("ace/mode/folding/cstyle", ["require", "exports", "module", "ace/lib/oop", "ace/range", "ace/mode/folding/fold_mode"], function (require, exports, module) {
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

define("ace/mode/json", ["require", "exports", "module", "ace/lib/oop", "ace/mode/text", "ace/mode/json_highlight_rules", "ace/mode/matching_brace_outdent", "ace/mode/behaviour/cstyle", "ace/mode/folding/cstyle", "ace/worker/worker_client"], function (require, exports, module) {
    "use strict";

    var oop = require("../lib/oop");
    var TextMode = require("./text").Mode;
    var HighlightRules = require("./json_highlight_rules").JsonHighlightRules;
    var MatchingBraceOutdent = require("./matching_brace_outdent").MatchingBraceOutdent;
    var CstyleBehaviour = require("./behaviour/cstyle").CstyleBehaviour;
    var CStyleFoldMode = require("./folding/cstyle").FoldMode;
    var WorkerClient = require("../worker/worker_client").WorkerClient;

    var Mode = function Mode() {
        this.HighlightRules = HighlightRules;
        this.$outdent = new MatchingBraceOutdent();
        this.$behaviour = new CstyleBehaviour();
        this.foldingRules = new CStyleFoldMode();
    };
    oop.inherits(Mode, TextMode);

    (function () {

        this.getNextLineIndent = function (state, line, tab) {
            var indent = this.$getIndent(line);

            if (state == "start") {
                var match = line.match(/^.*[\{\(\[]\s*$/);
                if (match) {
                    indent += tab;
                }
            }

            return indent;
        };

        this.checkOutdent = function (state, line, input) {
            return this.$outdent.checkOutdent(line, input);
        };

        this.autoOutdent = function (state, doc, row) {
            this.$outdent.autoOutdent(doc, row);
        };

        this.createWorker = function (session) {
            var worker = new WorkerClient(["ace"], "ace/mode/json_worker", "JsonWorker");
            worker.attachToDocument(session.getDocument());

            worker.on("error", function (e) {
                session.setAnnotations([e.data]);
            });

            worker.on("ok", function () {
                session.clearAnnotations();
            });

            return worker;
        };

        this.$id = "ace/mode/json";
    }).call(Mode.prototype);

    exports.Mode = Mode;
});