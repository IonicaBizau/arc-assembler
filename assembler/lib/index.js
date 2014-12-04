var Parse = require("./parser")
  , Compile = require("./compiler")
  ;

var ArcAssembler = module.exports = {};
ArcAssembler.parse = Parse;
ArcAssembler.compileLine = Compile;
ArcAssembler.compile = function (lines) {
    var result = {
        raw: [],
        mCode: []
    };
    if (!Array.isArray(lines)) {
        lines = lines.toString();
    }
    if (typeof lines === "string") {
        lines = lines.split("\n");
    }
    var parsed = Parse(lines);
    parsed.lines.forEach(function (c, i) {
        var ins = ArcAssembler.compileLine(parsed.lines[i], parsed);
        if (!ins.length) { return; }
        result.raw.push({
            code: ins
          , line: i + 1
        });
        result.mCode = result.mCode.concat(
            ins.split("").map(function (c) {
                return parseInt(c);
            })
        );
    });
    return result;
};

// Browser support
if (typeof window === "object") {
    window.ArcAssembler = ArcAssembler;
}
