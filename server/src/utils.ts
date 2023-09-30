import {
	Diagnostic,
	DiagnosticSeverity,
	CompletionItem,
	CompletionItemKind,
	MarkupContent,
	Range
} from 'vscode-languageserver/node';


import { Position, TextDocument } from 'vscode-languageserver-textdocument';
import { Parser } from './parser';
import { exec } from 'child_process';

export function checkLang(textDocument : TextDocument)  : Diagnostic | false {

	const langPattern = /(#lang+ )\w+/g;
	if (!langPattern.test(textDocument.getText())){
		const diagnostic: Diagnostic = {
			severity: DiagnosticSeverity.Error,
			range: {
				start: textDocument.positionAt(0),
				end: textDocument.positionAt(5)
			},
			message: `#lang <language> is required to compile .rkt files`,
			source: `${textDocument.uri.split('/').at(-1)}`
		};
		return diagnostic

	}
	return false

}
function checkEnvironment(variableName : string, environment : CompletionItem[] ) : Boolean{
	// TODO : Remove collisions, create structures to operate quickly.

	environment.forEach((elem, index) => {
		if (elem.label == variableName){
			return true;
		}
	});
	return false;
}

export function execPromise(cmd : string) {
    return new Promise(function(resolve, reject) {
        exec(cmd, function(err, stdout, stderr) {
            resolve(stderr);
        });
    });
}

export function itemDetailer(item : CompletionItem) : CompletionItem {

	if (item.kind == 3 || item.kind == 6){
		item.detail = "";
		let markdown: MarkupContent = {
			kind: "markdown",
			value: [
			  '```lisp',
			  `${item.data}`,
			  '```'
			].join('\n')
		   };
		item.documentation = markdown;
	}
	return item
}


export function getWordRangeAtPosition(document : TextDocument, position : Position) {
	const currentLine = document.getText().split(/\r\n|\r|\n/).at(position.line);
	let start = 0;
	let end = 0;

	if (typeof currentLine != 'undefined'){

		[...currentLine.matchAll(/[\w\d-.><="?]+/g)].forEach((elem) =>{
			if (typeof elem.index != 'undefined'){
				if (position.character >= elem.index  && position.character <= elem.index + elem[0].length){
					start = elem.index
					end = start + elem[0].length
				}
			}
			
		})

		return Range.create({line : position.line, character : start}, {line : position.line, character : end})
	}

	return null
}

export function changeOrAdd(items : CompletionItem[], completions : CompletionItem[]){

	const initials = getAllInitialCompletions()
	for (let i = 0; i < getAllInitialCompletions().length; i++){
		completions[i] = initials[i]
	}

	items.forEach((elem) => {
		let found = false;
		console.log(elem);
		for (let i = 0; i < completions.length; i++){
			if (completions[i].label == elem.label){
				found = true
				completions[i].data = elem.data
				completions[i].kind = elem.kind
			}
		}
		if (!found){
			completions.push(elem)
		}
	})

	let returnedCompletions = completions
	for (let i = getAllInitialCompletions().length; i < completions.length; i++){
		let found = false;
		for (let j = 0; j < items.length; j++){
			if (items[j].label == completions[i].label){
				found = true
			}
		}
		if (!found){
			returnedCompletions.splice(i, 1);
		}
	}
	
	return returnedCompletions
}

export function getAllInitialCompletions() : CompletionItem[] {
	return [
		{
			label: 'lang',
			insertText : "#lang",
			kind: CompletionItemKind.Function,
			data: `#lang s-exp module-path
	form ...`
		},
		{
			label: 'define',
			kind: CompletionItemKind.Keyword,
			data: `(define (head args) body ...+)
	head = id
		 | (head args)
								 
	args = arg ...
		 | arg ... . rest-id
								 
	arg	 = arg-id
		 | [arg-id default-expr]
		 | keyword arg-id
		 | keyword [arg-id default-expr]`
		},
		{
			label: 'provide',
			kind: CompletionItemKind.Keyword,
			data: `(define (provide provide-spec ...))
	provide-spec = id
				 | (all-defined-out)
				 | (all-from-out module-path ...)
				 | (rename-out [orig-id export-id] ...)
				 | (except-out provide-spec provide-spec ...)
				 | (prefix-out prefix-id provide-spec)
				 | (struct-out id)
				 | (combine-out provide-spec ...)
				 | (protect-out provide-spec ...)
				 | (for-meta phase-level provide-spec ...)
				 | (for-syntax provide-spec ...)
				 | (for-template provide-spec ...)
				 | (for-label provide-spec ...)
				 | (for-space space provide-spec ...)
				 | derived-provide-spec`
		},
		{
			label : 'max',
			kind : CompletionItemKind.Function,
			data : '(define (max x y z ...+) \n ...)'
		},
		{
			label: 'struct',
			kind: CompletionItemKind.Keyword,
			data: ''
		},
		{
			label: 'define-struct',
			kind: CompletionItemKind.Keyword,
			data: ''
		},
		{
			label: 'cond',
			kind: CompletionItemKind.Keyword,
			data: ''
		},
		{
			label: 'foldl',
			kind: CompletionItemKind.Function,
			data: `(define (foldl proc init lst ...+)) → any/c
	proc : procedure?
	init : any/c
	lst : list?`
		},
		{
			label: 'foldr',
			kind: CompletionItemKind.Function,
			data: `(define (foldr proc init lst ...+)) → any/c
	proc : procedure?
	init : any/c
	lst : list?`
		},
		{
			label: 'filter',
			kind: CompletionItemKind.Function,
			data: `(define (filter pred lst)) → list?
	pred : procedure?
	lst : list`
		},
		{
			label: 'remove',
			kind: CompletionItemKind.Function,
			data: `(define (remove v lst [proc])) → list?
	v : any/c
	lst : list?
	proc : procedure? = equal?`
		},
		{
			label: 'remq',
			kind: CompletionItemKind.Function,
			data: `(define (remq v lst)) → list?
	v : any/c
	lst : list?`
		},
		{
			label: 'remv',
			kind: CompletionItemKind.Function,
			data: `(define (remv v lst)) → list?
	v : any/c
	lst : list?`
		},
		{
			label: 'remw',
			kind: CompletionItemKind.Function,
			data: `(define (remw v lst)) → list?
	v : any/c
	lst : list?`
		},
		{
			label: 'remw',
			kind: CompletionItemKind.Function,
			data: `(define (remove* v-lst lst [proc])) → list?
	v-lst : list?
	lst : list?
	proc : procedure? = equal?`
		},
		{
			label: 'sort',
			kind: CompletionItemKind.Function,
			data: `(define (sort lst	 	 	 	 
		less-than?	 	 	 	 
		[ #:key extract-key	 	 	 	 
		  #:cache-keys? cache-keys?])) 	→	 	list?
  
	lst : list?
	less-than? : (any/c any/c . -> . any/c)
	extract-key : (any/c . -> . any/c) = (lambda (x) x)
	cache-keys? : boolean? = #f`
		},
		{
			label : 'min',
			kind : CompletionItemKind.Function,
			data : '(define (min x y z ...+) \n ...)'
		},
		{
			label : 'match',
			kind : CompletionItemKind.Keyword,
			data : 12
		},
		{
			label : 'type-case',
			kind : CompletionItemKind.Keyword,
			data : 13
		},
		{
			label : 'eq?',
			kind : CompletionItemKind.Function,
			data : `(define (eq? v1 v2)) → boolean?
	v1 : any/c
	v2 : any/c`
		},
		{
			label : 'equal?',
			kind : CompletionItemKind.Function,
			data : `(define (equal? v1 v2)) → boolean?
	v1 : any/c
	v2 : any/c`
		},
		{
			label : 'equal?/recur',
			kind : CompletionItemKind.Function,
			data : `(define (equal?/recur v1 v2 recur-proc)) → boolean?
	v1 : any/c
	v2 : any/c
	recur-proc : (any/c any/c -> any/c)`
		},
		{
			label : 'equal-always?',
			kind : CompletionItemKind.Function,
			data : `(define (equal-always? v1 v2)) → boolean?
	v1 : any/c
	v2 : any/c`
		},
		{
			label : 'equal-hash-code',
			kind : CompletionItemKind.Function,
			data : `(define (equal-hash-code v)) → fixnum?
	v : any/c`
		},
		{
			label : 'member',
			kind : CompletionItemKind.Function,
			data : `(define (member v lst [is-equal?])) → (or/c #f list? any/c)
	v : any/c
	lst : (or/c list? any/c)
	is-equal? : (any/c any/c -> any/c) = equal?`
		},
		{
			label : 'length',
			kind : CompletionItemKind.Function,
			data : `(define (length lst)) → exact-nonnegative-integer?
	lst : list?`
		},
		{
			label : 'list-ref',
			kind : CompletionItemKind.Function,
			data : `(define (list-ref lst pos)) → any/c
	lst : pair?
	pos : exact-nonnegative-integer?`
		},
		{
			label : 'list->string',
			kind : CompletionItemKind.Function,
			data : `(define (list->string lst)) → string?
	lst : (listof char?)`
		},
		{
			label : 'list-tail',
			kind : CompletionItemKind.Function,
			data : `(define (list-tail lst pos)) → any/c
	lst : any/c
	pos : exact-nonnegative-integer?`
		},
		{
			label : 'cons',
			kind : CompletionItemKind.Function,
			data : `(define (cons a d)) → pair?
	a : any/c
	d : any/c`
		},
		{
			label : 'lambda',
			kind : CompletionItemKind.Keyword,
			data : `(lambda kw-formals body ...+)
	kw-formals	= (arg ...)
				| (arg ...+ . rest-id)
				| rest-id
								 
	       arg	= id
				| [id default-expr]
				| keyword id
				| keyword [id default-expr]`
		},
		{
			label : 'car',
			kind : CompletionItemKind.Function,
			data : `(define (car p)) → any/c
	p : pair?`
		},
		{
			label : 'cdr',
			kind : CompletionItemKind.Function,
			data : `(define (cdr p)) → any/c
	p : pair?`
		},
		{
			label : 'else',
			kind : CompletionItemKind.Keyword,
			data : 22
		},
		{
			label : 'map',
			kind : CompletionItemKind.Function,
			data : `(define (map proc lst ...+)) → list?
	proc : procedure?
	lst : list?`
		},
		{
			label : 'andmap',
			kind : CompletionItemKind.Function,
			data : `(define (andmap proc lst ...+)) → any
	proc : procedure?
	lst : list?`
		},
		{
			label : 'ormap',
			kind : CompletionItemKind.Function,
			data : `(define (ormap proc lst ...+)) → any
	proc : procedure?
	lst : list?`
		},
		{
			label : 'for-each',
			kind : CompletionItemKind.Function,
			data : `(define (for-each proc lst ...+)) → void?
	proc : procedure?
	lst : list?`
		},
		{
			label : 'define-type',
			kind : CompletionItemKind.Keyword,
			data : 24
		},
		{
			label : 'first',
			kind : CompletionItemKind.Function,
			data : `(define (first lst)) → any/c
	lst : list?`
		},
		{
			label : 'second',
			kind : CompletionItemKind.Function,
			data : `(define (second lst)) → any/c
	lst : list?`
		},
		{
			label : 'third',
			kind : CompletionItemKind.Function,
			data : `(define (third lst)) → any/c
	lst : list?`
		},
		{
			label : 'fourth',
			kind : CompletionItemKind.Function,
			data : `(define (fourth lst)) → any/c
	lst : list?`
		},
		{
			label : 'range',
			kind : CompletionItemKind.Function,
			data : `(define (range start end [step])) → list?
	start : real?
	end : real?
	step : real? = 1`
		},
		{
			label : 'rest',
			kind : CompletionItemKind.Function,
			data : '(define (rest xs) \n ...)'
		},
		{
			label : 'null?',
			kind : CompletionItemKind.Function,
			data : `(define (null? v)) → boolean?
	v : any/c`
		},
		{
			label : 'null',
			kind : CompletionItemKind.Value,
			data : `null : null?`
		},
		{
			label : 'empty?',
			kind : CompletionItemKind.Function,
			data : '(define (empty? xs) \n ...)'
		},
		{
			label : 'empty',
			kind : CompletionItemKind.Keyword,
			data : 'Creates an empty list in plait'
		},
		{
			label : 'list?',
			kind : CompletionItemKind.Function,
			data : `(define (list? v)) → boolean?
	v : any/c`
		},
		{
			label : 's-exp-match?',
			kind : CompletionItemKind.Function,
			data : '(define (s-exp-match? form data))'
		},
		{
			label : 's-exp->list',
			kind : CompletionItemKind.Function,
			data : '(define (s-exp->list s-exp))'
		},
		{
			label : 's-exp->symbol',
			kind : CompletionItemKind.Function,
			data : '(define (s-exp->symbol s-exp))'
		},
		{
			label : 's-exp->number',
			kind : CompletionItemKind.Function,
			data : '(define (s-exp->number s-exp))'
		},
		{
			label : 'list',
			kind : CompletionItemKind.Function,
			data : `(define (list v ...)) → list?
	v : any/c`
		},
		{
			label : 'list*',
			kind : CompletionItemKind.Function,
			data : `(define (list* v ... tail)) → any/c
	v : any/c
	tail : any/c`
		},
		{
			label : 'build-list',
			kind : CompletionItemKind.Function,
			data : `(define (build-list n proc)) → list?
	n : exact-nonnegative-integer?
	proc : (exact-nonnegative-integer? . -> . any)`
		},
		{
			label : 'build-string',
			kind : CompletionItemKind.Function,
			data : `(define (build-string n proc)) → string?
	n : exact-nonnegative-integer?
	proc : (exact-nonnegative-integer? . -> . char?)`
		},
		{
			label : 'string=?',
			kind : CompletionItemKind.Function,
			data : `(define (string=? str1 str2 ...)) → boolean?
	str1 : string?
	str2 : string?`
		},
		{
			label : 'assoc',
			kind : CompletionItemKind.Function,
			data : `(define (assoc v lst [is-equal?])) → (or/c pair? #f)
	v : any/c
	lst : (or/c (listof pair?) any/c)
	is-equal? : (any/c any/c -> any/c) = equal?`
		},
		{
			label : 'some',
			kind : CompletionItemKind.Function,
			data : '(define (some x) \n ...)'
		},
		{
			label : 'none',
			kind : CompletionItemKind.Function,
			data : '(define (none) )'
		},
		{
			label : 'some-v',
			kind : CompletionItemKind.Function,
			data : '(define (some-v x ) x)'
		},
		{
			label : 'hash-ref',
			kind : CompletionItemKind.Function,
			data : '(define (hash-ref hash key) \n ...)'
		},
		{
			label : 'append',
			kind : CompletionItemKind.Function,
			data : `(define (append lst ...)) → list?
	lst : list?`
		},
		{
			label : 'append-map',
			kind : CompletionItemKind.Function,
			data : `(define (append-map proc lst ...+)) → list?
	proc : procedure?
	lst : list?`
		},
		{
			label : 'combinations',
			kind : CompletionItemKind.Function,
			data : `(define (combinations lst [size])) → list?
	lst : list?
	size : exact-nonnegative-integer?`
		},
		{
			label : 'permutations',
			kind : CompletionItemKind.Function,
			data : `(define (permutations lst)) → list?
	lst : list?`
		},
		{
			label : 'cartesian-product',
			kind : CompletionItemKind.Function,
			data : `(define (cartesian-product lst ...)) → (listof list?)
	lst : list?`
		},
		{
			label : 'pair?',
			kind : CompletionItemKind.Function,
			data : `(define (pair? v)) → boolean?
	v : any/c`
		},
		{
			label : 'pair',
			kind : CompletionItemKind.Function,
			data : '(define (pair x y) \n ...)'
		},
		{
			label : 'fst',
			kind : CompletionItemKind.Function,
			data : '(define (fst pair) \n ...)'
		},
		{
			label : 'snd',
			kind : CompletionItemKind.Function,
			data : '(define (snd pair) \n ...)'
		},
		{
			label : 'let*',
			kind : CompletionItemKind.Keyword,
			data : `(let* ([id val-expr] ...) body ...+)`
		},
		{
			label : 'letrec',
			kind : CompletionItemKind.Keyword,
			data : `(letrec ([id val-expr] ...) body ...+)`
		},
		{
			label : 'string->list',
			kind : CompletionItemKind.Function,
			data : `(define (string->list str)) → (listof char?)
	str : string?`
		},
		{
			label : 'apply',
			kind : CompletionItemKind.Keyword,
			data : ''
		},
		{
			label : 'begin',
			kind : CompletionItemKind.Keyword,
			data : ''
		},
		{
			label : 'display',
			kind : CompletionItemKind.Function,
			data : `(define (display datum [out])) → void?
	datum : any/cd
	out : output-port? = (current-output-port)`
		},
		{
			label : 'reverse',
			kind : CompletionItemKind.Function,
			data : `(define (reverse lst)) → list?
	lst : list?`
		},
		{
			label : 'displayln',
			kind : CompletionItemKind.Function,
			data : `(define (displayln datum [out])) → void?
	datum : any/c
	out : output-port? = (current-output-port)`
		},
		{
			label : 'print',
			kind : CompletionItemKind.Function,
			data : '(define (print x) \n ...)'
		},
		{
			label : 'println',
			kind : CompletionItemKind.Function,
			data : '(define (println x) \n ...)'
		},
		{
			label : 'and',
			kind : CompletionItemKind.Function,
			data : '(define (and x y ...+) \n ...)'
		},
		{
			label : 'or',
			kind : CompletionItemKind.Function,
			data : '(define (or x y ...+) \n ...)'
		},
		{
			label : 'boolean?',
			kind : CompletionItemKind.Function,
			data : `(define (boolean? v)) → boolean?
	v : any/c`
		},
		{
			label : 'immutable?',
			kind : CompletionItemKind.Function,
			data : `(define (immutable? v)) → boolean?
	v : any/c`
		},
		{
			label : 'number?',
			kind : CompletionItemKind.Function,
			data : '(define (number? x) \n ...)'
		},
		{
			label : 'string?',
			kind : CompletionItemKind.Function,
			data : '(define (string? x) \n ...)'
		},
		{
			label : 'real?',
			kind : CompletionItemKind.Function,
			data : '(define (real? x) \n ...)'
		},
		{
			label : 'define/contract',
			kind : CompletionItemKind.Keyword,
			data : 48
		},
		{
			label : 'parametric->/c',
			kind : CompletionItemKind.Keyword,
			data : 49
		},
		{
			label : 'not',
			kind : CompletionItemKind.Function,
			data : '(define (not x) \n ...)'
		},
		{
			label : 'values',
			kind : CompletionItemKind.Function,
			data : '(define (values x y ...+) \n ...)'
		},
		{
			label : 'symbol?',
			kind : CompletionItemKind.Function,
			data : '(define (symbol? x) \n ...)'
		},
		{
			label : 'symbol=?',
			kind : CompletionItemKind.Function,
			data : `(define (symbol=? a b)) → boolean?
	a : symbol?
	b : symbol?`
		},
		{
			label : 'nand',
			kind : CompletionItemKind.Function,
			data : `(define (nand expr ...))`
		},
		{
			label : 'nor',
			kind : CompletionItemKind.Function,
			data : `(define (nor expr ...))`
		},
		{
			label : 'implies',
			kind : CompletionItemKind.Function,
			data : `(define (implies expr1 expr2))`
		},
		{
			label : 'xor',
			kind : CompletionItemKind.Function,
			data : `(define (xor b1 b2)) → any
	b1 : any/c
	b2 : any/c`
		},
		{
			label : 'mutable-string?',
			kind : CompletionItemKind.Function,
			data : `(define (mutable-string? v)) → boolean?
	v : any/c`
		},
		{
			label : 'immutable-string?',
			kind : CompletionItemKind.Function,
			data : `(define (immutable-string? v)) → boolean?
	v : any/c`
		},
		{
			label : 'make-string',
			kind : CompletionItemKind.Function,
			data : `(define (make-string k [char])) → string?
	k : exact-nonnegative-integer?
	char : char? = #\\nul`
		},
		{
			label : 'string',
			kind : CompletionItemKind.Function,
			data : `(define (string char ...)) → string?
	char : char?`
		},
		{
			label : 'string->immutable-string',
			kind : CompletionItemKind.Function,
			data : `(define (string->immutable-string str)) 
		→ (and/c string? immutable?)
	str : string?`
		},
		{
			label : 'string-set!',
			kind : CompletionItemKind.Function,
			data : `(define (string-set! str k char)) → void?
	str : (and/c string? (not/c immutable?))
	k : exact-nonnegative-integer?
	char : char?`
		},
		{
			label : 'substring',
			kind : CompletionItemKind.Function,
			data : `(define (substring str start [end])) → string?
	str : string?
	start : exact-nonnegative-integer?
	end : exact-nonnegative-integer? = (string-length str)`
		},
		{
			label : 'string-copy',
			kind : CompletionItemKind.Function,
			data : `(define (string-copy str)) → string?
	str : string?`
		},
		{
			label : 'string-copy!',
			kind : CompletionItemKind.Function,
			data : `(define (string-copy! dest	 	 	 	 
			dest-start	 	 	 	 
			src	 	 	 	 
			[ src-start	 	 	 	 
			  src-end])) → void?
  
	dest : (and/c string? (not/c immutable?))
	dest-start : exact-nonnegative-integer?
	src : string?
	src-start : exact-nonnegative-integer? = 0
	src-end : exact-nonnegative-integer? = (string-length src)`
		},
		{
			label : 'string-append',
			kind : CompletionItemKind.Function,
			data : `(define (string-append str ...)) → string?
	str : string?`
		},
		{
			label : 'let',
			kind : CompletionItemKind.Keyword,
			data : `(let ([id val-expr] ...) body ...+)`
		}
	];

}