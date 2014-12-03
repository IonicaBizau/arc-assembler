var Fs = require("fs")
  , Parse = require("./parser")
  ;

const OUTPUT_FILE = "./out.arc"
    , INPUT_FILE = "./Test.asm"
    ;

var outputStream = Fs.createWriteStream(OUTPUT_FILE);

Fs.readFile(INPUT_FILE, "utf-8", function (err, lines) {
    lines = lines.split("\n");
    console.log(">> Parsing...");
    console.log("--------------------------");

    var parsed = Parse(lines);

    console.log("Compiling...");
    console.log("--------------------------");
    for (var i in parsed.lines) {
        var cLine = parsed.lines[i];
        var bdata = [];

        // Instruction: "ld"
        if (cLine.instruction === "ld") {

            // Memory instruction
            bdata.push("11");

            // ld [x], %r(1-31)
            // 11 00001 000000 00000 1 0100000010100
            // op rd    op3    rs1   i simm13
            // e.g. ld [x], %r1
            if (/^ld \[[a-z]+\]\,\ ?\%r[0-9]+$/.test(cLine.c.trim())) {

                // %r(1-31) (rd)
                bdata.push(("00000" + parseInt(cLine.c.match(/ld \[[a-z]+\]\,\ ?\%r([0-9]+)/)[1]).toString(2)).slice(-5));

                // op3 (ld)
                bdata.push("000000");

                // rs1
                bdata.push("00000");

                // i
                bdata.push("1");

                var memLoc = cLine.c.match(/\[([a-z]+)\]/)[1];
                var loc = parsed.addresses[memLoc];
                if (!loc) {
                    throw new Error("Invalid memory location: " + memLoc);
                }

                // simm13
                bdata.push(("0000000000000" + loc.address.toString(2)).slice(-13));
            }

            // ld [x], %r(1-31), %r(1-31)
            // e.g. ld [x], %r0, %r1
            else if (/^ld \[[a-z]+\]\,\ ?\%r[0-9]+,\ ?\%r[0-9]+$/.test(cLine.c.trim())) {
                // TODO
                throw new Error("Not yet implemented.");
            }

            // ld %r(1-31)\+[a-z]+, %r(1-31)
            // e.g. ld %r0+x, %r1
            else if (/^ld \%r[0-9]+\+[a-z]+\,\ ?\%r[0-9]+$/.test(cLine.c.trim())) {
                // TODO
                throw new Error("Not yet implemented.");
            }
        }

        // Instruction: "st"
        if (cLine.instruction === "st") {

            // Memory instruction
            bdata.push("11");

            // st %r(1-31) [...]
            // e.g. st %r1, [x]
            if (/^st \%r[0-9]+\,\ ?\[[a-z]+\]$/.test(cLine.c)) {

                // rd
                bdata.push(("00000" + parseInt(cLine.iArgs[0].replace("%r", "")).toString(2)).slice(-5));

                // op3 (st)
                bdata.push("000100");

                // rs1
                bdata.push("00000");

                // i
                bdata.push("1");

                var memLoc = cLine.iArgs[1].match(/\[([a-z]+)\]/)[1];
                var loc = parsed.addresses[memLoc];
                if (!loc) {
                    throw new Error("Invalid memory location: " + memLoc);
                }

                // simm13
                bdata.push(("0000000000000" + loc.address.toString(2)).slice(-13));
            }
        }

        if (cLine.instruction === "jmpl") {
            // Arithmetic instruction
            bdata.push("10");

            if (/^jmpl \%r[0-9]+\+[0-9]+\,\ ?\%r[0-9]+$/.test(cLine.c)) {
                bdata.push(("00000" + eval(cLine.iArgs[1].replace("%r", "")).toString(2)).slice(-5));
                bdata.push("111000");
                bdata.push(("00000" + parseInt(cLine.iArgs[0].replace(/\%r|\+[0-9]+/g, "")).toString(2)).slice(-5));
                bdata.push("1");
                // simm13
                bdata.push(("0000000000000" + parseInt(cLine.iArgs[0].match(/\+([0-9]+)/)).toString(2)).slice(-13));
            }
        }

        // Instruction: "ld"
        if (cLine.instruction === "addcc") {
            // Memory instruction
            bdata.push("10");

            // addcc %r1, %r2, %r3
            if (/^addcc \%r[0-9]+,\ ?\%r[0-9],\ ?\%r[0-9]+$/.test(cLine.c.trim())) {

                // %r(1-31) (rd)
                bdata.push(("00000" + parseInt(cLine.iArgs[2].replace("%r", "")).toString(2)).slice(-5));

                // op3 (addcc)
                bdata.push("010000");

                // %r(1-31) (rs1)
                bdata.push(("00000" + parseInt(cLine.iArgs[0].replace("%r", "")).toString(2)).slice(-5));

                // i
                bdata.push("0");

                // 8 empty bits
                bdata.push("00000000");

                // %r(1-31) (rs2)
                bdata.push(("00000" + parseInt(cLine.iArgs[1].replace("%r", "")).toString(2)).slice(-5));
            }

            // TODO
        }

        if (bdata.length) {
            var buff = new Buffer(bdata)
            console.log("> " + bdata.join("").match(/.{1,4}/g).join(" "));
            // write buffer in stream
            outputStream.write(buff);
        }
    }


    outputStream.end();
});
