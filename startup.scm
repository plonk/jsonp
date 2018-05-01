(define (apply f args)
  (eval (append (list f) args)))

(define (assoc key ls)
  (if (null? ls)
      #f
      (if (eq? key (car (car ls)))
          (car ls)
          (assoc key (cdr ls)))))

(define (cadr ls)
  (car (cdr ls)))

(define (read-char . args)
  (define port #f)
  (if (null? args)
      (set! port (current-input-port))
      (set! port (car args)))
  (if (char-ready? port)
      (read-char-nonblock port)
      (read-char port)))

(define (length ls)
  (if (null? ls)
      0
      (+ 1 (length (cdr ls)))))

(define (- . args)
  (if (eq? 1 (length args))
      (negate (car args))
      (+ (car args) (negate (apply + (cdr args))))))

(define (string->list str)
  (define len (string-length str))
  (define (iter n)
    (if (eq? n len)
        '()
        (cons (string-ref str n) (iter (+ 1 n)))))
  (iter 0))

(define (iota count . rest)
  (define start 0)
  (define step 1)
  (define (iter c n)
    (if (zero? c)
        '()
        (cons n (iter (- c 1) (+ n step)))))

  (if (not (null? rest))
      (begin
        (set! start (car rest))
        (if (not (null? (cdr rest)))
            (set! step (car (cdr rest))))))
  (iter count start))

(define (read-line port)
  (define line "")
  (define ch (undefined))
  (define (loop)
    (set! ch (read-char port))
    (if (eq? ch "\x0a") ; RETURN
        (begin
          (write-char ch (current-output-port))
          'done)
        (if (eq? ch "\x15") ; ^U
            (begin
              (for-each
               (lambda (ch)
                 (if (eq? (wcwidth ch) 1)
                     (display "\x08 \x08")
                     (display "\x08 \x08\x08 \x08")))
               (string->list line))
              (set! line "")
              (loop))
            (if (eq? ch "\x04") ; ^D
                (if (eq? "" line)
                    (begin
                      (set! line (eof-object))
                      'done)
                    (loop))
                (begin
                  (if (eq? ch "\x7f") ; DEL
                      (if (not (eq? 0 (string-length line)))
                          (let ((last-char (string-ref line (+ (string-length line) -1))))
                            (set! line (substring line 0 (+ (string-length line) -1)))
                            (if (eq? (wcwidth last-char) 1)
                                (display "\x08 \x08") ; half width
                                (display "\x08 \x08\x08 \x08")))) ; full width
                      (begin
                        (write-char ch (current-output-port))
                        (set! line (string-append line ch))))
                  (loop))))))
  (loop)
  line)

(define (call-with-current-continuation f)
    (define c '())
    (define first-time #t)
    (set! c (make-continuation))
    (if first-time
        (begin
          (set! first-time #f)
          (f c))
        c))

(define call/cc call-with-current-continuation)

(define (for-each proc ls)
  (if (null? ls)
      'done
      (begin
        (proc (car ls))
        (for-each proc (cdr ls)))))

(define (not v) (if v #f #t))

(define (generate-one-element-at-a-time lst)
  (define (control-state return)
    (for-each
     (lambda (element)
       (set! return (call-with-current-continuation
                     (lambda (resume-here)
                       (set! control-state resume-here)
                       (return element)))))
     lst)
    (return 'you-fell-off-the-end))

  (define (generator)
    (call-with-current-continuation control-state))

  generator)

(define generate-digit
  (generate-one-element-at-a-time '(0 1 2)))

(define (zero? n)
  (eq? n 0))
