"use strict";

define("ace/mode/css_highlight_rules", ["require", "exports", "module", "ace/lib/oop", "ace/lib/lang", "ace/mode/text_highlight_rules"], function (require, exports, module) {
    "use strict";

    var oop = require("../lib/oop");
    var lang = require("../lib/lang");
    var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;
    var supportType = exports.supportType = "animation-fill-mode|alignment-adjust|alignment-baseline|animation-delay|animation-direction|animation-duration|animation-iteration-count|animation-name|animation-play-state|animation-timing-function|animation|appearance|azimuth|backface-visibility|background-attachment|background-break|background-clip|background-color|background-image|background-origin|background-position|background-repeat|background-size|background|baseline-shift|binding|bleed|bookmark-label|bookmark-level|bookmark-state|bookmark-target|border-bottom|border-bottom-color|border-bottom-left-radius|border-bottom-right-radius|border-bottom-style|border-bottom-width|border-collapse|border-color|border-image|border-image-outset|border-image-repeat|border-image-slice|border-image-source|border-image-width|border-left|border-left-color|border-left-style|border-left-width|border-radius|border-right|border-right-color|border-right-style|border-right-width|border-spacing|border-style|border-top|border-top-color|border-top-left-radius|border-top-right-radius|border-top-style|border-top-width|border-width|border|bottom|box-align|box-decoration-break|box-direction|box-flex-group|box-flex|box-lines|box-ordinal-group|box-orient|box-pack|box-shadow|box-sizing|break-after|break-before|break-inside|caption-side|clear|clip|color-profile|color|column-count|column-fill|column-gap|column-rule|column-rule-color|column-rule-style|column-rule-width|column-span|column-width|columns|content|counter-increment|counter-reset|crop|cue-after|cue-before|cue|cursor|direction|display|dominant-baseline|drop-initial-after-adjust|drop-initial-after-align|drop-initial-before-adjust|drop-initial-before-align|drop-initial-size|drop-initial-value|elevation|empty-cells|fit|fit-position|float-offset|float|font-family|font-size|font-size-adjust|font-stretch|font-style|font-variant|font-weight|font|grid-columns|grid-rows|hanging-punctuation|height|hyphenate-after|hyphenate-before|hyphenate-character|hyphenate-lines|hyphenate-resource|hyphens|icon|image-orientation|image-rendering|image-resolution|inline-box-align|left|letter-spacing|line-height|line-stacking-ruby|line-stacking-shift|line-stacking-strategy|line-stacking|list-style-image|list-style-position|list-style-type|list-style|margin-bottom|margin-left|margin-right|margin-top|margin|mark-after|mark-before|mark|marks|marquee-direction|marquee-play-count|marquee-speed|marquee-style|max-height|max-width|min-height|min-width|move-to|nav-down|nav-index|nav-left|nav-right|nav-up|opacity|orphans|outline-color|outline-offset|outline-style|outline-width|outline|overflow-style|overflow-x|overflow-y|overflow|padding-bottom|padding-left|padding-right|padding-top|padding|page-break-after|page-break-before|page-break-inside|page-policy|page|pause-after|pause-before|pause|perspective-origin|perspective|phonemes|pitch-range|pitch|play-during|pointer-events|position|presentation-level|punctuation-trim|quotes|rendering-intent|resize|rest-after|rest-before|rest|richness|right|rotation-point|rotation|ruby-align|ruby-overhang|ruby-position|ruby-span|size|speak-header|speak-numeral|speak-punctuation|speak|speech-rate|stress|string-set|table-layout|target-name|target-new|target-position|target|text-align-last|text-align|text-decoration|text-emphasis|text-height|text-indent|text-justify|text-outline|text-shadow|text-transform|text-wrap|top|transform-origin|transform-style|transform|transition-delay|transition-duration|transition-property|transition-timing-function|transition|unicode-bidi|vertical-align|visibility|voice-balance|voice-duration|voice-family|voice-pitch-range|voice-pitch|voice-rate|voice-stress|voice-volume|volume|white-space-collapse|white-space|widows|width|word-break|word-spacing|word-wrap|z-index";
    var supportFunction = exports.supportFunction = "rgb|rgba|url|attr|counter|counters";
    var supportConstant = exports.supportConstant = "absolute|after-edge|after|all-scroll|all|alphabetic|always|antialiased|armenian|auto|avoid-column|avoid-page|avoid|balance|baseline|before-edge|before|below|bidi-override|block-line-height|block|bold|bolder|border-box|both|bottom|box|break-all|break-word|capitalize|caps-height|caption|center|central|char|circle|cjk-ideographic|clone|close-quote|col-resize|collapse|column|consider-shifts|contain|content-box|cover|crosshair|cubic-bezier|dashed|decimal-leading-zero|decimal|default|disabled|disc|disregard-shifts|distribute-all-lines|distribute-letter|distribute-space|distribute|dotted|double|e-resize|ease-in|ease-in-out|ease-out|ease|ellipsis|end|exclude-ruby|fill|fixed|georgian|glyphs|grid-height|groove|hand|hanging|hebrew|help|hidden|hiragana-iroha|hiragana|horizontal|icon|ideograph-alpha|ideograph-numeric|ideograph-parenthesis|ideograph-space|ideographic|inactive|include-ruby|inherit|initial|inline-block|inline-box|inline-line-height|inline-table|inline|inset|inside|inter-ideograph|inter-word|invert|italic|justify|katakana-iroha|katakana|keep-all|last|left|lighter|line-edge|line-through|line|linear|list-item|local|loose|lower-alpha|lower-greek|lower-latin|lower-roman|lowercase|lr-tb|ltr|mathematical|max-height|max-size|medium|menu|message-box|middle|move|n-resize|ne-resize|newspaper|no-change|no-close-quote|no-drop|no-open-quote|no-repeat|none|normal|not-allowed|nowrap|nw-resize|oblique|open-quote|outset|outside|overline|padding-box|page|pointer|pre-line|pre-wrap|pre|preserve-3d|progress|relative|repeat-x|repeat-y|repeat|replaced|reset-size|ridge|right|round|row-resize|rtl|s-resize|scroll|se-resize|separate|slice|small-caps|small-caption|solid|space|square|start|static|status-bar|step-end|step-start|steps|stretch|strict|sub|super|sw-resize|table-caption|table-cell|table-column-group|table-column|table-footer-group|table-header-group|table-row-group|table-row|table|tb-rl|text-after-edge|text-before-edge|text-bottom|text-size|text-top|text|thick|thin|transparent|underline|upper-alpha|upper-latin|upper-roman|uppercase|use-script|vertical-ideographic|vertical-text|visible|w-resize|wait|whitespace|z-index|zero";
    var supportConstantColor = exports.supportConstantColor = "aqua|black|blue|fuchsia|gray|green|lime|maroon|navy|olive|orange|purple|red|silver|teal|white|yellow";
    var supportConstantFonts = exports.supportConstantFonts = "arial|century|comic|courier|garamond|georgia|helvetica|impact|lucida|symbol|system|tahoma|times|trebuchet|utopia|verdana|webdings|sans-serif|serif|monospace";

    var numRe = exports.numRe = "\\-?(?:(?:[0-9]+)|(?:[0-9]*\\.[0-9]+))";
    var pseudoElements = exports.pseudoElements = "(\\:+)\\b(after|before|first-letter|first-line|moz-selection|selection)\\b";
    var pseudoClasses = exports.pseudoClasses = "(:)\\b(active|checked|disabled|empty|enabled|first-child|first-of-type|focus|hover|indeterminate|invalid|last-child|last-of-type|link|not|nth-child|nth-last-child|nth-last-of-type|nth-of-type|only-child|only-of-type|required|root|target|valid|visited)\\b";

    var CssHighlightRules = function CssHighlightRules() {

        var keywordMapper = this.createKeywordMapper({
            "support.function": supportFunction,
            "support.constant": supportConstant,
            "support.type": supportType,
            "support.constant.color": supportConstantColor,
            "support.constant.fonts": supportConstantFonts
        }, "text", true);

        this.$rules = {
            "start": [{
                token: "comment", // multi line comment
                regex: "\\/\\*",
                push: "comment"
            }, {
                token: "paren.lparen",
                regex: "\\{",
                push: "ruleset"
            }, {
                token: "string",
                regex: "@.*?{",
                push: "media"
            }, {
                token: "keyword",
                regex: "#[a-z0-9-_]+"
            }, {
                token: "variable",
                regex: "\\.[a-z0-9-_]+"
            }, {
                token: "string",
                regex: ":[a-z0-9-_]+"
            }, {
                token: "constant",
                regex: "[a-z0-9-_]+"
            }, {
                caseInsensitive: true
            }],

            "media": [{
                token: "comment", // multi line comment
                regex: "\\/\\*",
                push: "comment"
            }, {
                token: "paren.lparen",
                regex: "\\{",
                push: "ruleset"
            }, {
                token: "string",
                regex: "\\}",
                next: "pop"
            }, {
                token: "keyword",
                regex: "#[a-z0-9-_]+"
            }, {
                token: "variable",
                regex: "\\.[a-z0-9-_]+"
            }, {
                token: "string",
                regex: ":[a-z0-9-_]+"
            }, {
                token: "constant",
                regex: "[a-z0-9-_]+"
            }, {
                caseInsensitive: true
            }],

            "comment": [{
                token: "comment",
                regex: "\\*\\/",
                next: "pop"
            }, {
                defaultToken: "comment"
            }],

            "ruleset": [{
                token: "paren.rparen",
                regex: "\\}",
                next: "pop"
            }, {
                token: "comment", // multi line comment
                regex: "\\/\\*",
                push: "comment"
            }, {
                token: "string", // single line
                regex: '["](?:(?:\\\\.)|(?:[^"\\\\]))*?["]'
            }, {
                token: "string", // single line
                regex: "['](?:(?:\\\\.)|(?:[^'\\\\]))*?[']"
            }, {
                token: ["constant.numeric", "keyword"],
                regex: "(" + numRe + ")(ch|cm|deg|em|ex|fr|gd|grad|Hz|in|kHz|mm|ms|pc|pt|px|rad|rem|s|turn|vh|vm|vw|%)"
            }, {
                token: "constant.numeric",
                regex: numRe
            }, {
                token: "constant.numeric", // hex6 color
                regex: "#[a-f0-9]{6}"
            }, {
                token: "constant.numeric", // hex3 color
                regex: "#[a-f0-9]{3}"
            }, {
                token: ["punctuation", "entity.other.attribute-name.pseudo-element.css"],
                regex: pseudoElements
            }, {
                token: ["punctuation", "entity.other.attribute-name.pseudo-class.css"],
                regex: pseudoClasses
            }, {
                token: ["support.function", "string", "support.function"],
                regex: "(url\\()(.*)(\\))"
            }, {
                token: keywordMapper,
                regex: "\\-?[a-zA-Z_][a-zA-Z0-9_\\-]*"
            }, {
                caseInsensitive: true
            }]
        };

        this.normalizeRules();
    };

    oop.inherits(CssHighlightRules, TextHighlightRules);

    exports.CssHighlightRules = CssHighlightRules;
});

