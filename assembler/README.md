ARC Assembler
=============
An ARC assembler written in Node.JS.

## Installation

```sh
$ npm install -g arc-asm
```

## Example

```js
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
```

## Documentation
### `parse(lines)`
Parses provided lines of assembly code.

#### Params
- **Array** `lines`: The input lines.

#### Return
- **Object** An object containing:
 - `lines` (Array): Parsed lines.
 - `addresses` (Object): Parsed labels containing the addresses.
 - `_cAddress` (Number): The current address.
 - `verbose` (String): The verbose parsing output.

### `compileLine(line, parsed)`
Compiles a line.

#### Params
- **Object** `line`: The current line.
- **Object** `parsed`: The object containing the parsed lines.

#### Return
- **String** The machine code generated for the current line.

### `compile(lines)`
Compiles the parsed assembly code.

#### Params
- **String|Array** `lines`: The input lines.

#### Return
- **Object** An object containing:
 - `raw` (Array): An array containing raw output.
 - `mCode` (Array): Generated machine code.

## How to contribute
1. File an issue in the repository, using the bug tracker, describing the
   contribution you'd like to make. This will help us to get you started on the
   right foot.
2. Fork the project in your account and create a new branch:
   `your-great-feature`.
3. Commit your changes in that branch.
4. Open a pull request, and reference the initial issue in the pull request
   message.

## License
See the [LICENSE](./LICENSE) file.
