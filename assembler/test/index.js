// Dependencies
var ArcAssembler = require("../lib");

// Compile input
var result = ArcAssembler.compile(
           "! Sum of two numbers"
  + "\n" + "! This is a comment"
  + "\n" + "     .begin"
  + "\n" + "     .org 2048"
  + "\n" + "     ld [x], %r1"
  + "\n" + "     ld [y], %r2"
  + "\n" + "     addcc %r1, %r2, %r3"
  + "\n" + "     jmpl %r15+4, %r0"
  + "\n" + "x:   2"
  + "\n" + "y:   0xa"
);

// Show some output
result.raw.forEach(function (c) {
    console.log(c.code.match(/.{1,4}/g).join(" ") + " << Line " + c.line);
});
