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
