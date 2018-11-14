class EndOfFile {
  toString() {
    return "#<eof>";
  }
}

class Character {
  constructor(ch) {
    this.value = ch;
  }

  toString() {
    switch (this.value) {
    case " ": return "#\\space";
    case "\n": return "#\\newline";
    default:
      return "#\\" + this.value;
    }
  }
}

class MutableString {
  constructor(jsString) {
    this.buffer = Array.from(jsString).map(c => new Character(c));
  }

  toString() {
    return this.buffer.map(c => c.value).join("");
  }
}

class AssocList {
  constructor() {
    this.list = [];
  }

  hasKey(key) {
    for (var pair of this.list) {
      if (pair[0] === key)
        return true;
    }
    return false;
  }

  lookupPair(key) {
    for (var pair of this.list) {
      if (pair[0] === key)
        return pair;
    }
    return null;
  }

  lookupValue(key) {
    var pair = this.lookupPair(key);
    if (pair) {
      return pair[1];
    } else {
      throw new Error(`entry with ${key} not found`);
    }
  }

  put(key, value) {
    var pair = this.lookupPair(key);
    if (pair) {
      pair[1] = value;
    } else {
      this.list.push([key, value]);
    }
  }
}

var a = new AssocList();
console.log(a.hasKey("x"));
a.put("x", 123);
console.log(a.hasKey("x"));
console.log(a.lookupValue("x"));

class Frame {
  constructor(parent) {
    this.bindings = new AssocList();
    this.parent = parent;
    this.name = undefined;
  }

  has_variable(name) {
    if (this.bindings.hasKey(name)) {
      return true;
    } else if (this.parent) {
      return this.parent.has_variable(name);
    } else {
      return false;
    }
  }

  lookup_variable(name) {
    if (this.bindings.hasKey(name)) {
      return this.bindings.lookupValue(name);
    } else if (this.parent) {
      return this.parent.lookup_variable(name);
    } else
      throw new Error(`lookup_variable: no such variable ${name}`);
  }

  assign_variable(name, value) {
    if (this.bindings.hasKey(name))
      this.bindings.put(name, value);
    else if (this.parent)
      this.parent.assign_variable(name, value);
    else
      throw new Error(`assign_variable: no such variable ${name}`);
  }

  define_variable(name, value) {
    if (this.bindings.hasKey(name))
      throw new Error(`variable ${name} already defined`);
    else
      this.bindings.put(name, value);
  }
}

var f = new Frame();
//console.log(f.lookup_variable("x"));
f.define_variable("x", 999);
console.log(f.lookup_variable("x"));
var g = new Frame(f);
console.log(g.lookup_variable("x"));
g.define_variable("x", 1);
console.log(g.lookup_variable("x"));

class Pair {
  constructor(first, second) {
    this.first = first;
    this.second = second;
  }

  toString() {
    return "(" + this.first + " . " + this.second + ")";
  }
}

// var p = new Pair(1, 2);
// console.log(p.second);

function cons(car, cdr) {
  return new Pair(car, cdr);
}

function car(pair) {
  return pair.first;
}

function cdr(pair) {
  return pair.second;
}

function list() {
  var res = null; // NIL
  var ls = Array.from(arguments);
  ls.reverse();
  for (var elt of ls) {
    res = cons(elt, res);
  }
  return res;
}

// console.log(list(1, 2, 3));
// console.log(list("p", 1));

function append(xs, ys) {
  if (xs === null) {
    return ys;
  } else {
    return cons(xs.first, append(xs.second, ys));
  }
}

function map(f, xs) {
  if (xs === null) {
    return null;
  } else {
    return cons(f(xs.first), map(f, xs.second));
  }
}
console.log(map(function(x) { return x+1; }, list(1,2,3)));

