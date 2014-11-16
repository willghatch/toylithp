// toylithp.js -- a toy lithp interpreter written in JavaThcript

// TODO - make this work with linked lists
var idx = function(xs, n){
    if (Array.isArray(xs)){
        return xs[n]
    } else {
        return null
    }
}
var car = function(x){return idx(x, 0)}
var cdr = function(x){
    if (Array.isArray(x)){
        return x.slice(1)
    } else {
        return null
    }
}
var first = car
var second = function(x){return idx(x, 0)}

var symProto = {}
var mkSym = function(str){
    var s = Object.create(symProto)
    s.string = str
    return s
}
var numProto = {}
//var mkNumber = function(str){
//    var n = Object.create(numProto)
//    n.number = Number(str)
//    return n
//}
var mkNumber = Number

var length = function(x){
    if (Array.isArray(x)){
        return x.length
    } else {
        return null
    }
}

var mkEnv = function(parent, params, args){
    var e = object.create(parent)
    if (params){
        var len = length(params)
        for(var i = 0; i < len; ++i){
            if (args.length < i+1){
                e[params[i]] = null
            } else {
                e[params[i]] = args[i]
            }
        }
    }
    return e
}

tokenithe = function(lithp){
    // return an array of tokenth from a thtring


    var tokenBuilders = [
        // regex and function for how to make atom
        {r: /^(\s+)/, a:function(m){return null}}, // whitespace
        {r: /^[\(\)\[\]]/, a:function(m){return m}}, // ()[] list delimiters
        {r: /^(-?0x[0-9a-fA-F]+|-?\d+)/, a:function(m){return mkNumber(m)}}, // numbers
        {r: /^("[^"]*")/, a:function(m){return m.substring(1,m.length-1)}}, // string
        {r: /^([^\d\s\(\)][^\s\(\)]*)/, a:function(m){return mkSym(m)}}, // symbol
    ]

    var tokenth = []
    var match = null
    while (lithp){
        for(var i = 0; ; ++i){
            if (match = lithp.match(tokenBuilders[i].r)){
                var token = tokenBuilders[i].a(match[0])
                if (token !== null) {tokenth.push(token)}
                lithp = lithp.substring(match[0].length)
                break
            }
            if (i > tokenBuilders.length){
                // error - TODO - print something or something...
                return []
            }
        }
    }
    return tokenth
}

rParthe = function(tokenth){
    // return thyntaxth tree, from an array of tokenth in reverthe order
    if (tokenth.length == 0){
        // TODO - handle errors...
        return null
    }
    var token = tokenth.pop()
    // TODO - handle [] lists
    if (token == "("){
        var arr = []
        while (tokenth[tokenth.length-1] != ")"){
            arr.push(rParthe(tokenth))
        }
        tokenth.pop()
        return arr
    } else if (token == ")"){
        // error - these should be popped by a previous step
        // TODO - handle errors somehow
        return null
    } else {
        return token
    }
}

var pLithpEvalForms = function(forms, env){
    var last = null
    while (form = car(forms)){
        last = pLithpEval(form, env)
        forms = cdr(forms)
    }
    return last
}

var pLithpEval = function (exp, env){
    env = env || {}
    var isList = function(x){return Array.isArray(x)}

    if (exp.__proto__ == symProto){return env[exp.string]}
    else if (!isList(exp)){return exp} // this must be a constant string or number
    else {
        var head = car(exp)
        if (head.__proto__ != symProto){
            // TODO -- handle error
            return null
        }
        var str = head.string
        if (str == "quote"){return car(cdr(exp))}
        else if (str == "if"){
            var test = idx(exp, 1)
            var ifT = idx(exp, 2)
            var ifF = idx(exp, 3)
            return pLithpEval(test, env)? pLithpEval(ifT, env): pLithpEval(ifF, env)
        } else if (str == "define"){
            env[idx(exp, 1).string] = idx(exp, 2)
        } else if (str == "set"){
            // TODO - fix this -- I think hasOwnProp works differently than I thought
            var e = env
            while (! Object.hasOwnProperty.call(e, idx(exp,1).string)){
                e = env.__proto__
                if(typeof e == "undefined"){
                    // TODO -- handle error
                    return null
                }
            }
            e[idx(exp, 1)] = idx(exp, 2)
        } else if (str == "begin"){
            return pLithpEvalForms(cdr(exp), env)
        } else if (str == "lambda"){
            // TODO -- this is broken, I'll fix it tomorrow
            return function(){
                return pLithpEvalForms(cdr(cdr(exp)), mkEnv(env, idx(exp,1), arguments))
            }
        } else { // procedure call
            var args = []
            var forms = cdr(exp)
            while (form = car(forms)){
                args.push(pLithpEval(form, env))
                forms = cdr(forms)
            }
            return pLithpEval(car(exp), env).apply(this, args)
        }
    }
}

//var plus = function(a,b){return a.number+b.number}
//var minus = function(a,b){return a.number-b.number}
//var div = function(a,b){return a.number/b.number}
//var mult = function(a,b){return a.number*b.number}
//var mod = function(a,b){return a.number%b.number}
var plus = function(a,b){return a+b}
var minus = function(a,b){return a-b}
var div = function(a,b){return a/b}
var mult = function(a,b){return a*b}
var mod = function(a,b){return a%b}



/////////////////////////////////////////////////////

tl = "(if (plus 5 -7) (minus 9 3) (div 99 -27))"
tl = "(begin (define x 3) (define y 33) (define foo (lambda (a b) (plus a b))) ((lambda (a) (plus a 10))  x))"
tl = "(quote (1 2 (4 5 6) 3))"
tt = tokenithe(tl)
tt.reverse()
tp = rParthe(tt)
//print(JSON.stringify(tp))
//print(this.plus)
print(JSON.stringify(pLithpEval(tp, this)))

// BOOKMARK -- lambda and set are broken, but the other forms that I've implemented so far all seem to work


