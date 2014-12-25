var Operators = module.exports = {
    "010":      "branch"
  , "100":      "sethi"

  , "010000":   "addcc"
  , "010001":   "andcc"
  , "010010":   "orcc"
  , "010110":   "orncc"
  , "010111":   "xorcc"
  , "011000":   "andncc"
  , "100110":   "srl"
  , "111000":   "jmpl"
  , "000000":   "ld"
  , "000100":   "st"

  // Cond
  , "0001":     "be"
  , "0101":     "bcs"
  , "0110":     "bneg"
  , "0111":     "bvs"
  , "1000":     "ba"
};