function transpose(lls) {
  if (lls === null) {
    return null;
  } else if (lls.first === null) {
    return null;
  } else {
    return cons(map(car, lls), transpose(map(cdr, lls)));
  }
}
console.log(transpose(list(list(1, 10), list(2, 20))));

function array(ls) {
  var res = [];
  while (ls !== null) {
    res.push(ls.first);
    ls = ls.second;
  }
  return res;
}

class Continuation {
  constructor(data) {
    this.data = data;
  }
}

class VM {
  constructor() {
    this.pc = null;
    this.val = null;
    this.exp = null;
    this.env = new Frame();
    this.argl = null;
    this.unev = null;
    this.stack = [];
    this.continue = null;
    this.proc = null;
    this.interaction_env = undefined;

    this.syscall = null;
  }

  make_continuation() {
    var c = new Continuation({
      pc: this.pc,
      exp: this.exp,
      env: this.env,
      argl: this.argl,
      unev: this.unev,
      stack: Array.from(this.stack),
      continue: this.continue,
      proc: this.proc,
      interaction_env: this.interaction_env,
    });

    console.log("MAKE CONT");
    console.log(c);
    return c;
  }

  save(v) {
    this.stack.push(v)
  }

  restore() {
    return this.stack.pop();
  }

  step() {
    try {
      this.pc.apply(this, []);
    } catch (e) {
      if (e !== "jump") {
        throw e;
      }
    }
  }

  goto(label) {
    this.pc = label
    throw "jump";
  }

  // 式タイプ判別関数：

  is_variable(exp) {
    return (typeof(exp) === "string");
  }

  is_quoted(exp) {
    return (exp.first === "quote");
  }

  is_assignment(exp) {
    return (exp.first === "set!");
  }

  is_definition(exp) {
    return (exp.first === "define");
  }

  is_if(exp) {
    return (exp.first === "if");
  }

  is_lambda(exp) {
    return (exp.first === "lambda");
  }

  is_begin(exp) {
    return (exp.first === "begin");
  }

  is_application(exp) {
    return exp instanceof Pair;
  }

  is_eval(pair) {
    return (pair.first === "eval");
  }

  is_make_cont(pair) {
    return pair.first === "make-continuation";
  }

  is_let(pair) {
    return pair.first === "let";
  }

  is_when(pair) {
    return pair.first === "when";
  }

  is_cond(pair) {
    return pair.first === "cond";
  }

  is_or(pair) {
    return pair.first === "or";
  }

  is_and(pair) {
    return pair.first === "and";
  }

  is_syscall(pair) {
    return pair.first === "syscall";
  }

  //

  ev_variable() {
    this.val = this.env.lookup_variable(this.exp)
    this.goto(this.continue)
  }

  ev_self_eval() {
    this.val = this.exp
    this.goto(this.continue)
  }

  ev_application() {
    this.save(this.continue)
    this.save(this.env)

    this.save(this.exp.second) // unev

    this.exp = this.exp.first
    this.continue = this.ev_appl_did_operator
    this.goto(this.eval_dispatch)
  }

  ev_appl_did_operator() {
    this.unev = this.restore()
    this.env = this.restore()

    this.argl = null;
    this.proc = this.val

    if (this.unev === null) {
      this.goto(this.apply_dispatch)
    } else {
      this.save(this.proc)
      this.goto(this.ev_appl_operand_loop)
    }
  }

  ev_appl_operand_loop() {
    this.save(this.argl)
    this.exp = this.unev.first
    if (this.unev.second === null) {
      this.goto(this.ev_appl_last_arg)
    } else {
      this.save(this.env)
      this.save(this.unev)
      this.continue = this.ev_appl_accumulate_arg
      this.goto(this.eval_dispatch);
    }
  }

  ev_appl_accumulate_arg() {
    this.unev = this.restore()
    this.env = this.restore()
    this.argl = this.restore()
    this.argl = append(this.argl, list(this.val))
    this.unev = this.unev.second
    this.goto(this.ev_appl_operand_loop);
  }

