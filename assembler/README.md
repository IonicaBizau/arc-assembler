# `$ arc-asm` [![Support this project][donate-now]][paypal-donations]

An ARC assembler written in Node.JS.

## Installation

You can install the package globally and use it as command line tool:

```sh
$ npm i -g arc-asm
```

Then, run `arc-asm --help` and see what the CLI tool can do.

## Example

Here is an example how to use this package as library. To install it locally, as library, you can do that using `npm`:

```sh
$ npm i arc-asm
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

[license]: http://ionicabizau.github.io/kindly-license/?author=Ionic%C4%83%20Biz%C4%83u%20%3Cbizauionica@gmail.com%3E&year=2014

[website]: http://ionicabizau.net
[paypal-donations]: https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=RVXDDLKKLQRJW
[donate-now]: http://i.imgur.com/6cMbHOC.png

[contributing]: /CONTRIBUTING.md
[docs]: /DOCUMENTATION.md