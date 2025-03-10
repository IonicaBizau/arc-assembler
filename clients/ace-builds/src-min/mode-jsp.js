"use strict";

define("ace/mode/css_highlight_rules", ["require", "exports", "module", "ace/lib/oop", "ace/lib/lang", "ace/mode/text_highlight_rules"], function (e, t, n) {
  "use strict";
  var r = e("../lib/oop"),
      i = e("../lib/lang"),
      s = e("./text_highlight_rules").TextHighlightRules,
      o = t.supportType = "animation-fill-mode|alignment-adjust|alignment-baseline|animation-delay|animation-direction|animation-duration|animation-iteration-count|animation-name|animation-play-state|animation-timing-function|animation|appearance|azimuth|backface-visibility|background-attachment|background-break|background-clip|background-color|background-image|background-origin|background-position|background-repeat|background-size|background|baseline-shift|binding|bleed|bookmark-label|bookmark-level|bookmark-state|bookmark-target|border-bottom|border-bottom-color|border-bottom-left-radius|border-bottom-right-radius|border-bottom-style|border-bottom-width|border-collapse|border-color|border-image|border-image-outset|border-image-repeat|border-image-slice|border-image-source|border-image-width|border-left|border-left-color|border-left-style|border-left-width|border-radius|border-right|border-right-color|border-right-style|border-right-width|border-spacing|border-style|border-top|border-top-color|border-top-left-radius|border-top-right-radius|border-top-style|border-top-width|border-width|border|bottom|box-align|box-decoration-break|box-direction|box-flex-group|box-flex|box-lines|box-ordinal-group|box-orient|box-pack|box-shadow|box-sizing|break-after|break-before|break-inside|caption-side|clear|clip|color-profile|color|column-count|column-fill|column-gap|column-rule|column-rule-color|column-rule-style|column-rule-width|column-span|column-width|columns|content|counter-increment|counter-reset|crop|cue-after|cue-before|cue|cursor|direction|display|dominant-baseline|drop-initial-after-adjust|drop-initial-after-align|drop-initial-before-adjust|drop-initial-before-align|drop-initial-size|drop-initial-value|elevation|empty-cells|fit|fit-position|float-offset|float|font-family|font-size|font-size-adjust|font-stretch|font-style|font-variant|font-weight|font|grid-columns|grid-rows|hanging-punctuation|height|hyphenate-after|hyphenate-before|hyphenate-character|hyphenate-lines|hyphenate-resource|hyphens|icon|image-orientation|image-rendering|image-resolution|inline-box-align|left|letter-spacing|line-height|line-stacking-ruby|line-stacking-shift|line-stacking-strategy|line-stacking|list-style-image|list-style-position|list-style-type|list-style|margin-bottom|margin-left|margin-right|margin-top|margin|mark-after|mark-before|mark|marks|marquee-direction|marquee-play-count|marquee-speed|marquee-style|max-height|max-width|min-height|min-width|move-to|nav-down|nav-index|nav-left|nav-right|nav-up|opacity|orphans|outline-color|outline-offset|outline-style|outline-width|outline|overflow-style|overflow-x|overflow-y|overflow|padding-bottom|padding-left|padding-right|padding-top|padding|page-break-after|page-break-before|page-break-inside|page-policy|page|pause-after|pause-before|pause|perspective-origin|perspective|phonemes|pitch-range|pitch|play-during|pointer-events|position|presentation-level|punctuation-trim|quotes|rendering-intent|resize|rest-after|rest-before|rest|richness|right|rotation-point|rotation|ruby-align|ruby-overhang|ruby-position|ruby-span|size|speak-header|speak-numeral|speak-punctuation|speak|speech-rate|stress|string-set|table-layout|target-name|target-new|target-position|target|text-align-last|text-align|text-decoration|text-emphasis|text-height|text-indent|text-justify|text-outline|text-shadow|text-transform|text-wrap|top|transform-origin|transform-style|transform|transition-delay|transition-duration|transition-property|transition-timing-function|transition|unicode-bidi|vertical-align|visibility|voice-balance|voice-duration|voice-family|voice-pitch-range|voice-pitch|voice-rate|voice-stress|voice-volume|volume|white-space-collapse|white-space|widows|width|word-break|word-spacing|word-wrap|z-index",
      u = t.supportFunction = "rgb|rgba|url|attr|counter|counters",
      a = t.supportConstant = "absolute|after-edge|after|all-scroll|all|alphabetic|always|antialiased|armenian|auto|avoid-column|avoid-page|avoid|balance|baseline|before-edge|before|below|bidi-override|block-line-height|block|bold|bolder|border-box|both|bottom|box|break-all|break-word|capitalize|caps-height|caption|center|central|char|circle|cjk-ideographic|clone|close-quote|col-resize|collapse|column|consider-shifts|contain|content-box|cover|crosshair|cubic-bezier|dashed|decimal-leading-zero|decimal|default|disabled|disc|disregard-shifts|distribute-all-lines|distribute-letter|distribute-space|distribute|dotted|double|e-resize|ease-in|ease-in-out|ease-out|ease|ellipsis|end|exclude-ruby|fill|fixed|georgian|glyphs|grid-height|groove|hand|hanging|hebrew|help|hidden|hiragana-iroha|hiragana|horizontal|icon|ideograph-alpha|ideograph-numeric|ideograph-parenthesis|ideograph-space|ideographic|inactive|include-ruby|inherit|initial|inline-block|inline-box|inline-line-height|inline-table|inline|inset|inside|inter-ideograph|inter-word|invert|italic|justify|katakana-iroha|katakana|keep-all|last|left|lighter|line-edge|line-through|line|linear|list-item|local|loose|lower-alpha|lower-greek|lower-latin|lower-roman|lowercase|lr-tb|ltr|mathematical|max-height|max-size|medium|menu|message-box|middle|move|n-resize|ne-resize|newspaper|no-change|no-close-quote|no-drop|no-open-quote|no-repeat|none|normal|not-allowed|nowrap|nw-resize|oblique|open-quote|outset|outside|overline|padding-box|page|pointer|pre-line|pre-wrap|pre|preserve-3d|progress|relative|repeat-x|repeat-y|repeat|replaced|reset-size|ridge|right|round|row-resize|rtl|s-resize|scroll|se-resize|separate|slice|small-caps|small-caption|solid|space|square|start|static|status-bar|step-end|step-start|steps|stretch|strict|sub|super|sw-resize|table-caption|table-cell|table-column-group|table-column|table-footer-group|table-header-group|table-row-group|table-row|table|tb-rl|text-after-edge|text-before-edge|text-bottom|text-size|text-top|text|thick|thin|transparent|underline|upper-alpha|upper-latin|upper-roman|uppercase|use-script|vertical-ideographic|vertical-text|visible|w-resize|wait|whitespace|z-index|zero",
      f = t.supportConstantColor = "aqua|black|blue|fuchsia|gray|green|lime|maroon|navy|olive|orange|purple|red|silver|teal|white|yellow",
      l = t.supportConstantFonts = "arial|century|comic|courier|garamond|georgia|helvetica|impact|lucida|symbol|system|tahoma|times|trebuchet|utopia|verdana|webdings|sans-serif|serif|monospace",
      c = t.numRe = "\\-?(?:(?:[0-9]+)|(?:[0-9]*\\.[0-9]+))",
      h = t.pseudoElements = "(\\:+)\\b(after|before|first-letter|first-line|moz-selection|selection)\\b",
      p = t.pseudoClasses = "(:)\\b(active|checked|disabled|empty|enabled|first-child|first-of-type|focus|hover|indeterminate|invalid|last-child|last-of-type|link|not|nth-child|nth-last-child|nth-last-of-type|nth-of-type|only-child|only-of-type|required|root|target|valid|visited)\\b",
      d = function d() {
    var e = this.createKeywordMapper({ "support.function": u, "support.constant": a, "support.type": o, "support.constant.color": f, "support.constant.fonts": l }, "text", !0);this.$rules = { start: [{ token: "comment", regex: "\\/\\*", push: "comment" }, { token: "paren.lparen", regex: "\\{", push: "ruleset" }, { token: "string", regex: "@.*?{", push: "media" }, { token: "keyword", regex: "#[a-z0-9-_]+" }, { token: "variable", regex: "\\.[a-z0-9-_]+" }, { token: "string", regex: ":[a-z0-9-_]+" }, { token: "constant", regex: "[a-z0-9-_]+" }, { caseInsensitive: !0 }], media: [{ token: "comment", regex: "\\/\\*", push: "comment" }, { token: "paren.lparen", regex: "\\{", push: "ruleset" }, { token: "string", regex: "\\}", next: "pop" }, { token: "keyword", regex: "#[a-z0-9-_]+" }, { token: "variable", regex: "\\.[a-z0-9-_]+" }, { token: "string", regex: ":[a-z0-9-_]+" }, { token: "constant", regex: "[a-z0-9-_]+" }, { caseInsensitive: !0 }], comment: [{ token: "comment", regex: "\\*\\/", next: "pop" }, { defaultToken: "comment" }], ruleset: [{ token: "paren.rparen", regex: "\\}", next: "pop" }, { token: "comment", regex: "\\/\\*", push: "comment" }, { token: "string", regex: '["](?:(?:\\\\.)|(?:[^"\\\\]))*?["]' }, { token: "string", regex: "['](?:(?:\\\\.)|(?:[^'\\\\]))*?[']" }, { token: ["constant.numeric", "keyword"], regex: "(" + c + ")(ch|cm|deg|em|ex|fr|gd|grad|Hz|in|kHz|mm|ms|pc|pt|px|rad|rem|s|turn|vh|vm|vw|%)" }, { token: "constant.numeric", regex: c }, { token: "constant.numeric", regex: "#[a-f0-9]{6}" }, { token: "constant.numeric", regex: "#[a-f0-9]{3}" }, { token: ["punctuation", "entity.other.attribute-name.pseudo-element.css"], regex: h }, { token: ["punctuation", "entity.other.attribute-name.pseudo-class.css"], regex: p }, { token: ["support.function", "string", "support.function"], regex: "(url\\()(.*)(\\))" }, { token: e, regex: "\\-?[a-zA-Z_][a-zA-Z0-9_\\-]*" }, { caseInsensitive: !0 }] }, this.normalizeRules();
  };r.inherits(d, s), t.CssHighlightRules = d;
}), define("ace/mode/doc_comment_highlight_rules", ["require", "exports", "module", "ace/lib/oop", "ace/mode/text_highlight_rules"], function (e, t, n) {
  "use strict";
  var r = e("../lib/oop"),
      i = e("./text_highlight_rules").TextHighlightRules,
      s = function s() {
    this.$rules = { start: [{ token: "comment.doc.tag", regex: "@[\\w\\d_]+" }, s.getTagRule(), { defaultToken: "comment.doc", caseInsensitive: !0 }] };
  };r.inherits(s, i), s.getTagRule = function (e) {
    return { token: "comment.doc.tag.storage.type", regex: "\\b(?:TODO|FIXME|XXX|HACK)\\b" };
  }, s.getStartRule = function (e) {
    return { token: "comment.doc", regex: "\\/\\*(?=\\*)", next: e };
  }, s.getEndRule = function (e) {
    return { token: "comment.doc", regex: "\\*\\/", next: e };
  }, t.DocCommentHighlightRules = s;
}), define("ace/mode/javascript_highlight_rules", ["require", "exports", "module", "ace/lib/oop", "ace/mode/doc_comment_highlight_rules", "ace/mode/text_highlight_rules"], function (e, t, n) {
  "use strict";
  var r = e("../lib/oop"),
      i = e("./doc_comment_highlight_rules").DocCommentHighlightRules,
      s = e("./text_highlight_rules").TextHighlightRules,
      o = function o(e) {
    var t = this.createKeywordMapper({ "variable.language": "Array|Boolean|Date|Function|Iterator|Number|Object|RegExp|String|Proxy|Namespace|QName|XML|XMLList|ArrayBuffer|Float32Array|Float64Array|Int16Array|Int32Array|Int8Array|Uint16Array|Uint32Array|Uint8Array|Uint8ClampedArray|Error|EvalError|InternalError|RangeError|ReferenceError|StopIteration|SyntaxError|TypeError|URIError|decodeURI|decodeURIComponent|encodeURI|encodeURIComponent|eval|isFinite|isNaN|parseFloat|parseInt|JSON|Math|this|arguments|prototype|window|document", keyword: "const|yield|import|get|set|break|case|catch|continue|default|delete|do|else|finally|for|function|if|in|instanceof|new|return|switch|throw|try|typeof|let|var|while|with|debugger|__parent__|__count__|escape|unescape|with|__proto__|class|enum|extends|super|export|implements|private|public|interface|package|protected|static", "storage.type": "const|let|var|function", "constant.language": "null|Infinity|NaN|undefined", "support.function": "alert", "constant.language.boolean": "true|false" }, "identifier"),
        n = "case|do|else|finally|in|instanceof|return|throw|try|typeof|yield|void",
        r = "[a-zA-Z\\$_\xA1-\uFFFF][a-zA-Z\\d\\$_\xA1-\uFFFF]*\\b",
        s = "\\\\(?:x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4}|[0-2][0-7]{0,2}|3[0-6][0-7]?|37[0-7]?|[4-7][0-7]?|.)";this.$rules = { no_regex: [{ token: "comment", regex: "\\/\\/", next: "line_comment" }, i.getStartRule("doc-start"), { token: "comment", regex: /\/\*/, next: "comment" }, { token: "string", regex: "'(?=.)", next: "qstring" }, { token: "string", regex: '"(?=.)', next: "qqstring" }, { token: "constant.numeric", regex: /0[xX][0-9a-fA-F]+\b/ }, { token: "constant.numeric", regex: /[+-]?\d+(?:(?:\.\d*)?(?:[eE][+-]?\d+)?)?\b/ }, { token: ["storage.type", "punctuation.operator", "support.function", "punctuation.operator", "entity.name.function", "text", "keyword.operator"], regex: "(" + r + ")(\\.)(prototype)(\\.)(" + r + ")(\\s*)(=)", next: "function_arguments" }, { token: ["storage.type", "punctuation.operator", "entity.name.function", "text", "keyword.operator", "text", "storage.type", "text", "paren.lparen"], regex: "(" + r + ")(\\.)(" + r + ")(\\s*)(=)(\\s*)(function)(\\s*)(\\()", next: "function_arguments" }, { token: ["entity.name.function", "text", "keyword.operator", "text", "storage.type", "text", "paren.lparen"], regex: "(" + r + ")(\\s*)(=)(\\s*)(function)(\\s*)(\\()", next: "function_arguments" }, { token: ["storage.type", "punctuation.operator", "entity.name.function", "text", "keyword.operator", "text", "storage.type", "text", "entity.name.function", "text", "paren.lparen"], regex: "(" + r + ")(\\.)(" + r + ")(\\s*)(=)(\\s*)(function)(\\s+)(\\w+)(\\s*)(\\()", next: "function_arguments" }, { token: ["storage.type", "text", "entity.name.function", "text", "paren.lparen"], regex: "(function)(\\s+)(" + r + ")(\\s*)(\\()", next: "function_arguments" }, { token: ["entity.name.function", "text", "punctuation.operator", "text", "storage.type", "text", "paren.lparen"], regex: "(" + r + ")(\\s*)(:)(\\s*)(function)(\\s*)(\\()", next: "function_arguments" }, { token: ["text", "text", "storage.type", "text", "paren.lparen"], regex: "(:)(\\s*)(function)(\\s*)(\\()", next: "function_arguments" }, { token: "keyword", regex: "(?:" + n + ")\\b", next: "start" }, { token: ["punctuation.operator", "support.function"], regex: /(\.)(s(?:h(?:ift|ow(?:Mod(?:elessDialog|alDialog)|Help))|croll(?:X|By(?:Pages|Lines)?|Y|To)?|t(?:op|rike)|i(?:n|zeToContent|debar|gnText)|ort|u(?:p|b(?:str(?:ing)?)?)|pli(?:ce|t)|e(?:nd|t(?:Re(?:sizable|questHeader)|M(?:i(?:nutes|lliseconds)|onth)|Seconds|Ho(?:tKeys|urs)|Year|Cursor|Time(?:out)?|Interval|ZOptions|Date|UTC(?:M(?:i(?:nutes|lliseconds)|onth)|Seconds|Hours|Date|FullYear)|FullYear|Active)|arch)|qrt|lice|avePreferences|mall)|h(?:ome|andleEvent)|navigate|c(?:har(?:CodeAt|At)|o(?:s|n(?:cat|textual|firm)|mpile)|eil|lear(?:Timeout|Interval)?|a(?:ptureEvents|ll)|reate(?:StyleSheet|Popup|EventObject))|t(?:o(?:GMTString|S(?:tring|ource)|U(?:TCString|pperCase)|Lo(?:caleString|werCase))|est|a(?:n|int(?:Enabled)?))|i(?:s(?:NaN|Finite)|ndexOf|talics)|d(?:isableExternalCapture|ump|etachEvent)|u(?:n(?:shift|taint|escape|watch)|pdateCommands)|j(?:oin|avaEnabled)|p(?:o(?:p|w)|ush|lugins.refresh|a(?:ddings|rse(?:Int|Float)?)|r(?:int|ompt|eference))|e(?:scape|nableExternalCapture|val|lementFromPoint|x(?:p|ec(?:Script|Command)?))|valueOf|UTC|queryCommand(?:State|Indeterm|Enabled|Value)|f(?:i(?:nd|le(?:ModifiedDate|Size|CreatedDate|UpdatedDate)|xed)|o(?:nt(?:size|color)|rward)|loor|romCharCode)|watch|l(?:ink|o(?:ad|g)|astIndexOf)|a(?:sin|nchor|cos|t(?:tachEvent|ob|an(?:2)?)|pply|lert|b(?:s|ort))|r(?:ou(?:nd|teEvents)|e(?:size(?:By|To)|calc|turnValue|place|verse|l(?:oad|ease(?:Capture|Events)))|andom)|g(?:o|et(?:ResponseHeader|M(?:i(?:nutes|lliseconds)|onth)|Se(?:conds|lection)|Hours|Year|Time(?:zoneOffset)?|Da(?:y|te)|UTC(?:M(?:i(?:nutes|lliseconds)|onth)|Seconds|Hours|Da(?:y|te)|FullYear)|FullYear|A(?:ttention|llResponseHeaders)))|m(?:in|ove(?:B(?:y|elow)|To(?:Absolute)?|Above)|ergeAttributes|a(?:tch|rgins|x))|b(?:toa|ig|o(?:ld|rderWidths)|link|ack))\b(?=\()/ }, { token: ["punctuation.operator", "support.function.dom"], regex: /(\.)(s(?:ub(?:stringData|mit)|plitText|e(?:t(?:NamedItem|Attribute(?:Node)?)|lect))|has(?:ChildNodes|Feature)|namedItem|c(?:l(?:ick|o(?:se|neNode))|reate(?:C(?:omment|DATASection|aption)|T(?:Head|extNode|Foot)|DocumentFragment|ProcessingInstruction|E(?:ntityReference|lement)|Attribute))|tabIndex|i(?:nsert(?:Row|Before|Cell|Data)|tem)|open|delete(?:Row|C(?:ell|aption)|T(?:Head|Foot)|Data)|focus|write(?:ln)?|a(?:dd|ppend(?:Child|Data))|re(?:set|place(?:Child|Data)|move(?:NamedItem|Child|Attribute(?:Node)?)?)|get(?:NamedItem|Element(?:sBy(?:Name|TagName)|ById)|Attribute(?:Node)?)|blur)\b(?=\()/ }, { token: ["punctuation.operator", "support.constant"], regex: /(\.)(s(?:ystemLanguage|cr(?:ipts|ollbars|een(?:X|Y|Top|Left))|t(?:yle(?:Sheets)?|atus(?:Text|bar)?)|ibling(?:Below|Above)|ource|uffixes|e(?:curity(?:Policy)?|l(?:ection|f)))|h(?:istory|ost(?:name)?|as(?:h|Focus))|y|X(?:MLDocument|SLDocument)|n(?:ext|ame(?:space(?:s|URI)|Prop))|M(?:IN_VALUE|AX_VALUE)|c(?:haracterSet|o(?:n(?:structor|trollers)|okieEnabled|lorDepth|mp(?:onents|lete))|urrent|puClass|l(?:i(?:p(?:boardData)?|entInformation)|osed|asses)|alle(?:e|r)|rypto)|t(?:o(?:olbar|p)|ext(?:Transform|Indent|Decoration|Align)|ags)|SQRT(?:1_2|2)|i(?:n(?:ner(?:Height|Width)|put)|ds|gnoreCase)|zIndex|o(?:scpu|n(?:readystatechange|Line)|uter(?:Height|Width)|p(?:sProfile|ener)|ffscreenBuffering)|NEGATIVE_INFINITY|d(?:i(?:splay|alog(?:Height|Top|Width|Left|Arguments)|rectories)|e(?:scription|fault(?:Status|Ch(?:ecked|arset)|View)))|u(?:ser(?:Profile|Language|Agent)|n(?:iqueID|defined)|pdateInterval)|_content|p(?:ixelDepth|ort|ersonalbar|kcs11|l(?:ugins|atform)|a(?:thname|dding(?:Right|Bottom|Top|Left)|rent(?:Window|Layer)?|ge(?:X(?:Offset)?|Y(?:Offset)?))|r(?:o(?:to(?:col|type)|duct(?:Sub)?|mpter)|e(?:vious|fix)))|e(?:n(?:coding|abledPlugin)|x(?:ternal|pando)|mbeds)|v(?:isibility|endor(?:Sub)?|Linkcolor)|URLUnencoded|P(?:I|OSITIVE_INFINITY)|f(?:ilename|o(?:nt(?:Size|Family|Weight)|rmName)|rame(?:s|Element)|gColor)|E|whiteSpace|l(?:i(?:stStyleType|n(?:eHeight|kColor))|o(?:ca(?:tion(?:bar)?|lName)|wsrc)|e(?:ngth|ft(?:Context)?)|a(?:st(?:M(?:odified|atch)|Index|Paren)|yer(?:s|X)|nguage))|a(?:pp(?:MinorVersion|Name|Co(?:deName|re)|Version)|vail(?:Height|Top|Width|Left)|ll|r(?:ity|guments)|Linkcolor|bove)|r(?:ight(?:Context)?|e(?:sponse(?:XML|Text)|adyState))|global|x|m(?:imeTypes|ultiline|enubar|argin(?:Right|Bottom|Top|Left))|L(?:N(?:10|2)|OG(?:10E|2E))|b(?:o(?:ttom|rder(?:Width|RightWidth|BottomWidth|Style|Color|TopWidth|LeftWidth))|ufferDepth|elow|ackground(?:Color|Image)))\b/ }, { token: ["support.constant"], regex: /that\b/ }, { token: ["storage.type", "punctuation.operator", "support.function.firebug"], regex: /(console)(\.)(warn|info|log|error|time|trace|timeEnd|assert)\b/ }, { token: t, regex: r }, { token: "keyword.operator", regex: /--|\+\+|===|==|=|!=|!==|<=|>=|<<=|>>=|>>>=|<>|<|>|!|&&|\|\||\?\:|[!$%&*+\-~\/^]=?/, next: "start" }, { token: "punctuation.operator", regex: /[?:,;.]/, next: "start" }, { token: "paren.lparen", regex: /[\[({]/, next: "start" }, { token: "paren.rparen", regex: /[\])}]/ }, { token: "comment", regex: /^#!.*$/ }], start: [i.getStartRule("doc-start"), { token: "comment", regex: "\\/\\*", next: "comment_regex_allowed" }, { token: "comment", regex: "\\/\\/", next: "line_comment_regex_allowed" }, { token: "string.regexp", regex: "\\/", next: "regex" }, { token: "text", regex: "\\s+|^$", next: "start" }, { token: "empty", regex: "", next: "no_regex" }], regex: [{ token: "regexp.keyword.operator", regex: "\\\\(?:u[\\da-fA-F]{4}|x[\\da-fA-F]{2}|.)" }, { token: "string.regexp", regex: "/[sxngimy]*", next: "no_regex" }, { token: "invalid", regex: /\{\d+\b,?\d*\}[+*]|[+*$^?][+*]|[$^][?]|\?{3,}/ }, { token: "constant.language.escape", regex: /\(\?[:=!]|\)|\{\d+\b,?\d*\}|[+*]\?|[()$^+*?.]/ }, { token: "constant.language.delimiter", regex: /\|/ }, { token: "constant.language.escape", regex: /\[\^?/, next: "regex_character_class" }, { token: "empty", regex: "$", next: "no_regex" }, { defaultToken: "string.regexp" }], regex_character_class: [{ token: "regexp.charclass.keyword.operator", regex: "\\\\(?:u[\\da-fA-F]{4}|x[\\da-fA-F]{2}|.)" }, { token: "constant.language.escape", regex: "]", next: "regex" }, { token: "constant.language.escape", regex: "-" }, { token: "empty", regex: "$", next: "no_regex" }, { defaultToken: "string.regexp.charachterclass" }], function_arguments: [{ token: "variable.parameter", regex: r }, { token: "punctuation.operator", regex: "[, ]+" }, { token: "punctuation.operator", regex: "$" }, { token: "empty", regex: "", next: "no_regex" }], comment_regex_allowed: [i.getTagRule(), { token: "comment", regex: "\\*\\/", next: "start" }, { defaultToken: "comment", caseInsensitive: !0 }], comment: [i.getTagRule(), { token: "comment", regex: "\\*\\/", next: "no_regex" }, { defaultToken: "comment", caseInsensitive: !0 }], line_comment_regex_allowed: [i.getTagRule(), { token: "comment", regex: "$|^", next: "start" }, { defaultToken: "comment", caseInsensitive: !0 }], line_comment: [i.getTagRule(), { token: "comment", regex: "$|^", next: "no_regex" }, { defaultToken: "comment", caseInsensitive: !0 }], qqstring: [{ token: "constant.language.escape", regex: s }, { token: "string", regex: "\\\\$", next: "qqstring" }, { token: "string", regex: '"|$', next: "no_regex" }, { defaultToken: "string" }], qstring: [{ token: "constant.language.escape", regex: s }, { token: "string", regex: "\\\\$", next: "qstring" }, { token: "string", regex: "'|$", next: "no_regex" }, { defaultToken: "string" }] }, (!e || !e.noES6) && this.$rules.no_regex.unshift({ regex: "[{}]", onMatch: function onMatch(e, t, n) {
        this.next = e == "{" ? this.nextState : "";if (e == "{" && n.length) return n.unshift("start", t), "paren";if (e == "}" && n.length) {
          n.shift(), this.next = n.shift();if (this.next.indexOf("string") != -1) return "paren.quasi.end";
        }return e == "{" ? "paren.lparen" : "paren.rparen";
      }, nextState: "start" }, { token: "string.quasi.start", regex: /`/, push: [{ token: "constant.language.escape", regex: s }, { token: "paren.quasi.start", regex: /\${/, push: "start" }, { token: "string.quasi.end", regex: /`/, next: "pop" }, { defaultToken: "string.quasi" }] }), this.embedRules(i, "doc-", [i.getEndRule("no_regex")]), this.normalizeRules();
  };r.inherits(o, s), t.JavaScriptHighlightRules = o;
}), define("ace/mode/xml_highlight_rules", ["require", "exports", "module", "ace/lib/oop", "ace/mode/text_highlight_rules"], function (e, t, n) {
  "use strict";
  var r = e("../lib/oop"),
      i = e("./text_highlight_rules").TextHighlightRules,
      s = function s(e) {
    this.$rules = { start: [{ token: "string.cdata.xml", regex: "<\\!\\[CDATA\\[", next: "cdata" }, { token: ["punctuation.xml-decl.xml", "keyword.xml-decl.xml"], regex: "(<\\?)(xml)(?=[\\s])", next: "xml_decl", caseInsensitive: !0 }, { token: ["punctuation.instruction.xml", "keyword.instruction.xml"], regex: "(<\\?)([-_a-zA-Z0-9]+)", next: "processing_instruction" }, { token: "comment.xml", regex: "<\\!--", next: "comment" }, { token: ["xml-pe.doctype.xml", "xml-pe.doctype.xml"], regex: "(<\\!)(DOCTYPE)(?=[\\s])", next: "doctype", caseInsensitive: !0 }, { include: "tag" }, { token: "text.end-tag-open.xml", regex: "</" }, { token: "text.tag-open.xml", regex: "<" }, { include: "reference" }, { defaultToken: "text.xml" }], xml_decl: [{ token: "entity.other.attribute-name.decl-attribute-name.xml", regex: "(?:[-_a-zA-Z0-9]+:)?[-_a-zA-Z0-9]+" }, { token: "keyword.operator.decl-attribute-equals.xml", regex: "=" }, { include: "whitespace" }, { include: "string" }, { token: "punctuation.xml-decl.xml", regex: "\\?>", next: "start" }], processing_instruction: [{ token: "punctuation.instruction.xml", regex: "\\?>", next: "start" }, { defaultToken: "instruction.xml" }], doctype: [{ include: "whitespace" }, { include: "string" }, { token: "xml-pe.doctype.xml", regex: ">", next: "start" }, { token: "xml-pe.xml", regex: "[-_a-zA-Z0-9:]+" }, { token: "punctuation.int-subset", regex: "\\[", push: "int_subset" }], int_subset: [{ token: "text.xml", regex: "\\s+" }, { token: "punctuation.int-subset.xml", regex: "]", next: "pop" }, { token: ["punctuation.markup-decl.xml", "keyword.markup-decl.xml"], regex: "(<\\!)([-_a-zA-Z0-9]+)", push: [{ token: "text", regex: "\\s+" }, { token: "punctuation.markup-decl.xml", regex: ">", next: "pop" }, { include: "string" }] }], cdata: [{ token: "string.cdata.xml", regex: "\\]\\]>", next: "start" }, { token: "text.xml", regex: "\\s+" }, { token: "text.xml", regex: "(?:[^\\]]|\\](?!\\]>))+" }], comment: [{ token: "comment.xml", regex: "-->", next: "start" }, { defaultToken: "comment.xml" }], reference: [{ token: "constant.language.escape.reference.xml", regex: "(?:&#[0-9]+;)|(?:&#x[0-9a-fA-F]+;)|(?:&[a-zA-Z0-9_:\\.-]+;)" }], attr_reference: [{ token: "constant.language.escape.reference.attribute-value.xml", regex: "(?:&#[0-9]+;)|(?:&#x[0-9a-fA-F]+;)|(?:&[a-zA-Z0-9_:\\.-]+;)" }], tag: [{ token: ["meta.tag.punctuation.tag-open.xml", "meta.tag.punctuation.end-tag-open.xml", "meta.tag.tag-name.xml"], regex: "(?:(<)|(</))((?:[-_a-zA-Z0-9]+:)?[-_a-zA-Z0-9]+)", next: [{ include: "attributes" }, { token: "meta.tag.punctuation.tag-close.xml", regex: "/?>", next: "start" }] }], tag_whitespace: [{ token: "text.tag-whitespace.xml", regex: "\\s+" }], whitespace: [{ token: "text.whitespace.xml", regex: "\\s+" }], string: [{ token: "string.xml", regex: "'", push: [{ token: "string.xml", regex: "'", next: "pop" }, { defaultToken: "string.xml" }] }, { token: "string.xml", regex: '"', push: [{ token: "string.xml", regex: '"', next: "pop" }, { defaultToken: "string.xml" }] }], attributes: [{ token: "entity.other.attribute-name.xml", regex: "(?:[-_a-zA-Z0-9]+:)?[-_a-zA-Z0-9]+" }, { token: "keyword.operator.attribute-equals.xml", regex: "=" }, { include: "tag_whitespace" }, { include: "attribute_value" }], attribute_value: [{ token: "string.attribute-value.xml", regex: "'", push: [{ token: "string.attribute-value.xml", regex: "'", next: "pop" }, { include: "attr_reference" }, { defaultToken: "string.attribute-value.xml" }] }, { token: "string.attribute-value.xml", regex: '"', push: [{ token: "string.attribute-value.xml", regex: '"', next: "pop" }, { include: "attr_reference" }, { defaultToken: "string.attribute-value.xml" }] }] }, this.constructor === s && this.normalizeRules();
  };(function () {
    this.embedTagRules = function (e, t, n) {
      this.$rules.tag.unshift({ token: ["meta.tag.punctuation.tag-open.xml", "meta.tag." + n + ".tag-name.xml"], regex: "(<)(" + n + "(?=\\s|>|$))", next: [{ include: "attributes" }, { token: "meta.tag.punctuation.tag-close.xml", regex: "/?>", next: t + "start" }] }), this.$rules[n + "-end"] = [{ include: "attributes" }, { token: "meta.tag.punctuation.tag-close.xml", regex: "/?>", next: "start", onMatch: function onMatch(e, t, n) {
          return n.splice(0), this.token;
        } }], this.embedRules(e, t, [{ token: ["meta.tag.punctuation.end-tag-open.xml", "meta.tag." + n + ".tag-name.xml"], regex: "(</)(" + n + "(?=\\s|>|$))", next: n + "-end" }, { token: "string.cdata.xml", regex: "<\\!\\[CDATA\\[" }, { token: "string.cdata.xml", regex: "\\]\\]>" }]);
    };
  }).call(i.prototype), r.inherits(s, i), t.XmlHighlightRules = s;
}), define("ace/mode/html_highlight_rules", ["require", "exports", "module", "ace/lib/oop", "ace/lib/lang", "ace/mode/css_highlight_rules", "ace/mode/javascript_highlight_rules", "ace/mode/xml_highlight_rules"], function (e, t, n) {
  "use strict";
  var r = e("../lib/oop"),
      i = e("../lib/lang"),
      s = e("./css_highlight_rules").CssHighlightRules,
      o = e("./javascript_highlight_rules").JavaScriptHighlightRules,
      u = e("./xml_highlight_rules").XmlHighlightRules,
      a = i.createMap({ a: "anchor", button: "form", form: "form", img: "image", input: "form", label: "form", option: "form", script: "script", select: "form", textarea: "form", style: "style", table: "table", tbody: "table", td: "table", tfoot: "table", th: "table", tr: "table" }),
      f = function f() {
    u.call(this), this.addRules({ attributes: [{ include: "tag_whitespace" }, { token: "entity.other.attribute-name.xml", regex: "[-_a-zA-Z0-9:]+" }, { token: "keyword.operator.attribute-equals.xml", regex: "=", push: [{ include: "tag_whitespace" }, { token: "string.unquoted.attribute-value.html", regex: "[^<>='\"`\\s]+", next: "pop" }, { token: "empty", regex: "", next: "pop" }] }, { include: "attribute_value" }], tag: [{ token: function token(e, t) {
          var n = a[t];return ["meta.tag.punctuation." + (e == "<" ? "" : "end-") + "tag-open.xml", "meta.tag" + (n ? "." + n : "") + ".tag-name.xml"];
        }, regex: "(</?)([-_a-zA-Z0-9:]+)", next: "tag_stuff" }], tag_stuff: [{ include: "attributes" }, { token: "meta.tag.punctuation.tag-close.xml", regex: "/?>", next: "start" }] }), this.embedTagRules(s, "css-", "style"), this.embedTagRules(o, "js-", "script"), this.constructor === f && this.normalizeRules();
  };r.inherits(f, u), t.HtmlHighlightRules = f;
}), define("ace/mode/java_highlight_rules", ["require", "exports", "module", "ace/lib/oop", "ace/mode/doc_comment_highlight_rules", "ace/mode/text_highlight_rules"], function (e, t, n) {
  "use strict";
  var r = e("../lib/oop"),
      i = e("./doc_comment_highlight_rules").DocCommentHighlightRules,
      s = e("./text_highlight_rules").TextHighlightRules,
      o = function o() {
    var e = "abstract|continue|for|new|switch|assert|default|goto|package|synchronized|boolean|do|if|private|this|break|double|implements|protected|throw|byte|else|import|public|throws|case|enum|instanceof|return|transient|catch|extends|int|short|try|char|final|interface|static|void|class|finally|long|strictfp|volatile|const|float|native|super|while",
        t = "null|Infinity|NaN|undefined",
        n = "AbstractMethodError|AssertionError|ClassCircularityError|ClassFormatError|Deprecated|EnumConstantNotPresentException|ExceptionInInitializerError|IllegalAccessError|IllegalThreadStateException|InstantiationError|InternalError|NegativeArraySizeException|NoSuchFieldError|Override|Process|ProcessBuilder|SecurityManager|StringIndexOutOfBoundsException|SuppressWarnings|TypeNotPresentException|UnknownError|UnsatisfiedLinkError|UnsupportedClassVersionError|VerifyError|InstantiationException|IndexOutOfBoundsException|ArrayIndexOutOfBoundsException|CloneNotSupportedException|NoSuchFieldException|IllegalArgumentException|NumberFormatException|SecurityException|Void|InheritableThreadLocal|IllegalStateException|InterruptedException|NoSuchMethodException|IllegalAccessException|UnsupportedOperationException|Enum|StrictMath|Package|Compiler|Readable|Runtime|StringBuilder|Math|IncompatibleClassChangeError|NoSuchMethodError|ThreadLocal|RuntimePermission|ArithmeticException|NullPointerException|Long|Integer|Short|Byte|Double|Number|Float|Character|Boolean|StackTraceElement|Appendable|StringBuffer|Iterable|ThreadGroup|Runnable|Thread|IllegalMonitorStateException|StackOverflowError|OutOfMemoryError|VirtualMachineError|ArrayStoreException|ClassCastException|LinkageError|NoClassDefFoundError|ClassNotFoundException|RuntimeException|Exception|ThreadDeath|Error|Throwable|System|ClassLoader|Cloneable|Class|CharSequence|Comparable|String|Object",
        r = this.createKeywordMapper({ "variable.language": "this", keyword: e, "constant.language": t, "support.function": n }, "identifier");this.$rules = { start: [{ token: "comment", regex: "\\/\\/.*$" }, i.getStartRule("doc-start"), { token: "comment", regex: "\\/\\*", next: "comment" }, { token: "string", regex: '["](?:(?:\\\\.)|(?:[^"\\\\]))*?["]' }, { token: "string", regex: "['](?:(?:\\\\.)|(?:[^'\\\\]))*?[']" }, { token: "constant.numeric", regex: "0[xX][0-9a-fA-F]+\\b" }, { token: "constant.numeric", regex: "[+-]?\\d+(?:(?:\\.\\d*)?(?:[eE][+-]?\\d+)?)?\\b" }, { token: "constant.language.boolean", regex: "(?:true|false)\\b" }, { token: r, regex: "[a-zA-Z_$][a-zA-Z0-9_$]*\\b" }, { token: "keyword.operator", regex: "!|\\$|%|&|\\*|\\-\\-|\\-|\\+\\+|\\+|~|===|==|=|!=|!==|<=|>=|<<=|>>=|>>>=|<>|<|>|!|&&|\\|\\||\\?\\:|\\*=|%=|\\+=|\\-=|&=|\\^=|\\b(?:in|instanceof|new|delete|typeof|void)" }, { token: "lparen", regex: "[[({]" }, { token: "rparen", regex: "[\\])}]" }, { token: "text", regex: "\\s+" }], comment: [{ token: "comment", regex: ".*?\\*\\/", next: "start" }, { token: "comment", regex: ".+" }] }, this.embedRules(i, "doc-", [i.getEndRule("start")]);
  };r.inherits(o, s), t.JavaHighlightRules = o;
}), define("ace/mode/jsp_highlight_rules", ["require", "exports", "module", "ace/lib/oop", "ace/mode/html_highlight_rules", "ace/mode/java_highlight_rules"], function (e, t, n) {
  "use strict";
  var r = e("../lib/oop"),
      i = e("./html_highlight_rules").HtmlHighlightRules,
      s = e("./java_highlight_rules").JavaHighlightRules,
      o = function o() {
    i.call(this);var e = "request|response|out|session|application|config|pageContext|page|Exception",
        t = "page|include|taglib",
        n = [{ token: "comment", regex: "<%--", push: "jsp-dcomment" }, { token: "meta.tag", regex: "<%@?|<%=?|<jsp:[^>]+>", push: "jsp-start" }],
        r = [{ token: "meta.tag", regex: "%>|<\\/jsp:[^>]+>", next: "pop" }, { token: "variable.language", regex: e }, { token: "keyword", regex: t }];for (var o in this.$rules) {
      this.$rules[o].unshift.apply(this.$rules[o], n);
    }this.embedRules(s, "jsp-", r, ["start"]), this.addRules({ "jsp-dcomment": [{ token: "comment", regex: ".*?--%>", next: "pop" }] }), this.normalizeRules();
  };r.inherits(o, i), t.JspHighlightRules = o;
}), define("ace/mode/matching_brace_outdent", ["require", "exports", "module", "ace/range"], function (e, t, n) {
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
}), define("ace/mode/behaviour/cstyle", ["require", "exports", "module", "ace/lib/oop", "ace/mode/behaviour", "ace/token_iterator", "ace/lib/lang"], function (e, t, n) {
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
}), define("ace/mode/folding/cstyle", ["require", "exports", "module", "ace/lib/oop", "ace/range", "ace/mode/folding/fold_mode"], function (e, t, n) {
  "use strict";
  var r = e("../../lib/oop"),
      i = e("../../range").Range,
      s = e("./fold_mode").FoldMode,
      o = t.FoldMode = function (e) {
    e && (this.foldingStartMarker = new RegExp(this.foldingStartMarker.source.replace(/\|[^|]*?$/, "|" + e.start)), this.foldingStopMarker = new RegExp(this.foldingStopMarker.source.replace(/\|[^|]*?$/, "|" + e.end)));
  };r.inherits(o, s), function () {
    this.foldingStartMarker = /(\{|\[)[^\}\]]*$|^\s*(\/\*)/, this.foldingStopMarker = /^[^\[\{]*(\}|\])|^[\s\*]*(\*\/)/, this.getFoldWidgetRange = function (e, t, n, r) {
      var i = e.getLine(n),
          s = i.match(this.foldingStartMarker);if (s) {
        var o = s.index;if (s[1]) return this.openingBracketBlock(e, s[1], n, o);var u = e.getCommentFoldRange(n, o + s[0].length, 1);return u && !u.isMultiLine() && (r ? u = this.getSectionRange(e, n) : t != "all" && (u = null)), u;
      }if (t === "markbegin") return;var s = i.match(this.foldingStopMarker);if (s) {
        var o = s.index + s[0].length;return s[1] ? this.closingBracketBlock(e, s[1], n, o) : e.getCommentFoldRange(n, o, -1);
      }
    }, this.getSectionRange = function (e, t) {
      var n = e.getLine(t),
          r = n.search(/\S/),
          s = t,
          o = n.length;t += 1;var u = t,
          a = e.getLength();while (++t < a) {
        n = e.getLine(t);var f = n.search(/\S/);if (f === -1) continue;if (r > f) break;var l = this.getFoldWidgetRange(e, "all", t);if (l) {
          if (l.start.row <= s) break;if (l.isMultiLine()) t = l.end.row;else if (r == f) break;
        }u = t;
      }return new i(s, o, u, e.getLine(u).length);
    };
  }.call(o.prototype);
}), define("ace/mode/jsp", ["require", "exports", "module", "ace/lib/oop", "ace/mode/text", "ace/mode/jsp_highlight_rules", "ace/mode/matching_brace_outdent", "ace/mode/behaviour/cstyle", "ace/mode/folding/cstyle"], function (e, t, n) {
  "use strict";
  var r = e("../lib/oop"),
      i = e("./text").Mode,
      s = e("./jsp_highlight_rules").JspHighlightRules,
      o = e("./matching_brace_outdent").MatchingBraceOutdent,
      u = e("./behaviour/cstyle").CstyleBehaviour,
      a = e("./folding/cstyle").FoldMode,
      f = function f() {
    this.HighlightRules = s, this.$outdent = new o(), this.$behaviour = new u(), this.foldingRules = new a();
  };r.inherits(f, i), function () {
    this.$id = "ace/mode/jsp";
  }.call(f.prototype), t.Mode = f;
});