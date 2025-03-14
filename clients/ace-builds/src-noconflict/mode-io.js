"use strict";

ace.define("ace/mode/io_highlight_rules", ["require", "exports", "module", "ace/lib/oop", "ace/mode/text_highlight_rules"], function (require, exports, module) {
    "use strict";

    var oop = require("../lib/oop");
    var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;

    var IoHighlightRules = function IoHighlightRules() {

        this.$rules = { start: [{ token: ['text', 'meta.empty-parenthesis.io'],
                regex: '(\\()(\\))',
                comment: 'we match this to overload return inside () --Allan; scoping rules for what gets the scope have changed, so we now group the ) instead of the ( -- Rob' }, { token: ['text', 'meta.comma-parenthesis.io'],
                regex: '(\\,)(\\))',
                comment: 'We want to do the same for ,) -- Seckar; same as above -- Rob' }, { token: 'keyword.control.io',
                regex: '\\b(?:if|ifTrue|ifFalse|ifTrueIfFalse|for|loop|reverseForeach|foreach|map|continue|break|while|do|return)\\b' }, { token: 'punctuation.definition.comment.io',
                regex: '/\\*',
                push: [{ token: 'punctuation.definition.comment.io',
                    regex: '\\*/',
                    next: 'pop' }, { defaultToken: 'comment.block.io' }] }, { token: 'punctuation.definition.comment.io',
                regex: '//',
                push: [{ token: 'comment.line.double-slash.io',
                    regex: '$',
                    next: 'pop' }, { defaultToken: 'comment.line.double-slash.io' }] }, { token: 'punctuation.definition.comment.io',
                regex: '#',
                push: [{ token: 'comment.line.number-sign.io', regex: '$', next: 'pop' }, { defaultToken: 'comment.line.number-sign.io' }] }, { token: 'variable.language.io',
                regex: '\\b(?:self|sender|target|proto|protos|parent)\\b',
                comment: 'I wonder if some of this isn\'t variable.other.language? --Allan; scoping this as variable.language to match Objective-C\'s handling of \'self\', which is inconsistent with C++\'s handling of \'this\' but perhaps intentionally so -- Rob' }, { token: 'keyword.operator.io',
                regex: '<=|>=|=|:=|\\*|\\||\\|\\||\\+|-|/|&|&&|>|<|\\?|@|@@|\\b(?:and|or)\\b' }, { token: 'constant.other.io', regex: '\\bGL[\\w_]+\\b' }, { token: 'support.class.io', regex: '\\b[A-Z](?:\\w+)?\\b' }, { token: 'support.function.io',
                regex: '\\b(?:clone|call|init|method|list|vector|block|\\w+(?=\\s*\\())\\b' }, { token: 'support.function.open-gl.io',
                regex: '\\bgl(?:u|ut)?[A-Z]\\w+\\b' }, { token: 'punctuation.definition.string.begin.io',
                regex: '"""',
                push: [{ token: 'punctuation.definition.string.end.io',
                    regex: '"""',
                    next: 'pop' }, { token: 'constant.character.escape.io', regex: '\\\\.' }, { defaultToken: 'string.quoted.triple.io' }] }, { token: 'punctuation.definition.string.begin.io',
                regex: '"',
                push: [{ token: 'punctuation.definition.string.end.io',
                    regex: '"',
                    next: 'pop' }, { token: 'constant.character.escape.io', regex: '\\\\.' }, { defaultToken: 'string.quoted.double.io' }] }, { token: 'constant.numeric.io',
                regex: '\\b(?:0(?:x|X)[0-9a-fA-F]*|(?:[0-9]+\\.?[0-9]*|\\.[0-9]+)(?:(?:e|E)(?:\\+|-)?[0-9]+)?)(?:L|l|UL|ul|u|U|F|f)?\\b' }, { token: 'variable.other.global.io', regex: 'Lobby\\b' }, { token: 'constant.language.io',
                regex: '\\b(?:TRUE|true|FALSE|false|NULL|null|Null|Nil|nil|YES|NO)\\b' }] };

        this.normalizeRules();
    };

    IoHighlightRules.metaData = { fileTypes: ['io'],
        keyEquivalent: '^~I',
        name: 'Io',
        scopeName: 'source.io' };

    oop.inherits(IoHighlightRules, TextHighlightRules);

    exports.IoHighlightRules = IoHighlightRules;
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

ace.define("ace/mode/io", ["require", "exports", "module", "ace/lib/oop", "ace/mode/text", "ace/tokenizer", "ace/mode/io_highlight_rules", "ace/mode/folding/cstyle"], function (require, exports, module) {
    "use strict";

    var oop = require("../lib/oop");
    var TextMode = require("./text").Mode;
    var Tokenizer = require("../tokenizer").Tokenizer;
    var IoHighlightRules = require("./io_highlight_rules").IoHighlightRules;
    var FoldMode = require("./folding/cstyle").FoldMode;

    var Mode = function Mode() {
        this.HighlightRules = IoHighlightRules;
        this.foldingRules = new FoldMode();
    };
    oop.inherits(Mode, TextMode);

    (function () {
        this.lineCommentStart = "//";
        this.blockComment = { start: "/*", end: "*/" };
        this.$id = "ace/mode/io";
    }).call(Mode.prototype);

    exports.Mode = Mode;
});