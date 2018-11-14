(define (iter)
  (display "* ")
  (let ((line (read-line (current-input-port))))
    (if (eof-object? line)
        'done
        (begin
          (write (eval (read-from-string line)))
          (newline)
          (iter)))))
(define *resume-from-error* (undefined))
(call/cc (lambda (c) (set! *resume-from-error* c)))
(iter)
