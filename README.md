# arc-assembler [![Support this project][donate-now]][paypal-donations]

An ARC assembler written in Node.JS.

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

## How to contribute
Have an idea? Found a bug? See [how to contribute][contributing].

## Thanks
Back in 2014, I coded this during the *Computer Architecture* course by [**@HoreaOros**](https://github.com/HoreaOros)–one of my greatest computer-science teachers. :sparkle: :cake:

## License

[MIT][license] © [Ionică Bizău][website]

[paypal-donations]: https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=RVXDDLKKLQRJW
[donate-now]: http://i.imgur.com/6cMbHOC.png

[license]: http://showalicense.com/?fullname=Ionic%C4%83%20Biz%C4%83u%20%3Cbizauionica%40gmail.com%3E%20(http%3A%2F%2Fionicabizau.net)&year=2014#license-mit
[website]: http://ionicabizau.net
[contributing]: /CONTRIBUTING.md
[docs]: /DOCUMENTATION.md