  ev_appl_last_arg() {
    this.continue = this.ev_appl_accum_last_arg
    this.goto(this.eval_dispatch);
  }

  ev_appl_accum_last_arg() {
    this.argl = this.restore()
    this.argl = append(this.argl, list(this.val))
    this.proc = this.restore()
    this.goto(this.apply_dispatch);
  }

  is_primitive_procedure(exp) {
    return (exp instanceof Function);
  }

  is_compound_procedure(exp) {
    return (exp instanceof Procedure);
  }

  compound_apply() {
    var frame = new Frame(this.proc.env)
    frame.name = this.proc.toString();
    var params = this.proc.params;
    var args = this.argl;
    while (params !== null) {
      if (params instanceof Pair) {
        frame.define_variable(params.first, args.first);
        params = params.second;
        args = args.second;
      } else {
        frame.define_variable(params, args);
        break;
      }
    }

    this.unev = this.proc.body
    this.env = frame
    this.goto(this.ev_sequence);
  }

  restore_from_continuation(cont) {
    console.log("RESTORE CONT");
    console.log(cont);
    var data = cont.data;
    this.pc              = data.pc;
    this.exp             = data.exp;
    this.env             = data.env;
    this.argl            = data.argl;
    this.unev            = data.unev;
    // this.stack           = data.stack;
    this.stack           = Array.from(data.stack);
    this.continue        = data.continue;
    this.proc            = data.proc;
    this.interaction_env = data.interaction_env;
  }

  continuation_apply() {
    console.log("CONTINUATION APPLY");
    this.val = this.argl.first;

    this.restore_from_continuation(this.proc);
    this.goto(this.continue);
  }

  is_continuation(val) {
    return val instanceof Continuation;
  }

  apply_dispatch() {
    if (this.is_primitive_procedure(this.proc))
      this.goto(this.primitive_apply);
    else if (this.is_compound_procedure(this.proc))
      this.goto(this.compound_apply);
    else if (this.is_continuation(this.proc))
      this.goto(this.continuation_apply);
    else
      this.goto(this.unknown_procedure_type);
  }

  unknown_procedure_type() {
    throw new Error("Unknown procedure type: " + this.proc);
  }

  primitive_apply() {
    this.val = this.proc.apply(null, array(this.argl))
    this.continue = this.restore()
    this.goto(this.continue)
  }

  ev_begin() {
    this.unev = this.exp.second
    this.save(this.continue)
    this.goto(this.ev_sequence);
  }

  ev_sequence() {
    this.exp = this.unev.first;
    if (this.unev.second === null)
      this.goto(this.ev_sequence_last_exp)
    else {
      this.save(this.unev)
      this.save(this.env)
      this.continue = this.ev_sequence_continue
      this.goto(this.eval_dispatch)
    }
  }

  ev_sequence_continue() {
    this.env = this.restore()
    this.unev = this.restore()
    this.unev = this.unev.second;
    this.goto(this.ev_sequence);
  }

  ev_sequence_last_exp() {
    this.continue = this.restore()
    this.goto(this.eval_dispatch)
  }

  ev_lambda() {
    this.val = new Procedure(this.exp.second.first, this.exp.second.second, this.env)
    this.goto(this.continue);
  }

  ev_definition() {
    if (typeof(this.exp.second.first) === "string") {
      this.save(this.exp.second.first) // name
      this.exp = this.exp.second.second.first
      this.save(this.env)
      this.save(this.continue)
      this.continue = this.ev_definition_1
      this.goto(this.eval_dispatch);
    } else if (this.exp.second.first instanceof Pair) { // procedure definition
      this.save(this.exp.second.first.first); // name
      this.exp = cons("lambda", cons(this.exp.second.first.second, this.exp.second.second));
      this.save(this.env);
      this.save(this.continue);
      this.continue = this.ev_definition_2;
      this.goto(this.eval_dispatch);
    } else {
      throw new Error("ill-formed define")
    }
  }

