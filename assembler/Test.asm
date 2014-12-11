!
! This program sums two numbers
!

        .begin
        .org 2048

main:   ld [true], %r1
        ld [false], %r2
        ld [n], %r9
        ld [m], %r10
        andcc %r1, %r2, %r0
        be add
        jmpl %r15+4, %r0

add:    addcc %r9, %r10, %r11
        jmpl %r15+4, %r0

true:   1
false:  0

n:      10
m:      -0xa

        .end
