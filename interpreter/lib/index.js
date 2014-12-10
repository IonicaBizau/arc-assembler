var Path = require("path")
  , Operators = require("./operators")
  , Util = require("../../util")
  , Registers = {}
  ;

function initRegisters() {
    Registers = {
        "00000": Util.pad(0, 32)
      , "00001": Util.pad(0, 32)
      , "00010": Util.pad(0, 32)
      , "00011": Util.pad(0, 32)
      , "00100": Util.pad(0, 32)
      , "00101": Util.pad(0, 32)
      , "00110": Util.pad(0, 32)
      , "00111": Util.pad(0, 32)
      , "01000": Util.pad(0, 32)
      , "01001": Util.pad(0, 32)
      , "01010": Util.pad(0, 32)
      , "01011": Util.pad(0, 32)
      , "01100": Util.pad(0, 32)
      , "01101": Util.pad(0, 32)
      , "01110": Util.pad(0, 32)
      , "01111": Util.pad(0, 32)
      , "10000": Util.pad(0, 32)
      , "10001": Util.pad(0, 32)
      , "10010": Util.pad(0, 32)
      , "10011": Util.pad(0, 32)
      , "10100": Util.pad(0, 32)
      , "10101": Util.pad(0, 32)
      , "10110": Util.pad(0, 32)
      , "10111": Util.pad(0, 32)
      , "11000": Util.pad(0, 32)
      , "11001": Util.pad(0, 32)
      , "11010": Util.pad(0, 32)
      , "11011": Util.pad(0, 32)
      , "11100": Util.pad(0, 32)
      , "11101": Util.pad(0, 32)
      , "11110": Util.pad(0, 32)
      , "11111": Util.pad(0, 32)
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
        return Util.uncomp(r);
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
        var jmp = parseInt(Registers[Util.pad((15).toString(2), 5)], 2);
        if (!jmp) {
            ended = true;
        } else {
            ArcInterpreter.cPosition = jmp + 32;
            Registers[Util.pad((15).toString(2), 5)] = Util.pad("0", 32);
            result += "Returning from subrutine.";
            return;
        }
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
            var sub = parseInt(s(cIns, 2, 31), 2) - 2048;
            var loc = (sub / 4 - 1)* 32;
            result += "Calling subrutine located at memory location: " + (loc + 2048);
            Registers[Util.pad((15).toString(2), 5)] = Util.pad(parseInt(ArcInterpreter.cPosition).toString(2), 32);
            ArcInterpreter.cPosition = loc;
            return result;
        // ARITHMETIC
        case "10":
            if (Operators[op] === "addcc") {
                Registers[rd(cIns)] = Util.bin(rv(rs1(cIns), 2) + rv(rs2(cIns), 2))
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
                result += ">> Copying content from register " + rd(cIns) + " to memory location: " + (loc + 2048);
                for (var i = 0; i < 32; ++i) {
                    buff[loc + i] = parseInt(rdc[i]);
                }
            }
            break;
        default:
            throw new Error("Invalid instruction format.");
            break;
    }

    ArcInterpreter.cPosition += 32;
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

    ArcInterpreter.cPosition = 0;
    while (!ended) {
        var cIns = inp.slice(ArcInterpreter.cPosition, ArcInterpreter.cPosition + 32)
          , result = interpret(cIns, inp)
          ;

        output += result ? result + "\n" : "";
    }

    return output.trim();
};

if (typeof window === "object") {
    window.ArcInterpreter = ArcInterpreter;
}
