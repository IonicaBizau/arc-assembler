var Fs = require("fs")
  , ArcAssembler = require("./lib")
  ;

const OUTPUT_FILE = __dirname + "/out"
    , INPUT_FILE = __dirname + "/Test.asm"
    ;

var outputStream = Fs.createWriteStream(OUTPUT_FILE);

Fs.readFile(INPUT_FILE, "utf-8", function (err, lines) {
    var result = ArcAssembler.compile(lines);

    result.raw.forEach(function (c) {
        console.log(c.code.match(/.{1,4}/g).join(" ") + " << Line " + c.line);
    });

    console.log("---- Full machine code ----");
    for (var i = 0; i < result.mCode.length; i += 32) {
        console.log(result.mCode.slice(i, i + 32).join("").match(/.{1,4}/g).join(" "));
    }

    outputStream.write("#!env/arc-int\n");
    outputStream.write(new Buffer(result.mCode));
    outputStream.end();
    Fs.chmodSync(OUTPUT_FILE, 0755);
});
