        .begin
        .org 2048
main:   ld [x], %r1
        jmpl %r15+4, %r0
x:      10
        .end
