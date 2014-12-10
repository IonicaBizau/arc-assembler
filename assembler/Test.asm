!
! A simple ARC program to add two numbers
!
      .begin
      .org 2048
main: ld [x], %r1               ! load x into %r1 | 15
      st %r1, [y]               ! store %r1 into [y]
      ld [y], %r2               ! load y into %r2 | 15
      jmpl %r15+4, %r0          ! standard return
x:    -15
z:    -0x1bb
y:    0
      .end
