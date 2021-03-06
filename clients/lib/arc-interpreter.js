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
    (function (process) {
      function normalizeArray(parts, allowAboveRoot) {
        var up = 0;for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];if (last === ".") {
            parts.splice(i, 1);
          } else if (last === "..") {
            parts.splice(i, 1);up++;
          } else if (up) {
            parts.splice(i, 1);up--;
          }
        }if (allowAboveRoot) {
          for (; up--; up) {
            parts.unshift("..");
          }
        }return parts;
      }var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;var splitPath = function splitPath(filename) {
        return splitPathRe.exec(filename).slice(1);
      };exports.resolve = function () {
        var resolvedPath = "",
            resolvedAbsolute = false;for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = i >= 0 ? arguments[i] : process.cwd();if (typeof path !== "string") {
            throw new TypeError("Arguments to path.resolve must be strings");
          } else if (!path) {
            continue;
          }resolvedPath = path + "/" + resolvedPath;resolvedAbsolute = path.charAt(0) === "/";
        }resolvedPath = normalizeArray(filter(resolvedPath.split("/"), function (p) {
          return !!p;
        }), !resolvedAbsolute).join("/");return (resolvedAbsolute ? "/" : "") + resolvedPath || ".";
      };exports.normalize = function (path) {
        var isAbsolute = exports.isAbsolute(path),
            trailingSlash = substr(path, -1) === "/";path = normalizeArray(filter(path.split("/"), function (p) {
          return !!p;
        }), !isAbsolute).join("/");if (!path && !isAbsolute) {
          path = ".";
        }if (path && trailingSlash) {
          path += "/";
        }return (isAbsolute ? "/" : "") + path;
      };exports.isAbsolute = function (path) {
        return path.charAt(0) === "/";
      };exports.join = function () {
        var paths = Array.prototype.slice.call(arguments, 0);return exports.normalize(filter(paths, function (p, index) {
          if (typeof p !== "string") {
            throw new TypeError("Arguments to path.join must be strings");
          }return p;
        }).join("/"));
      };exports.relative = function (from, to) {
        from = exports.resolve(from).substr(1);to = exports.resolve(to).substr(1);function trim(arr) {
          var start = 0;for (; start < arr.length; start++) {
            if (arr[start] !== "") break;
          }var end = arr.length - 1;for (; end >= 0; end--) {
            if (arr[end] !== "") break;
          }if (start > end) return [];return arr.slice(start, end - start + 1);
        }var fromParts = trim(from.split("/"));var toParts = trim(to.split("/"));var length = Math.min(fromParts.length, toParts.length);var samePartsLength = length;for (var i = 0; i < length; i++) {
          if (fromParts[i] !== toParts[i]) {
            samePartsLength = i;break;
          }
        }var outputParts = [];for (var i = samePartsLength; i < fromParts.length; i++) {
          outputParts.push("..");
        }outputParts = outputParts.concat(toParts.slice(samePartsLength));return outputParts.join("/");
      };exports.sep = "/";exports.delimiter = ":";exports.dirname = function (path) {
        var result = splitPath(path),
            root = result[0],
            dir = result[1];if (!root && !dir) {
          return ".";
        }if (dir) {
          dir = dir.substr(0, dir.length - 1);
        }return root + dir;
      };exports.basename = function (path, ext) {
        var f = splitPath(path)[2];if (ext && f.substr(-1 * ext.length) === ext) {
          f = f.substr(0, f.length - ext.length);
        }return f;
      };exports.extname = function (path) {
        return splitPath(path)[3];
      };function filter(xs, f) {
        if (xs.filter) return xs.filter(f);var res = [];for (var i = 0; i < xs.length; i++) {
          if (f(xs[i], i, xs)) res.push(xs[i]);
        }return res;
      }var substr = "ab".substr(-1) === "b" ? function (str, start, len) {
        return str.substr(start, len);
      } : function (str, start, len) {
        if (start < 0) start = str.length + start;return str.substr(start, len);
      };
    }).call(this, require("_process"));
  }, { _process: 2 }], 2: [function (require, module, exports) {
    var process = module.exports = {};process.nextTick = function () {
      var canSetImmediate = typeof window !== "undefined" && window.setImmediate;var canMutationObserver = typeof window !== "undefined" && window.MutationObserver;var canPost = typeof window !== "undefined" && window.postMessage && window.addEventListener;if (canSetImmediate) {
        return function (f) {
          return window.setImmediate(f);
        };
      }var queue = [];if (canMutationObserver) {
        var hiddenDiv = document.createElement("div");var observer = new MutationObserver(function () {
          var queueList = queue.slice();queue.length = 0;queueList.forEach(function (fn) {
            fn();
          });
        });observer.observe(hiddenDiv, { attributes: true });return function nextTick(fn) {
          if (!queue.length) {
            hiddenDiv.setAttribute("yes", "no");
          }queue.push(fn);
        };
      }if (canPost) {
        window.addEventListener("message", function (ev) {
          var source = ev.source;if ((source === window || source === null) && ev.data === "process-tick") {
            ev.stopPropagation();if (queue.length > 0) {
              var fn = queue.shift();fn();
            }
          }
        }, true);return function nextTick(fn) {
          queue.push(fn);window.postMessage("process-tick", "*");
        };
      }return function nextTick(fn) {
        setTimeout(fn, 0);
      };
    }();process.title = "browser";process.browser = true;process.env = {};process.argv = [];function noop() {}process.on = noop;process.addListener = noop;process.once = noop;process.off = noop;process.removeListener = noop;process.removeAllListeners = noop;process.emit = noop;process.binding = function (name) {
      throw new Error("process.binding is not supported");
    };process.cwd = function () {
      return "/";
    };process.chdir = function (dir) {
      throw new Error("process.chdir is not supported");
    };
  }, {}], 3: [function (require, module, exports) {
    (function (process) {
      var Path = require("path"),
          Operators = require("./operators"),
          Util = require("arc-util"),
          Registers = {};var Stdout = process.stdout ? process.stdout : window.Process.stdout;var ArcInterpreter = module.exports = {};function initRegisters() {
        Registers = { "00000": Util.pad(0, 32), "00001": Util.pad(0, 32), "00010": Util.pad(0, 32), "00011": Util.pad(0, 32), "00100": Util.pad(0, 32), "00101": Util.pad(0, 32), "00110": Util.pad(0, 32), "00111": Util.pad(0, 32), "01000": Util.pad(0, 32), "01001": Util.pad(0, 32), "01010": Util.pad(0, 32), "01011": Util.pad(0, 32), "01100": Util.pad(0, 32), "01101": Util.pad(0, 32), "01110": Util.pad(0, 32), "01111": Util.pad(0, 32), 10000: Util.pad(0, 32), 10001: Util.pad(0, 32), 10010: Util.pad(0, 32), 10011: Util.pad(0, 32), 10100: Util.pad(0, 32), 10101: Util.pad(0, 32), 10110: Util.pad(0, 32), 10111: Util.pad(0, 32), 11000: Util.pad(0, 32), 11001: Util.pad(0, 32), 11010: Util.pad(0, 32), 11011: Util.pad(0, 32), 11100: Util.pad(0, 32), 11101: Util.pad(0, 32), 11110: Util.pad(0, 32), 11111: Util.pad(0, 32), PC: Util.pad(0, 32), PSR: Util.pad(0, 32) };for (var k in ArcInterpreter.r) {
          delete ArcInterpreter.r[k];
        }for (var r in Registers) {
          (function (r) {
            _r[r] = Registers[r];delete Registers[r];Object.defineProperty(Registers, r, { writeable: true, set: function set(newValue) {
                if (r !== "00000") {
                  _r[r] = newValue;ArcInterpreter.rSet(">> Register " + RegisterMap[r] + " was set: " + Util.uncomp(newValue));
                }
              }, get: function get() {
                ArcInterpreter.rSet("<< Getting value from register: " + RegisterMap[r]);return _r[r];
              } });
          })(r);
        }
      }var RegisterMap = ArcInterpreter.registerMap = { "00000": "r0", "00001": "r1", "00010": "r2", "00011": "r3", "00100": "r4", "00101": "r5", "00110": "r6", "00111": "r7", "01000": "r8", "01001": "r9", "01010": "r10", "01011": "r11", "01100": "r12", "01101": "r13", "01110": "r14", "01111": "r15", 10000: "r16", 10001: "r17", 10010: "r18", 10011: "r19", 10100: "r20", 10101: "r21", 10110: "r22", 10111: "r23", 11000: "r24", 11001: "r25", 11010: "r26", 11011: "r27", 11100: "r28", 11101: "r29", 11110: "r30", 11111: "r31", PC: "PC", PSR: "PSR" };var PSR = { update: function update(v, tN) {
          var setN = parseInt(v[0]),
              setZ = tN === 0,
              setC = true,
              setV = Math.abs(tN) >= Math.pow(2, 31);Registers.PSR = Registers.PSR.split("").map(function (c, i) {
            if (i === 8) {
              if (setN) {
                return 1;
              } else {
                return 0;
              }
            }if (i === 9) {
              if (setZ) {
                return 1;
              } else {
                return 0;
              }
            }if (i === 10) {
              if (setC) {
                return 1;
              } else {
                return 0;
              }
            }if (i === 11) {
              if (setV) {
                return 1;
              } else {
                return 0;
              }
            }return c;
          }).join("");
        }, n: function n() {
          return parseInt(Registers.PSR[8]);
        }, z: function z() {
          return parseInt(Registers.PSR[9]);
        }, c: function c() {
          return parseInt(Registers.PSR[10]);
        }, v: function v() {
          return parseInt(Registers.PSR[11]);
        } };function s(inp, s, e) {
        var c = "";for (var i = s; i <= e; ++i) {
          if (typeof inp[i] === "undefined") {
            continue;
          }c += inp[i].toString();
        }return c;
      }function getLoc(buff, cIns) {
        return Util.uncomp(s(cIns, 19, 31)) / 4;
      }function getSimm13(buff, cIns) {
        return s(buff.slice(getLoc(buff, cIns) * 32), 0, 31);
      }function rd(cIns) {
        return s(cIns, 2, 6);
      }function rs1(cIns) {
        return s(cIns, 13, 17);
      }function rs2(cIns) {
        return s(cIns, 27, 31);
      }function rv(r, b) {
        r = Registers[r];if (!r) {
          throw new Error("Register is empty.");
        }if (typeof b === "number") {
          return Util.uncomp(r);
        }return r;
      }var ended = false;function interpret(cIns, buff) {
        var result = "";var op = s(cIns, 7, 12);if (ended) {
          return;
        }if (Operators[op] === "jmpl") {
          var jmp = Util.uncomp(Registers[Util.pad(15..toString(2), 5)]);if (!jmp) {
            ended = true;
          } else {
            ArcInterpreter.cPosition = jmp + 32;Registers[Util.pad(15..toString(2), 5)] = Util.pad("0", 32);result += "Returning from subrutine.";return;
          }
        }if (ended) {
          return;
        }switch (s(cIns, 0, 1)) {case "00":
            op = s(cIns, 7, 9);if (Operators[op] === "branch") {
              var cond = s(cIns, 3, 6);var sub = Util.uncomp(s(cIns, 10, 31));var loc = sub / 4 * 32;if (Operators[cond] === "be" && PSR.z()) {
                result += "Calling subrutine located at memory location: " + loc;Registers[Util.pad(15..toString(2), 5)] = Util.pad(0, 32);ArcInterpreter.cPosition = loc;return result;
              }if (Operators[cond] === "bneg" && PSR.n()) {
                result += "Calling subrutine located at memory location: " + loc;Registers[Util.pad(15..toString(2), 5)] = Util.pad(ArcInterpreter.cPosition.toString(2), 32);ArcInterpreter.cPosition = loc;return result;
              }if (Operators[cond] === "bcs" && PSR.c()) {
                result += "Calling subrutine located at memory location: " + loc;Registers[Util.pad(15..toString(2), 5)] = Util.pad(ArcInterpreter.cPosition.toString(2), 32);ArcInterpreter.cPosition = loc;return result;
              }if (Operators[cond] === "bvs" && PSR.v()) {
                result += "Calling subrutine located at memory location: " + loc;Registers[Util.pad(15..toString(2), 5)] = Util.pad(ArcInterpreter.cPosition.toString(2), 32);ArcInterpreter.cPosition = loc;return result;
              }if (Operators[cond] === "ba") {
                result += "Calling subrutine located at memory location: " + loc;Registers[Util.pad(15..toString(2), 5)] = Util.pad("0", 32);ArcInterpreter.cPosition = loc;return result;
              }
            }if (Operators[op] === "sethi") {
              throw new Error("sethi is not supported.");
            }break;case "01":
            var sub = Util.uncomp(s(cIns, 2, 31));var loc = sub / 4 * 32;result += "Calling subrutine located at memory location: " + loc;Registers[Util.pad(15..toString(2), 5)] = Util.pad(ArcInterpreter.cPosition.toString(2), 32);ArcInterpreter.cPosition = loc;return result;case "10":
            var dest = rd(cIns),
                iBit = cIns[18],
                c1 = rv(rs1(cIns), 2),
                c2 = iBit === 0 ? rv(rs2(cIns), 2) : Util.uncomp(s(cIns, 19, 31)),
                r = null,
                tN = null;if (Operators[op] === "addcc") {
              r = Util.bin(tN = c1 + c2);
            }if (Operators[op] === "andncc") {
              r = Util.comp(Util.bin(tN = c1 & c2));
            }if (Operators[op] === "andcc") {
              r = Util.bin(tN = c1 & c2);
            }if (Operators[op] === "orcc") {
              r = Util.bin(tN = c1 | c2);
            }if (Operators[op] === "orncc") {
              r = Util.comp(Util.bin(tN = c1 | c2));
            }if (Operators[op] === "xorcc") {
              r = Util.bin(tN = c1 ^ c2);
            }if (r === null) {
              throw new Error("Invalid arithmetic instruction.");
            }Registers[dest] = r;PSR.update(r, tN);break;case "11":
            var iBit = cIns[18];if (Operators[op] === "ld") {
              if (iBit === 0) {
                var sAddress = Util.uncomp(Registers[rs1(cIns)]) * 8;Registers[rd(cIns)] = s(buff.slice(sAddress, sAddress + 32), 0, 31);
              } else {
                Registers[rd(cIns)] = getSimm13(buff, cIns);
              }
            }if (Operators[op] === "st") {
              var loc = getLoc(buff, cIns) * 32;var rdc = rv(rd(cIns));result += ">> Copying content from register " + RegisterMap[rd(cIns)] + " to memory location: " + loc;for (var i = 0; i < 32; ++i) {
                buff[loc + i] = parseInt(rdc[i]);
              }
            }if (Operators[op] === "printn") {
              Stdout.write(Util.uncomp(Registers[rd(cIns)]).toString());
            }if (Operators[op] === "printc") {
              Stdout.write(String.fromCharCode(Util.uncomp(Registers[rd(cIns)])));
            }break;default:
            throw new Error("Invalid instruction format.");break;}ArcInterpreter.cPosition += 32;return result;
      }var _r = ArcInterpreter.r = {};ArcInterpreter.interpret = function (inp) {
        var output = "";initRegisters();ended = false;ArcInterpreter.rSet = function (m) {
          output += m + "\n";
        };ArcInterpreter.rGet = function (m) {
          output += m + "\n";
        };ArcInterpreter.cPosition = 0;while (!ended) {
          var cIns = inp.slice(ArcInterpreter.cPosition, ArcInterpreter.cPosition + 32);var result = interpret(cIns, inp);output += result ? result + "\n" : "";
        }for (var i = 0; i < inp.length; i += 32) {
          output += s(inp.slice(i, i + 32), 0, 31).match(/.{1,4}/g).join(" ") + "\n";
        }return output.trim();
      };if ((typeof window === "undefined" ? "undefined" : _typeof(window)) === "object") {
        window.ArcInterpreter = ArcInterpreter;
      }
    }).call(this, require("_process"));
  }, { "./operators": 4, _process: 2, "arc-util": 5, path: 1 }], 4: [function (require, module, exports) {
    var Operators = module.exports = { "010": "branch", 100: "sethi", "010000": "addcc", "010001": "andcc", "010010": "orcc", "010110": "orncc", "010111": "xorcc", "011000": "andncc", 100110: "srl", 111000: "jmpl", "000000": "ld", "000100": "st", "001000": "printn", "001001": "printc", "0001": "be", "0101": "bcs", "0110": "bneg", "0111": "bvs", 1000: "ba" };
  }, {}], 5: [function (require, module, exports) {
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
  }, {}] }, {}, [3]);