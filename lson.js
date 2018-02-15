var AL = {
  "has_key_p" : function (al, key) {
    for (var pair of al) {
      if (pair[0] === key)
        return true;
    }
    return false;
  },
  "lookup" : function (al, key) {
    for (var pair of al) {
      if (pair[0] === key)
        return pair[1];
    }
    return null;
  }
};

if (!AL.has_key_p([["x", 10]], "x")) throw new Error();
if (AL.has_key_p([], "x")) throw new Error();
if (AL.lookup([["x", 10]], "x") !== 10) throw new Error();
if (AL.lookup([["x", 10]], "y") !== null) throw new Error();

var Evaluator = function (opts) {
  if (typeof(opts) !== 'object')
    throw TypeError("opts");

  this.global_env = [
    ... [">=",  ">", "==", "!=", "<", "<=",
         "+", "-", "*", "/", "list", "p", "globals",
         "append","conj","cons"].map(function (f) {
           return [f, ["builtin", f]];
         })
  ];
  this.macros = [
    ["let", ["builtin", "let"]]
  ];
  this.outfn = (opts.outfn || function(str){});
  Evaluator.force(
    this.eval(["defmacro", "defun", ["name","params","&","body"],
               ["list", ["","do"],
                ["list", ["","def"], "name",
                 ["append", ["list", ["","fn"], "params"], "body"]],
                ["list", ["",""],"name"]]],
              [])
  );
  Evaluator.force(
    this.eval(["defun", "not", ["x"], ["if", "x", false, true]],
              [])
  );

  this.evaluating = false;
  this.syscall = null;
  this.syscallResult = null;
};

Evaluator.for_all_adjacent_pairs_p = function (arr, binary_func) {
  for (var i = 0; i < arr.length - 1; i++) {
    if (!binary_func(arr[i], arr[i+1])) {
      return false;
    }
  }
  return true;
};
if (!Evaluator.for_all_adjacent_pairs_p([1,1,1], (a,b)=>a==b)) throw new Error();
if (Evaluator.for_all_adjacent_pairs_p([1,1,2], (a,b)=>a==b)) throw new Error();

Evaluator.operator_func = {
  ">=": (a,b) => a>=b,
  ">": (a,b) => a>b,
  "==": (a,b) => a==b,
  "!=": (a,b) => a!=b,
  "<": (a,b) => a<b,
  "<=": (a,b) => a<=b,
};

Evaluator.slices = function (arr, width) {
  var res = [];
  for (var i = 0; i < arr.length; i += width) {
    var slice = [];
    for (var j = 0; (i+j) < arr.length; j++) {
      slice.push(arr[i+j]);
    }
    res.push(slice);
  }
  return res;
};

Evaluator.all_p = function (arr, pred) {
  for (var i = 0; i < arr.length; i++) {
    if (!pred(arr[i]))
      return false;
  }
  return true;
};

Evaluator.transpose = function (arr) {
  if (!Evaluator.all_p(arr, e => e instanceof Array))
    throw new TypeError("array elements required");
  if (!Evaluator.all_p(arr, e => e.length == arr[0].length))
    throw new TypeError("sublist length mismatch");
  if (arr.length === 0) return [];
  var res = [];
  for (var i = 0; i < arr[0].length; i++) {
    var s = [];
    for (var j = 0; j < arr.length; j++) {
      s.push(arr[j][i]);
    }
    res.push(s);
  }
  return res;
};

