var mnemonics = {
    "ld": {
        type: "memory"
    }
  , "st": {
        type: "memory"
    }
  , "sethi": {
        type: "sethi"
    }
  , "branch": {
        type: "branch"
    }

  , "be": {
        type: "branch"
    }
  , "bcs": {
        type: "branch"
    }
  , "bneg": {
        type: "branch"
    }
  , "bvs": {
        type: "branch"
    }
  , "ba": {
        type: "branch"
    }
  , "ba": {
        type: "branch"
    }
  , "call": {
        type: "control"
    }

  , "addcc": {
        type: "arithmetic"
    }
  , "andcc": {
        type: "arithmetic"
    }
  , "orcc": {
        type: "arithmetic"
    }
  , "orncc": {
        type: "arithmetic"
    }
  , "srl": {
        type: "arithmetic"
    }
  , "jmpl": {
        type: "arithmetic"
    }
};

const ALL_MNEMONICS = "\\b(?:" + Object.keys(mnemonics).join("|") + ")\\b";

function parse(lines) {

    var result = {
        lines: []
      , labels: []
      , addresses: {}
      , _cAddress: 0
    };

    var lastLabel = null;
    var asEnded = false;
    var asStarted = false;

    for (var i in lines) {
        var c = lines[i];
        c = c.replace(/\!.*$/g, "");

        var op = ((c.match(/\.([a-z]+)/) || [])[1] || "").trim()
          , label = ((c.match(/^([a-z,_]+):\ /) || [])[1] || "").trim()
          , instruction = null
          , iArgs = []
          , oArgs = []
          , lValue = ""
          , cLine = {}
          ;

        label = label || lastLabel;

        if (new RegExp(ALL_MNEMONICS).test(c)) {
            var m = c.match(new RegExp("(" + ALL_MNEMONICS + ")( (.*))?")) || [];
            instruction = m[1];
            iArgs = (m[2] || "").split(/[ ,]+/).filter(function (c) { return c; });
        }


        if (op) {
            lValue = "";
            lastLabel = "";
            label = "";
            oArgs = c.replace("." + op, "").split(/[ ,]+/).filter(function (c) { return c; });
        }

        if (op || label || instruction)
            console.log("Line " + (parseInt(i) + 1) + ":");

        if (op)
            console.log("  > Pseudo ops: " + op);


        if (oArgs.length)
            console.log("  > Operator Args: " + JSON.stringify(oArgs));

        if (label) {
            lastLabel = label;
            lValue = c.replace(new RegExp("^" + label + "\:"), "").trim();
            console.log("  > Label: " + label);
            console.log("  > Content: " + lValue);
        }

        if (instruction) {
            console.log("  > Instruction: " + instruction);
            lValue = c.trim();
        }

        if (iArgs.length)
            console.log("  > Instruction Arguments: " + JSON.stringify(iArgs));

        cLine.op = op;
        cLine._c = c;
        cLine.label = label;
        cLine.instruction = instruction;
        cLine.iArgs = iArgs;
        cLine.oArgs = oArgs;
        cLine.c = lValue;

        // Pseudo operation: begin
        if (cLine.op === "begin") {
            asStarted = true;
            asEnded = false;
        }

        // Pseudo operation: end
        if (cLine.op === "end") {
            asEnded = true;
        }

        if (asStarted && !asEnded) {

            // Check instruction
            if (instruction) {
                if (!mnemonics[instruction]) {
                    throw new Error("Invalid instruction: " + instruction);
                }
                cLine.type = mnemonics[instruction].type
            }

            // Pseudo operation: org
            if (cLine.op === "org") {
                result._cAddress = parseInt(oArgs[0]);
                if (!(result._cAddress >= 0)) {
                    throw new Error(".org value should be positive integer");
                }
            }

            if (cLine.label && !result.addresses[cLine.label]) {
                result.addresses[cLine.label] = {
                    address: result._cAddress
                };
            }
            cLine.address = result._cAddress;

            if (cLine.label || cLine.instruction) {
                result._cAddress += 4;
            }

        }

        result.lines.push(cLine);
    }

    return result;
}

module.exports = parse;
