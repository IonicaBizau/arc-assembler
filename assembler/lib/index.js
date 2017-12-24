"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

// Dependencies
var Parse = require("./parser"),
    Compile = require("./compiler"),
    Util = require("arc-util");

// Constructor
var ArcAssembler = module.exports = {};

/**
 * parse
 * Parses provided lines of assembly code.
 *
 * @name parse
 * @function
 * @param {Array} lines The input lines.
 * @return {Object} An object containing:
 *
 *  - `lines` (Array): Parsed lines.
 *  - `addresses` (Object): Parsed labels containing the addresses.
 *  - `_cAddress` (Number): The current address.
 *  - `verbose` (String): The verbose parsing output.
 *
 */
ArcAssembler.parse = Parse;

/**
 * compileLine
 * Compiles a line.
 *
 * @name compileLine
 * @function
 * @param {Object} line The current line.
 * @param {Object} parsed The object containing the parsed lines.
 * @return {String} The machine code generated for the current line.
 */
ArcAssembler.compileLine = Compile;

/**
 * compile
 * Compiles the parsed assembly code.
 *
 * @name compile
 * @function
 * @param {String|Array} lines The input lines.
 * @return {Object} An object containing:
 *
 *  - `raw` (Array): An array containing raw output.
 *  - `mCode` (Array): Generated machine code.
 */
ArcAssembler.compile = function (lines) {
    var result = {
        raw: [],
        mCode: []
    };
    if (!Array.isArray(lines)) {
        lines = lines.toString();
    }
    if (typeof lines === "string") {
        lines = lines.split("\n");
    }
    var parsed = Parse(lines);
    var size = Math.max.apply(null, parsed.lines.map(function (c) {
        return c.address || -1;
    }));
    result.mCode = [];
    for (var i = 0; i < size * 8; ++i) {
        result.mCode.push(0);
    }

    function setBits(sAddress, bits) {
        if (typeof bits === "string") {
            bits = bits.split("").map(function (c) {
                return parseInt(c);
            });
        }

        for (var i = 0; i < bits.length; ++i) {
            result.mCode[sAddress * 8 + i] = bits[i];
        }
    }

    parsed.lines.forEach(function (c, i) {
        if (!c.c) {
            return;
        }
        var ins = ArcAssembler.compileLine(c, parsed);
        if (!ins.length) {
            return;
        }
        result.raw.push({
            code: ins,
            line: i + 1
        });
        setBits(c.address, ins);
    });
    return result;
};

// Browser support
if ((typeof window === "undefined" ? "undefined" : _typeof(window)) === "object") {
    window.ArcAssembler = ArcAssembler;
}