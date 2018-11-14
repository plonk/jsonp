(define (iter lines index)
  (cond ((null? lines) 'done)
        ((< index 23)
         (print (car lines))
         (iter (cdr lines) (+ 1 index)))
        (else
         (display (string-append "\x1b[7m" "--More--" "\x1b[0m"))
         (let ((ch (read-char)))
           ;; erase entire line and jump to column 0
           (display "\x1b[2K\r")
           (cond ((char=? ch #\q) 'done)
                 ((char=? ch #\space)
                  (iter lines 0))
                 (else
                  (iter lines (- index 1))))))))

(define (but-last ls)
  (reverse (cdr (reverse ls))))

(define (main)
  (if (null? *argv*)
      (begin
        (print "Usage: more FILENAME")
        (exit)))
  (let ((buffer (sys-get-file-contents (car *argv*))))
    (if (string=? "" buffer)
        (exit)
        (let ((lines (split "\\n" buffer)))
          (if (char=? #\newline (string-ref buffer (- (string-length buffer) 1)))
              (set! lines (but-last lines)))
          (iter lines 0)))))

(main)
