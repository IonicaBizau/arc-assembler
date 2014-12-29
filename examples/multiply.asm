! ======================================================= !
! Muliply two positive numbers                            !
! -------------------                                     !
! This program will multiply the numbers located at       !
! memory locations [x] and [y] and will store the result  !
! in [z].                                                 !
! -------------------                                     !
! Used registers:                                         !
!   r1: the x value                                       !
!   r2: the y value                                       !
!   r3: the z value                                       !
! All the registers above will be unset after multiplying !
! and the result will be loaded in r1                     !
! ======================================================= !

        .begin
        .org 2048

        ld [x], %r1
        ld [y], %r2
        ld [z], %r3
        call mult

mult:   addcc %r3, %r1, %r3
        addcc %r2, -1, %r2
        be done
        ba mult

done:   ld [z], %r1
        ld [z], %r2
        st %r3, [z]
        ld [zero], %r3
        jmpl %r15+4, %r0

x:      5
y:      2
z:      0
zero:   0
        .end
