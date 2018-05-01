(define (print-lines lines)
  (if (null? lines)
      'done
      (begin
        (print (car lines))
        (print-lines (cdr lines)))))
(print-lines (sys-list-files))
