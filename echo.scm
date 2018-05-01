(define (print-words words)
  (if (null? words)
      (display "\n")
      (if (null? (cdr words)) ; last
          (begin
            (display (car words))
            (print-words (cdr words)))
          (begin
            (display (car words))
            (display " ")
            (print-words (cdr words))))))
(print-words *argv*)
