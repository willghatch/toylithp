toylithp
========

It'th a toy, that ith only half done.  My idea ith to integrate it well into the JavaThcript world... maybe I'll uthe it in a webpage or thomething.

That thaid, it'th really jutht for fun and learning.

It doeth have bathic primitiveth, thuch ath:

- define
- lambda
- quote, quasiquote, unquote, unquotesplicing
- if
- set
- begin
- defmacro
- procedure calls and macro expansion
- constant numbers, strings, symbols

Ath well ath thome predefined functhionth and valueth:

- plus, minus, div, mult, not
- t, f, n (true, false, null)


I plan to thupport both JavaThcript arrayth and linked lithttth, with [] and () thyntaxth, rethpectively.  And objectth with {} thyntaxth.

The bathic functhions:

    toylithp.eval(toylithp.read("(thome thexthpth (can go) (here))"))
    // or
    toylithp.reval("(ithnt lithp fun!)")

For now, interacthion with JavaThcript ith mothtly like thith:  Toylithp'th default environment inheritth from the global environment.  Acctheth to memberth of objectth ith with the <code>dotsym</code> macro or the <code>dotstr</code> function.

    (dotstr foo bar baz) --> foo[bar][baz]
    (dotsym foo bar baz) --> foo.bar.baz

The macroth neither bathe nor bruth their teeth.  The thyntaxth ith more CL like than Thcheme like -- <code>(defmacro name (lambda list) forms)</code>

It'th a work in progreth.  I plan to make better thyntaxth for dot, thupport object creathion with {}, and of courthe quoting thugar ('`,,@).


