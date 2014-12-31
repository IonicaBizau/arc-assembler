// Dependencies
var Path = require("path")
  , Operators = require("./operators")
  , Util = require("arc-util")
  , Registers = {}
  ;

// Get the stdout
var Stdout = process.stdout ? process.stdout : window.Process.stdout;

// Constructor
var ArcInterpreter = module.exports = {};

/*!
 * initRegisters
 * Inits the register contents.
 *
 * @name initRegisters
 * @function
 * @return {undefined}
 */
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
      , "PC":    Util.pad(0, 32)
      , "PSR":   Util.pad(0, 32) // 0000 ... n z c  v
                                 // 0123 ... 8 9 10 11
    };

    for (var k in ArcInterpreter.r) {
        delete ArcInterpreter.r[k];
    }

    for (var r in Registers) {
        (function (r) {
            _r[r] = Registers[r];
            delete Registers[r];
            Object.defineProperty(Registers, r, {
                writeable: true
              , set: function (newValue) {
                    if (r !== "00000") {
                        _r[r] = newValue;
                        ArcInterpreter.rSet(">> Register " + RegisterMap[r] + " was set: " + Util.uncomp(newValue));
                    }
                }
              , get: function () {
                    ArcInterpreter.rSet("<< Getting value from register: " + RegisterMap[r]);
                    return _r[r];
                }
            });
        })(r);
    }
}

var RegisterMap = ArcInterpreter.registerMap = {
    "00000": "r0"
  , "00001": "r1"
  , "00010": "r2"
  , "00011": "r3"
  , "00100": "r4"
  , "00101": "r5"
  , "00110": "r6"
  , "00111": "r7"
  , "01000": "r8"
  , "01001": "r9"
  , "01010": "r10"
  , "01011": "r11"
  , "01100": "r12"
  , "01101": "r13"
  , "01110": "r14"
  , "01111": "r15"
  , "10000": "r16"
  , "10001": "r17"
  , "10010": "r18"
  , "10011": "r19"
  , "10100": "r20"
  , "10101": "r21"
  , "10110": "r22"
  , "10111": "r23"
  , "11000": "r24"
  , "11001": "r25"
  , "11010": "r26"
  , "11011": "r27"
  , "11100": "r28"
  , "11101": "r29"
  , "11110": "r30"
  , "11111": "r31"
  , "PC":    "PC"
  , "PSR":   "PSR"
};

var PSR = {
    update: function (v, tN) {

        var setN = parseInt(v[0])
          , setZ = tN === 0
          , setC = true // TODO
          , setV = Math.abs(tN) >= Math.pow(2, 31)
          ;

        Registers.PSR = Registers.PSR.split("").map(function (c, i) {

            // n
            if (i === 8) {
                if (setN) {
                    return 1;
                } else {
                    return 0;
                }
            }

            // z
            if (i === 9) {
                if (setZ) {
                    return 1;
                } else {
                    return 0;
                }
            }

            // c
            if (i === 10) {
                if (setC) {
                    return 1;
                } else {
                    return 0;
                }
            }

            // v
            if (i === 11) {
                if (setV) {
                    return 1;
                } else {
                    return 0;
                }
            }

            return c;
        }).join("");

    }
  , n: function () {
        return parseInt(Registers.PSR[8]);
    }
  , z: function () {
        return parseInt(Registers.PSR[9]);
    }
  , c: function () {
        return parseInt(Registers.PSR[10]);
    }
  , v: function () {
        return parseInt(Registers.PSR[11]);
    }
};

/*!
 * s
 * Stringifies a buffer segment.
 *
 * @name s
 * @function
 * @param {Buffer} inp Segment of the buffer that should be stringified.
 * @param {Number} s Start index.
 * @param {Number} e End index.
 * @return {String} The stringified segment of buffer.
 */
