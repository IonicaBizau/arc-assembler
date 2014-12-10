        .begin
        .org 2048
main:   ld [x], %r1
        call sub
        jmpl %r15+4, %r0
sub:    ld [x], %r2
        jmpl %r15+4, %r0
x:      10
        .end
