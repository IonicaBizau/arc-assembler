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
    var size = Math.max.apply(null, parsed.lines.map(function (c) { return c.address || -1; }));
    result.mCode = [];
    for (var i = 0; i < size * 8; ++i) {
        result.mCode.push(0);
    }


    function setBits(sAddress, bits) {
        if (typeof bits === "string") {
            bits = bits.split("").map(function (c) {
                return parseInt(c);
            });
        }

        for (var i = 0; i < bits.length; ++i) {
            result.mCode[sAddress * 8 + i] = bits[i];
        }
    }

    parsed.lines.forEach(function (c, i) {
        if (!c.c) {
            return;
        }
        var ins = ArcAssembler.compileLine(c, parsed);
        if (!ins.length) { return; }
        result.raw.push({
            code: ins
          , line: i + 1
        });
        setBits(c.address, ins);
    });
    return result;
};

// Browser support
if (typeof window === "object") {
    window.ArcAssembler = ArcAssembler;
}
