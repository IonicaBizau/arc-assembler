
# arc-assembler

 [![Patreon](https://img.shields.io/badge/Support%20me%20on-Patreon-%23e6461a.svg)][patreon] [![PayPal](https://img.shields.io/badge/%24-paypal-f39c12.svg)][paypal-donations] [![AMA](https://img.shields.io/badge/ask%20me-anything-1abc9c.svg)](https://github.com/IonicaBizau/ama) [![Version](https://img.shields.io/npm/v/arc-assembler.svg)](https://www.npmjs.com/package/arc-assembler) [![Downloads](https://img.shields.io/npm/dt/arc-assembler.svg)](https://www.npmjs.com/package/arc-assembler) [![Get help on Codementor](https://cdn.codementor.io/badges/get_help_github.svg)](https://www.codementor.io/johnnyb?utm_source=github&utm_medium=button&utm_term=johnnyb&utm_campaign=github)

> An ARC assembler written in Node.JS.

## Presentation

[Click here](https://docs.google.com/presentation/d/1mot26ZuiUIKRXCICa-4uNp-OfksdtQ8RbiOp-56lpgw/edit?usp=sharing) to see the presentation of the project.

## Installation
```sh
# Install the assembler
$ npm install -g arc-asm
# Install the interpreter
$ npm install -g arc-int
```

Also, you can checkout [the online version](http://ionicabizau.github.io/arc-assembler/).

## Usage

Checkout the [assembler](/assembler) and [interpreter](/interpreter) docs

## Example

Here we go through the process of assembling a file and then interpreting it.

Write the following content in a file (e.g. `hello-world.asm`).

```asm
! ======================================= !
! Hello World Program written in Assembly !
! --------------------------------------- !
! This program prints in console the text !
! "Hello World"                           !
! ======================================= !

            .begin
            .org 2048

main:       ld [h_start], %r1
            ld [length], %r2
            call loop

            ! Load characters one by one
            ! and print them in the console
loop:       ld %r1, %r3
            addcc %r1, 4, %r1
            addcc %r2, -1, %r2
            printc %r3
            be done
            ba loop

done:       jmpl %r15+4, %r0

h_start:    3000
length:     12

            ! "Hello World" ASCII codes
            .org 3000
            72
            101
            108
            108
            111
            32
            87
            111
            114
            108
            100
            10
            .end
```

Assemble this the assembly file using the assembler command line tool. This will generate a executable.

```sh
$ arc-asm -s hello-world.asm -o hello
1100 0010 0000 0111 0010 1000 0011 1100 << Line 11
1100 0100 0000 0000 0010 1000 0100 0000 << Line 12
0100 0000 0000 0000 0000 1000 0001 1000 << Line 13
1100 0110 0000 0000 0100 0000 0000 0000 << Line 17
1000 0010 1000 0000 0110 0000 0000 0100 << Line 18
1000 0100 1000 0000 1011 1111 1111 1111 << Line 19
1100 0110 0100 1000 1100 0000 0000 0000 << Line 20
0000 0010 1000 0000 0000 1000 0011 0100 << Line 21
0001 0000 1000 0000 0000 1000 0001 1000 << Line 22
1000 0001 1100 0011 1110 0000 0000 0100 << Line 24
0000 0000 0000 0000 0000 1011 1011 1000 << Line 26
0000 0000 0000 0000 0000 0000 0000 1100 << Line 27
0000 0000 0000 0000 0000 0000 0100 1000 << Line 31
0000 0000 0000 0000 0000 0000 0110 0101 << Line 32
0000 0000 0000 0000 0000 0000 0110 1100 << Line 33
0000 0000 0000 0000 0000 0000 0110 1100 << Line 34
0000 0000 0000 0000 0000 0000 0110 1111 << Line 35
0000 0000 0000 0000 0000 0000 0010 0000 << Line 36
0000 0000 0000 0000 0000 0000 0101 0111 << Line 37
0000 0000 0000 0000 0000 0000 0110 1111 << Line 38
0000 0000 0000 0000 0000 0000 0111 0010 << Line 39
0000 0000 0000 0000 0000 0000 0110 1100 << Line 40
0000 0000 0000 0000 0000 0000 0110 0100 << Line 41
0000 0000 0000 0000 0000 0000 0000 1010 << Line 42
```

Then run it as executable (you have to make sure you installed the interpreter globally):

```sh
$ ./hello
Hello World
```

Or interpret it with the `arc-int` tool:

```sh
$ arc-int hello
Hello World
```

## :memo: Documentation

### Supported Instructions

#### `Branch`

##### `be`

```asm
be label
```

If the `z` bit from the `PSR` register is `1`, the subrutine located at `label` address is called.

##### `bneg`

```asm
bneg label
```

If the `n` bit from the `PSR` register is `1`, the subrutine located at `label` address is called.

##### `bcs`

```asm
bcs label
```

If the `c` bit from the `PSR` register is `1`, the subrutine located at `label` address of is called.

##### `bvs`

```asm
bvs label
```

If the `v` bit from the `PSR` register is `1`, the subrutine located at `label` address is called.

##### `ba`

```asm
ba label
```

Branch always the subrutine located at `label` address.

#### `CALL`

##### `call`

```asm
call label
```

Calls a subrutine located at `label` address and stores the current address in `r15`.

##### `jpml`

```asm
jmpl %r15+4, %r0
```

Jumps at the address indicated by `r15` register value and stores the result in `r0`.

#### Arithmetic

##### `addcc`
```asm
addcc %r1, %r2, %r3
```

Sums the values of `r1` and `r2` in `r3`.

##### `andcc`
```asm
andcc %r1, %r2, %r3
```

Bitwise AND between `r1` and `r2`, storing the result in `r3`.

##### `andncc`
```asm
andncc %r1, %r2, %r3
```

Bitwise NOT AND between `r1` and `r2`, storing the result in `r3`.

##### `orcc`
```asm
orcc %r1, %r2, %r3
```

Bitwise OR between `r1` and `r2`, storing the result in `r3`.

##### `orncc`
```asm
orncc %r1, %r2, %r3
```

Bitwise NOR between `r1` and `r2`, storing the result in `r3`.

##### `xorcc`
```asm
xorcc %r1, %r2, %r3
```

Bitwise XOR between `r1` and `r2`, storing the result in `r3`.

#### Memory
##### `ld`
```asm
ld [x], %r1
```

Load value from `x` address into `r1`.

##### `st`
```asm
ld %r1, [x]
```

Stores `r1` value into `x` address.

#### Output
##### `printn`
```asm
printn %r1
```

Prints in console the decimal number from `%r1`.

##### `printc`
```asm
printc %r1
```

Prints in console the character from `%r1`.

### Supported pseudo-operations

#### `.begin`

```asm
.begin
```

Start assembling.

#### `.end`
```asm
.end
```

Stop assembling.

#### `.org`
```asm
.org 2048
```

Changes location counter to `2048`.

## :yum: How to contribute
Have an idea? Found a bug? See [how to contribute][contributing].


## :moneybag: Donations

Another way to support the development of my open-source modules is
to [set up a recurring donation, via Patreon][patreon]. :rocket:

[PayPal donations][paypal-donations] are appreciated too! Each dollar helps.

Thanks! :heart:

## :cake: Thanks
Back in 2014, I coded this during the *Computer Architecture* course by [**@HoreaOros**](https://github.com/HoreaOros)–one of my greatest computer-science teachers. :sparkle: :cake:


## :scroll: License

[MIT][license] © [Ionică Bizău][website]

[patreon]: https://www.patreon.com/ionicabizau
[paypal-donations]: https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=RVXDDLKKLQRJW
[donate-now]: http://i.imgur.com/6cMbHOC.png

[license]: http://showalicense.com/?fullname=Ionic%C4%83%20Biz%C4%83u%20%3Cbizauionica%40gmail.com%3E%20(http%3A%2F%2Fionicabizau.net)&year=2014#license-mit
[website]: http://ionicabizau.net
[contributing]: /CONTRIBUTING.md
[docs]: /DOCUMENTATION.md
