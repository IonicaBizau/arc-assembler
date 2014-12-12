!
! This program calculates the product of two positive numbers
!

        .begin
        .org 2048

main:       ld [x], %r10            ! load x into r10
            ld [y], %r11            ! load y into r11
            ld [minus_one], %r14    ! r14 = -1
            call pre_mult
            call mult               ! call the mult subrutine
            jmpl %r15+4, %r0        ! Done

pre_mult:   addcc %r11, %r14, %r11
            jmpl %r15+4, %r0        ! Done

mult:       addcc %r10, %r10, %r10  ! x += x
            addcc %r11, %r14, %r11
            orncc %r0, %r11, %r16   ! check if r11 is 0
            be mult
            jmpl %r15+4, %r0

m_tmp: 0
minus_one: -1
plus_one: 1

x:      5
y:      4
z:      0

        .end
