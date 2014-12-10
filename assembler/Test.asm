!
! This program sums two numbers
!

        .begin
        .org 2048

main:   ld [x], %r9                 ! load x into r9
        ld [y], %r10                ! load y into r10
        call sum                    ! call sum subrutine
        st %r10, [z]                ! store the result in z
        jmpl %r15+4, %r0            ! Done

sum:    addcc %r9, %r10, %r11       ! sums the registers r9 and r10 into %r11
        jmpl %r15+4, %r0            ! standard return

x:      10
y:      20
z:      0

        .end