  ev_definition_1() {
    this.continue = this.restore()
    this.env = this.restore()
    var name = this.restore()
    this.env.define_variable(name, this.val)
    this.val = "ok"
    this.goto(this.continue);
  }

  ev_definition_2() {
    this.continue = this.restore()
    this.env = this.restore()
    var name = this.restore()
    this.val.name = name;
    this.env.define_variable(name, this.val)
    this.val = "ok"
    this.goto(this.continue);
  }

  ev_quoted() {
    this.val = this.exp.second.first;
    this.goto(this.continue);
  }

  is_true(v) {
    return v !== false;
  }

  ev_if() {
    this.save(this.continue);
    this.continue = this.ev_if_did_test;
    this.save(this.exp);
    this.save(this.env);
    this.exp = this.exp.second.first;
    this.goto(this.eval_dispatch);
  }

  ev_if_did_test() {
    this.env = this.restore();
    this.exp = this.restore();
    this.continue = this.restore();

    if (this.is_true(this.val)) {
      this.exp = this.exp.second.second.first;
      this.goto(this.eval_dispatch);
    } else {
      if (this.exp.second.second.second === null) { // else節がない。
        this.val = undefined;
        this.goto(this.continue);
      } else {
        this.exp = this.exp.second.second.second.first;
        this.goto(this.eval_dispatch);
      }
    }
  }

  ev_assignment() {
    var name = this.exp.second.first;
    this.save(name);
    this.save(this.env);
    this.save(this.continue);
    this.exp = this.exp.second.second.first;
    this.continue = this.ev_assignment_did_eval;
    this.goto(this.eval_dispatch);
  }

  ev_assignment_did_eval() {
    this.continue = this.restore();
    this.env = this.restore();
    var name = this.restore();
    this.env.assign_variable(name, this.val);
    this.val = "ok";
    this.goto(this.continue);
  }

  // eval の呼び出し。
  ev_eval() {
    this.save(this.continue)
    this.continue = this.ev_eval_did_eval_arg;
    this.exp = this.exp.second.first;
    this.goto(this.eval_dispatch);
  }
  ev_eval_did_eval_arg() {
    this.continue = this.ev_eval_did_eval;
    this.save(this.env);
    this.env = this.interaction_env;
    this.exp = this.val;
    this.goto(this.eval_dispatch);
  }
  ev_eval_did_eval() {
    this.env = this.restore();
    this.continue = this.restore();
    this.goto(this.continue);
  }

  ev_make_cont() {
    this.val = this.make_continuation();
    this.goto(this.continue);
  }

  ev_let() {
    // (let ((a x) (b y) (c z)) BODY)
    // ((lambda (a b c) BODY) x y z)
    var ls = transpose(this.exp.second.first);
    // console.log(inspect(ls));
    var params = ls.first;
    var args = ls.second.first;
    var body = this.exp.second.second;
    this.exp = cons(append(list("lambda", params), body),
                    args);
    // console.log(inspect(this.exp));
    this.pc = this.ev_application;
  }

  ev_when() {
    this.exp = list("if", this.exp.second.first,
                    cons("begin", this.exp.second.second));
    this.goto(this.eval_dispatch);
  }

  expand_cond_clauses(exp) {
    if (exp === null) {
      return undefined; // else clause
    } else {
      var clause = exp.first;

      if (!(clause instanceof Pair)) {
        throw new Error("expand_cond_clauses: malformed clause");
      }

      if (clause.first === "else") {
        return cons("begin", clause.second);
      } else {
        return list("if", clause.first,
                    cons("begin", clause.second),
                    this.expand_cond_clauses(exp.second));
      }
    }
  }

  ev_cond() {
    this.exp = this.expand_cond_clauses(this.exp.second);
    this.goto(this.eval_dispatch);
  }

