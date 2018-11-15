(define (apply f args)
  (eval (append (list f) args)))

(define (assoc key ls)
  (if (null? ls)
      #f
      (if (equal? key (car (car ls)))
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
      (begin
        (syscall 'sleep 0.05)
        (read-char port))))

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

(define *read-line-history* #f)

(define (read-line . args)
  (define port #f)
  (define (caret-notate c)
    (string-append "^" (string
                        (integer->char (+ (char->integer c) 64)))))
  (define (char-display-width c)
    (if (char-control? c)
        2
        (wcwidth c)))
  (define (char-display c)
    (if (char-control? c)
        (string-append "\x1b[35m" (caret-notate c) "\x1b[0m")
        (string c)))
  (define line "")
  (define ch (undefined))
  (define (loop)
    (set! ch (read-char port))
    (cond ((char=? ch (integer->char #x0a)) ; RETURN
           (display ch (current-output-port))
           'done)
          ((char=? ch (integer->char #x15)) ; ^U
           (for-each
            (lambda (ch)
              (if (= 2 (char-display-width ch))
                  (display (string (integer->char #x08)
                                   #\space
                                   (integer->char #x08)
                                   (integer->char #x08)
                                   #\space
                                   (integer->char #x08)))
                  (display (string (integer->char #x08)
                                   #\space
                                   (integer->char #x08)))))
            (string->list line))
           (set! line "")
           (loop))
          ((char=? ch (integer->char #x04)) ; ^D
           (if (string=? "" line)
               (begin
                 (set! line (eof-object))
                 'done)
               (loop)))
          ((char=? ch (integer->char #x10)) ; ^P
           (if *read-line-history*
               (begin
                 (for-each
                  (lambda (ch)
                    (if (= 2 (char-display-width ch))
                        (display (string (integer->char #x08)
                                         #\space
                                         (integer->char #x08)
                                         (integer->char #x08)
                                         #\space
                                         (integer->char #x08)))
                        (display (string (integer->char #x08)
                                         #\space
                                         (integer->char #x08)))))
                  (string->list line))
                 (set! line *read-line-history*)
                 (set! *read-line-history* #f)
                 (display (apply string-append (map char-display (string->list line)))))
               (display (integer->char #x07))) ; BEL
           (loop))
          ((char=? ch (integer->char #x7f)) ; DEL
           (when (not (eq? 0 (string-length line)))
                 (let ((last-char (string-ref line (- (string-length line) 1))))
                   (set! line (substring line 0 (- (string-length line) 1)))
                   (if (= 2 (char-display-width last-char))
(display (string (integer->char #x08)
                                   #\space
                                   (integer->char #x08)
                                   (integer->char #x08)
                                   #\space
                                   (integer->char #x08)))
                  (display (string (integer->char #x08)
                                   #\space
                                   (integer->char #x08))))))
           (loop))
          (else
           (display (char-display ch) (current-output-port))
           (set! line (string-append line (string ch)))
           (loop))))
  (if (null? args)
      (set! port (current-input-port))
      (set! port (car args)))
  (loop)
  (set! *read-line-history* line)
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

(define (reverse ls)
  (define (iter xs acc)
    (if (null? xs)
        acc
        (iter (cdr xs) (cons (car xs) acc))))
  (iter ls '()))

(define (min . xs)
  (cond ((null? xs)
         (error "no args"))
        ((null? (cdr xs))
         (car xs))
        (else
         (if (< (car xs) (cadr xs))
             (apply min (cons (car xs) (cdr (cdr xs))))
             (apply min (cdr xs))))))

(define (max . xs)
  (cond ((null? xs)
         (error "no args"))
        ((null? (cdr xs))
         (car xs))
        (else
         (if (> (car xs) (cadr xs))
             (apply max (cons (car xs) (cdr (cdr xs))))
             (apply max (cdr xs))))))

(define (memq obj ls)
  (if (null? ls)
      #f
      (if (eq? (car ls) obj)
          ls
          (memq obj (cdr ls)))))

(define (memv obj ls)
  (if (null? ls)
      #f
      (if (eqv? (car ls) obj)
          ls
          (memq obj (cdr ls))))
)
(define (member obj ls)
  (if (null? ls)
      #f
      (if (equal? (car ls) obj)
          ls
          (memq obj (cdr ls)))))

(define (char-control? c)
  (let ((n (char->integer c)))
    (if (or (and (<= 0 n)
                 (< n 32))
            (= n 127))
        #t
        #f)))

(define (map f xs)
  (if (null? xs)
      '()
      (cons (f (car xs)) (map f (cdr xs)))))

(define (list? v)
  (or (pair? v) (null? v)))

(define (spawn program . args)
  (syscall 'spawn program args))

(define (exit)
  (syscall 'exit))
