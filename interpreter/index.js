var Path = require("path")
  , Fs = require("fs")
  , Operators = require("./operators")
  , Util = require("../util")
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

function getSimm13(buff, cIns) {
    return s(buff.slice(((parseInt(s(cIns, 19, 31), 2) - 2048) / 4) * 32), 0, 31);
}

function rd(cIns) {
    return s(cIns, 2, 6);
}

function rs1(cIns) {
    return s(cIns, 13, 17);
}

function rs2(cIns) {
    return s(cIns, 27, 31);
}

function rv(r, b) {
    r = Registers[r];
    if (!r) {
        throw new Error("Register is empty.");
    }
    if (typeof b === "number") {
        return parseInt(r, b);
    }
    return r;
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
            if (Operators[op] === "addcc") {
                Registers[rd(cIns)] = Util.pad((rv(rs1(cIns), 2) + rv(rs2(cIns), 2)).toString(2), 32);
            }
            break;
        // MEMORY
        case "11":
            if (Operators[op] === "ld") {
                Registers[rd(cIns)] = getSimm13(buff, cIns);
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

var _r = {};
for (var r in Registers) {
    (function (r) {
        delete Registers[r];
        Object.defineProperty(Registers, r, {
            writeable: true
          , set: function (newValue) {
                _r[r] = newValue;
                console.log(">> Register " + r + " was changed: " + newValue);
            }
          , get: function () {
                console.log("<< Getting value from register: " + r);
                return _r[r];
            }
        });
    })(r);
}
