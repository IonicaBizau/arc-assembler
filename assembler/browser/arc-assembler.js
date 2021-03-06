"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

(function e(t, n, r) {
  function s(o, u) {
    if (!n[o]) {
      if (!t[o]) {
        var a = typeof require == "function" && require;if (!u && a) return a(o, !0);if (i) return i(o, !0);var f = new Error("Cannot find module '" + o + "'");throw f.code = "MODULE_NOT_FOUND", f;
      }var l = n[o] = { exports: {} };t[o][0].call(l.exports, function (e) {
        var n = t[o][1][e];return s(n ? n : e);
      }, l, l.exports, e, t, n, r);
    }return n[o].exports;
  }var i = typeof require == "function" && require;for (var o = 0; o < r.length; o++) {
    s(r[o]);
  }return s;
})({ 1: [function (require, module, exports) {
    var Util = require("arc-util");function handleNumber(r, length) {
      var value = "";if (/^\-?0x|H$/.test(r)) {
        value = parseInt(r.replace("-", ""), 16);if (r[0] === "-") {
          value = -value;
        }return Util.bin(value, length);
      }if (/[0-9]+/.test(r)) {
        value = parseInt(r);return Util.bin(value, length);
      }return Util.bin(0, length);
    }function compile(line, parsed) {
      function bR(r, length) {
        length = length || 5;if (/^\%r[0-9]+\+[a-z]+$/.test(r)) {
          return Util.pad(Util.addBin(bR(r.replace(/\+[a-z]+$/g, "")), bR("[" + r.match(/\+([a-z]+)/)[0] + "]")), length);
        }if (/^\%r[0-9]+\+[0-9]+$/.test(r)) {
          return bR(r.replace(/\+[0-9]+$/g, ""), length);
        }if (Util.isRegister(r)) {
          return Util.pad(parseInt(r.match(/\%r([0-9]+)/)[1]).toString(2), length);
        }if (Util.isLocAdd(r)) {
          var add = r.match(/^\[([a-z,_]+)\]$/)[1],
              loc = parsed.addresses[add];if (!loc) {
            throw new Error("Invalid memory location: " + add);
          }return Util.pad(loc.address.toString(2), length);
        }return handleNumber(r);
      }function getRd(line, raw) {
        if (raw === true) {
          return line.iArgs.slice(-1)[0];
        }return bR(getRd(line, true));
      }function getRs1(line, raw) {
        if (raw === true) {
          return line.iArgs[0];
        }var r = getRs1(line, true);return bR(r);
      }function getRs2(line, raw) {
        if (raw === true) {
          return line.iArgs[1];
        }if (line.iArgs.length <= 2) {
          return "00000";
        }var r = getRs2(line, true);return bR(r);
      }var instruction = "";if (line.instruction) {
        switch (line.type) {case "memory":
            instruction += "11";break;case "arithmetic":
            instruction += "10";break;case "sethi":
            instruction += "00";break;case "branch":
            instruction += "00";break;case "control":
            instruction += "01";break;}switch (line.instruction) {case "ld":
            if (line.iArgs.length >= 2) {
              var rd = getRd(line);var rs1 = getRs1(line);var rs2 = getRs2(line);instruction += rd;instruction += "000000";instruction += rs1;if (!Util.isLocAdd(getRs1(line, true))) {
                instruction += "0";instruction += "00000000";instruction += rs2;
              } else {
                instruction += "1";instruction += bR(getRs1(line, true), 13);
              }
            } else {
              throw new Error("Invalid syntax: " + line.c);
            }break;case "st":
            if (line.iArgs.length >= 2) {
              var rd = getRd(line);var rs1 = getRs1(line);var rs2 = getRs2(line);if (Util.isLocAdd(getRd(line, true))) {
                rd = getRs1(line);rs1 = Util.pad("", 5);
              }instruction += rd;instruction += "000100";instruction += rs1;if (!Util.isLocAdd(getRd(line, true))) {
                instruction += "0";instruction += "00000000";instruction += rs2;
              } else {
                instruction += "1";instruction += bR(getRd(line, true), 13);
              }
            } else {
              throw new Error("Invalid syntax: " + line.c);
            }break;case "printn":
            if (line.iArgs.length !== 1) {
              throw new Error("Invalid syntax: " + line.c);
            }var rd = getRd(line);var rs1 = getRs1(line);var rs2 = getRs2(line);if (Util.isLocAdd(getRd(line, true))) {
              rd = getRs1(line);rs1 = Util.pad("", 5);
            }instruction += rd;instruction += "001000";instruction += rs1;instruction += "0";instruction += "00000000";instruction += rs2;break;case "printc":
            if (line.iArgs.length !== 1) {
              throw new Error("Invalid syntax: " + line.c);
            }var rd = getRd(line);var rs1 = getRs1(line);var rs2 = getRs2(line);if (Util.isLocAdd(getRd(line, true))) {
              rd = getRs1(line);rs1 = Util.pad("", 5);
            }instruction += rd;instruction += "001001";instruction += rs1;instruction += "0";instruction += "00000000";instruction += rs2;break;case "addcc":
            if (line.iArgs.length === 3) {
              var rd = getRd(line);var rs1 = getRs1(line);var rs2 = getRs2(line);instruction += rd;instruction += "010000";instruction += rs1;if (Util.isRegister(getRs2(line, true))) {
                instruction += "0";instruction += "00000000";instruction += rs2;
              } else {
                instruction += "1";instruction += handleNumber(getRs2(line, true), 13);
              }
            } else {
              throw new Error("Invalid syntax: addcc requires 3 arguments");
            }break;case "andcc":
            if (line.iArgs.length === 3) {
              var rd = getRd(line);var rs1 = getRs1(line);var rs2 = getRs2(line);instruction += rd;instruction += "010001";instruction += rs1;if (!Util.isLocAdd(getRd(line, true))) {
                instruction += "0";instruction += "00000000";instruction += rs2;
              } else {
                instruction += "1";instruction += bR(getRd(line, true), 13);
              }
            } else {
              throw new Error("Invalid syntax: andcc requires 3 arguments");
            }break;case "andncc":
            if (line.iArgs.length === 3) {
              var rd = getRd(line);var rs1 = getRs1(line);var rs2 = getRs2(line);instruction += rd;instruction += "011000";instruction += rs1;if (!Util.isLocAdd(getRd(line, true))) {
                instruction += "0";instruction += "00000000";instruction += rs2;
              } else {
                instruction += "1";instruction += bR(getRd(line, true), 13);
              }
            } else {
              throw new Error("Invalid syntax: andncc requires 3 arguments");
            }break;case "orcc":
            if (line.iArgs.length === 3) {
              var rd = getRd(line);var rs1 = getRs1(line);var rs2 = getRs2(line);instruction += rd;instruction += "010010";instruction += rs1;if (!Util.isLocAdd(getRd(line, true))) {
                instruction += "0";instruction += "00000000";instruction += rs2;
              } else {
                instruction += "1";instruction += bR(getRd(line, true), 13);
              }
            } else {
              throw new Error("Invalid syntax: orcc requires 3 arguments");
            }break;case "orncc":
            if (line.iArgs.length === 3) {
              var rd = getRd(line);var rs1 = getRs1(line);var rs2 = getRs2(line);instruction += rd;instruction += "010110";instruction += rs1;if (!Util.isLocAdd(getRd(line, true))) {
                instruction += "0";instruction += "00000000";instruction += rs2;
              } else {
                instruction += "1";instruction += bR(getRd(line, true), 13);
              }
            } else {
              throw new Error("Invalid syntax: orncc requires 3 arguments");
            }break;case "xorcc":
            if (line.iArgs.length === 3) {
              var rd = getRd(line);var rs1 = getRs1(line);var rs2 = getRs2(line);instruction += rd;instruction += "010111";instruction += rs1;if (!Util.isLocAdd(getRd(line, true))) {
                instruction += "0";instruction += "00000000";instruction += rs2;
              } else {
                instruction += "1";instruction += bR(getRd(line, true), 13);
              }
            } else {
              throw new Error("Invalid syntax: xorcc requires 3 arguments");
            }case "call":
            if (line.iArgs.length > 1) {
              throw new Error("Too many argumnets for call instruction.");
            }if (!parsed.addresses[line.iArgs[0]]) {
              throw new Error("Subrutine " + line.iArgs[0] + " doesn't exist");
            }instruction += Util.pad(parsed.addresses[line.iArgs[0]].address.toString(2), 30);break;case "jmpl":
            if (line.iArgs.length === 2) {
              var rd = getRd(line);var rs1 = getRs1(line);instruction += rd;instruction += "111000";instruction += rs1;instruction += "1";instruction += Util.bin(handleNumber(line.iArgs[0].match(/\+([0-9]+)/)), 13);
            } else {
              throw new Error("jmpl requires two arguments");
            }break;case "be":
            if (line.iArgs.length > 1) {
              throw new Error("Too many argumnets for be instruction.");
            }instruction += "0";instruction += "0001";instruction += "010";instruction += Util.pad(parsed.addresses[line.iArgs[0]].address.toString(2), 22);break;case "bcs":
            if (line.iArgs.length > 1) {
              throw new Error("Too many argumnets for bcs instruction.");
            }instruction += "0";instruction += "0101";instruction += "010";instruction += Util.pad(parsed.addresses[line.iArgs[0]].address.toString(2), 22);case "bneg":
            if (line.iArgs.length > 1) {
              throw new Error("Too many argumnets for bneg instruction.");
            }instruction += "0";instruction += "0110";instruction += "010";instruction += Util.pad(parsed.addresses[line.iArgs[0]].address.toString(2), 22);break;case "bvs":
            if (line.iArgs.length > 1) {
              throw new Error("Too many argumnets for bvs instruction.");
            }instruction += "0";instruction += "0111";instruction += "010";instruction += Util.pad(parsed.addresses[line.iArgs[0]].address.toString(2), 22);break;case "ba":
            if (line.iArgs.length > 1) {
              throw new Error("Too many argumnets for ba instruction.");
            }instruction += "0";instruction += "1000";instruction += "010";instruction += Util.pad(parsed.addresses[line.iArgs[0]].address.toString(2), 22);break;}
      }if (Util.isNumber(line.c)) {
        instruction = handleNumber(line.c, 32);
      }return instruction;
    }module.exports = compile;
  }, { "arc-util": 4 }], 2: [function (require, module, exports) {
    var Parse = require("./parser"),
        Compile = require("./compiler"),
        Util = require("arc-util");var ArcAssembler = module.exports = {};ArcAssembler.parse = Parse;ArcAssembler.compileLine = Compile;ArcAssembler.compile = function (lines) {
      var result = { raw: [], mCode: [] };if (!Array.isArray(lines)) {
        lines = lines.toString();
      }if (typeof lines === "string") {
        lines = lines.split("\n");
      }var parsed = Parse(lines);var size = Math.max.apply(null, parsed.lines.map(function (c) {
        return c.address || -1;
      }));result.mCode = [];for (var i = 0; i < size * 8; ++i) {
        result.mCode.push(0);
      }function setBits(sAddress, bits) {
        if (typeof bits === "string") {
          bits = bits.split("").map(function (c) {
            return parseInt(c);
          });
        }for (var i = 0; i < bits.length; ++i) {
          result.mCode[sAddress * 8 + i] = bits[i];
        }
      }parsed.lines.forEach(function (c, i) {
        if (!c.c) {
          return;
        }var ins = ArcAssembler.compileLine(c, parsed);if (!ins.length) {
          return;
        }result.raw.push({ code: ins, line: i + 1 });setBits(c.address, ins);
      });return result;
    };if ((typeof window === "undefined" ? "undefined" : _typeof(window)) === "object") {
      window.ArcAssembler = ArcAssembler;
    }
  }, { "./compiler": 1, "./parser": 3, "arc-util": 4 }], 3: [function (require, module, exports) {
    var Util = require("arc-util");var mnemonics = { ld: { type: "memory" }, st: { type: "memory" }, printn: { type: "memory" }, printc: { type: "memory" }, sethi: { type: "sethi" }, branch: { type: "branch" }, be: { type: "branch" }, bcs: { type: "branch" }, bneg: { type: "branch" }, bvs: { type: "branch" }, ba: { type: "branch" }, call: { type: "control" }, addcc: { type: "arithmetic" }, andcc: { type: "arithmetic" }, andncc: { type: "arithmetic" }, orcc: { type: "arithmetic" }, xorcc: { type: "arithmetic" }, orncc: { type: "arithmetic" }, srl: { type: "arithmetic" }, jmpl: { type: "arithmetic" } };var ALL_MNEMONICS = "\\b(?:" + Object.keys(mnemonics).join("|") + ")\\b";function parse(lines) {
      var result = { lines: [], addresses: {}, _cAddress: 0, verbose: "" };var lastLabel = null;var asEnded = false;var asStarted = false;for (var i in lines) {
        var c = lines[i];c = c.replace(/\!.*$/g, "");var op = ((c.match(/\.([a-z]+)/) || [])[1] || "").trim(),
            label = ((c.match(/^([a-z,_]+):\ /i) || [])[1] || "").trim(),
            instruction = null,
            iArgs = [],
            oArgs = [],
            lValue = "",
            cLine = {};label = label || lastLabel;if (new RegExp(ALL_MNEMONICS).test(c)) {
          var m = c.match(new RegExp("(" + ALL_MNEMONICS + ")( (.*))?")) || [];instruction = m[1];iArgs = (m[2] || "").split(/[ ,]+/).filter(function (c) {
            return c;
          });
        }if (op) {
          lValue = "";lastLabel = "";label = "";oArgs = c.replace("." + op, "").split(/[ ,]+/).filter(function (c) {
            return c;
          });
        }if (op || label || instruction) {
          result.verbose += "Line " + (parseInt(i) + 1) + ":\n";
        }if (op) {
          result.verbose += "  > Pseudo ops: " + op;
        }if (oArgs.length) {
          result.verbose += "  > Operator Args: " + JSON.stringify(oArgs);
        }if (label) {
          lastLabel = label;lValue = c.replace(new RegExp("^" + label + ":"), "").trim();result.verbose += "  > Label: " + label;result.verbose += "  > Content: " + lValue;
        }if (instruction) {
          result.verbose += "  > Instruction: " + instruction;lValue = c.trim();
        }if (iArgs.length) {
          result.verbose += "  > Instruction Arguments: " + JSON.stringify(iArgs);
        }if (Util.isNumber(c.trim())) {
          lValue = c.trim();
        }cLine.op = op;cLine._c = c;cLine.label = label;cLine.instruction = instruction;cLine.iArgs = iArgs;cLine.oArgs = oArgs;cLine.c = lValue;if (cLine.op === "begin") {
          asStarted = true;asEnded = false;
        }if (cLine.op === "end") {
          asEnded = true;
        }if (asStarted && !asEnded) {
          if (instruction) {
            if (!mnemonics[instruction]) {
              throw new Error("Invalid instruction: " + instruction);
            }cLine.type = mnemonics[instruction].type;
          }if (cLine.op === "org") {
            result._cAddress = parseInt(oArgs[0]);if (!(result._cAddress >= 0)) {
              throw new Error(".org value should be positive integer");
            }
          }if (cLine.label && !result.addresses[cLine.label]) {
            result.addresses[cLine.label] = { address: result._cAddress };
          }cLine.address = result._cAddress;if (cLine.label || cLine.instruction || Util.isNumber(cLine.c)) {
            result._cAddress += 4;
          }
        }result.lines.push(cLine);
      }return result;
    }module.exports = parse;
  }, { "arc-util": 4 }], 4: [function (require, module, exports) {
    var Util = module.exports = {};Util.pad = function (input, l, c) {
      c = c || "0";l = l || 32;var pad = Array.apply(null, Array(l)).map(function () {
        return c;
      }).join("");return (pad + input).slice(-l);
    };Util.isRegister = function (inp) {
      return (/^\%r[0-9]+$/.test(inp)
      );
    };Util.isLocAdd = function (inp) {
      return (/^\[[a-z,_]+\]$/.test(inp)
      );
    };Util.addBin = function () {
      var r = 0;for (var i = 0; i < arguments.length; ++i) {
        r += parseInt(arguments[i], 2);
      }return r.toString(2);
    };Util.comp = function (input) {
      return input.replace(/1/g, "a").replace(/0/g, "1").replace(/a/g, "0");
    };Util.uncomp = function (input) {
      if (input[0] === "1") {
        return -Util.uncomp(Util.comp(input)) - 1;
      }return parseInt(input, 2);
    };Util.bin = function (input, l) {
      if (input >= 0) {
        return Util.pad(input.toString(2), l);
      }return Util.comp(Util.bin(Math.abs(input + 1), l));
    };Util.isNumber = function (c) {
      return (/(^\-?[0-9]+$)|(^\-?0x)|H$/.test(c)
      );
    };
  }, {}] }, {}, [2]);