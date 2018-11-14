;; (print "Tests")

(define (assert name result)
  ;; (print name)
  (if (not result)
      (error (string-append "assertion " (symbol->string name) " failed"))))

(assert 'vector?-1
        (vector? (vector)))
(assert 'vector?-2
        (not (vector? 0)))

(assert 'make-vector-1
        (eq? 3 (vector-length (make-vector 3 #t))))

(assert 'vector-1
        (eq? 3 (vector-length (vector 'a 'b 'c))))

(assert 'vector-length
        (eq? 0 (vector-length (vector))))

(assert 'vector-ref
        (eq? 'a (vector-ref (vector 'a 'b 'c) 0)))

(assert 'vector-set!
        (eq? 9 (let ((v (vector 1 2 3))) (vector-set! v 0 9) (vector-ref v 0))))

(assert 'vector->list-1
        (null? (vector->list (vector))))
(assert 'vector->list-2
        (pair? (vector->list (vector 1 2 3))))

(assert 'list->vector-1
        (vector? (list->vector '())))

(assert 'vector-fill!
        (let ((v (vector-fill! (make-vector 1 #f) #t))) (vector-ref v 0)))

(assert 'symbol?
        (symbol? 'a))

(assert 'symbol?
        (not (symbol? "a")))

(assert 'symbol->string
        (string=? (symbol->string 'a) "a"))

(assert 'string?
        (string? "a"))

(assert 'string?
        (not (string? 'a)))

(assert 'string=?
        (string=? "a" "a"))

(assert 'string=?
        (not (string=? "a" "A")))

(assert 'string-length
        (eq? 0 (string-length "")))

(assert 'string-length
        (eq? 3 (string-length "foo")))

(assert 'string-length
        (eq? 3 (string-length "あいう")))

(assert 'string-append
        (string=? "aあ" (string-append "a" "あ")))

(assert 'string-ref
        (char=? #\a (string-ref "abc" 0)))

(assert 'string->symbol
        (eq? 'a (string->symbol "a")))

(assert 'string->take
        (string=? "ab" (string-take "abc" 2)))

(assert 'string->number
        (eq? 123 (string->number "123")))

(assert 'char-control?
        (char-control? #\newline))
(assert 'char-control?
        (not (char-control? #\a)))

(assert 'undefined
        (eq? (undefined) (undefined))) ;; 何をテストしているのか…

(assert 'str
        (string=? "abc123" (str "a" "b" "c" 123)))

(assert 'eqv?-1 (eqv? 'a 'a))
(assert 'eqv?-2 (not (eqv? 'a 'b)))
(assert 'eqv?-3 (eqv? 2 2))
(assert 'eqv?-4 (eqv? '() '()))
(assert 'eqv?-5 (eqv? 100000000 100000000))
(assert 'eqv?-6 (not (eqv? (cons 1 2) (cons 1 2))))
(assert 'eqv?-7 (not (eqv? (lambda () 1) (lambda () 2))))
(assert 'eqv?-8 (not (eqv? #f 'nil)))
(assert 'eqv?-9 (let ((p (lambda (x) x)))
                (eqv? p p)))

(assert 'eqv?-10 (eqv? #\a #\a))
(assert 'eqv?-11 (not (eqv? #\a #\A)))

(assert 'eq? (eq? 'a 'a))
(assert 'eq? (not (eq? (list 'a) (list 'a))))
(assert 'eq? (eq? '() '()))
(assert 'eq? (eq? car car))
(assert 'eq? (let ((x '()))
               (eq? x x)))
(assert 'eq? (let ((x '#()))
               (eq? x x)))
(assert 'eq? (let ((p (lambda (x) x)))
               (eq? p p)))

(assert 'equal? (equal? 'a 'a))
(assert 'equal? (equal? '(a) '(a)))
(assert 'equal? (equal? '(a (b) c) '(a (b) c)))
(assert 'equal? (equal? "abc" "abc"))
(assert 'equal? (equal? 2 2))
(assert 'equal? (equal? (make-vector 5 'a)
                        (make-vector 5 'a)))

(assert 'char? (char? #\a))
(assert 'char? (not (char? "a")))
(assert 'char? (not (char? 'a)))

(assert 'char=? (char=? #\a #\a))
(assert 'char=? (not (char=? #\a #\A)))

(assert 'char->integer (eq? (char->integer #\A) 65))
(assert 'integer->char (char=? (integer->char 65) #\A))

(assert 'string (string=? "a" (string #\a)))

(assert 'hex (eq? #xf 15))
(assert 'hex (eq? #x0f 15))
(assert 'octal (eq? #o10 8))

(assert 'string->list (equal? '(#\a #\b #\c) (string->list "abc")))
(assert 'list->string (equal? "abc"
                              (list->string '(#\a #\b #\c))))

(assert 'wcwidth (eq? 1 (wcwidth #\a)))
(assert 'wcwidth (eq? 2 (wcwidth #\ａ)))

(print "all tests passed")
