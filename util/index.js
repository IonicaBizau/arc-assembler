// Constructor
var Util = module.exports = {};

/**
 * pad
 * Padds the input.
 *
 * @name pad
 * @function
 * @param {String} input The value that should be padded.
 * @param {Number} l The pad length (default: `32`).
 * @param {String} c Pad content (default: `"c"`).
 * @return {String} The padded input.
 */
Util.pad = function (input, l, c) {
    c = c || "0";
    l = l || 32;
    var pad = Array.apply(null, Array(l)).map(function () { return c; }).join("");
    return (pad + input).slice(-l);
};

/**
 * isRegister
 * Checks if the input is a register.
 *
 * @name isRegister
 * @function
 * @param {String} inp The input value.
 * @return {Boolean} A boolean value representing whether the input is a register or not.
 */
Util.isRegister = function (inp) {
    return /^\%r[0-9]+$/.test(inp);
};

/**
 * isLocAdd
 * Checks if the input is a location address.
 *
 * @name isLocAdd
 * @function
 * @param {String} inp The input value.
 * @return {Boolean} A boolean value representing whether the input is a location address or not.
 */
Util.isLocAdd = function (inp) {
    return /^\[[a-z,_]+\]$/.test(inp);
};

/**
 * addBin
 * Sums the numbers provided in parameters.
 *
 * @name addBin
 * @function
 * @return {String} The binary sum of provided arguments.
 */
Util.addBin = function () {
    var r = 0;
    for (var i = 0; i < arguments.length; ++i) {
        r += Util.uncomp(arguments[i]);
    }
    return Util.comp(r);
};

/**
 * comp
 * Runs the complementary task.
 *
 * @name comp
 * @function
 * @param {String} input The input value.
 * @return {String} The result value.
 */
Util.comp = function (input) {
    return input.replace(/1/g, "a").replace(/0/g, "1").replace(/a/g, "0");
};

/**
 * uncomp
 * Computes the decimal value of the input value in two's complement input.
 *
 * @name uncomp
 * @function
 * @param {String} input The input value.
 * @return {Number} The decimal value of the two's complement input.
 */
Util.uncomp = function (input) {
    if (input[0] === "1") {
        return -Util.uncomp(Util.comp(input)) - 1;
    }
    return parseInt(input, 2);
};

/**
 * bin
 * Converts a decimal value to binary.
 *
 * @name bin
 * @function
 * @param {String} input The input value.
 * @param {Number} l The number of bits.
 * @return {String} The input value in binary.
 */
Util.bin = function (input, l) {
    if (input >= 0) {
        return Util.pad(input.toString(2), l);
    }
    return Util.comp(Util.bin(Math.abs(input + 1), l));
};

/**
 * isNumber
 * Checks if the input is a number or not.
 *
 * @name isNumber
 * @function
 * @param {String} c The input value.
 * @return {Boolean} A boolean value representing whether the input is a valid number or not.
 */
Util.isNumber = function (c) {
    return /(^\-?[0-9]+$)|(^\-?0x)|H$/.test(c);
}