function s(inp, s, e) {
    var c = "";
    for (var i = s; i <= e; ++i) {
        if (typeof inp[i] === "undefined") { continue; }
        c += inp[i].toString();
    }
    return c;
}

/*!
 * getLoc
 * Computes the memory location located at simm13.
 *
 * @name getLoc
 * @function
 * @param {Buffer} buff The full buffer.
 * @param {Buffer} cIns The buffer segment.
 * @return {Number} Memory location of simm13 value.
 */
function getLoc(buff, cIns) {
    return Util.uncomp(s(cIns, 19, 31)) / 4;
}

/*!
 * getSimm13
 * Returns the raw value of simm13.
 *
 * @name getSimm13
 * @function
 * @param {Buffer} buff The full buffer.
 * @param {Buffer} cIns The buffer segment.
 * @return {String} Simm13 raw value.
 */
function getSimm13(buff, cIns) {
    return s(buff.slice((getLoc(buff, cIns)) * 32), 0, 31);
}


/*!
 * rd
 * Gets the destination register.
 *
 * @name rd
 * @function
 * @param {Buffer} cIns The buffer segment.
 * @return {String} The destination register.
 */
function rd(cIns) {
    return s(cIns, 2, 6);
}

/*!
 * rs1
 * Gets the source 1 register.
 *
 * @name rs1
 * @function
 * @param {Buffer} cIns The buffer segment.
 * @return {String} The source 1 register.
 */
function rs1(cIns) {
    return s(cIns, 13, 17);
}

/*!
 * rs2
 * Gets the source 2 register.
 *
 * @name rs2
 * @function
 * @param {Buffer} cIns The buffer segment.
 * @return {String} The source 2 register.
 */
function rs2(cIns) {
    return s(cIns, 27, 31);
}

/*!
 * rv
 * Gets the register value.
 *
 * @name rv
 * @function
 * @param {String} r The register id.
 * @param {String} b The result base.
 * @return {String} The register value.
 */
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

/*!
 * interpret
 *
 * @name interpret
 * @function
 * @param {Buffer} cIns The buffer segment.
 * @param {Buffer} buff The full buffer.
 * @return {String} Verbose data.
 */
