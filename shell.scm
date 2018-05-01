(define (iter)
  (display (string-append "\x1b[36m" "SHELL% " "\x1b[0m"))
  (let ((cmdline (read-line (current-input-port))))
    (if (eof-object? cmdline) ; ^D
        'done
        (if (eq? "" cmdline) ; RETURN
            (iter)
            (let ((words (split "\\s+" cmdline)))
              (if (eq? (car words) "exit")
                  'exit
                  (begin
                    (let ((result (apply spawn (cons (str (car words) ".scm") (cdr words)) )))
                      (if (not (eq? result 'ok))
                          (print result)))
                    (iter))))))))
(iter)
