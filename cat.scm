(define (print-files files)
  (if (null? files)
      'done
      (let ((buf (sys-get-file-contents (car files))))
        (if (eq? buf (undefined))
            (begin
              (display "No such file: ")
              (print (car files))
              (print-files (cdr files)))
            (begin
              (display buf)
              (print-files (cdr files)))))))
(print-files *argv*)
