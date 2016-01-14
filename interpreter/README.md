# `$ arc-int` [![PayPal](https://img.shields.io/badge/%24-paypal-f39c12.svg)][paypal-donations] [![Version](https://img.shields.io/npm/v/arc-int.svg)](https://www.npmjs.com/package/arc-int) [![Downloads](https://img.shields.io/npm/dt/arc-int.svg)](https://www.npmjs.com/package/arc-int) [![Get help on Codementor](https://cdn.codementor.io/badges/get_help_github.svg)](https://www.codementor.io/johnnyb?utm_source=github&utm_medium=button&utm_term=johnnyb&utm_campaign=github)

> An ARC interpreter written in Node.JS.

## Installation

You can install the package globally and use it as command line tool:

```sh
$ npm i -g arc-int
```

Then, run `arc-int --help` and see what the CLI tool can do.

## Example

Here is an example how to use this package as library. To install it locally, as library, you can do that using `npm`:

```sh
$ npm i --save arc-int
```

```js
// Dependencies
var ArcInterpreter = require("arc-int")

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