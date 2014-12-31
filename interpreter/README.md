ARC Interpreter
===============
An ARC interpreter written in Node.JS.

## Installation

```sh
$ npm install arc-int
```

## Example

```js
// Dependencies
var ArcInterpreter = require("../lib")

// Interpret
console.log(ArcInterpreter.interpret([
    1,1,0,0, 0,0,1,0, 0,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,0, 0,0,0,1, 0,0,0,0, // ld [x], %r1
    1,1,0,0, 0,1,0,0, 0,0,0,0, 0,1,0,1, 0,0,1,0, 0,0,0,0, 0,0,0,1, 0,1,0,0, // ld [y], %r2
    1,0,0,0, 0,1,1,0, 1,0,0,0, 0,0,0,0, 0,1,0,0, 0,0,0,0, 0,0,0,0, 0,0,1,0, // addcc %r1, %r2, %r3
    1,0,0,0, 0,0,0,1, 1,1,0,0, 0,0,1,1, 1,1,1,0, 0,0,0,0, 0,0,0,0, 0,1,0,0, // jmpl %r15+4, %r0
    0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,1,0, // x: 2
    0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 1,0,1,0, // y: 0xa
]));
```

## Documentation
### `interpret(inp)`
Interprets machine code.

#### Params
- **Buffer** `inp`: The input buffer (machine code).

#### Return
- **String** Verbose output.

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
