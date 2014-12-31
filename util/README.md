Utility Package for ARC Assembler & Interpreter
===============================================

The utility package for [ARC Assembler & Interpreter](https://github.com/IonicaBizau/arc-assembler).

# Documentation

## `pad(input, l, c)`
Padds the input.

### Params
- **String** `input`: The value that should be padded.
- **Number** `l`: The pad length (default: `32`).
- **String** `c`: Pad content (default: `"c"`).

### Return
- **String** The padded input.

## `isRegister(inp)`
Checks if the input is a register.

### Params
- **String** `inp`: The input value.

### Return
- **Boolean** A boolean value representing whether the input is a register or not.

## `isLocAdd(inp)`
Checks if the input is a location address.

### Params
- **String** `inp`: The input value.

### Return
- **Boolean** A boolean value representing whether the input is a location address or not.

## `addBin()`
Sums the numbers provided in parameters.

### Return
- **String** The binary sum of provided arguments.

## `comp(input)`
Runs the complementary task.

### Params
- **String** `input`: The input value.

### Return
- **String** The result value.

## `uncomp(input)`
Computes the decimal value of the input value in two's complement input.

### Params
- **String** `input`: The input value.

### Return
- **Number** The decimal value of the two's complement input.

## `bin(input, l)`
Converts a decimal value to binary.

### Params
- **String** `input`: The input value.
- **Number** `l`: The number of bits.

### Return
- **String** The input value in binary.

## `isNumber(c)`
Checks if the input is a number or not.

### Params
- **String** `c`: The input value.

### Return
- **Boolean** A boolean value representing whether the input is a valid number or not.

