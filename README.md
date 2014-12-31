ARC Assembler & Interpreter
===========================
An ARC assembler and interpreter written in Node.JS.

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

## Documentation
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

Change location counter to `2048`.

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
