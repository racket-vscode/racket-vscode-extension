([**define**](https://docs.racket-lang.org/reference/define.html#%28form._%28%28lib._racket%2Fprivate%2Fbase..rkt%29._define%29%29) id expr)

([**define**](https://docs.racket-lang.org/reference/define.html#%28form._%28%28lib._racket%2Fprivate%2Fbase..rkt%29._define%29%29)  (head  args)  body  ...+)
```scheme
head = id
     | (head args)
args = arg  ...
     | arg  ... . rest-id
arg  = arg-id
     | [arg-id default-expr]
     | keyword arg-id
     | keyword [arg-id default-expr] 
```
### Examples :
```scheme
(define x 10)

> x
10

(define (f x) 
	(+ 1 x))
	
> (f 10)
11

(define ((f x) [y 20]) 
	(+ x y))
	
> ((f 10) 30)
40
> ((f 10))
30
```