define("ace/mode/doc_comment_highlight_rules", ["require", "exports", "module", "ace/lib/oop", "ace/mode/text_highlight_rules"], function (require, exports, module) {
    "use strict";

    var oop = require("../lib/oop");
    var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;

    var DocCommentHighlightRules = function DocCommentHighlightRules() {
        this.$rules = {
            "start": [{
                token: "comment.doc.tag",
                regex: "@[\\w\\d_]+" // TODO: fix email addresses
            }, DocCommentHighlightRules.getTagRule(), {
                defaultToken: "comment.doc",
                caseInsensitive: true
            }]
        };
    };

    oop.inherits(DocCommentHighlightRules, TextHighlightRules);

    DocCommentHighlightRules.getTagRule = function (start) {
        return {
            token: "comment.doc.tag.storage.type",
            regex: "\\b(?:TODO|FIXME|XXX|HACK)\\b"
        };
    };

    DocCommentHighlightRules.getStartRule = function (start) {
        return {
            token: "comment.doc", // doc comment
            regex: "\\/\\*(?=\\*)",
            next: start
        };
    };

    DocCommentHighlightRules.getEndRule = function (start) {
        return {
            token: "comment.doc", // closing comment
            regex: "\\*\\/",
            next: start
        };
    };

    exports.DocCommentHighlightRules = DocCommentHighlightRules;
});

