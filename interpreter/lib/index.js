var Path = require("path")
  , Operators = require("./operators")
  , Util = require("../../util")
  ;


var ArcInterpreter = module.exports = {};
ArcInterpreter.registers = require("./registers");

function s(inp, s, e) {
    var c = "";
    for (var i = s; i <= e; ++i) {
        if (typeof inp[i] == "undefined") {
            debugger
        }
       c += inp[i].toString();
    }
    return c;
}

function getLoc(buff, cIns) {
    return (parseInt(s(cIns, 19, 31), 2) - 2048) / 4 - 1;
}

function getSimm13(buff, cIns) {
    return s(buff.slice((getLoc(buff, cIns) + 1) * 32), 0, 31);
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
    r = ArcInterpreter.registers[r];
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
                ArcInterpreter.registers[rd(cIns)] = Util.pad((rv(rs1(cIns), 2) + rv(rs2(cIns), 2)).toString(2), 32);
            }
            break;
        // MEMORY
        case "11":

            if (Operators[op] === "ld") {
                ArcInterpreter.registers[rd(cIns)] = getSimm13(buff, cIns);
            }

            if (Operators[op] === "st") {
                var loc = getLoc(buff, cIns) * 32;
                var rdc = ArcInterpreter.registers[rd(cIns)];
                result += ">> Copying content from register " + rd(cIns) + " to memory location: " + loc + "\n";
                for (var i = 0; i < 32; ++i) {
                    buff[loc + i] = rdc[i];
                }
            }
            break;
        default:
            throw new Error("Invalid instruction format.");
            break;
    }
    return result;
}

ArcInterpreter.interpret = function (inp) {
    var output = "";

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

var _r = ArcInterpreter.r = {};
for (var r in ArcInterpreter.registers) {
    (function (r) {
        delete ArcInterpreter.registers[r];
        Object.defineProperty(ArcInterpreter.registers, r, {
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
