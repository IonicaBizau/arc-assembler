!
! A simple ARC program to add two numbers
!
      .begin
      .org 2048
main: ld [x], %r1               ! load x into %r1 | 11
      ld [y], %r2               ! load y into %r2
      addcc %r1, %r2, %r3       ! %r3 <- %r1 + %r2
      st %r3, [z]               ! store %r3 into z
      jmpl %r15+4, %r0          ! standard return
x:    15
y:    9
z:    0
      .end
