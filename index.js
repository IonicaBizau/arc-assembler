var Fs = require("fs")
  , Parse = require("./parser")
  , Compile = require("./compiler")
  ;

const OUTPUT_FILE = "./out.arc"
    , INPUT_FILE = "./Test.asm"
    ;

var outputStream = Fs.createWriteStream(OUTPUT_FILE);

Fs.readFile(INPUT_FILE, "utf-8", function (err, lines) {
    lines = lines.split("\n");
    console.log(">> Parsing...");
    console.log("--------------------------");

    var parsed = Parse(lines);

    console.log("Compiling...");
    console.log("--------------------------");
    parsed.lines.forEach(function (c, i) {
        var ins = Compile(parsed.lines[i], parsed);

        if (ins.length) {
            console.log( i + 1 + "> " + ins.match(/.{1,4}/g).join(" "));
            outputStream.write(new Buffer([ins]));
        }
    });

    outputStream.end();
});
