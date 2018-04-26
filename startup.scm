(define read-char (lambda (port)
     (if (char-ready? port)
         (begin (read-char-nonblock port))
         (begin (read-char port)))))

(define read-line (lambda (port)
  (define ch (read-char port))
  (write-char ch (current-output-port))
  (if (eq ch "\x0a")
     ""
     (str ch (read-line port)))))
