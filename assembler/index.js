var Fs = require("fs")
  , ArcAssembler = require("./lib")
  ;

const OUTPUT_FILE = "./out"
    , INPUT_FILE = "./Test.asm"
    ;

var outputStream = Fs.createWriteStream(OUTPUT_FILE);

Fs.readFile(INPUT_FILE, "utf-8", function (err, lines) {
    var result = ArcAssembler.compile(lines);

    result.raw.forEach(function (c) {
        console.log(c.code.match(/.{1,4}/g).join(" ") + " << Line " + c.line);
    });

    outputStream.write(new Buffer(result.mCode));
    outputStream.end();
});