define("ace/mode/javascript_highlight_rules", ["require", "exports", "module", "ace/lib/oop", "ace/mode/doc_comment_highlight_rules", "ace/mode/text_highlight_rules"], function (require, exports, module) {
    "use strict";

    var oop = require("../lib/oop");
    var DocCommentHighlightRules = require("./doc_comment_highlight_rules").DocCommentHighlightRules;
    var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;

    var JavaScriptHighlightRules = function JavaScriptHighlightRules(options) {
        var keywordMapper = this.createKeywordMapper({
            "variable.language": "Array|Boolean|Date|Function|Iterator|Number|Object|RegExp|String|Proxy|" + // Constructors
            "Namespace|QName|XML|XMLList|" + // E4X
            "ArrayBuffer|Float32Array|Float64Array|Int16Array|Int32Array|Int8Array|" + "Uint16Array|Uint32Array|Uint8Array|Uint8ClampedArray|" + "Error|EvalError|InternalError|RangeError|ReferenceError|StopIteration|" + // Errors
            "SyntaxError|TypeError|URIError|" + "decodeURI|decodeURIComponent|encodeURI|encodeURIComponent|eval|isFinite|" + // Non-constructor functions
            "isNaN|parseFloat|parseInt|" + "JSON|Math|" + // Other
            "this|arguments|prototype|window|document", // Pseudo
            "keyword": "const|yield|import|get|set|" + "break|case|catch|continue|default|delete|do|else|finally|for|function|" + "if|in|instanceof|new|return|switch|throw|try|typeof|let|var|while|with|debugger|" + "__parent__|__count__|escape|unescape|with|__proto__|" + "class|enum|extends|super|export|implements|private|public|interface|package|protected|static",
            "storage.type": "const|let|var|function",
            "constant.language": "null|Infinity|NaN|undefined",
            "support.function": "alert",
            "constant.language.boolean": "true|false"
        }, "identifier");
        var kwBeforeRe = "case|do|else|finally|in|instanceof|return|throw|try|typeof|yield|void";
        var identifierRe = "[a-zA-Z\\$_\xA1-\uFFFF][a-zA-Z\\d\\$_\xA1-\uFFFF]*\\b";

        var escapedRe = "\\\\(?:x[0-9a-fA-F]{2}|" + // hex
        "u[0-9a-fA-F]{4}|" + // unicode
        "[0-2][0-7]{0,2}|" + // oct
        "3[0-6][0-7]?|" + // oct
        "37[0-7]?|" + // oct
        "[4-7][0-7]?|" + //oct
        ".)";

        this.$rules = {
            "no_regex": [{
                token: "comment",
                regex: "\\/\\/",
                next: "line_comment"
            }, DocCommentHighlightRules.getStartRule("doc-start"), {
                token: "comment", // multi line comment
                regex: /\/\*/,
                next: "comment"
            }, {
                token: "string",
                regex: "'(?=.)",
                next: "qstring"
            }, {
                token: "string",
                regex: '"(?=.)',
                next: "qqstring"
            }, {
                token: "constant.numeric", // hex
                regex: /0[xX][0-9a-fA-F]+\b/
            }, {
                token: "constant.numeric", // float
                regex: /[+-]?\d+(?:(?:\.\d*)?(?:[eE][+-]?\d+)?)?\b/
            }, {
                token: ["storage.type", "punctuation.operator", "support.function", "punctuation.operator", "entity.name.function", "text", "keyword.operator"],
                regex: "(" + identifierRe + ")(\\.)(prototype)(\\.)(" + identifierRe + ")(\\s*)(=)",
                next: "function_arguments"
            }, {
                token: ["storage.type", "punctuation.operator", "entity.name.function", "text", "keyword.operator", "text", "storage.type", "text", "paren.lparen"],
                regex: "(" + identifierRe + ")(\\.)(" + identifierRe + ")(\\s*)(=)(\\s*)(function)(\\s*)(\\()",
                next: "function_arguments"
            }, {
                token: ["entity.name.function", "text", "keyword.operator", "text", "storage.type", "text", "paren.lparen"],
                regex: "(" + identifierRe + ")(\\s*)(=)(\\s*)(function)(\\s*)(\\()",
                next: "function_arguments"
            }, {
                token: ["storage.type", "punctuation.operator", "entity.name.function", "text", "keyword.operator", "text", "storage.type", "text", "entity.name.function", "text", "paren.lparen"],
                regex: "(" + identifierRe + ")(\\.)(" + identifierRe + ")(\\s*)(=)(\\s*)(function)(\\s+)(\\w+)(\\s*)(\\()",
                next: "function_arguments"
            }, {
                token: ["storage.type", "text", "entity.name.function", "text", "paren.lparen"],
                regex: "(function)(\\s+)(" + identifierRe + ")(\\s*)(\\()",
                next: "function_arguments"
            }, {
                token: ["entity.name.function", "text", "punctuation.operator", "text", "storage.type", "text", "paren.lparen"],
                regex: "(" + identifierRe + ")(\\s*)(:)(\\s*)(function)(\\s*)(\\()",
                next: "function_arguments"
            }, {
                token: ["text", "text", "storage.type", "text", "paren.lparen"],
                regex: "(:)(\\s*)(function)(\\s*)(\\()",
                next: "function_arguments"
            }, {
                token: "keyword",
                regex: "(?:" + kwBeforeRe + ")\\b",
                next: "start"
            }, {
                token: ["punctuation.operator", "support.function"],
                regex: /(\.)(s(?:h(?:ift|ow(?:Mod(?:elessDialog|alDialog)|Help))|croll(?:X|By(?:Pages|Lines)?|Y|To)?|t(?:op|rike)|i(?:n|zeToContent|debar|gnText)|ort|u(?:p|b(?:str(?:ing)?)?)|pli(?:ce|t)|e(?:nd|t(?:Re(?:sizable|questHeader)|M(?:i(?:nutes|lliseconds)|onth)|Seconds|Ho(?:tKeys|urs)|Year|Cursor|Time(?:out)?|Interval|ZOptions|Date|UTC(?:M(?:i(?:nutes|lliseconds)|onth)|Seconds|Hours|Date|FullYear)|FullYear|Active)|arch)|qrt|lice|avePreferences|mall)|h(?:ome|andleEvent)|navigate|c(?:har(?:CodeAt|At)|o(?:s|n(?:cat|textual|firm)|mpile)|eil|lear(?:Timeout|Interval)?|a(?:ptureEvents|ll)|reate(?:StyleSheet|Popup|EventObject))|t(?:o(?:GMTString|S(?:tring|ource)|U(?:TCString|pperCase)|Lo(?:caleString|werCase))|est|a(?:n|int(?:Enabled)?))|i(?:s(?:NaN|Finite)|ndexOf|talics)|d(?:isableExternalCapture|ump|etachEvent)|u(?:n(?:shift|taint|escape|watch)|pdateCommands)|j(?:oin|avaEnabled)|p(?:o(?:p|w)|ush|lugins.refresh|a(?:ddings|rse(?:Int|Float)?)|r(?:int|ompt|eference))|e(?:scape|nableExternalCapture|val|lementFromPoint|x(?:p|ec(?:Script|Command)?))|valueOf|UTC|queryCommand(?:State|Indeterm|Enabled|Value)|f(?:i(?:nd|le(?:ModifiedDate|Size|CreatedDate|UpdatedDate)|xed)|o(?:nt(?:size|color)|rward)|loor|romCharCode)|watch|l(?:ink|o(?:ad|g)|astIndexOf)|a(?:sin|nchor|cos|t(?:tachEvent|ob|an(?:2)?)|pply|lert|b(?:s|ort))|r(?:ou(?:nd|teEvents)|e(?:size(?:By|To)|calc|turnValue|place|verse|l(?:oad|ease(?:Capture|Events)))|andom)|g(?:o|et(?:ResponseHeader|M(?:i(?:nutes|lliseconds)|onth)|Se(?:conds|lection)|Hours|Year|Time(?:zoneOffset)?|Da(?:y|te)|UTC(?:M(?:i(?:nutes|lliseconds)|onth)|Seconds|Hours|Da(?:y|te)|FullYear)|FullYear|A(?:ttention|llResponseHeaders)))|m(?:in|ove(?:B(?:y|elow)|To(?:Absolute)?|Above)|ergeAttributes|a(?:tch|rgins|x))|b(?:toa|ig|o(?:ld|rderWidths)|link|ack))\b(?=\()/
            }, {
                token: ["punctuation.operator", "support.function.dom"],
                regex: /(\.)(s(?:ub(?:stringData|mit)|plitText|e(?:t(?:NamedItem|Attribute(?:Node)?)|lect))|has(?:ChildNodes|Feature)|namedItem|c(?:l(?:ick|o(?:se|neNode))|reate(?:C(?:omment|DATASection|aption)|T(?:Head|extNode|Foot)|DocumentFragment|ProcessingInstruction|E(?:ntityReference|lement)|Attribute))|tabIndex|i(?:nsert(?:Row|Before|Cell|Data)|tem)|open|delete(?:Row|C(?:ell|aption)|T(?:Head|Foot)|Data)|focus|write(?:ln)?|a(?:dd|ppend(?:Child|Data))|re(?:set|place(?:Child|Data)|move(?:NamedItem|Child|Attribute(?:Node)?)?)|get(?:NamedItem|Element(?:sBy(?:Name|TagName)|ById)|Attribute(?:Node)?)|blur)\b(?=\()/
            }, {
                token: ["punctuation.operator", "support.constant"],
                regex: /(\.)(s(?:ystemLanguage|cr(?:ipts|ollbars|een(?:X|Y|Top|Left))|t(?:yle(?:Sheets)?|atus(?:Text|bar)?)|ibling(?:Below|Above)|ource|uffixes|e(?:curity(?:Policy)?|l(?:ection|f)))|h(?:istory|ost(?:name)?|as(?:h|Focus))|y|X(?:MLDocument|SLDocument)|n(?:ext|ame(?:space(?:s|URI)|Prop))|M(?:IN_VALUE|AX_VALUE)|c(?:haracterSet|o(?:n(?:structor|trollers)|okieEnabled|lorDepth|mp(?:onents|lete))|urrent|puClass|l(?:i(?:p(?:boardData)?|entInformation)|osed|asses)|alle(?:e|r)|rypto)|t(?:o(?:olbar|p)|ext(?:Transform|Indent|Decoration|Align)|ags)|SQRT(?:1_2|2)|i(?:n(?:ner(?:Height|Width)|put)|ds|gnoreCase)|zIndex|o(?:scpu|n(?:readystatechange|Line)|uter(?:Height|Width)|p(?:sProfile|ener)|ffscreenBuffering)|NEGATIVE_INFINITY|d(?:i(?:splay|alog(?:Height|Top|Width|Left|Arguments)|rectories)|e(?:scription|fault(?:Status|Ch(?:ecked|arset)|View)))|u(?:ser(?:Profile|Language|Agent)|n(?:iqueID|defined)|pdateInterval)|_content|p(?:ixelDepth|ort|ersonalbar|kcs11|l(?:ugins|atform)|a(?:thname|dding(?:Right|Bottom|Top|Left)|rent(?:Window|Layer)?|ge(?:X(?:Offset)?|Y(?:Offset)?))|r(?:o(?:to(?:col|type)|duct(?:Sub)?|mpter)|e(?:vious|fix)))|e(?:n(?:coding|abledPlugin)|x(?:ternal|pando)|mbeds)|v(?:isibility|endor(?:Sub)?|Linkcolor)|URLUnencoded|P(?:I|OSITIVE_INFINITY)|f(?:ilename|o(?:nt(?:Size|Family|Weight)|rmName)|rame(?:s|Element)|gColor)|E|whiteSpace|l(?:i(?:stStyleType|n(?:eHeight|kColor))|o(?:ca(?:tion(?:bar)?|lName)|wsrc)|e(?:ngth|ft(?:Context)?)|a(?:st(?:M(?:odified|atch)|Index|Paren)|yer(?:s|X)|nguage))|a(?:pp(?:MinorVersion|Name|Co(?:deName|re)|Version)|vail(?:Height|Top|Width|Left)|ll|r(?:ity|guments)|Linkcolor|bove)|r(?:ight(?:Context)?|e(?:sponse(?:XML|Text)|adyState))|global|x|m(?:imeTypes|ultiline|enubar|argin(?:Right|Bottom|Top|Left))|L(?:N(?:10|2)|OG(?:10E|2E))|b(?:o(?:ttom|rder(?:Width|RightWidth|BottomWidth|Style|Color|TopWidth|LeftWidth))|ufferDepth|elow|ackground(?:Color|Image)))\b/
            }, {
                token: ["support.constant"],
                regex: /that\b/
            }, {
                token: ["storage.type", "punctuation.operator", "support.function.firebug"],
                regex: /(console)(\.)(warn|info|log|error|time|trace|timeEnd|assert)\b/
            }, {
                token: keywordMapper,
                regex: identifierRe
            }, {
                token: "keyword.operator",
                regex: /--|\+\+|===|==|=|!=|!==|<=|>=|<<=|>>=|>>>=|<>|<|>|!|&&|\|\||\?\:|[!$%&*+\-~\/^]=?/,
                next: "start"
            }, {
                token: "punctuation.operator",
                regex: /[?:,;.]/,
                next: "start"
            }, {
                token: "paren.lparen",
                regex: /[\[({]/,
                next: "start"
            }, {
                token: "paren.rparen",
                regex: /[\])}]/
            }, {
                token: "comment",
                regex: /^#!.*$/
            }],
            "start": [DocCommentHighlightRules.getStartRule("doc-start"), {
                token: "comment", // multi line comment
                regex: "\\/\\*",
                next: "comment_regex_allowed"
            }, {
                token: "comment",
                regex: "\\/\\/",
                next: "line_comment_regex_allowed"
            }, {
                token: "string.regexp",
                regex: "\\/",
                next: "regex"
            }, {
                token: "text",
                regex: "\\s+|^$",
                next: "start"
            }, {
                token: "empty",
                regex: "",
                next: "no_regex"
            }],
            "regex": [{
                token: "regexp.keyword.operator",
                regex: "\\\\(?:u[\\da-fA-F]{4}|x[\\da-fA-F]{2}|.)"
            }, {
                token: "string.regexp",
                regex: "/[sxngimy]*",
                next: "no_regex"
            }, {
                token: "invalid",
                regex: /\{\d+\b,?\d*\}[+*]|[+*$^?][+*]|[$^][?]|\?{3,}/
            }, {
                token: "constant.language.escape",
                regex: /\(\?[:=!]|\)|\{\d+\b,?\d*\}|[+*]\?|[()$^+*?.]/
            }, {
                token: "constant.language.delimiter",
                regex: /\|/
            }, {
                token: "constant.language.escape",
                regex: /\[\^?/,
                next: "regex_character_class"
            }, {
                token: "empty",
                regex: "$",
                next: "no_regex"
            }, {
                defaultToken: "string.regexp"
            }],
            "regex_character_class": [{
                token: "regexp.charclass.keyword.operator",
                regex: "\\\\(?:u[\\da-fA-F]{4}|x[\\da-fA-F]{2}|.)"
            }, {
                token: "constant.language.escape",
                regex: "]",
                next: "regex"
            }, {
                token: "constant.language.escape",
                regex: "-"
            }, {
                token: "empty",
                regex: "$",
                next: "no_regex"
            }, {
                defaultToken: "string.regexp.charachterclass"
            }],
            "function_arguments": [{
                token: "variable.parameter",
                regex: identifierRe
            }, {
                token: "punctuation.operator",
                regex: "[, ]+"
            }, {
                token: "punctuation.operator",
                regex: "$"
            }, {
                token: "empty",
                regex: "",
                next: "no_regex"
            }],
            "comment_regex_allowed": [DocCommentHighlightRules.getTagRule(), { token: "comment", regex: "\\*\\/", next: "start" }, { defaultToken: "comment", caseInsensitive: true }],
            "comment": [DocCommentHighlightRules.getTagRule(), { token: "comment", regex: "\\*\\/", next: "no_regex" }, { defaultToken: "comment", caseInsensitive: true }],
            "line_comment_regex_allowed": [DocCommentHighlightRules.getTagRule(), { token: "comment", regex: "$|^", next: "start" }, { defaultToken: "comment", caseInsensitive: true }],
            "line_comment": [DocCommentHighlightRules.getTagRule(), { token: "comment", regex: "$|^", next: "no_regex" }, { defaultToken: "comment", caseInsensitive: true }],
            "qqstring": [{
                token: "constant.language.escape",
                regex: escapedRe
            }, {
                token: "string",
                regex: "\\\\$",
                next: "qqstring"
            }, {
                token: "string",
                regex: '"|$',
                next: "no_regex"
            }, {
                defaultToken: "string"
            }],
            "qstring": [{
                token: "constant.language.escape",
                regex: escapedRe
            }, {
                token: "string",
                regex: "\\\\$",
                next: "qstring"
            }, {
                token: "string",
                regex: "'|$",
                next: "no_regex"
            }, {
                defaultToken: "string"
            }]
        };

        if (!options || !options.noES6) {
            this.$rules.no_regex.unshift({
                regex: "[{}]", onMatch: function onMatch(val, state, stack) {
                    this.next = val == "{" ? this.nextState : "";
                    if (val == "{" && stack.length) {
                        stack.unshift("start", state);
                        return "paren";
                    }
                    if (val == "}" && stack.length) {
                        stack.shift();
                        this.next = stack.shift();
                        if (this.next.indexOf("string") != -1) return "paren.quasi.end";
                    }
                    return val == "{" ? "paren.lparen" : "paren.rparen";
                },
                nextState: "start"
            }, {
                token: "string.quasi.start",
                regex: /`/,
                push: [{
                    token: "constant.language.escape",
                    regex: escapedRe
                }, {
                    token: "paren.quasi.start",
                    regex: /\${/,
                    push: "start"
                }, {
                    token: "string.quasi.end",
                    regex: /`/,
                    next: "pop"
                }, {
                    defaultToken: "string.quasi"
                }]
            });
        }

        this.embedRules(DocCommentHighlightRules, "doc-", [DocCommentHighlightRules.getEndRule("no_regex")]);

        this.normalizeRules();
    };

    oop.inherits(JavaScriptHighlightRules, TextHighlightRules);

    exports.JavaScriptHighlightRules = JavaScriptHighlightRules;
});

define("ace/mode/xml_highlight_rules", ["require", "exports", "module", "ace/lib/oop", "ace/mode/text_highlight_rules"], function (require, exports, module) {
    "use strict";

    var oop = require("../lib/oop");
    var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;

    var XmlHighlightRules = function XmlHighlightRules(normalize) {
        this.$rules = {
            start: [{ token: "string.cdata.xml", regex: "<\\!\\[CDATA\\[", next: "cdata" }, {
                token: ["punctuation.xml-decl.xml", "keyword.xml-decl.xml"],
                regex: "(<\\?)(xml)(?=[\\s])", next: "xml_decl", caseInsensitive: true
            }, {
                token: ["punctuation.instruction.xml", "keyword.instruction.xml"],
                regex: "(<\\?)([-_a-zA-Z0-9]+)", next: "processing_instruction"
            }, { token: "comment.xml", regex: "<\\!--", next: "comment" }, {
                token: ["xml-pe.doctype.xml", "xml-pe.doctype.xml"],
                regex: "(<\\!)(DOCTYPE)(?=[\\s])", next: "doctype", caseInsensitive: true
            }, { include: "tag" }, { token: "text.end-tag-open.xml", regex: "</" }, { token: "text.tag-open.xml", regex: "<" }, { include: "reference" }, { defaultToken: "text.xml" }],

            xml_decl: [{
                token: "entity.other.attribute-name.decl-attribute-name.xml",
                regex: "(?:[-_a-zA-Z0-9]+:)?[-_a-zA-Z0-9]+"
            }, {
                token: "keyword.operator.decl-attribute-equals.xml",
                regex: "="
            }, {
                include: "whitespace"
            }, {
                include: "string"
            }, {
                token: "punctuation.xml-decl.xml",
                regex: "\\?>",
                next: "start"
            }],

            processing_instruction: [{ token: "punctuation.instruction.xml", regex: "\\?>", next: "start" }, { defaultToken: "instruction.xml" }],

            doctype: [{ include: "whitespace" }, { include: "string" }, { token: "xml-pe.doctype.xml", regex: ">", next: "start" }, { token: "xml-pe.xml", regex: "[-_a-zA-Z0-9:]+" }, { token: "punctuation.int-subset", regex: "\\[", push: "int_subset" }],

            int_subset: [{
                token: "text.xml",
                regex: "\\s+"
            }, {
                token: "punctuation.int-subset.xml",
                regex: "]",
                next: "pop"
            }, {
                token: ["punctuation.markup-decl.xml", "keyword.markup-decl.xml"],
                regex: "(<\\!)([-_a-zA-Z0-9]+)",
                push: [{
                    token: "text",
                    regex: "\\s+"
                }, {
                    token: "punctuation.markup-decl.xml",
                    regex: ">",
                    next: "pop"
                }, { include: "string" }]
            }],

            cdata: [{ token: "string.cdata.xml", regex: "\\]\\]>", next: "start" }, { token: "text.xml", regex: "\\s+" }, { token: "text.xml", regex: "(?:[^\\]]|\\](?!\\]>))+" }],

            comment: [{ token: "comment.xml", regex: "-->", next: "start" }, { defaultToken: "comment.xml" }],

            reference: [{
                token: "constant.language.escape.reference.xml",
                regex: "(?:&#[0-9]+;)|(?:&#x[0-9a-fA-F]+;)|(?:&[a-zA-Z0-9_:\\.-]+;)"
            }],

            attr_reference: [{
                token: "constant.language.escape.reference.attribute-value.xml",
                regex: "(?:&#[0-9]+;)|(?:&#x[0-9a-fA-F]+;)|(?:&[a-zA-Z0-9_:\\.-]+;)"
            }],

            tag: [{
                token: ["meta.tag.punctuation.tag-open.xml", "meta.tag.punctuation.end-tag-open.xml", "meta.tag.tag-name.xml"],
                regex: "(?:(<)|(</))((?:[-_a-zA-Z0-9]+:)?[-_a-zA-Z0-9]+)",
                next: [{ include: "attributes" }, { token: "meta.tag.punctuation.tag-close.xml", regex: "/?>", next: "start" }]
            }],

            tag_whitespace: [{ token: "text.tag-whitespace.xml", regex: "\\s+" }],
            whitespace: [{ token: "text.whitespace.xml", regex: "\\s+" }],
            string: [{
                token: "string.xml",
                regex: "'",
                push: [{ token: "string.xml", regex: "'", next: "pop" }, { defaultToken: "string.xml" }]
            }, {
                token: "string.xml",
                regex: '"',
                push: [{ token: "string.xml", regex: '"', next: "pop" }, { defaultToken: "string.xml" }]
            }],

            attributes: [{
                token: "entity.other.attribute-name.xml",
                regex: "(?:[-_a-zA-Z0-9]+:)?[-_a-zA-Z0-9]+"
            }, {
                token: "keyword.operator.attribute-equals.xml",
                regex: "="
            }, {
                include: "tag_whitespace"
            }, {
                include: "attribute_value"
            }],

            attribute_value: [{
                token: "string.attribute-value.xml",
                regex: "'",
                push: [{ token: "string.attribute-value.xml", regex: "'", next: "pop" }, { include: "attr_reference" }, { defaultToken: "string.attribute-value.xml" }]
            }, {
                token: "string.attribute-value.xml",
                regex: '"',
                push: [{ token: "string.attribute-value.xml", regex: '"', next: "pop" }, { include: "attr_reference" }, { defaultToken: "string.attribute-value.xml" }]
            }]
        };

        if (this.constructor === XmlHighlightRules) this.normalizeRules();
    };

    (function () {

        this.embedTagRules = function (HighlightRules, prefix, tag) {
            this.$rules.tag.unshift({
                token: ["meta.tag.punctuation.tag-open.xml", "meta.tag." + tag + ".tag-name.xml"],
                regex: "(<)(" + tag + "(?=\\s|>|$))",
                next: [{ include: "attributes" }, { token: "meta.tag.punctuation.tag-close.xml", regex: "/?>", next: prefix + "start" }]
            });

            this.$rules[tag + "-end"] = [{ include: "attributes" }, { token: "meta.tag.punctuation.tag-close.xml", regex: "/?>", next: "start",
                onMatch: function onMatch(value, currentState, stack) {
                    stack.splice(0);
                    return this.token;
                } }];

            this.embedRules(HighlightRules, prefix, [{
                token: ["meta.tag.punctuation.end-tag-open.xml", "meta.tag." + tag + ".tag-name.xml"],
                regex: "(</)(" + tag + "(?=\\s|>|$))",
                next: tag + "-end"
            }, {
                token: "string.cdata.xml",
                regex: "<\\!\\[CDATA\\["
            }, {
                token: "string.cdata.xml",
                regex: "\\]\\]>"
            }]);
        };
    }).call(TextHighlightRules.prototype);

    oop.inherits(XmlHighlightRules, TextHighlightRules);

    exports.XmlHighlightRules = XmlHighlightRules;
});

define("ace/mode/html_highlight_rules", ["require", "exports", "module", "ace/lib/oop", "ace/lib/lang", "ace/mode/css_highlight_rules", "ace/mode/javascript_highlight_rules", "ace/mode/xml_highlight_rules"], function (require, exports, module) {
    "use strict";

    var oop = require("../lib/oop");
    var lang = require("../lib/lang");
    var CssHighlightRules = require("./css_highlight_rules").CssHighlightRules;
    var JavaScriptHighlightRules = require("./javascript_highlight_rules").JavaScriptHighlightRules;
    var XmlHighlightRules = require("./xml_highlight_rules").XmlHighlightRules;

    var tagMap = lang.createMap({
        a: 'anchor',
        button: 'form',
        form: 'form',
        img: 'image',
        input: 'form',
        label: 'form',
        option: 'form',
        script: 'script',
        select: 'form',
        textarea: 'form',
        style: 'style',
        table: 'table',
        tbody: 'table',
        td: 'table',
        tfoot: 'table',
        th: 'table',
        tr: 'table'
    });

    var HtmlHighlightRules = function HtmlHighlightRules() {
        XmlHighlightRules.call(this);

        this.addRules({
            attributes: [{
                include: "tag_whitespace"
            }, {
                token: "entity.other.attribute-name.xml",
                regex: "[-_a-zA-Z0-9:]+"
            }, {
                token: "keyword.operator.attribute-equals.xml",
                regex: "=",
                push: [{
                    include: "tag_whitespace"
                }, {
                    token: "string.unquoted.attribute-value.html",
                    regex: "[^<>='\"`\\s]+",
                    next: "pop"
                }, {
                    token: "empty",
                    regex: "",
                    next: "pop"
                }]
            }, {
                include: "attribute_value"
            }],
            tag: [{
                token: function token(start, tag) {
                    var group = tagMap[tag];
                    return ["meta.tag.punctuation." + (start == "<" ? "" : "end-") + "tag-open.xml", "meta.tag" + (group ? "." + group : "") + ".tag-name.xml"];
                },
                regex: "(</?)([-_a-zA-Z0-9:]+)",
                next: "tag_stuff"
            }],
            tag_stuff: [{ include: "attributes" }, { token: "meta.tag.punctuation.tag-close.xml", regex: "/?>", next: "start" }]
        });

        this.embedTagRules(CssHighlightRules, "css-", "style");
        this.embedTagRules(JavaScriptHighlightRules, "js-", "script");

        if (this.constructor === HtmlHighlightRules) this.normalizeRules();
    };

    oop.inherits(HtmlHighlightRules, XmlHighlightRules);

    exports.HtmlHighlightRules = HtmlHighlightRules;
});

define("ace/mode/ftl_highlight_rules", ["require", "exports", "module", "ace/lib/oop", "ace/mode/html_highlight_rules", "ace/mode/text_highlight_rules"], function (require, exports, module) {
    "use strict";

    var oop = require("../lib/oop");
    var HtmlHighlightRules = require("./html_highlight_rules").HtmlHighlightRules;
    var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;

    var FtlLangHighlightRules = function FtlLangHighlightRules() {

        var stringBuiltIns = "\\?|substring|cap_first|uncap_first|capitalize|chop_linebreak|date|time|datetime|" + "ends_with|html|groups|index_of|j_string|js_string|json_string|last_index_of|length|lower_case|" + "left_pad|right_pad|contains|matches|number|replace|rtf|url|split|starts_with|string|trim|" + "upper_case|word_list|xhtml|xml";
        var numberBuiltIns = "c|round|floor|ceiling";
        var dateBuiltIns = "iso_[a-z_]+";
        var seqBuiltIns = "first|last|seq_contains|seq_index_of|seq_last_index_of|reverse|size|sort|sort_by|chunk";
        var hashBuiltIns = "keys|values";
        var xmlBuiltIns = "children|parent|root|ancestors|node_name|node_type|node_namespace";
        var expertBuiltIns = "byte|double|float|int|long|short|number_to_date|number_to_time|number_to_datetime|" + "eval|has_content|interpret|is_[a-z_]+|namespacenew";
        var allBuiltIns = stringBuiltIns + numberBuiltIns + dateBuiltIns + seqBuiltIns + hashBuiltIns + xmlBuiltIns + expertBuiltIns;

        var deprecatedBuiltIns = "default|exists|if_exists|web_safe";

        var variables = "data_model|error|globals|lang|locale|locals|main|namespace|node|current_node|" + "now|output_encoding|template_name|url_escaping_charset|vars|version";

        var operators = "gt|gte|lt|lte|as|in|using";

        var reserved = "true|false";

        var attributes = "encoding|parse|locale|number_format|date_format|time_format|datetime_format|time_zone|" + "url_escaping_charset|classic_compatible|strip_whitespace|strip_text|strict_syntax|ns_prefixes|" + "attributes";

        this.$rules = {
            "start": [{
                token: "constant.character.entity",
                regex: /&[^;]+;/
            }, {
                token: "support.function",
                regex: "\\?(" + allBuiltIns + ")"
            }, {
                token: "support.function.deprecated",
                regex: "\\?(" + deprecatedBuiltIns + ")"
            }, {
                token: "language.variable",
                regex: "\\.(?:" + variables + ")"
            }, {
                token: "constant.language",
                regex: "\\b(" + reserved + ")\\b"
            }, {
                token: "keyword.operator",
                regex: "\\b(?:" + operators + ")\\b"
            }, {
                token: "entity.other.attribute-name",
                regex: attributes
            }, {
                token: "string", //
                regex: /['"]/,
                next: "qstring"
            }, {
                token: function token(value) {
                    if (value.match("^[+-]?\\d+(?:(?:\\.\\d*)?(?:[eE][+-]?\\d+)?)?$")) {
                        return "constant.numeric";
                    } else {
                        return "variable";
                    }
                },
                regex: /[\w.+\-]+/
            }, {
                token: "keyword.operator",
                regex: "!|\\.|\\$|%|&|\\*|\\-\\-|\\-|\\+\\+|\\+|~|===|==|=|!=|!==|<=|>=|<<=|>>=|>>>=|<>|<|>|&&|\\|\\||\\?\\:|\\*=|%=|\\+=|\\-=|&=|\\^="
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

            "qstring": [{
                token: "constant.character.escape",
                regex: '\\\\[nrtvef\\\\"$]'
            }, {
                token: "string",
                regex: /['"]/,
                next: "start"
            }, {
                defaultToken: "string"
            }]
        };
    };

    oop.inherits(FtlLangHighlightRules, TextHighlightRules);

    var FtlHighlightRules = function FtlHighlightRules() {
        HtmlHighlightRules.call(this);

        var directives = "assign|attempt|break|case|compress|default|elseif|else|escape|fallback|function|flush|" + "ftl|global|if|import|include|list|local|lt|macro|nested|noescape|noparse|nt|recover|recurse|return|rt|" + "setting|stop|switch|t|visit";

        var startRules = [{
            token: "comment",
            regex: "<#--",
            next: "ftl-dcomment"
        }, {
            token: "string.interpolated",
            regex: "\\${",
            push: "ftl-start"
        }, {
            token: "keyword.function",
            regex: "</?#(" + directives + ")",
            push: "ftl-start"
        }, {
            token: "keyword.other",
            regex: "</?@[a-zA-Z\\.]+",
            push: "ftl-start"
        }];

        var endRules = [{
            token: "keyword",
            regex: "/?>",
            next: "pop"
        }, {
            token: "string.interpolated",
            regex: "}",
            next: "pop"
        }];

        for (var key in this.$rules) {
            this.$rules[key].unshift.apply(this.$rules[key], startRules);
        }this.embedRules(FtlLangHighlightRules, "ftl-", endRules, ["start"]);

        this.addRules({
            "ftl-dcomment": [{
                token: "comment",
                regex: ".*?-->",
                next: "pop"
            }, {
                token: "comment",
                regex: ".+"
            }]
        });

        this.normalizeRules();
    };

    oop.inherits(FtlHighlightRules, HtmlHighlightRules);

    exports.FtlHighlightRules = FtlHighlightRules;
});

define("ace/mode/ftl", ["require", "exports", "module", "ace/lib/oop", "ace/mode/text", "ace/mode/ftl_highlight_rules"], function (require, exports, module) {
    "use strict";

    var oop = require("../lib/oop");
    var TextMode = require("./text").Mode;
    var FtlHighlightRules = require("./ftl_highlight_rules").FtlHighlightRules;

    var Mode = function Mode() {
        this.HighlightRules = FtlHighlightRules;
    };
    oop.inherits(Mode, TextMode);

    (function () {

        this.$id = "ace/mode/ftl";
    }).call(Mode.prototype);

    exports.Mode = Mode;
});