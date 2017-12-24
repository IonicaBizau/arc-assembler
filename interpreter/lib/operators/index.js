"use strict";

var Operators = module.exports = {
  // SETHI/BRANCH
  "010": "branch",
  "100": "sethi"

  // Arithmetic
  , "010000": "addcc",
  "010001": "andcc",
  "010010": "orcc",
  "010110": "orncc",
  "010111": "xorcc",
  "011000": "andncc",
  "100110": "srl",
  "111000": "jmpl"

  // Memory
  , "000000": "ld",
  "000100": "st",
  "001000": "printn",
  "001001": "printc"

  // Cond
  , "0001": "be",
  "0101": "bcs",
  "0110": "bneg",
  "0111": "bvs",
  "1000": "ba"
};