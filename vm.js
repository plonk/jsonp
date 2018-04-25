$SYMBOLS = {};

class Symbol {
  constructor(name) {
    if ($SYMBOLS.hasOwnProperty(name))
      throw new Error(`symbol ${name} already interned`);

    this.name = name;
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
a.put(intern("x"), 123);
console.log(a.lookupValue(intern("x")));

class Frame {
  constructor(parent) {
    this.bindings = new AssocList();
    this.parent = parent;
  }

  lookup_variable(name) {
    if (this.bindings.hasKey(name))
      return this.bindings.lookupValue(name);
    else if (this.parent)
      return this.parent.lookup_variable(name);
    else
      new Error(`no such variable ${name}`);
  }

  assign_variable(name, value) {
    if (this.bindings.hasKey(name))
      this.bindings.put(name, value);
    else if (this.parent)
      this.parent.assign_variable(name, value);
    else
      throw new Error(`no such variable ${name}`);
  }

  define_variable(name, value) {
    if (this.bindings.hasKey(name))
      throw new Error(`variable ${name} already defined`);
    else
      this.bindings.put(name, value);
  }
}

var f = new Frame();
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
}

var p = new Pair(1, 2);
console.log(p.second);

function cons(car, cdr) {
  return new Pair(car, cdr);
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

console.log(list(1, 2, 3));
console.log(list(intern("p"), 1));

function append(xs, ys) {
  if (xs === null) {
    return ys;
  } else {
    return cons(xs.first, append(xs.second, ys));
  }
}

function array(ls) {
  var res = [];
  while (ls !== null) {
    res.push(ls.first);
    ls = ls.second;
  }
  return res;
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
    var params = this.proc.params;
    var args = this.argl;
    while (params !== null) {
      frame.define_variable(params.first, args.first);
      params = params.second;
      args = args.second;
    }

    this.unev = this.proc.body
    this.env = frame
    this.goto(this.ev_sequence);
  }

  apply_dispatch() {
    if (this.is_primitive_procedure(this.proc))
      this.goto(this.primitive_apply);
    else if (this.is_compound_procedure(this.proc))
      this.goto(this.compound_apply);
    else
      this.goto(this.unknown_procedure_type);
  }

  unknown_procedure_type() {
    throw new Error("Unknown procedure type");
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
    this.save(this.exp.second.first)
    this.exp = this.exp.second.second.first
    this.save(this.env)
    this.save(this.continue)
    this.continue = this.ev_definition_1
    this.goto(this.eval_dispatch);
  }

  ev_definition_1() {
    this.continue = this.restore()
    this.env = this.restore()
    var name = this.restore()
    this.env.define_variable(name, this.val)
    this.val = intern("ok")
    this.goto(this.continue);
  }

  eval_dispatch() {
    if      (this.is_self_evaluating(this.exp)) this.goto(this.ev_self_eval);
    else if (this.is_variable(this.exp)       ) this.goto(this.ev_variable);
    else if (this.is_quoted(this.exp)         ) this.goto(this.ev_quoted);
    else if (this.is_assignment(this.exp)     ) this.goto(this.ev_assignment);
    else if (this.is_definition(this.exp)     ) this.goto(this.ev_definition);
    else if (this.is_if(this.exp)             ) this.goto(this.ev_if);
    else if (this.is_lambda(this.exp)         ) this.goto(this.ev_lambda);
    else if (this.is_begin(this.exp)          ) this.goto(this.ev_begin);
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
  }
}

function make_vm(exp, initenv) {
  var vm = new VM()
  vm.exp = exp

  var env = new Frame()
  for (var [key, value] of initenv) {
    env.define_variable(key, value);
  }

  vm.env = env
  vm.pc = vm.eval_dispatch;
  return vm
}

// var initenv = [ [intern("p"), console.log] ];
// var vm1 = make_vm(list(intern("p"), 987), 
//                   initenv);
// console.log(vm1);
// while (vm1.pc) {
//   vm1.step();
// }


// run_vms(vms)
//   until vms.empty?
//     vms.delete_if { |vm|
//       vm.pc.nil?
//     }
//     vms.each do |vm|
//       vm.step
//     end
//   end
// end

// initenv = { "+": lambda { |*xs| xs.inject(0, :+) }, "p": proc { |*xs| p(*xs) } }
// vm1 = make_vm([:begin,
//                [:define, :count, [:lambda, [:n], [:p, :n], [:count, [:+, +1, :n]]]],
//                [:count, 0],
//               ],
//               initenv)
// vm2 = make_vm([:begin,
//                [:define, :count, [:lambda, [:n], [:p, :n], [:count, [:+, -1, :n]]]],
//                [:count, 0],
//               ],
//               initenv)

// run_vms([vm1, vm2])