Evaluator.prototype.apply_builtin_function = function(name, args) {
  switch (name) {
  case "+":
    return args.reduce(function(acc,x) { return acc+x; }, 0);
    break;
  case "-":
    return args.reduce(function(acc,x) { return acc-x; });
    break;
  case "*":
    return args.reduce(function(acc,x) { return acc*x; }, 1);
    break;
  case "/":
    return args.reduce(function(acc,x) { return acc/x; });
    break;
  case ">=": case ">": case "==": case "!=": case "<": case "<=":
    var f = Evaluator.operator_func[name];
    return Evaluator.for_all_adjacent_pairs_p(args, f);
    break;
  case "list":
    return args;
    break;
  case "let":
    var [vars, vals] = Evaluator.transpose(Evaluator.slices(args[0], 2));
    return [["fn", vars, ... args.slice(1)], ... vals];
    break;
  case "p":
    var value;
    if (args.length == 0) {
      value = null;
    } else if (args.length == 1) {
      value = args[0];
    } else {
      value = args;
    }
    try {
      this.outfn(JSON.stringify(value) + "\r\n");
    } catch (e) {
      this.outfn(e.message + "\r\n");
    }
    return value;
    break;
  case "append":
    if (!Evaluator.all_p(args, a => a instanceof Array)) throw new TypeError("array expected");
    return args.reduce((acc,x) => acc.concat(x), []);
    break;
  default:
    throw new Error("undefined builtin " + name);
  }
};

Evaluator.make_bindings = function(params, args) {
  if (params.length === 0) {
    if (args.length > 0)
      new Error("too many arguments");
    else
      return params;
  } else {
    var [first, ... rest] = params;
    if (first === "&") { // 可変長引数
      if (rest.length < 1) {
        throw new Error("no name after &");
      } else if (rest.length > 1) {
        throw new Error("too many names after &");
      } else {
        var name = rest[0];
        return [[name, args]];
      }
    } else if (typeof(first) === 'string') {
      if (args.length === 0) {
        throw new Error("too few arguments");
      } else {
        return [[first, args[0]]].concat(this.make_bindings(rest, args.splice(1)));
      }
    } else if (first instanceof Array) {
      if (!(args.length > 0 && args[0] instanceof Array)) {
        throw new Error("cannot undestructure a non-array type " + args[0]);
      } else {
        return this.make_bindings(first, args[0]).concat(
          this.make_bindings(rest, args.splice(1)));
      }
    } else {
      throw new Error();
    }
  }
};


if (JSON.stringify(Evaluator.make_bindings(["x"], [10])) !== '[["x",10]]') throw new Error();
// console.log( JSON.stringify(Evaluator.make_bindings([["x","y"]], [[10,20]])) );
// console.log( JSON.stringify(Evaluator.make_bindings(["x","&","y"], [10,20,30])) );

// args は評価済み。
Evaluator.prototype.apply_function = function(func, args) {
  if (func instanceof Array) {
    switch (func[0]) {
    case "closure":
      var [_, form, env] = func;
      var [_, params, ... body] = form;
      var fenv = Evaluator.make_bindings(params, args).concat(env);
      var self = this;
      return Evaluator.make_thunk_chain(body, e => self.eval(e, fenv));
      break;
    case "builtin":
      var [_, name1] = func;
      return this.apply_builtin_function(name1, args);
    default:
      console.debug(func);
      throw new Error("invalid function");
    }
  } else {
    throw new Error("invalid function (not an Array)");
  }
};


Evaluator.force = function (x) {
  while (typeof(x) === 'function')
    x = x();
  return x;
};

Evaluator.make_thunk_chain = function(arr, fn) {
  if (arr.length === 0) {
    return null;
  } else if (arr.length === 1) {
    return function () {
      return fn(arr[0]);
    };
  } else {
    return function () {
      fn(arr[0]);
      return Evaluator.make_thunk_chain(arr.slice(1), fn);
    };
  }
};

