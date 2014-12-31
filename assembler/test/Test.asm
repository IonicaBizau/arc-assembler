        .begin
        .org 2048
        ld [length], %r1
        ld [zero], %r10
        ld [start], %r4
        call loop
        jmpl %r15+4, %r0

loop:   addcc %r4, 4, %r4
        ld %r4, %r10

        addcc %r1, -1, %r1
        jmpl %r15+4, %r0

length: 3
zero:   0
start:  3000

        .org 3000
        1
        2
        3
        .end