  expand_and(terms) {
    if (terms.second === null) { // last term
      return list("let", list(list("x", terms.first)),
                  list("if", "x", "x", false));
    } else {
      return list("if", terms.first,
                  this.expand_and(terms.second),
                  false);
    }
  }

  ev_and() {
    if (this.exp.second === null) {
      this.val = true;
      this.goto(this.continue);
    } else {
      this.exp = this.expand_and(this.exp.second);
      this.goto(this.eval_dispatch);
    }
  }

  ev_or() {
    if (this.exp.second === null) {
      this.val = false;
      this.goto(this.continue);
    } else {
      this.unev = this.exp.second.second;
      this.exp = this.exp.second.first;
      this.save(this.continue);
      this.save(this.unev);
      this.save(this.env);
      this.continue = this.ev_or_did_eval;
      this.goto(this.eval_dispatch);
    }
  }

  ev_or_did_eval() {
    this.env = this.restore();
    this.unev = this.restore()
    if (this.is_true(this.val)) {
      this.continue = this.restore();
      this.goto(this.continue);
    } else if (this.unev === null) {
      this.continue = this.restore();
      this.goto(this.continue); // この val で return する
    } else {
      this.exp = this.unev.first;
      this.unev = this.unev.second;
      this.save(this.unev);
      this.save(this.env);
      this.continue = this.ev_or_did_eval;
      this.goto(this.eval_dispatch);
    }
  }

  syscall_handler() {
    this.syscall = Array.from(arguments);
  }

  ev_syscall() {
    this.save(this.continue);
    this.save(this.env)

    this.save(this.exp.second.second); // unev

    this.exp = this.exp.second.first;
    this.continue = this.ev_syscall_did_operator;
    this.goto(this.eval_dispatch);
  }

  ev_syscall_did_operator() {
    this.unev = this.restore();
    this.env = this.restore(); // ???

    this.argl = list(this.val);
    this.proc = this.syscall_handler.bind(this);

    if (this.unev === null) {
      this.goto(this.apply_dispatch);
    } else {
      this.save(this.proc);
      this.goto(this.ev_appl_operand_loop);
    }
  }

  eval_dispatch() {
    if (this.exp instanceof Pair) {
      if (this.is_quoted(this.exp)         ) this.goto(this.ev_quoted);
      else if (this.is_assignment(this.exp)) this.goto(this.ev_assignment);
      else if (this.is_definition(this.exp)) this.goto(this.ev_definition);
      else if (this.is_if(this.exp)        ) this.goto(this.ev_if);
      else if (this.is_when(this.exp)      ) this.goto(this.ev_when);
      else if (this.is_cond(this.exp)      ) this.goto(this.ev_cond);
      else if (this.is_lambda(this.exp)    ) this.goto(this.ev_lambda);
      else if (this.is_begin(this.exp)     ) this.goto(this.ev_begin);
      else if (this.is_eval(this.exp)      ) this.goto(this.ev_eval);
      else if (this.is_make_cont(this.exp) ) this.goto(this.ev_make_cont);
      else if (this.is_let(this.exp)       ) this.goto(this.ev_let);
      else if (this.is_and(this.exp)       ) this.goto(this.ev_and);
      else if (this.is_or(this.exp)        ) this.goto(this.ev_or);
      else if (this.is_syscall(this.exp)   ) this.goto(this.ev_syscall);
      else
        this.goto(this.ev_application);
    } else if (this.is_variable(this.exp)) {
      this.goto(this.ev_variable);
    } else {
      this.goto(this.ev_self_eval);
    }
  }
}

class Procedure {
  constructor(params, body, env) {
    this.params = params
    this.body = body
    this.env = env
    this.name = undefined;
  }

  toString() {
    if (this.name) {
      return `#<procedure ${this.name} ${inspect(this.params)}>`;
    } else {
      return `#<lambda ${inspect(this.params)}>`;
    }
  }
}