Evaluator.prototype.eval_form = function(form, env) {
  var self = this;
  var [name, ... args] = form;

  switch (name) {
  case "quote":
  case "":
    if (args.size === 0) throw new Error("no arguments to quote");
    if (args.length == 1)
        return args[0];
    else
        return args;
  case "def": // グローバル変数を定義する
    if (args.length !== 2) throw new Error("def require 2 args");
    if (typeof(args[0]) !== 'string') throw new Error("type error");
    if (AL.has_key_p(this.global_env, args[0]))
      throw new Error(args[0] + " already defined");
    else {
      var value = this.eval(args[1], env);
      this.global_env.unshift([args[0], value]);
      return value;
    }
  case "if":
    if (args.length < 2 || args.length > 3) throw new Error("invalid if form");
    var [test, then_clause, else_clause] = args;
    if (this.eval(test, env)) // 真の定義？
      return this.eval(then_clause, env);
    else
      return (args.length == 3) ? this.eval(else_clause, env) : null;
  case "fn":
    return ["closure", form, env];
  case "defmacro":
    var [name, params, ... body] = args;
    if (typeof(name) !== 'string') throw new TypeError("name");
    if (!(params instanceof Array)) throw new TypeError("params");
    if (AL.has_key_p(this.macros, name))
      throw new Error("macro " + name + " already defined");
    var fn = this.eval(["fn", params, ... body], env);
    this.macros.unshift([name, fn]);
    return name;
    break;
  case "do":
    return Evaluator.make_thunk_chain(args, x => self.eval(x, env));
    break;
  case "letrec":
    var new_bindings = Evaluator.slices(args[0], 2).map(function ([name,expr]) {
      if (typeof(name) !== 'string')
        new Error("name is not a name");
      return [name, null];
    });
    var i = 0;
    for (var [name, expr] of Evaluator.slices(args[0], 2)) {
      new_bindings[i][1] = this.eval(expr, new_bindings.concat(env));
      i++;
    }
    var body_env = new_bindings.concat(env);
    return args.slice(1).reduce((acc, expr) => self.eval(expr, body_env), null);
    break;
  case "getchar":
    this.syscall = ["getchar"];
    console.log("syscall start");
    return () => {
      console.log("thunk: " + this.syscallResult);
      return this.syscallResult;
    };
    break;
  default:
    var macro_func = AL.lookup(this.macros, name);
    if (macro_func) {
      var expansion = Evaluator.force(this.apply_function(macro_func, args));
      return this.eval(expansion, env);
    } else {
      return this.apply_function(this.eval(name, env), args.map(a => self.eval(a, env)));
    }
  }
};

Evaluator.prototype.eval = function(exp, env) {
  if (typeof(exp) === 'number') {
    return exp;
  } else if (typeof(exp) === 'string') {
    if (AL.has_key_p(env, exp))
      return AL.lookup(env, exp);
    else if (AL.has_key_p(this.global_env, exp))
      return AL.lookup(this.global_env, exp);
    else
      throw new Error("unbound name " + exp);
  } else if (exp instanceof Array) {
    if (exp.length === 0)
      return exp;
    else
      return this.eval_form(exp, env);
  } else {
    return exp;
  }
};

Evaluator.prototype.startEval = function (exp, env) {
  if (this.evaluating)
    throw new Error("already evaluating");
  this.value = this.eval(exp, env);
  this.evaluating = (typeof(this.value) == 'function');
};

Evaluator.prototype.step = function () {
  console.log("step");
  if (!this.evaluating)
    throw new Error("not evaluating");

  if (typeof(this.value) === 'function') {
    console.log("before", this.value);
    this.value = this.value();
    console.log("after", this.value);
  } else {
    console.log("not a function", this.value);
    throw TypeError('this.value is not a function');
  }
  this.evaluating = (typeof(this.value) == 'function');
};

var e = new Evaluator({});
if (e.eval(1,[]) !== 1) throw new Error();
if (e.eval(true,[]) !== true) throw new Error();
if (e.eval(false,[]) !== false) throw new Error();
if (e.eval(null,[]) !== null) throw new Error();
if (e.eval(undefined,[]) !== undefined) throw new Error();
if (e.eval("x",[["x",10]]) !== 10) throw new Error();
if (e.eval(["+",1,1],[]) !== 2) throw new Error();
// console.log( e.eval(["+",1,1], []) );

Evaluator.prototype.syscallEnd = function (value) {
  this.syscall = null;
  this.syscallResult = value;
  console.log("syscall end", this.syscallResult, this.value);
  this.evaluating = true;
};
