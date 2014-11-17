// toylithp.js -- a toy lithp interpreter written in JavaThcript

var toylithp = function(){
    var tl = Object.create(this) // hopefully this makes the global object the parent,
                                   // so the global scope is accessible to lisp forms
    tl.jseval = eval
    tl.eval = function(str){
        var tokenth = tl.tokenithe(str)
        tokenth.reverse()
        var parthed = tl.rParthe(tokenth)
        return tl.pLithpEval(parthed, tl)
    }
    
    // TODO - make this work with linked lists
    tl.idx = function(xs, n){
        if (Array.isArray(xs)){
            return xs[n]
        } else {
            return null
        }
    }
    tl.car = function(x){return tl.idx(x, 0)}
    tl.cdr = function(x){
        if (Array.isArray(x)){
            return x.slice(1)
        } else {
            return null
        }
    }
    tl.first = tl.car
    tl.second = function(x){return tl.idx(x, 0)}

    tl.symProto = {}
    tl.mkSym = function(str){
        var s = Object.create(tl.symProto)
        s.string = str
        return s
    }
    tl.numProto = {}
    //var mkNumber = function(str){
    //    var n = Object.create(numProto)
    //    n.number = Number(str)
    //    return n
    //}
    tl.mkNumber = Number

    tl.length = function(x){
        if (Array.isArray(x)){
            return x.length
        } else {
            return null
        }
    }

    tl.mkEnv = function(parent, params, args){
        var e = Object.create(parent)
        if (params){
            var len = tl.length(params)
            for(var i = 0; i < len; ++i){
                if (args.length < i+1){
                    e[params[i].string] = null
                } else {
                    e[params[i].string] = args[i]
                }
            }
        }
        return e
    }

    tl.tokenithe = function(lithp){
        // return an array of tokenth from a thtring


        var tokenBuilders = [
            // regex and function for how to make atom
            {r: /^(\s+)/, a:function(m){return null}}, // whitespace
            {r: /^[\(\)\[\]]/, a:function(m){return m}}, // ()[] list delimiters
            {r: /^(-?0x[0-9a-fA-F]+|-?\d+)/, a:function(m){return tl.mkNumber(m)}}, // numbers
            {r: /^("[^"]*")/, a:function(m){return m.substring(1,m.length-1)}}, // string
            {r: /^([^\d\s\(\)][^\s\(\)]*)/, a:function(m){return tl.mkSym(m)}}, // symbol
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

    tl.rParthe = function(tokenth){
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
                if (tokenth.length == 0) {
                    return "Not enough closing parens!"
                }
                arr.push(tl.rParthe(tokenth))
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

    tl.pLithpEvalForms = function(forms, env){
        var last = null
        while (form = tl.car(forms)){
            last = tl.pLithpEval(form, env)
            forms = tl.cdr(forms)
        }
        return last
    }

    tl.pLithpEval = function (exp, env){
        env = env || {}
        var isList = function(x){return Array.isArray(x)}
        var isFunction = function(obj) {
            return !!(obj && obj.constructor && obj.call && obj.apply);
        };
        var procCall = function(func, forms, env){
            if (!isFunction(func)){
                func = tl.pLithpEval(func, env)
            }
            var args = []
            var form = null
            while (form = tl.car(forms)){
                args.push(tl.pLithpEval(form, env))
                forms = tl.cdr(forms)
            }
            return func.apply(this, args)
        }

        if (exp.__proto__ == tl.symProto){return env[exp.string]}
        else if (!isList(exp)){return exp} // this must be a constant string or number
        else {
            var head = tl.car(exp)
            var str = head.string
            if (str == "quote"){return tl.car(tl.cdr(exp))}
            else if (str == "if"){
                var test = tl.idx(exp, 1)
                var ifT = tl.idx(exp, 2)
                var ifF = tl.idx(exp, 3)
                return tl.pLithpEval(test, env)?
                    tl.pLithpEval(ifT, env):
                    tl.pLithpEval(ifF, env)
            } else if (str == "define"){
                env[tl.idx(exp, 1).string] = tl.pLithpEval(tl.idx(exp, 2), env)
            } else if (str == "set"){
                var e = env
                while (! Object.hasOwnProperty.call(e, tl.idx(exp,1).string)){
                    e = env.__proto__
                    if(typeof e == "undefined"){
                        // TODO -- handle error
                        return null
                    }
                }
                e[tl.idx(exp, 1).string] = tl.idx(exp, 2)
            } else if (str == "begin"){
                return tl.pLithpEvalForms(tl.cdr(exp), tl.mkEnv(env, [], []))
            } else if (str == "lambda"){
                return function(){
                    return tl.pLithpEvalForms(tl.cdr(tl.cdr(exp)),
                                                tl.mkEnv(env, tl.idx(exp,1),
                                                           arguments))
                }
            } else { // procedure call
                return procCall(tl.car(exp), tl.cdr(exp), env)
            }
        }
    }

    tl.plus = function(a,b){return a+b}
    tl.minus = function(a,b){return a-b}
    tl.div = function(a,b){return a/b}
    tl.mult = function(a,b){return a*b}
    tl.mod = function(a,b){return a%b}

    return tl
}()

