            .begin
            .org 2048
            ld [length], %r1
            ld [address], %r2
            andcc %r3, %r0, %r3
            andcc %r1, %r1, %r0
loop:       jmpl %r15+4, %r0
            .org 3000
length:     20
address:    3000
            .end
