ARC Assembler & Interpreter
===========================
An ARC assembler and interpreter.

## Installation

```sh
$ npm install -g arc-asm
$ npm install -g arc-int
```

Also, you can checkout [the online version](http://ionicabizau.github.io/arc-assembler/).

## Usage

### `arc-asm`
```sh
$ arc-asm  --help
Usage: arc-asm [options]

Options:
  -h, --help                          Displays this help.
  -s, --source <path/to/source/file>  Sets the source file path.
  -o, --output <path/to/output/file>  Sets the output file path

Documentation can be found at https://github.com/IonicaBizau/arc-assembler
```

### `arc-int`

```sh
$ arc-int
Usage: arc-int <path/to/binary/file>

Documentation can be found at https://github.com/IonicaBizau/arc-assembler
```

You can pass `-v` and `-r` flags:

 - `-v`: verbose output
 - `-r`: shows the final state of registers

## Example
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

Compile the assembly file using:

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

Then run it as executable:

```sh
$ ./hello
Hello World
```

Or interpret it with `arc-int` tool:

```sh
$ arc-int hello
Hello World
```

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
