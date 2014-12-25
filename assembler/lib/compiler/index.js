var Util = require("../../../util");

function handleNumber(r, length) {
    var value = ""
    // hex
    if (/^\-?0x|H$/.test(r)) {
        value = parseInt(r.replace("-", ""), 16);
        if (r[0] === "-") {
            value = -value;
        }
        return Util.bin(value, length);
    }

    // Int
    if (/[0-9]+/.test(r)) {
        value = parseInt(r);
        return Util.bin(value, length);
    }

    return Util.bin(0, length);
}

function compile(line, parsed) {

    function bR(r, length) {
        length = length || 5;

        // %r0+x
        if (/^\%r[0-9]+\+[a-z]+$/.test(r)) {
            return Util.pad(Util.addBin(
                bR(r.replace(/\+[a-z]+$/g, "")), bR("[" + r.match(/\+([a-z]+)/)[0] + "]")
            ), length);
        }

        // %r0+4
        if (/^\%r[0-9]+\+[0-9]+$/.test(r)) {
            return bR(r.replace(/\+[0-9]+$/g, ""), length);
            //return Util.pad(
            //    Util.addBin(bR(r.replace(/\+[0-9]+$/g, "")), bR(r.match(/\+([0-9]+)/)[0])
            //), length);
        }

        // %r0
        if (Util.isRegister(r)) {
            return Util.pad(parseInt(r.match(/\%r([0-9]+)/)[1]).toString(2), length);
        }

        // [x]
        if (Util.isLocAdd(r)) {
            var add = r.match(/^\[([a-z,_]+)\]$/)[1]
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
        return bR(r);
    }

    function getRs2(line, raw) {
        if (raw === true) {
            return line.iArgs[1];
        }
        if (line.iArgs.length <= 2) {
            return "00000";
        }
        var r = getRs2(line, true);
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

                    // Add two registers
                    if (Util.isRegister(getRs2(line, true))) {
                        instruction += "0";
                        instruction += "00000000";
                        instruction += rs2;
                    } else {
                        // Add a register and a constant
                        instruction += "1";
                        instruction += handleNumber(getRs2(line, true), 13);
                    }
                } else {
                    throw new Error("Invalid syntax: addcc requires 3 arguments");
                }
                break;
            case "andcc":
                if (line.iArgs.length === 3) {

                    var rd = getRd(line);
                    var rs1 = getRs1(line);
                    var rs2 = getRs2(line);

                    // rd
                    instruction += rd;

                    // op
                    instruction += "010001";

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
                    throw new Error("Invalid syntax: andcc requires 3 arguments");
                }
                break;
            case "andncc":
                if (line.iArgs.length === 3) {

                    var rd = getRd(line);
                    var rs1 = getRs1(line);
                    var rs2 = getRs2(line);

                    // rd
                    instruction += rd;

                    // op
                    instruction += "011000";

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
                    throw new Error("Invalid syntax: andncc requires 3 arguments");
                }
                break;
            case "orcc":
                if (line.iArgs.length === 3) {

                    var rd = getRd(line);
                    var rs1 = getRs1(line);
                    var rs2 = getRs2(line);

                    // rd
                    instruction += rd;

                    // op
                    instruction += "010010";

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
                    throw new Error("Invalid syntax: orcc requires 3 arguments");
                }
                break;
            case "orncc":
                if (line.iArgs.length === 3) {

                    var rd = getRd(line);
                    var rs1 = getRs1(line);
                    var rs2 = getRs2(line);

                    // rd
                    instruction += rd;

                    // op
                    instruction += "010110";

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
                    throw new Error("Invalid syntax: orncc requires 3 arguments");
                }
                break;
            case "xorcc":
                if (line.iArgs.length === 3) {

                    var rd = getRd(line);
                    var rs1 = getRs1(line);
                    var rs2 = getRs2(line);

                    // rd
                    instruction += rd;

                    // op
                    instruction += "010111";

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
                    throw new Error("Invalid syntax: xorcc requires 3 arguments");
                }
            // Control
            case "call":
                if (line.iArgs.length > 1) { throw new Error("Too many argumnets for call instruction."); }
                if (!parsed.addresses[line.iArgs[0]]) {
                    throw new Error("Subrutine " +line.iArgs[0] + " doesn't exist");
                }
                instruction += Util.pad(parsed.addresses[line.iArgs[0]].address.toString(2), 30);
                break;
            case "jmpl":
                if (line.iArgs.length === 2) {
                    var rd = getRd(line);
                    var rs1 = getRs1(line);
                    instruction += rd;
                    instruction += "111000";
                    instruction += rs1;
                    instruction += "1";
                    // simm13
                    instruction += Util.bin(handleNumber(line.iArgs[0].match(/\+([0-9]+)/)), 13);
                } else {
                    throw new Error("jmpl requires two arguments");
                }
                break;
            case "be":
                if (line.iArgs.length > 1) { throw new Error("Too many argumnets for be instruction."); }
                instruction += "0";
                instruction += "0001";
                instruction += "010";
                instruction += Util.pad(parsed.addresses[line.iArgs[0]].address.toString(2), 22);
                break;
            case "bcs":
                if (line.iArgs.length > 1) { throw new Error("Too many argumnets for bcs instruction."); }
                instruction += "0";
                instruction += "0101";
                instruction += "010";
                instruction += Util.pad(parsed.addresses[line.iArgs[0]].address.toString(2), 22);
            case "bneg":
                if (line.iArgs.length > 1) { throw new Error("Too many argumnets for bneg instruction."); }
                instruction += "0";
                instruction += "0110";
                instruction += "010";
                instruction += Util.pad(parsed.addresses[line.iArgs[0]].address.toString(2), 22);
                break;
            case "bvs":
                if (line.iArgs.length > 1) { throw new Error("Too many argumnets for bvs instruction."); }
                instruction += "0";
                instruction += "0111";
                instruction += "010";
                instruction += Util.pad(parsed.addresses[line.iArgs[0]].address.toString(2), 22);
                break;
            case "ba":
                if (line.iArgs.length > 1) { throw new Error("Too many argumnets for ba instruction."); }
                instruction += "0";
                instruction += "1000";
                instruction += "010";
                instruction += Util.pad(parsed.addresses[line.iArgs[0]].address.toString(2), 22);
                break;
        }
    }

    if (Util.isNumber(line.c)) {
        instruction = handleNumber(line.c, 32);
    }

    return instruction;
}

module.exports = compile;
