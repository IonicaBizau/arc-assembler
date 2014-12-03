var Util = module.exports = {};
Util.pad = function (input, l, c) {
    c = c || "0";
    l = l || 32;
    var pad = Array.apply(null, Array(l)).map(function () { return c; }).join("");
    return (pad + input).slice(-l);
};