var ended = false;
function interpret(cIns, buff) {
    var result = "";
    var op = s(cIns, 7, 12);
    if (ended) {
        return;
    }

    if (Operators[op] === "jmpl") {
        var jmp = Util.uncomp(Registers[Util.pad((15).toString(2), 5)]);
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
            op = s(cIns, 7, 9);

            // branch
            if (Operators[op] === "branch") {
                var cond = s(cIns, 3, 6);
                var sub = Util.uncomp(s(cIns, 10, 31));
                var loc = sub / 4 * 32;

                // be
                if (Operators[cond] === "be" && PSR.z()) {
                    result += "Calling subrutine located at memory location: " + loc;
                    Registers[Util.pad((15).toString(2), 5)] = Util.pad(0, 32);
                    ArcInterpreter.cPosition = loc;
                    return result;
                }

                // bneg
                if (Operators[cond] === "bneg" && PSR.n()) {
                    result += "Calling subrutine located at memory location: " + loc;
                    Registers[Util.pad((15).toString(2), 5)] = Util.pad(ArcInterpreter.cPosition.toString(2), 32);
                    ArcInterpreter.cPosition = loc;
                    return result;
                }

                // bcs
                if (Operators[cond] === "bcs" && PSR.c()) {
                    result += "Calling subrutine located at memory location: " + loc;
                    Registers[Util.pad((15).toString(2), 5)] = Util.pad(ArcInterpreter.cPosition.toString(2), 32);
                    ArcInterpreter.cPosition = loc;
                    return result;
                }

                // bvs
                if (Operators[cond] === "bvs" && PSR.v()) {
                    result += "Calling subrutine located at memory location: " + loc;
                    Registers[Util.pad((15).toString(2), 5)] = Util.pad(ArcInterpreter.cPosition.toString(2), 32);
                    ArcInterpreter.cPosition = loc;
                    return result;
                }

                // ba
                if (Operators[cond] === "ba") {
                    result += "Calling subrutine located at memory location: " + loc;
                    Registers[Util.pad((15).toString(2), 5)] = Util.pad("0", 32);
                    ArcInterpreter.cPosition = loc;
                    return result;
                }
            }

            if (Operators[op] === "sethi") {
                // TODO
                throw new Error("sethi is not supported.");
            }
            break;

        // CALL
        case "01":
            var sub = Util.uncomp(s(cIns, 2, 31));
            var loc = sub / 4 * 32;
            result += "Calling subrutine located at memory location: " + loc;
            Registers[Util.pad((15).toString(2), 5)] = Util.pad(ArcInterpreter.cPosition.toString(2), 32);
            ArcInterpreter.cPosition = loc;
            return result;

        // ARITHMETIC
        case "10":
            var dest = rd(cIns)
              , iBit = cIns[18]
              , c1 = rv(rs1(cIns), 2)
              , c2 = iBit === 0 ? rv(rs2(cIns), 2) : Util.uncomp(s(cIns, 19, 31))
              , r = null
              , tN = null
              ;

            if (Operators[op] === "addcc") {
                r = Util.bin(tN = c1 + c2);
            }

            if (Operators[op] === "andncc") {
                r = Util.comp(Util.bin(tN = c1 & c2));
            }

            if (Operators[op] === "andcc") {
                r = Util.bin(tN = c1 & c2);
            }

            if (Operators[op] === "orcc") {
                r = Util.bin(tN = c1 | c2);
            }

            if (Operators[op] === "orncc") {
                r = Util.comp(Util.bin(tN = c1 | c2));
            }

            if (Operators[op] === "xorcc") {
                r = Util.bin(tN = c1 ^ c2);
            }

            if (r === null) {
                throw new Error("Invalid arithmetic instruction.");
            }

            Registers[dest] = r;
            PSR.update(r, tN);
            break;

        // MEMORY
        case "11":
            var iBit = cIns[18];

            if (Operators[op] === "ld") {
                if (iBit === 0) {
                    var sAddress = Util.uncomp(Registers[rs1(cIns)]) * 8;
                    Registers[rd(cIns)] = s(buff.slice(sAddress, sAddress + 32), 0, 31);
                } else {
                    Registers[rd(cIns)] = getSimm13(buff, cIns);
                }
            }

            if (Operators[op] === "st") {
                var loc = getLoc(buff, cIns) * 32;
                var rdc = rv(rd(cIns));
                result += ">> Copying content from register " + RegisterMap[rd(cIns)] + " to memory location: " + loc;
                for (var i = 0; i < 32; ++i) {
                    buff[loc + i] = parseInt(rdc[i]);
                }
            }

            if (Operators[op] === "printn") {
                Stdout.write(Util.uncomp(Registers[rd(cIns)]));
            }

            if (Operators[op] === "printc") {
                Stdout.write(String.fromCharCode(Util.uncomp(Registers[rd(cIns)])));
            }

            break;
        default:
            throw new Error("Invalid instruction format.");
            break;
    }

    ArcInterpreter.cPosition += 32;
    return result;
}

/**
 * interpret
 * Interprets machine code.
 *
 * @name interpret
 * @function
 * @param {Buffer} inp The input buffer (machine code).
 * @return {String} Verbose output.
 */
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
        var cIns = inp.slice(ArcInterpreter.cPosition, ArcInterpreter.cPosition + 32);
        var result = interpret(cIns, inp);

        output += result ? result + "\n" : "";
    }

    for (var i = 0; i < inp.length; i += 32) {
        output += s(inp.slice(i, i + 32), 0, 31).match(/.{1,4}/g).join(" ") + "\n";
    }

    return output.trim();
};

// Browser support
if (typeof window === "object") {
    window.ArcInterpreter = ArcInterpreter;
}
