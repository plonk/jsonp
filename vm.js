$SYMBOLS = {};

class EndOfFile {
  toString() {
    return "#<eof>";
  }
}

class Symbol {
  constructor(name) {
    if ($SYMBOLS.hasOwnProperty(name))
      throw new Error(`symbol ${name} already interned`);

    this.name = name;
  }

  toString() {
    return this.name;
  }
}

function intern(name) {
  if ($SYMBOLS[name] === undefined)
    $SYMBOLS[name] = new Symbol(name);

  return $SYMBOLS[name];
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
console.log(a.hasKey(intern("x")));
a.put(intern("x"), 123);
console.log(a.hasKey(intern("x")));
console.log(a.lookupValue(intern("x")));

class Frame {
  constructor(parent) {
    this.bindings = new AssocList();
    this.parent = parent;
    this.name = undefined;
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
//console.log(f.lookup_variable(intern("x")));
f.define_variable(intern("x"), 999);
console.log(f.lookup_variable(intern("x")));
var g = new Frame(f);
console.log(g.lookup_variable(intern("x")));
g.define_variable(intern("x"), 1);
console.log(g.lookup_variable(intern("x")));

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
// console.log(list(intern("p"), 1));

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

  is_self_evaluating(exp) {
    if ( (exp instanceof Pair) ||
         (exp instanceof Symbol) )
      return false;
    else
      return true
  }

  is_variable(exp) {
    return (exp instanceof Symbol);
  }

  is_quoted(exp) {
    return (exp instanceof Pair) &&
      (exp.first === intern("quote"));
  }

  is_assignment(exp) {
    return (exp instanceof Pair) &&
      (exp.first === intern("set!"));
  }

  is_definition(exp) {
    return (exp instanceof Pair) &&
      (exp.first === intern("define"));
  }

  is_if(exp) {
    return (exp instanceof Pair) &&
      (exp.first === intern("if"));
  }

  is_lambda(exp) {
    return (exp instanceof Pair) &&
      (exp.first === intern("lambda"));
  }

  is_begin(exp) {
    return (exp instanceof Pair) &&
      (exp.first === intern("begin"));
  }

  is_application(exp) {
    return exp instanceof Pair;
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
    if (this.exp.second.first instanceof Symbol) {
      this.save(this.exp.second.first) // name
      this.exp = this.exp.second.second.first
      this.save(this.env)
      this.save(this.continue)
      this.continue = this.ev_definition_1
      this.goto(this.eval_dispatch);
    } else if (this.exp.second.first instanceof Pair) { // procedure definition
      this.save(this.exp.second.first.first); // name
      this.exp = cons(intern("lambda"), cons(this.exp.second.first.second, this.exp.second.second));
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
    this.val = intern("ok")
    this.goto(this.continue);
  }

  ev_definition_2() {
    this.continue = this.restore()
    this.env = this.restore()
    var name = this.restore()
    this.val.name = name.name;
    this.env.define_variable(name, this.val)
    this.val = intern("ok")
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
        this.val = null;
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
    this.val = intern("ok");
    this.goto(this.continue);
  }

  is_eval(exp) {
    return (exp instanceof Pair) &&
      (exp.first === intern("eval"));
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

  is_make_cont(exp) {
    return (exp instanceof Pair) &&
      exp.first === intern("make-continuation");
  }

  ev_make_cont() {
    this.val = this.make_continuation();
    this.goto(this.continue);
  }

  is_let(exp) {
    return (exp instanceof Pair) &&
      exp.first === intern("let");
  }

  ev_let() {
    // (let ((a x) (b y) (c z)) BODY)
    // ((lambda (a b c) BODY) x y z)
    var ls = transpose(this.exp.second.first);
    console.log(inspect(ls));
    var params = ls.first;
    var args = ls.second.first;
    var body = this.exp.second.second;
    this.exp = cons(append(list(intern("lambda"), params), body),
                    args);
    console.log(inspect(this.exp));
    this.pc = this.ev_application;
  }

  eval_dispatch() {
         if (this.is_self_evaluating(this.exp)) this.goto(this.ev_self_eval);
    else if (this.is_variable(this.exp)       ) this.goto(this.ev_variable);
    else if (this.is_quoted(this.exp)         ) this.goto(this.ev_quoted);
    else if (this.is_assignment(this.exp)     ) this.goto(this.ev_assignment);
    else if (this.is_definition(this.exp)     ) this.goto(this.ev_definition);
    else if (this.is_if(this.exp)             ) this.goto(this.ev_if);
    else if (this.is_lambda(this.exp)         ) this.goto(this.ev_lambda);
    else if (this.is_begin(this.exp)          ) this.goto(this.ev_begin);
    else if (this.is_eval(this.exp)           ) this.goto(this.ev_eval);
    else if (this.is_make_cont(this.exp)      ) this.goto(this.ev_make_cont);
    else if (this.is_let(this.exp)            ) this.goto(this.ev_let);
    else if (this.is_application(this.exp)    ) this.goto(this.ev_application);
    else
      this.goto(this.unknown_expression_type);
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
