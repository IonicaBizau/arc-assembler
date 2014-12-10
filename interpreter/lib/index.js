var Path = require("path")
  , Operators = require("./operators")
  , Util = require("../../util")
  , Registers = {}
  ;

function initRegisters() {
    Registers = {
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
      , "11111": ""
      , "PC": ""
      , "PSR": ""
    };

    for (var k in ArcInterpreter.r) {
        delete ArcInterpreter.r[k];
    }

    for (var r in Registers) {
        (function (r) {
            delete Registers[r];
            Object.defineProperty(Registers, r, {
                writeable: true
              , set: function (newValue) {
                    _r[r] = newValue;
                    ArcInterpreter.rSet(">> Register " + r + " was changed: " + newValue);
                }
              , get: function () {
                    ArcInterpreter.rSet("<< Getting value from register: " + r);
                    return _r[r];
                }
            });
        })(r);
    }
}

var ArcInterpreter = module.exports = {};

function s(inp, s, e) {
    var c = "";
    for (var i = s; i <= e; ++i) {
        if (typeof inp[i] === "undefined") { continue; }
        c += inp[i].toString();
    }
    return c;
}

function getLoc(buff, cIns) {
    return (parseInt(s(cIns, 19, 31), 2) - 2048) / 4;
}

function getSimm13(buff, cIns) {
    return s(buff.slice((getLoc(buff, cIns)) * 32), 0, 31);
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

var ended = false;
function interpret(cIns, buff) {
    var result = "";
    var op = s(cIns, 7, 12);
    if (ended) {
        return;
    }

    if (Operators[op] === "jmpl") {
        ended = true;
    }

    if (ended) {
        return;
    }

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

            if (Operators[op] === "st") {
                var loc = getLoc(buff, cIns) * 32;
                var rdc = rv(rd(cIns));
                result += ">> Copying content from register " + rd(cIns) + " to memory location: " + loc;
                for (var i = 0; i < 32; ++i) {
                    buff[loc + i] = parseInt(rdc[i]);
                }
            }
            break;
        default:
            throw new Error("Invalid instruction format.");
            break;
    }
    return result;
}

var _r = ArcInterpreter.r = {};
ArcInterpreter.interpret = function (inp) {
    var output = "";

    initRegisters();

    ended = false;

    ArcInterpreter.rSet = function (m) {
        output += m + "\n";
    };

    ArcInterpreter.rGet = function (m) {
        output += m + "\n";
    };

    for (var i = 0; i < inp.length; i += 32) {
        var cIns = inp.slice(i, i + 32)
          , result = interpret(cIns, inp)
          ;

        output += result ? result + "\n" : "";
    }
    return output.trim();
};

if (typeof window === "object") {
    window.ArcInterpreter = ArcInterpreter;
}
