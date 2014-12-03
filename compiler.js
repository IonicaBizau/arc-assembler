function compile(line, parsed) {
    var instruction = "";

    switch (line.instruction) {
        // Memory
        case "ld":
            break;
        case "st":
            break;
        // Arithmetic
        case "addcc":
            break;
    }

    // Instruction: "ld"
    if (line.instruction === "ld") {

        // Memory instruction
        instruction += ("11");

        // ld [x], %r(1-31)
        // 11 00001 000000 00000 1 0100000010100
        // op rd    op3    rs1   i simm13
        // e.g. ld [x], %r1
        if (/^ld \[[a-z]+\]\,\ ?\%r[0-9]+$/.test(line.c.trim())) {

            // %r(1-31) (rd)
            instruction += (("00000" + parseInt(line.c.match(/ld \[[a-z]+\]\,\ ?\%r([0-9]+)/)[1]).toString(2)).slice(-5));

            // op3 (ld)
            instruction += ("000000");

            // rs1
            instruction += ("00000");

            // i
            instruction += ("1");

            var memLoc = line.c.match(/\[([a-z]+)\]/)[1];
            var loc = parsed.addresses[memLoc];
            if (!loc) {
                throw new Error("Invalid memory location: " + memLoc);
            }

            // simm13
            instruction += (("0000000000000" + loc.address.toString(2)).slice(-13));
        }

        // ld [x], %r(1-31), %r(1-31)
        // e.g. ld [x], %r0, %r1
        else if (/^ld \[[a-z]+\]\,\ ?\%r[0-9]+,\ ?\%r[0-9]+$/.test(line.c.trim())) {
            // TODO
            throw new Error("Not yet implemented.");
        }

        // ld %r(1-31)\+[a-z]+, %r(1-31)
        // e.g. ld %r0+x, %r1
        else if (/^ld \%r[0-9]+\+[a-z]+\,\ ?\%r[0-9]+$/.test(line.c.trim())) {
            // TODO
            throw new Error("Not yet implemented.");
        }
    }

    // Instruction: "st"
    if (line.instruction === "st") {

        // Memory instruction
        instruction += ("11");

        // st %r(1-31) [...]
        // e.g. st %r1, [x]
        if (/^st \%r[0-9]+\,\ ?\[[a-z]+\]$/.test(line.c)) {

            // rd
            instruction += (("00000" + parseInt(line.iArgs[0].replace("%r", "")).toString(2)).slice(-5));

            // op3 (st)
            instruction += ("000100");

            // rs1
            instruction += ("00000");

            // i
            instruction += ("1");

            var memLoc = line.iArgs[1].match(/\[([a-z]+)\]/)[1];
            var loc = parsed.addresses[memLoc];
            if (!loc) {
                throw new Error("Invalid memory location: " + memLoc);
            }

            // simm13
            instruction += (("0000000000000" + loc.address.toString(2)).slice(-13));
        }
    }

    if (line.instruction === "jmpl") {
        // Arithmetic instruction
        instruction += ("10");

        if (/^jmpl \%r[0-9]+\+[0-9]+\,\ ?\%r[0-9]+$/.test(line.c)) {
            instruction += (("00000" + eval(line.iArgs[1].replace("%r", "")).toString(2)).slice(-5));
            instruction += ("111000");
            instruction += (("00000" + parseInt(line.iArgs[0].replace(/\%r|\+[0-9]+/g, "")).toString(2)).slice(-5));
            instruction += ("1");
            // simm13
            instruction += (("0000000000000" + parseInt(line.iArgs[0].match(/\+([0-9]+)/)).toString(2)).slice(-13));
        }
    }

    // Instruction: "ld"
    if (line.instruction === "addcc") {
        // Memory instruction
        instruction += ("10");

        // addcc %r1, %r2, %r3
        if (/^addcc \%r[0-9]+,\ ?\%r[0-9],\ ?\%r[0-9]+$/.test(line.c.trim())) {

            // %r(1-31) (rd)
            instruction += (("00000" + parseInt(line.iArgs[2].replace("%r", "")).toString(2)).slice(-5));

            // op3 (addcc)
            instruction += ("010000");

            // %r(1-31) (rs1)
            instruction += (("00000" + parseInt(line.iArgs[0].replace("%r", "")).toString(2)).slice(-5));

            // i
            instruction += ("0");

            // 8 empty bits
            instruction += ("00000000");

            // %r(1-31) (rs2)
            instruction += (("00000" + parseInt(line.iArgs[1].replace("%r", "")).toString(2)).slice(-5));
        }

        // TODO
    }

    return instruction;
}

module.exports = compile;
