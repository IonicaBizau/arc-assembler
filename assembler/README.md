# `$ arc-asm` [![PayPal](https://img.shields.io/badge/%24-paypal-f39c12.svg)][paypal-donations] [![Version](https://img.shields.io/npm/v/arc-asm.svg)](https://www.npmjs.com/package/arc-asm) [![Downloads](https://img.shields.io/npm/dt/arc-asm.svg)](https://www.npmjs.com/package/arc-asm) [![Get help on Codementor](https://cdn.codementor.io/badges/get_help_github.svg)](https://www.codementor.io/johnnyb?utm_source=github&utm_medium=button&utm_term=johnnyb&utm_campaign=github)

> An ARC assembler written in Node.JS.

## Installation

You can install the package globally and use it as command line tool:

```sh
$ npm i -g arc-asm
```

Then, run `arc-asm --help` and see what the CLI tool can do.

```sh
$ arc-asm --help
Usage: arc-asm [options]

Options:
  -s, --source <path>  Sets the source file path.   
  -o, --output <path>  Sets the output file path.   
  -h, --help           Displays this help.          
  -v, --version        Displays version information.

Examples:
  arc-asm -s my-input.asm # This will generate a.out
  arc-asm -s my-input.asm -o program # This will generate the `program` file.

Documentation can be found at https://github.com/IonicaBizau/arc-assembler
```

## Example

Here is an example how to use this package as library. To install it locally, as library, you can do that using `npm`:

```sh
$ npm i --save arc-asm
```

```js
// Dependencies
var ArcAssembler = require("arc-asm");

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

For full API reference, see the [DOCUMENTATION.md][docs] file.

## How to contribute
Have an idea? Found a bug? See [how to contribute][contributing].

## Where is this library used?
If you are using this library in one of your projects, add it in this list. :sparkles:

## License

[KINDLY][license] © [Ionică Bizău][website]

[paypal-donations]: https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=RVXDDLKKLQRJW
[donate-now]: http://i.imgur.com/6cMbHOC.png

[license]: http://showalicense.com/?fullname=Ionic%C4%83%20Biz%C4%83u%20%3Cbizauionica%40gmail.com%3E%20(http%3A%2F%2Fionicabizau.net)&year=2014#license-kindly
[website]: http://ionicabizau.net
[contributing]: /CONTRIBUTING.md
[docs]: /DOCUMENTATION.md