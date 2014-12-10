var Util = module.exports = {};
Util.pad = function (input, l, c) {
    c = c || "0";
    l = l || 32;
    var pad = Array.apply(null, Array(l)).map(function () { return c; }).join("");
    return (pad + input).slice(-l);
};

Util.isRegister = function (inp) {
    return /^\%r[0-9]+$/.test(inp);
};

Util.isLocAdd = function (inp) {
    return /^\[[a-z]+\]$/.test(inp);
};

Util.addBin = function () {
    var r = 0;
    for (var i = 0; i < arguments.length; ++i) {
        r += parseInt(arguments[i], 2)
    }
    return r.toString(2);
};

Util.comp = function (input) {
    return input.replace(/1/g, "a").replace(/0/g, "1").replace(/a/g, "0");
};

Util.uncomp = function (input) {
    if (input[0] === "1") {
        return -Util.uncomp(Util.comp(input));
    }
    return parseInt(input, 2);
};

Util.bin = function (input, l) {
    if (input >= 0) {
        return Util.pad(input.toString(2), l);
    }
    return Util.comp(Util.bin(Math.abs(input), l));
};
