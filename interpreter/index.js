var Path = require("path")
  , Fs = require("fs")
  , Operators = require("./operators")
  ;

const INPUT_FILE = Path.resolve("../assembler/out");

var Registers = {
    "00000": ""
  , "00001": ""
  , "00010": ""
  , "00011": ""
  , "00100": ""
  , "00101": ""
  , "00110": ""
  , "00111": ""
  , "01000": ""
  , "01001": ""
  , "01010": ""
  , "01011": ""
  , "01100": ""
  , "01101": ""
  , "01110": ""
  , "01111": ""
  , "10000": ""
  , "10001": ""
  , "10010": ""
  , "10011": ""
  , "10100": ""
  , "10101": ""
  , "10110": ""
  , "10111": ""
  , "11000": ""
  , "11001": ""
  , "11010": ""
  , "11011": ""
  , "11100": ""
  , "11101": ""
  , "11110": ""
};

function s(inp, s, e) {
    var c = "";
    for (var i = s; i <= e; ++i) {
       c += inp[i].toString();
    }
    return c;
}

function getFromMemory(buff, cIns) {
    return s(buff.slice(((parseInt(s(cIns, 31 - 12, 31), 2) - 2048) / 4 + 1) * 32), 0, 31);
}

function interpret(cIns, buff) {
    var op = s(cIns, 7, 12);
    switch(s(cIns, 0, 1)) {
        // SETHI/BRANCH
        case "00":
            op = s(cIns, 8, 11);
            break;
        // CALL
        case "01":
            op = s(cIns, 8, 11);
            var cond = s(cIns, 3, 7);
            break;
        // ARITHMETIC
        case "10":
            break;
        // MEMORY
        case "11":
            if (Operators[op] === "ld") {
            debugger;
                Registers[s(cIns, 2, 6)] = getFromMemory(buff, cIns);
            }
            break;
        default:
            throw new Error("Invalid instruction format.");
            break;
    }

    console.log("> OP: " + Operators[op], op);
}

Fs.readFile(INPUT_FILE, function (err, buff) {
    if (err) { throw err; }
    for (var i = 0; i < buff.length; i += 32) {
        var cIns = buff.slice(i, i + 32);
        interpret(cIns, buff);
    }
});

for (var r in Registers) {
    (function (r) {
        delete Registers[r];
        Object.defineProperty(Registers, r, {
            writeable: true
          , set: function (newValue) {
                console.log(">> Register " + r + " was changed: " + newValue);
            }
        });
    })(r);
}
