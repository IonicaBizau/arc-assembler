var Fs = require("fs")
  , Path = require("path")
  , Interpreter = require("./lib")
  ;

const INPUT_FILE = Path.resolve(__dirname + "/../assembler/out");
Fs.readFile(INPUT_FILE, function (err, buff) {
    if (err) { throw err; }
    console.log(Interpreter.interpret(buff));
});

