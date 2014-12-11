$(document).ready(function () {
    function compileAndUpdateMCode(showErr) {
        $("pre.machine-code,pre.result,pre.registers").empty();
        try {
            var result = ArcAssembler.compile(editor.getValue());
        } catch (e) {
            $("pre.machine-code").html(e.message);
            if (!showErr) { return; }
            $(".error.modal").modal("show").find(".content > .err").text(e.message);
            return;
        }

        var output = "";
        result.raw.forEach(function (c) {
            output += c.code.match(/.{1,4}/g).join(" ") + " << Line " + c.line + "\n";
        });

        $("pre.machine-code").html(output);
        try {
            var iResult = ArcInterpreter.interpret(result.mCode)
            $("pre.result").html(iResult);
            var reg = {};
            Object.keys(ArcInterpreter.r).forEach(function (c, i) {
                reg[ArcInterpreter.registerMap[c]] = ArcInterpreter.r[c];
            });
            $("pre.registers").html(JSON.stringify(reg));
        } catch (e) {
            $("pre.result").html(e.message);
        }
    }

    var editor = ace.edit("editor");
    editor.setTheme("ace/theme/dawn");
    editor.getSession().setMode("ace/mode/assembly_x86");
    editor.on("change", function () {
        compileAndUpdateMCode(false);
    });

    $(document).on("keydown", function (e) {
        if (e.which === 13 && e.ctrlKey) {
            compileAndUpdateMCode(true);
        }
    });

    $(".ui.button.compile").on("click", function () {
        compileAndUpdateMCode(true);
    });

    compileAndUpdateMCode();
});
