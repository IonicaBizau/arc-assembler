$(document).ready(function () {
    function compileAndUpdateMCode(showErr) {
        try {
            var result = ArcAssembler.compile(editor.getValue());
        } catch (e) {
            if (!showErr) { return; }
            $(".error.modal").modal("show").find(".content > .err").text(e.message);
            return;
        }

        var output = "";
        result.raw.forEach(function (c) {
            output += c.code.match(/.{1,4}/g).join(" ") + " << Line " + c.line + "\n";
        });
        $("pre.machine-code").html(output);
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
});
