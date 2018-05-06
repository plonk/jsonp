(define (assert name result)
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

(print "all tests passed")
