"use strict";

define("ace/ext/modelist", ["require", "exports", "module"], function (require, exports, module) {
    "use strict";

    var modes = [];
    function getModeForPath(path) {
        var mode = modesByName.text;
        var fileName = path.split(/[\/\\]/).pop();
        for (var i = 0; i < modes.length; i++) {
            if (modes[i].supportsFile(fileName)) {
                mode = modes[i];
                break;
            }
        }
        return mode;
    }

    var Mode = function Mode(name, caption, extensions) {
        this.name = name;
        this.caption = caption;
        this.mode = "ace/mode/" + name;
        this.extensions = extensions;
        if (/\^/.test(extensions)) {
            var re = extensions.replace(/\|(\^)?/g, function (a, b) {
                return "$|" + (b ? "^" : "^.*\\.");
            }) + "$";
        } else {
            var re = "^.*\\.(" + extensions + ")$";
        }

        this.extRe = new RegExp(re, "gi");
    };

    Mode.prototype.supportsFile = function (filename) {
        return filename.match(this.extRe);
    };
    var supportedModes = {
        ABAP: ["abap"],
        ActionScript: ["as"],
        ADA: ["ada|adb"],
        Apache_Conf: ["^htaccess|^htgroups|^htpasswd|^conf|htaccess|htgroups|htpasswd"],
        AsciiDoc: ["asciidoc"],
        Assembly_x86: ["asm"],
        AutoHotKey: ["ahk"],
        BatchFile: ["bat|cmd"],
        C9Search: ["c9search_results"],
        C_Cpp: ["cpp|c|cc|cxx|h|hh|hpp"],
        Cirru: ["cirru|cr"],
        Clojure: ["clj|cljs"],
        Cobol: ["CBL|COB"],
        coffee: ["coffee|cf|cson|^Cakefile"],
        ColdFusion: ["cfm"],
        CSharp: ["cs"],
        CSS: ["css"],
        Curly: ["curly"],
        D: ["d|di"],
        Dart: ["dart"],
        Diff: ["diff|patch"],
        Dockerfile: ["^Dockerfile"],
        Dot: ["dot"],
        Dummy: ["dummy"],
        DummySyntax: ["dummy"],
        Eiffel: ["e"],
        EJS: ["ejs"],
        Elixir: ["ex|exs"],
        Elm: ["elm"],
        Erlang: ["erl|hrl"],
        Forth: ["frt|fs|ldr"],
        FTL: ["ftl"],
        Gcode: ["gcode"],
        Gherkin: ["feature"],
        Gitignore: ["^.gitignore"],
        Glsl: ["glsl|frag|vert"],
        golang: ["go"],
        Groovy: ["groovy"],
        HAML: ["haml"],
        Handlebars: ["hbs|handlebars|tpl|mustache"],
        Haskell: ["hs"],
        haXe: ["hx"],
        HTML: ["html|htm|xhtml"],
        HTML_Ruby: ["erb|rhtml|html.erb"],
        INI: ["ini|conf|cfg|prefs"],
        Io: ["io"],
        Jack: ["jack"],
        Jade: ["jade"],
        Java: ["java"],
        JavaScript: ["js|jsm"],
        JSON: ["json"],
        JSONiq: ["jq"],
        JSP: ["jsp"],
        JSX: ["jsx"],
        Julia: ["jl"],
        LaTeX: ["tex|latex|ltx|bib"],
        LESS: ["less"],
        Liquid: ["liquid"],
        Lisp: ["lisp"],
        LiveScript: ["ls"],
        LogiQL: ["logic|lql"],
        LSL: ["lsl"],
        Lua: ["lua"],
        LuaPage: ["lp"],
        Lucene: ["lucene"],
        Makefile: ["^Makefile|^GNUmakefile|^makefile|^OCamlMakefile|make"],
        Markdown: ["md|markdown"],
        MATLAB: ["matlab"],
        MEL: ["mel"],
        MUSHCode: ["mc|mush"],
        MySQL: ["mysql"],
        Nix: ["nix"],
        ObjectiveC: ["m|mm"],
        OCaml: ["ml|mli"],
        Pascal: ["pas|p"],
        Perl: ["pl|pm"],
        pgSQL: ["pgsql"],
        PHP: ["php|phtml"],
        Powershell: ["ps1"],
        Praat: ["praat|praatscript|psc|proc"],
        Prolog: ["plg|prolog"],
        Properties: ["properties"],
        Protobuf: ["proto"],
        Python: ["py"],
        R: ["r"],
        RDoc: ["Rd"],
        RHTML: ["Rhtml"],
        Ruby: ["rb|ru|gemspec|rake|^Guardfile|^Rakefile|^Gemfile"],
        Rust: ["rs"],
        SASS: ["sass"],
        SCAD: ["scad"],
        Scala: ["scala"],
        Scheme: ["scm|rkt"],
        SCSS: ["scss"],
        SH: ["sh|bash|^.bashrc"],
        SJS: ["sjs"],
        Smarty: ["smarty|tpl"],
        snippets: ["snippets"],
        Soy_Template: ["soy"],
        Space: ["space"],
        SQL: ["sql"],
        Stylus: ["styl|stylus"],
        SVG: ["svg"],
        Tcl: ["tcl"],
        Tex: ["tex"],
        Text: ["txt"],
        Textile: ["textile"],
        Toml: ["toml"],
        Twig: ["twig"],
        Typescript: ["ts|typescript|str"],
        Vala: ["vala"],
        VBScript: ["vbs|vb"],
        Velocity: ["vm"],
        Verilog: ["v|vh|sv|svh"],
        VHDL: ["vhd|vhdl"],
        XML: ["xml|rdf|rss|wsdl|xslt|atom|mathml|mml|xul|xbl"],
        XQuery: ["xq"],
        YAML: ["yaml|yml"]
    };

    var nameOverrides = {
        ObjectiveC: "Objective-C",
        CSharp: "C#",
        golang: "Go",
        C_Cpp: "C and C++",
        coffee: "CoffeeScript",
        HTML_Ruby: "HTML (Ruby)",
        FTL: "FreeMarker"
    };
    var modesByName = {};
    for (var name in supportedModes) {
        var data = supportedModes[name];
        var displayName = (nameOverrides[name] || name).replace(/_/g, " ");
        var filename = name.toLowerCase();
        var mode = new Mode(filename, displayName, data[0]);
        modesByName[filename] = mode;
        modes.push(mode);
    }

    module.exports = {
        getModeForPath: getModeForPath,
        modes: modes,
        modesByName: modesByName
    };
});
(function () {
    window.require(["ace/ext/modelist"], function () {});
})();