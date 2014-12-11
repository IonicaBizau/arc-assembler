!
! An "if" written for ARC assembler
!

        .begin
        .org 2048

main:   ld [x], %r1
        ld [y], %r2
        orncc %r1, %r2, %r4
        be load_x
        bneg load_y
        jmpl %r15+4, %r0

load_x: ld [x], %r3
        jmpl %r15+4, %r0

load_y: ld [y], %r4
        jmpl %r15+4, %r0

x:      1
y:      0

        .end
