(define *quitting* #f)
(define *buffer* (undefined)) ; 必ず1行はある。
(define *posy* 0) ; 有効範囲 [0,|*buffer*|)
(define *posx* 0) ; 有効範囲 [0,|line|)
(define *screen-top* 0)
(define *insert-mode* #f)
(define *filename* #f)
(define *old-screen-top #f)
(define *normal-mode-table*
  (list
   (list "O" (lambda () ;; 上に行を追加
               (clear-command-line)
               (vector-splice! *buffer* *posy* 0 "")
               (set! *old-screen-top #f)))

   (list "o" (lambda () ;; 下に行を追加
               (clear-command-line)
               (vector-splice! *buffer* (+ 1 *posy*) 0 "")
               (set! *posy* (+ 1 *posy*))
               (minimum-scroll)
               (set! *old-screen-top #f)))

   (list "G" (lambda () ;; ファイルの最後に移動
               (clear-command-line)
               (set! *posy* (- (vector-length *buffer*) 1))
               (minimum-scroll)))

   (list "d" (lambda () ;; 行削除
               (clear-command-line)
               (vector-splice! *buffer* *posy* 1)
               (if (zero? (vector-length *buffer*))
                   (vector-splice! *buffer* 0 0 ""))
               (set! *posy* (min *posy* (- (vector-length *buffer*) 1)))
               (set! *old-screen-top #f)))

   (list "x" (lambda () ;; 文字削除
               (clear-command-line)
               (let ((current-line (vector-ref *buffer* *posy*)))
                 (if (and (> (string-length current-line) 0)
                          (< *posx* (string-length current-line)))
                     (let ((new-line (string-append
                                      (substring current-line 0 *posx*)
                                      (substring current-line
                                                 (+ *posx* 1)
                                                 (string-length current-line)))))
                       (vector-set! *buffer* *posy* new-line)
                       (set! *posx* (min *posx* (- (string-length new-line) 1))))
                     (beep)))))

   (list "i" (lambda ()
               (clear-command-line)
               (set! *insert-mode* #t)))

   (list "a" (lambda ()
               (clear-command-line)
               (set! *insert-mode* #t)
               (set! *posx* (min (+ 1 *posx*) (string-length (vector-ref *buffer* *posy*))))))

   (list "j" (lambda ()
               (clear-command-line)
               (if (eq? *posy* (- (vector-length *buffer*) 1))
                   (beep)
                   (begin
                     (set! *posy* (+ 1 *posy*))
                     (minimum-scroll)
                     (clamp-posx!)))))
   (list "k" (lambda ()
               (clear-command-line)
               (if (eq? *posy* 0)
                   (beep)
                   (begin
                     (set! *posy* (+ -1 *posy*))
                     (minimum-scroll)
                     (clamp-posx!)))))
   (list "l" (lambda ()
               (clear-command-line)
               (if (eq? *posx*
                        (max 0 (- (string-length (vector-ref *buffer* *posy*)) 1)))
                   (beep)
                   (set! *posx* (+ 1 *posx*)))))
   (list "h" (lambda ()
               (clear-command-line)
               (if (eq? *posx* 0)
                   (beep)
                   (set! *posx* (+ -1 *posx*)))))

   (list "^" (lambda ()
               (clear-command-line)
               (set! *posx* 0)))
   (list "$" (lambda ()
               (clear-command-line)
               (set! *posx*
                     (max 0 (- (string-length (vector-ref *buffer* *posy*)) 1)))))

   (list ":" (lambda ()
               (clear-command-line)
               (move-cursor 23 0)
               (display ":")
               (let ((cmd (read-line)))
                 (cond
                  ((eq? cmd "q")
                   (set! *quitting* #t))
                  ((eq? cmd "w")
                   (save-buffer *filename*))
                  ((eq? cmd "wq")
                   (save-buffer *filename*)
                   (set! *quitting* #t))
                  ((eq? cmd "")
                   (display "\r")
                   (clear-line))
                  (#t
                   (display "\r")
                   (clear-line)
                   (display "Unknown command")))
                 )))
   ))
(define *insert-mode-table* (list
                             (list "\n" (lambda ()
                                          (let ((left (substring (vector-ref *buffer* *posy*) 0 *posx*))
                                                (right (substring (vector-ref *buffer* *posy*) *posx*(vector-length (vector-ref *buffer* *posy*)))))
                                            (vector-set! *buffer* *posy* left)
                                            (vector-splice! *buffer* (+ 1 *posy*) 0 right)
                                            (set! *posy* (+ 1 *posy*))
                                            (set! *posx* 0)
                                            (set! *old-screen-top #f) ; ugly. force refresh
                                            )))
                             (list "\x1b" (lambda ()
                                            (set! *insert-mode* #f)
                                            (set! *posx* (max 0 (- *posx* 1)))
                                            ))))

(define (minimum-scroll)
  (cond ((< *posy* *screen-top*)
         (set! *screen-top* *posy*))
        ((>= *posy* (+ 23 *screen-top*))
         (set! *screen-top* (- *posy* 22)))))

(define (nth n ls)
  (if (null? ls)
      (undefined)
      (if (zero? n)
          (car ls)
          (nth (- n 1) (cdr ls)))))

(define (put s)
  (display s)
  ;(flush)
  )

(define (clear-command-line)
  (move-cursor 23 0)
  (clear-line))

(define (altscreen b)
  (if b
      (put "\x1b[?1049h")
      (put "\x1b[?1049l")))

(define (cls)
  (put "\x1b[2J"))

(define (clear-line)
  (display "\x1b[2K"))

(define (cr)
  (display "\r"))

(define (string-take-col str maxcol)
  (define (iter i acc acc-width)
    (if (< i (string-length str))
        (let ((ch (string-ref str i)))
          (cond
           ((> (+ acc-width  (wcwidth ch)) maxcol)
            acc)
           (#t
            (iter (+ 1 i) (string-append acc ch) (+ acc-width (wcwidth ch))))
          ))
        acc))
  (iter 0 "" 0))

(define (render-line line)
  ;; erase entire line and jump to column 0
  (clear-line)
  (cr)

  (display (string-take-col line 80))
  (newline))

(define (times n f)
  (define (iter i)
    (if (= i n)
        'done
        (begin
          (f i)
          (iter (+ 1 i)))))
  (iter 0))

(define (calc-column string pos)
  (columns (substring string 0 pos)))

(define (columns string)
  (define (iter i count)
    (if (< i (string-length string))
        (iter (+ 1 i) (+ (wcwidth (string-ref string i)) count))
        count))
  (iter 0 0))

(define (render-current-line line pos)
  (define pages (paginate line 80))
  (define page-x (pos->page-x pos pages))
  (define page (car page-x))
  (define x (cadr page-x))
  (define visline (nth page pages))
  (let ((col (calc-column visline x)))
    (clear-line)
    (display "\x0d")
    (display visline)
    (display "\x0d")
    (times col
           (lambda (unused) (display "\x1b") (display "[") (display "C")))
    ))

(define (paginate line screen-width)
  (let ((visline "")
        (visline-width 0)
        (pages '()))
    (define (iter i)
      (if (< i (string-length line))
          (let ((w (wcwidth (string-ref line i))))
            (if (< screen-width (+ visline-width w))
                (begin
                  (set! pages (cons visline pages))
                  (set! visline "")
                  (set! visline-width 0)
                  (iter i))
                (begin
                  (set! visline (string-append visline (string-ref line i)))
                  (set! visline-width (+ w visline-width))
                  (iter (+ 1 i)))))
          (begin
            (if (not (eq? visline ""))
                (set! pages (cons visline pages)))
            (if (or (null? pages)
                    (= (columns (car pages)) screen-width))
                (set! pages (cons "" pages)))
            (reverse pages))))
    (iter 0)))

(define (pos->page-x pos pages)
  (define page-num 0)
  (define (iter pos pages)
    (cond
     ((null? pages) (error "no pages"))
     ((and (null? (cdr pages)) (= pos (string-length (car pages))))
      pos)
     ((>= pos (string-length (car pages)))
      (set! page-num (+ 1 page-num))
      (iter (- pos (string-length (car pages))) (cdr pages)))
     (#t
      pos)))
  (let ((remainder (iter pos pages)))
    (list page-num remainder)))

;; [top,bottom)
(define (render-buffer buf top bottom)
  (move-cursor 0 0)
  (for-each
   (lambda (n)
     (if (= n *posy*)
         (newline)
         (if (< n (vector-length buf))
             (render-line (vector-ref buf n))
             (begin
               (clear-line)
               (display "~\n")))))
   (iota (- bottom top) top)))

;; カーソルを移動。座標は0ベース。
(define (move-cursor y x)
  (put
   (string-append
    "\x1b["
    (number->string (+ 1 y))
    ";"
    (number->string (+ 1 x))
    "H")))

;; カーソルの表示非表示を切り替える。
(define (cursor-visible b)
  (if b
      (put "\x1b[?25h")
      (put "\x1b[?25l")))

;; ^G を出力してビープ音を鳴らす。
(define (beep)
  (put "\x07"))

(define (clamp-posx!)
  (let ((len (string-length (vector-ref *buffer* *posy*))))
    ;; posx が現在行に対して大きすぎる場合、長さ-1に設定する。ただし、
    ;; 空行に対しては0とする。
    (if (>= *posx* len)
        (set! *posx* (max 0 (- len 1))))
    'done))

(define (take ls k)
  (cond
   ((null? ls) '())
   ((> k 0) (cons (car ls) (take (cdr ls) (- k 1))))
   (#t
    '())))

(define (last ls)
  (cond
   ((null? ls) (error "empty list"))
   ((null? (cdr ls)) (car ls))
   (#t
    (last (cdr ls)))))

(define (load-file filename)
  (define contents (sys-get-file-contents filename))
  (if (string? contents)
      (let ((lines (split "\\n" contents)))
        (if (and (> (length lines) 1)
                 (= (last lines) ""))
            (set! lines
                  (take lines (- (length lines) 1))))
        (set! *buffer* (list->vector lines)))
      (set! *buffer* (list->vector '("")))))

(define (buffer->string buffer)
  (apply string-append
         (map (lambda (line) (string-append line "\n"))
              (vector->list buffer))))

(define (save-buffer filename)
  (sys-put-file-contents filename (buffer->string *buffer*)))

(define (string-insert string pos phrase)
  (string-append
   (substring string 0 pos)
   phrase
   (substring string pos (string-length string))))

(define (command-loop)
  (cursor-visible #f)
  ;(cls)
  (if (not (eq? *old-screen-top *screen-top*))
      (begin
        (render-buffer *buffer* *screen-top* (+ 23 *screen-top*))
        (set! *old-screen-top *screen-top*)))
  (move-cursor (- *posy* *screen-top*) 0)
  (render-current-line (vector-ref *buffer* *posy*) *posx*)
  (cursor-visible #t)
  (let ((key (read-char))
        (table (if *insert-mode* *insert-mode-table* *normal-mode-table*)))
    (let ((entry (assoc key table)))
      (if entry
          ((cadr entry))
          (if *insert-mode*
              (begin
                (vector-set! *buffer* *posy* (string-insert (vector-ref *buffer* *posy*) *posx* key))
                (set! *posx* (+ 1 *posx*))))))
    (if *quitting*
        'done
        (command-loop))))

(if (or (null? *argv*) (eq? "" (car *argv*)))
    (begin
      (print "Filename required")
      (exit)))

(set! *filename* (car *argv*))
(load-file *filename*)

(altscreen #t)
(command-loop)
(altscreen #f)
