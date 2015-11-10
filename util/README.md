# arc-util [![Support this project][donate-now]][paypal-donations]

Utility package for ARC assembler and interpreter.

## Installation

```sh
$ npm i arc-util
```

## Documentation

### `pad(input, l, c)`
Padds the input.

#### Params
- **String** `input`: The value that should be padded.
- **Number** `l`: The pad length (default: `32`).
- **String** `c`: Pad content (default: `"c"`).

#### Return
- **String** The padded input.

### `isRegister(inp)`
Checks if the input is a register.

#### Params
- **String** `inp`: The input value.

#### Return
- **Boolean** A boolean value representing whether the input is a register or not.

### `isLocAdd(inp)`
Checks if the input is a location address.

#### Params
- **String** `inp`: The input value.

#### Return
- **Boolean** A boolean value representing whether the input is a location address or not.

### `addBin()`
Sums the numbers provided in parameters.

#### Return
- **String** The binary sum of provided arguments.

### `comp(input)`
Runs the complementary task.

#### Params
- **String** `input`: The input value.

#### Return
- **String** The result value.

### `uncomp(input)`
Computes the decimal value of the input value in two's complement input.

#### Params
- **String** `input`: The input value.

#### Return
- **Number** The decimal value of the two's complement input.

### `bin(input, l)`
Converts a decimal value to binary.

#### Params
- **String** `input`: The input value.
- **Number** `l`: The number of bits.

#### Return
- **String** The input value in binary.

### `isNumber(c)`
Checks if the input is a number or not.

#### Params
- **String** `c`: The input value.

#### Return
- **Boolean** A boolean value representing whether the input is a valid number or not.

## How to contribute
Have an idea? Found a bug? See [how to contribute][contributing].

## Where is this library used?
If you are using this library in one of your projects, add it in this list. :sparkles:

 - [`arc-asm`](https://github.com/IonicaBizau/arc-assembler)

 - [`arc-int`](https://github.com/IonicaBizau/arc-assembler)

## License

[KINDLY][license] © [Ionică Bizău][website]

[license]: http://ionicabizau.github.io/kindly-license/?author=Ionic%C4%83%20Biz%C4%83u%20%3Cbizauionica@gmail.com%3E&year=2014

[website]: http://ionicabizau.net
[paypal-donations]: https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=RVXDDLKKLQRJW
[donate-now]: http://i.imgur.com/6cMbHOC.png

[contributing]: /CONTRIBUTING.md
[docs]: /DOCUMENTATION.md