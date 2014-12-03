var mnemonics = {
    "ld": {
        opcode: ""
    }
  , "st": {
        opcode: ""
    }
  , "sethi": {
        opcode: ""
    }
  , "and": {
        opcode: "000001"
    }
  , "andcc": {
        opcode: "010001"
    }
  , "orcc": {
        opcode: "010010"
    }
  , "orncc": {
        opcode: "010110"
    }
  , "srl": {
        opcode: "100110"
    }
  , "addcc": {
        opcode: "010000"
    }
  , "call": {
        opcode: ""
    }
  , "jmpl": {
        opcode: "111000"
    }
  , "be": {
        opcode: "0001"
    }
  , "bneg": {
        opcode: "0110"
    }
  , "bcs": {
        opcode: "0101"
    }
  , "bvs": {
        opcode: "0111"
    }
  , "ba": {
        opcode: "1000"
    }

  , "halt": {
        opcode: ""
    }
};

const ALL_MNEMONICS = Object.keys(mnemonics).join("|") + " ";

function parse(lines) {
    var result = {
        lines: []
      , labels: []
      , addresses: {}
      , _sAddress: 0
      , _cAddress: -1
    };

    var lastLabel = null;
    for (var i in lines) {
        var c = lines[i];
        c = c.replace(/\!.*$/g, "");

        var op = ((c.match(/\.([a-z]+)/) || [])[1] || "").trim()
          , label = ((c.match(/^([a-z]+):\ /) || [])[1] || "").trim()
          , instruction = null
          , iArgs = []
          , oArgs = []
          , lValue = ""
          , cLine = {}
          ;

        label = label || lastLabel;

        if (new RegExp(ALL_MNEMONICS).test(c)) {
            var m = c.match(new RegExp("(" + ALL_MNEMONICS + ") (.*)")) || [];
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

        if (instruction)
            console.log("  > Instruction: " + instruction);

        if (iArgs.length)
            console.log("  > Instruction Arguments: " + JSON.stringify(iArgs));

        cLine.op = op;
        cLine._c = c;
        cLine.label = label;
        cLine.instruction = instruction;
        cLine.iArgs = iArgs;
        cLine.oArgs = oArgs;
        cLine.c = lValue;

        if (result._cAddress === -1 && cLine.label === "main") {
            result._cAddress = result._sAddress;
        }

        if (cLine.op === "org") {
            result._sAddress = parseInt(oArgs[0]);
            if (!(result._sAddress >= 0)) {
                throw new Error(".org value should be positive integer");
            }
        }

        if (cLine.label) {
            result.addresses[cLine.label] = {
                value: cLine.content
              , address: result._cAddress
            };
        }

        if (c.trim() && result._cAddress !== -1) {
            result._cAddress += 4;
        }

        result.lines.push(cLine);
    }
    return result;
}

module.exports = parse;
