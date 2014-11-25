// toylithp.js -- a toy lithp interpreter written in JavaThcript
var dbg = null
var toylithp = function(){
    var tl = Object.create(this) // hopefully this makes the global object the parent,
                                   // so the global scope is accessible to lisp forms
    tl.jseval = eval
    tl.jsonstr = JSON.stringify
    tl.reval = function(str){
        var parthed = tl.read(str)
        return tl.eval(parthed, tl)
    }
    tl.read = function(str){
        var tokenth = tokenithe(str)
        tokenth.reverse()
        return rParthe(tokenth)
    }

    // TODO - make this work with linked lists
    tl.listP = function(x){return Array.isArray(x)}
    tl.idx = function(xs, n){
        if (Array.isArray(xs)){
            return xs[n]
        } else {
            return null
        }
    }
    tl.nthcdr = function(xs, n){
        if (Array.isArray(xs)){
            return xs.slice(n)
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

    tl.symProto = {symbolP:true}
    tl.mkSym = function(str){
        var s = Object.create(tl.symProto)
        s.string = str
        return s
    }
    tl.symbolP = function(symbol){return symbol && symbol.symbolP}
    tl.mkNumber = Number

    tl.length = function(x){
        if (x.length || x.length == 0) {
            return x.length
        } else {
            return null
        }
    }
    tl.countKeys = function(obj) {
        return Object.keys(obj).length;
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
        e.arguments = args
        return e
    }

    var tokenithe = function(lithp){
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

    var rParthe = function(tokenth){
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

    tl.evalForms = function(forms, env){
        var last = null
        while (form = tl.car(forms)){
            last = tl.eval(form, env)
            forms = tl.cdr(forms)
        }
        return last
    }

    tl.macroTable = {}

    tl.eval = function (exp, env){
        env = env || {}
        var isFunction = function(obj) {
            return !!(obj && obj.constructor && obj.call && obj.apply);
        };
        var procCall = function(func, forms, env, isMacro){
            if (!isFunction(func)){
                func = tl.eval(func, env)
            }
            var args = []
            var form = null
            while (form = tl.car(forms)){
                args.push(isMacro? form: tl.eval(form, env))
                forms = tl.cdr(forms)
            }
            return func.apply(this, args)
        }

        if (tl.symbolP(exp)){return env[exp.string]}
        else if (!tl.listP(exp)){return exp} // this must be a constant string or number
        else {
            var head = tl.car(exp)
            var str = head.string
            if (str == "quote"){return tl.car(tl.cdr(exp))}
            else if (str == "quasiquote"){
                return tl.quasiExpand(tl.idx(exp,1), env)
            } else if (str == "if"){
                var test = tl.idx(exp, 1)
                var ifT = tl.idx(exp, 2)
                var ifF = tl.idx(exp, 3)
                //print("test: "+JSON.stringify(test))
                //print("ifT: "+JSON.stringify(ifT))
                //print("ifF: "+JSON.stringify(ifF))
                if (tl.eval(test, env)){
                    //print("truth")
                    return tl.eval(ifT, env)
                } else {
                    //print("falseeee")
                    return tl.eval(ifF, env)
                }
            } else if (str == "define"){
                env[tl.idx(exp, 1).string] = tl.eval(tl.idx(exp, 2), env)
            } else if (str == "set"){
                var e = env
                while (! Object.hasOwnProperty.call(e, tl.idx(exp,1).string)){
                    e = env.__proto__
                    if(!tl.countKeys(e) && !e.__proto__){
                        // TODO -- handle error
                        return null
                    }
                }
                var result = tl.eval(tl.idx(exp, 2), env)
                e[tl.idx(exp, 1).string] = result
                return result
            } else if (str == "begin"){
                return tl.evalForms(tl.cdr(exp), tl.mkEnv(env, [], []))
            } else if (str == "lambda"){
                return function(){
                    return tl.evalForms(tl.nthcdr(exp,2),
                                        tl.mkEnv(env, tl.idx(exp,1),
                                                 Array.prototype.slice.call(arguments)))
                }
            } else if (str == "defmacro"){
                tl.macroTable[tl.idx(exp,1).string] = function(){
                    return tl.evalForms(tl.nthcdr(exp,3),
                                        tl.mkEnv(env, tl.idx(exp,2),
                                                 Array.prototype.slice.call(arguments)))
                }
            } else if (tl.macroTable[str]){
                var expanded = procCall(tl.macroTable[str],tl.cdr(exp), env, true)
                dbg = expanded
                //print(tl.jsonstr(expanded))
                return tl.eval(expanded, env)
            } else { // procedure call
                return procCall(tl.car(exp), tl.cdr(exp), env, false)
            }
        }
    }
    tl.quasiExpand = function(e, env){
        if (!tl.listP(e)){
            return e
        }
        var ce = tl.car(e)
        if (tl.symbolP(ce)
            && (ce.string == "unquote" || ce.string == "unquotesplicing")){
            // if it's unquotesplicing it should really be another level down...
            return tl.eval(tl.idx(e, 1), env)
        }
        var ep = []
        var l = tl.length(e)
        for(var i = 0; i < l; ++i){
            var item = tl.idx(e,i)
            if (tl.listP(item)){
                if (tl.symbolP(tl.car(item)) && tl.car(item).string == "unquotesplicing"){
                    var items = tl.eval(tl.idx(item,1), env)
                    var il = tl.length(items)
                    for(var c = 0; c < il; ++c){
                        ep.push(items[c])
                    }
                } else {
                    ep.push(tl.quasiExpand(item, env))
                }
            } else {
                ep.push(item)
            }
        }
        return ep
    }


    tl.plus = function(a,b){return a+b}
    tl.minus = function(a,b){return a-b}
    tl.div = function(a,b){return a/b}
    tl.mult = function(a,b){return a*b}
    tl.mod = function(a,b){return a%b}
    tl.not = function(a){return !a}
    tl.equal = function(a,b){return a==b}
    tl.t = true
    tl.f = false
    tl.n = null
    tl.macroTable.dotsym = function(){
        var res = []
        res.push(tl.mkSym("dotstr"))
        res.push(arguments[0])
        for(var i = 1; i < arguments.length; ++i){
            res.push(arguments[i].string)
        }
        return res
    }
    tl.dotstr = function(){
        var res = arguments[0]
        for(var i = 1; i < arguments.length; ++i){
            res = res[arguments[i]]
        }
        return res
    }

    return tl
}()

toylithp.reval(
    " (defmacro inc (ex) (quasiquote (set (unquote ex) (plus 1 (unquote ex))))) "
)

toylithp.reval(
    " (defmacro and () (define andArgs arguments) (if (not (length andArgs)) t (quasiquote (if (unquote (car andArgs)) (and (unquotesplicing (cdr andArgs))) f))) ) "
)

//test = toylithp.reval("(quasiquote  t)")
//test = toylithp.reval("(quasiquote arguments)")
//test = toylithp.reval("(begin (define foo (quote (1 2 3 4 5))) (quasiquote (bar (unquotesplicing foo))))")
//test = toylithp.reval("(begin (define arr 3) (inc arr) (plus arr 1))")


