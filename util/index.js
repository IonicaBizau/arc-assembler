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
