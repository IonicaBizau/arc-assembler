var Util = require("../../../util");

function handleNumber(r, length) {
    var value = ""
    // hex
    if (/^\-?0x|H$/.test(r)) {
        value = Util.pad(parseInt(r.replace("-", ""), 16).toString(2), length);
        if (r[0] === "-") {
            value = Util.comp(value);
        }
        return value;
    }

    // Int
    if (/[0-9]+/.test(r)) {
        value = Util.pad(Math.abs(r).toString(2), length);
        if (r[0] === "-") {
            value = Util.comp(value);
        }
        return value;
    }

    throw new Error("Invalid number " + r);
}

function compile(line, parsed) {

    function bR(r, length) {
        length = length || 5;

        // %r0+x
        if (/^\%r[0-9]\+[a-z]+$/.test(r)) {
            return Util.pad(Util.addBin(
                bR(r.replace(/\+[a-z]+$/g, "")), bR("[" + r.match(/\+([a-z]+)/)[0] + "]")
            ), length);
        }

        // %r0
        if (Util.isRegister(r)) {
            return Util.pad(parseInt(r.match(/\%r([0-9]+)/)[1]).toString(2), length);
        }

        // [x]
        if (Util.isLocAdd(r)) {
            var add = r.match(/^\[([a-z]+)\]$/)[1]
              , loc = parsed.addresses[add]
              ;

            if (!loc) {
                throw new Error("Invalid memory location: " + add);
            }
            return Util.pad(loc.address.toString(2), length);
        }

        return handleNumber(r);
    }

    function getRd(line, raw) {
        if (raw === true) {
            return line.iArgs.slice(-1)[0];
        }
        return bR(getRd(line, true));
    }

    function getRs1(line, raw) {
        if (raw === true) {
            return line.iArgs[0];
        }
        var r = getRs1(line, true);
        if (!/^\%r[0-9]+$/.test(r)) {
            return "00000";
        }
        return bR(r);
    }

    function getRs2(line, raw) {
        if (raw === true) {
            return line.iArgs[1];
        }
        var r = getRs2(line, true);
        if (!/^\%r[0-9]+$/.test(r)) {
            return "00000";
        }
        return bR(r);
    }

    var instruction = "";

    if (line.instruction) {
        switch (line.type) {
            case "memory":
                instruction += "11";
                break;
            case "arithmetic":
                instruction += "10";
                break;
            case "sethi":
                instruction += "00";
                break;
            case "branch":
                instruction += "00";
                break;
            case "control":
                instruction += "01";
                break;
        }


        switch (line.instruction) {

            // Memory
            case "ld":
                if (line.iArgs.length >= 2) {
                    var rd = getRd(line);
                    var rs1 = getRs1(line);
                    var rs2 = getRs2(line);

                    // rd
                    instruction += rd;

                    // op
                    instruction += "000000";

                    // rs1
                    instruction += rs1;


                    if (!Util.isLocAdd(getRs1(line, true))) {
                        // i
                        instruction += "0";
                        instruction += "00000000";
                        instruction += rs2;
                    } else {
                        instruction += "1";
                        instruction += bR(getRs1(line, true), 13);
                    }
                } else {
                    throw new Error("Invalid syntax: " + line.c);
                }
                break;
            case "st":
                if (line.iArgs.length >= 2) {

                    var rd = getRd(line);
                    var rs1 = getRs1(line);
                    var rs2 = getRs2(line);

                    if (Util.isLocAdd(getRd(line, true))) {
                        rd = getRs1(line);
                        rs1 = Util.pad("", 5);
                    }

                    // rd
                    instruction += rd;

                    // op
                    instruction += ("000100");

                    // rs1
                    instruction += rs1;

                    if (!Util.isLocAdd(getRd(line, true))) {
                        // i
                        instruction += "0";
                        instruction += "00000000";
                        instruction += rs2;
                    } else {
                        instruction += "1";
                        instruction += bR(getRd(line, true), 13);
                    }
                } else {
                    throw new Error("Invalid syntax: " + line.c);
                }
                break;

            // Arithmetic
            case "jmpl":
                if (/^jmpl \%r[0-9]+\+[0-9]+\,\ ?\%r[0-9]+$/.test(line.c)) {
                    instruction += (("00000" + eval(line.iArgs[1].replace("%r", "")).toString(2)).slice(-5));
                    instruction += ("111000");
                    instruction += (("00000" + parseInt(line.iArgs[0].replace(/\%r|\+[0-9]+/g, "")).toString(2)).slice(-5));
                    instruction += ("1");
                    // simm13
                    instruction += (("0000000000000" + parseInt(line.iArgs[0].match(/\+([0-9]+)/)).toString(2)).slice(-13));
                }
                break;

            case "addcc":
                if (line.iArgs.length === 3) {

                    var rd = getRd(line);
                    // if (Util.isLocAdd(getRd(line, true))) {
                    //     rd = Util.pad("", 5);
                    // }

                    var rs1 = getRs1(line);
                    var rs2 = getRs2(line);

                    // rd
                    instruction += rd;

                    // op
                    instruction += ("010000");

                    // rs1
                    instruction += rs1;

                    if (!Util.isLocAdd(getRd(line, true))) {
                        // i
                        instruction += "0";
                        instruction += "00000000";
                        instruction += rs2;
                    } else {
                        instruction += "1";
                        instruction += bR(getRd(line, true), 13);
                    }
                } else {
                    throw new Error("Invalid syntax: addcc requires 3 arguments");
                }
                break;
            // Control
            case "call":
                if (line.iArgs.length > 1) { throw new Error("Too many argumnets for call instruction."); }
                instruction += Util.pad(parsed.addresses[line.iArgs[0]].address.toString(2), 30);
                break;
        }
    }

    if (line.label && !line.instruction) {
        instruction = handleNumber(line.c, 32);
    }

    return instruction;
}

module.exports = compile;