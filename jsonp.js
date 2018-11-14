'use strict';

function readCharacterLiteral(spec) {
  if (spec.length == 1) {
    return new Character(spec);
  } else {
    switch (spec) {
    case "space": return new Character(" ");
    case "newline": return new Character("\n");
    default:
      throw new Error("unknown character specification: " + spec);
    }
  }
}

// string → [type, value, string]
function readFromString(str) {
  var m;
  if (str === "") {
    return ["error", "empty string", str];
  } else if (m = (/^\.[^0-9A-Za-z]/).exec(str)) { // 適当すぎか。
    return ["dot", ".", str.slice(1)];
  } else if (m = (/^'/).exec(str)) {
    var [type, value, rest] = readFromString(str.slice(1));
    if (type === "sexp")
      return ["sexp", cons("quote", cons(value, null)), rest];
    else
      return [type, value, rest]; // error
  } else if (m = (/^#t/).exec(str)) {
    return ["sexp", true, str.slice(2)];
  } else if (m = (/^#f/).exec(str)) {
    return ["sexp", false, str.slice(2)];
  } else if (m = (/^\(/).exec(str)) {
    var res = null;
    var str = str.slice(1);
    while (true) {
      var [type, value, rest] = readFromString(str);
      if (type == "close-paren") {
        return ["sexp", res, rest];
      } else if (type == 'error' && value == 'empty string') {
        return ["error", 'unclosed left-parenthesis', rest];
      } else if (type == 'error') {
        return [type, value, rest];
      } else if (type == "dot") {
        str = rest;
        [type, value, rest] = readFromString(str);
        if (type !== "sexp")
          return ["error", "unexpected token: " + type, rest];

        var cdr = value;

        str = rest;
        [type, value, rest] = readFromString(str);
        if (type !== "close-paren") {
          console.log(value);
          return ["error", "close-paren expected but got: " + type, rest];
        }

        var lastcdr = res;
        while (lastcdr.second !== null)
          lastcdr = lastcdr.second; // go to last cdr
        lastcdr.second = cdr;
        return ["sexp", res, rest];
      } else {
        res = append(res, list(value));
        str = rest;
      }
    }
  } else if (m = (/^\)/).exec(str)) {
    return ["close-paren", ")", str.slice(1)];
  } else if (m = (/^;.*(\n|$)/).exec(str)) { // コメントを読み飛ばす。
    return readFromString(str.slice(m[0].length));
  } else if (m = (/^(-?[0-9]+\.[0-9]+)/).exec(str)) {
    return ["sexp", parseFloat(m[1]), str.slice(m[0].length)];
  } else if (m = (/^(-?[0-9]+)/).exec(str)) {
    return ["sexp", parseInt(m[1], 10), str.slice(m[0].length)];
  } else if (m = (/^#d(-?[0-9]+)/).exec(str)) {
    return ["sexp", parseInt(m[1], 10), str.slice(m[0].length)];
  } else if (m = (/^#x(-?[0-9a-fA-F]+)/).exec(str)) {
    return ["sexp", parseInt(m[1], 16), str.slice(m[0].length)];
  } else if (m = (/^#o(-?[0-7]+)/).exec(str)) {
    return ["sexp", parseInt(m[1], 8), str.slice(m[0].length)];
  } else if (m = (/^\s+/).exec(str)) {
    return readFromString(str.slice(m[0].length));
  } else if (m = (/^"([^"]*)"/).exec(str)) { // バックスラッシュエスケープ実装してない。
    return ["sexp", new MutableString(eval("\"" + m[1] + "\"")), str.slice(m[0].length)];
  } else if (m = (/^#\\(.[^()\s]*)/).exec(str)) {
    return ["sexp", readCharacterLiteral(m[1]), str.slice(m[0].length)];
  } else if (m = (/^[^\s\(\)]+/).exec(str)) {
    // 新しいSchemeではケースの正規化をしないようだから、小文字化は
    // 必要ないか？
    return ["sexp", m[0], str.slice(m[0].length)];
  } else {
    return ["error", 'parse error', str];
  }
}
// console.log(readFromString("(a)"));
// console.log(readFromString("(a . b)"));
// console.log(readFromString("(a b)"));

function code_to_sequence(code) {
  var [type, val, rest] = readFromString(code);
  if (type === "error") {
    if (val === "empty string") {
      return null;
    } else {
      throw new Error(val);
    }
  } else {
    return cons(val, code_to_sequence(rest));
  }
}

function isProperList(pair) {
  if (pair === null) {
    return true;
  } else if (!(pair instanceof Pair)) {
    return false;
  } else {
    return isProperList(pair.second);
  }
}

function inspect(val) {
  if (val === null) {
    return "()";
  } else if (val === true) {
    return "#t";
  } else if (val === false) {
    return "#f";
  } else if (val === undefined) {
    return "#<undef>";
  } else if (val instanceof Pair) {
    if (isProperList(val)) {
      var str = "(";
      while (val !== null) {
        if (str !== "(")
          str += " ";
        str += inspect(val.first);
        val = val.second;
      }
      str += ")";
      return str;
    } else {
      return "(" + inspect(val.first) + " . " + inspect(val.second) + ")";
    }
  } else if (val instanceof Array) {
    var str = "#(";
    for (var i = 0; i < val.length; i++) {
      if (i !== 0)
        str += " ";
      str += inspect(val[i]);
    }
    str += ")";
    return str;
  } else if (val instanceof MutableString) {
    return JSON.stringify(val.toString());
  } else {
    return "" + val; // stringify in the JavaScript way
  }
}

window.addEventListener('load', () => {
  var kbdBuffer = "";

  var print = function (val) {
    display(val);
    ttyOutputPort.writeChar("\n");
  };
  var display = function(val) {
    var str;
    if (val instanceof Character)
      str = val.value;
    else if (val instanceof MutableString)
      str = val.toString();
    else
      str = inspect(val);
    for (var ch of str)
      ttyOutputPort.writeChar(ch);
  };

  function dumpFrames(frame) {
    while (frame) {
      display("\t" + "in ");
      print(frame.name);
      frame = frame.parent;
    }
  }

  function isctrl(c) {
    var n = c.codePointAt(0);
    return (n <= 31);
  }

  var transmitter;
  var windowFocused = true;
  var interrupted = false;

  function updateBusyIndicator() {
    if (interrupted) {
      $('#indicator-busy').hide();
      $('#indicator-idle').show();
    } else {
      $('#indicator-busy').show();
      $('#indicator-idle').hide();
    }
  }

  transmitter = new Transmitter({
    write: function (str) {
      kbdBuffer += str;
    }
  });

  // force_redraw の場合は文字画面とオーバーレイ画面の両方が再描画される。
  // 何も文字バッファーに変更がなければ force_redraw は false。

  var ctrlJustPressed = false;
  var stickyCtrl = false;
  var ctrlLock = false;

  function switchStickyCtrl(flag) {
    if (flag) {
      $('#indicator-sticky').show();
      $('#indicator-no-sticky').hide();
      stickyCtrl = true;
    } else {
      $('#indicator-sticky').hide();
      $('#indicator-no-sticky').show();
      stickyCtrl = false;
    }
  }

  function switchCtrlLock(flag) {
    if (flag) {
      $('#indicator-lock').show();
      $('#indicator-no-lock').hide();
      ctrlLock = true;
    } else {
      $('#indicator-lock').hide();
      $('#indicator-no-lock').show();
      ctrlLock = false;
    }
  }

  $(document).keyup((e) => {
    if (e.key === "Control" && ctrlJustPressed) {
      if (ctrlLock) {
        switchCtrlLock(false);
      } else if (!stickyCtrl) {
        switchStickyCtrl(true);
      } else {
        switchCtrlLock(true);
        switchStickyCtrl(false);
      }
      ctrlJustPressed = false;
    }
  });

  $(document).keydown((e) => {
    if (e.key === "Control") {
      ctrlJustPressed = true;
      return;
    } else {
      ctrlJustPressed = false;
    }

    if (e.key === 'F12') // デベロッパーツールズ
      return;

    if (e.key === 'Pause') {
      e.preventDefault();
      interrupted = true;
      // updateBusyIndicator();
    }

    if (true) {
      e.preventDefault();

      var scrollAmount = receiver.rows;
      if (e.key === 'PageUp' && e.shiftKey) {
        receiver.scrollBack(scrollAmount);
        force_redraw = true;
      } else if (e.key === 'PageDown' && e.shiftKey){
        receiver.scrollBack(-scrollAmount);
        force_redraw = true;
      } else {
        if (transmitter) {
          if (stickyCtrl) {
            e.ctrlKey = true;
            switchStickyCtrl(false);
          }
          if (ctrlLock) {
            e.ctrlKey = true;
          }
          transmitter.typeIn(e);
        }
      }
    }
  });

  class TtyInputPort {
    isInputPort() { return true; }
    isOutputPort() { return false; }
    readChar() {
      if (!this.isCharReady())
        throw new Error("readChar: char not ready");

      var ch = kbdBuffer[0];
      // CR を LF に変換。
      if (ch === "\x0d")
        ch = "\x0a";
      kbdBuffer = kbdBuffer.slice(1);
      return ch;
    }
    peekChar() {
      if (!this.isCharReady())
        throw new Error("peekChar: char not ready");

      return kbdBuffer[0];
    }
    isCharReady() {
      return kbdBuffer.length > 0;
    }
  }
  var ttyInputPort = new TtyInputPort;

  class TtyOutputPort {
    isInputPort() { return false; }
    isOutputPort() { return true; }
    writeChar(ch) {
      if (ch === "\x0a") { // CR
        receiver.feed("\x0d\x0a"); // CR+LF
      } else {
        receiver.feed(ch);
      }
      force_redraw = true
    }
  }
  var ttyOutputPort = new TtyOutputPort;

  function eqv(a, b) {
    if (a instanceof Character && b instanceof Character) {
      if (a.value === b.value) 
        return true;
      else
        return false;
    } else {
      return a === b;
    }
  }

  function equal(a, b) {
    if (a instanceof Pair && b instanceof Pair) {
      return equal(a.first, b.first) && equal(a.second, b.second);
    } else if (a instanceof Array && b instanceof Array) {
      if (a.length !== b.length) return false;
      for (var i = 0; i < a.length; i++) {
        if (!equal(a[i], b[i]))
          return false;
      }
      return true;
    } else if (a instanceof MutableString && b instanceof MutableString) {
      return a.toString() === b.toString(); // ズルする。
    } else {
      return eqv(a, b);
    }
  }

  function makeInitenv(vm) {
    var initenv = [
      ["current-input-port", function () {
        return ttyInputPort;
      }],
      ["current-output-port", function () {
        return ttyOutputPort;
      }],
      ["input-port?", function (port) {
        return port.isInputPort();
      }],
      ["char-ready?", function (port) {
        port = port || ttyInputPort;
        return port.isCharReady();
      }],
      ["read-char-nonblock", function (port) {
        port = port || ttyInputPort;
        if (port.isCharReady()) {
          return new Character(port.readChar());
        } else {
          return null;
        }
      }],
      ["write-char", function () {
        var ch = ""+arguments[0];
        var port = arguments[1] || ttyOutputPort;

        port.writeChar(ch);
        return "ok";
      }],
      ["newline", function (port) {
        port = port || ttyOutputPort;

        port.writeChar("\x0d");
        port.writeChar("\x0a");
        return "ok";
      }],
      ["car", function(pair) { return pair.first;  }],
      ["cdr", function(pair) { return pair.second;  }],
      ["p", function(val) {
        var str = (""+val) + "\n";
        receiver.feed(str.replace(/\n/, "\r\n"));
        force_redraw = true
      }],
      ["print", print],
      ["display", display],
      ["write", function(obj) { display(inspect(obj)); }],
      ["+", function() {
        var sum = 0;
        for (var elt of arguments) { sum += elt; }
        return sum;
      }],
      ["str", function() {
        var sum = "";
        for (var elt of arguments) { sum += elt; }
        return new MutableString(sum);
      }],
      ["getch", function() {
        if (kbdBuffer.length > 0) {
          var ch = kbdBuffer[0];
          kbdBuffer = kbdBuffer.slice(1);
          return new Character(ch);
        } else {
          return null;
        }
      }],
      ["null?", function(v) {
        return (v === null);
      }],
      ["random", function(n) {
        return Math.floor(Math.random() * n);
      }],
      ["eq?", function(a, b) {
        return a === b;
      }],
      ["eqv?", eqv],
      ["equal?", equal],
      ["read-from-string", function(str) {
        var res = readFromString(""+str);
        console.log(res);
        return res[1];
      }],
      ["undefined", function(str) {
        return undefined;
      }],
      ["spawn", spawnProgram],
      ["exit", function () {
        vms.pop();
      }],
      ["list", list],
      ["sys-list-files", function () {
        return list.apply(null, Object.keys($ASSETS).map(s => new MutableString(s)));
      }],
      ["sys-get-file-contents", function (filename) {
        return new MutableString($ASSETS[filename]);
      }],
      ["sys-put-file-contents", function (filename, contents) {
        $ASSETS[filename] = contents.toString();
        return "ok";
      }],
      ["split", function (exp, str) {
        var r = new RegExp(exp);
        return list.apply(null, str.toString().split(r).map(s => new MutableString(s)));
      }],
      ["cons", cons],
      ["append", append],
      ["symbol?", function (v) { return typeof(v) === "string"; }],
      ["symbol->string", function (sym) { return new MutableString(sym); }],
      ["string?", function (v) { return v instanceof MutableString; }],
      ["string=?", function (a,b) {
        if (!(a instanceof MutableString)) { throw new Error("string=?: string required: " + inspect(a)); }
        if (!(b instanceof MutableString)) { throw new Error("string=?: string required: " + inspect(b)); }
        return (a.toString() === b.toString());
      }],
      ["string-length", function(s) { return s.toString().length; }],
      ["substring", function(s, start, end) {
        return new MutableString(s.toString().substr(start, end));
      }],
      ["string-append", function() {
        return new MutableString(
          Array.from(arguments).map(ms => {
            if (!(ms instanceof MutableString))
              throw new Error("string-append: mutable string required");
            return ms.toString()
          }).join("")
        );
      }],
      ["wcwidth", function(c) { return wcwidth(c.value); }],
      ["string-ref", function (s, k) {
        return s.buffer[k];
      }],
      ["eof-object", function() { return new EndOfFile; }],
      ["eof-object?", function(v) { return v instanceof EndOfFile; }],
      ["negate", function (v) { return -v; }],
      ["number->string", function (n) { return new MutableString(""+n); }],
      ["<", function (a, b) { return a < b; }],
      [">", function (a, b) { return a > b; }],
      ["<=", function (a, b) { return a <= b; }],
      [">=", function (a, b) { return a >= b; }],
      ["=", function (a, b) { return a === b; }],
      ["string->symbol", function(s) { return s.toString(); }],
      ["vector?",function(vector){ return vector instanceof Array;}],
      ["make-vector",function(k, fill){ return new Array(k).fill(fill); }],
      ["vector",function(){return Array.from(arguments);}],
      ["vector-length",function(vector){return vector.length;}],
      ["vector-ref",function(vector, k){return vector[k];}],
      ["vector-set!",function(vector, k, obj){vector[k] = obj; return "ok"}],
      ["vector->list",function(vector){return list.apply(null, vector);}],
      ["list->vector",function(ls){
        var res = [];
        while (ls !== null) {
          res.push(ls.first);
          ls = ls.second;
        }
        return res;
      }],
      ["vector-fill!",function(vector, fill){vector.fill(fill); return "ok";}],
      ["vector-splice!", function() {
        var vector = arguments[0];
        var args = Array.from(arguments).slice(1);
        vector.splice.apply(vector, args);
        return "ok";
      }],
      ["error", function(message){ throw new Error(message); }],
      ["pair?", function(val){ return val instanceof Pair; }],
      ["string-take", function(str, n) { return new MutableString(str.toString().slice(0, n)); }],
      ["char->integer", function(c) {
        if (!(c instanceof Character)) throw new Error("char->integer: character required");
        return c.value.codePointAt(0);
      }],
      ["integer->char", function(n) { return new Character(String.fromCodePoint(n)); }],
      ["sys-time", function() { return (+new Date) / 1000; }],
      ["list->string", function(ls) {
        return new MutableString(array(ls).map(c => c.value).join(""));
      }],
      ["string->number", function (str) { return +str; }],
      ["char?", function(v) { return v instanceof Character; }],
      ["char=?", function(a,b) {
        if (!(a instanceof Character)) throw new Error("char=?: character required");
        if (!(b instanceof Character)) throw new Error("char=?: character required");
        return a.value == b.value;
      }],
      ["string", function() {
        return new MutableString(
          Array.from(arguments).map(c => c.value).join("")
        );
      }],
    ];
    return initenv;
  }

  function loadProgram(filename, argv) {
    var vm = new VM()
    var initenv = makeInitenv(vm);

    var env = new Frame()
    env.name = 'top level';
    for (var [key, value] of initenv) {
      env.define_variable(key, value);
    }
    env.define_variable("*argv*", argv);

    vm.env = env;
    vm.interaction_env = env;

    var seq = code_to_sequence($ASSETS["startup.scm"]);
    vm.exp = cons("begin", seq);

    vm.pc = vm.eval_dispatch;
    while (vm.pc)
      vm.step();

    var code = code_to_sequence($ASSETS[filename]);
    vm.exp = cons("begin", code);
    vm.pc = vm.eval_dispatch;

    return vm;
  }
  var res;

  var vms = [];

  function spawnProgram(filename) {
    if ($ASSETS[filename] === undefined) {
      return "no-such-file";
    } else {
      var argv = list.apply(null, Array.from(arguments).slice(1));
      vms.push(loadProgram(filename, argv));
      return "ok";
    }
  }

  spawnProgram("init.scm");

  var ALLOCATED_TIME_MSEC = 8;

  function loop() {
    var start = +new Date;
    var ninsts = 0;

    while (vms.length > 0) {
      var vm = vms[vms.length - 1];
      if (!vm.pc) {
        vms.pop();
      } else if (interrupted) {
        print("Interrupt");
        vms.pop();
        interrupted = false;
      } else {
        if (vm.syscall) { // システムコールの終了待ち。
          break;
        }

        try {
          vm.step();
          if (vm.syscall !== null) {
            if (vm.syscall[0].name == "sleep") {
              setTimeout(() => {
                vm.syscall = null;
                vm.pc = vm.continue;
                vm.val = "ok";
              }, 1000 * vm.syscall[1]);
            } else {
              vm.syscall = null;
              vm.pc = vm.continue;
              vm.val = "error-unknown-syscall";
            }
            break;
          }
          ninsts++;
        } catch (e) {
          console.log(e);
          var str = inspect(e);
          for (var ch of str)
            ttyOutputPort.writeChar(ch);
          ttyOutputPort.writeChar("\n");
          dumpFrames(vm.env);
          if (vm.env.has_variable("*resume-from-error*")) {
            var c = vm.env.lookup_variable("*resume-from-error*");
            vm.restore_from_continuation(c);
          } else {
            // terminate this process.
            vms.pop();
          }
        }
      }

      if ((+new Date) - start >= ALLOCATED_TIME_MSEC)
        break;
    }
    updateInstructionCount(ninsts);

    window.requestAnimationFrame(loop);
  }
  window.requestAnimationFrame(loop);

  var instructionCount = null;
  var INST_AVERAGE_FACTOR = 0.999;
  var initialSamples = [];
  function updateInstructionCount(n) {
    var ips = n * 60
    if (initialSamples && initialSamples.length < 180) {
      initialSamples.push(ips);
    } else if (initialSamples && initialSamples.length === 180) {
      instructionCount = initialSamples.reduce((a, b) => a + b) / 180;
      initialSamples = null;
    } else {
      instructionCount = (instructionCount * INST_AVERAGE_FACTOR) + (1 - INST_AVERAGE_FACTOR) * ips;
    }
    if (instructionCount !== null) {
      $('#instructions').text(`${Math.round(instructionCount/1000)} KIPS`);
    } else {
      $('#instructions').text("calculating...");
    }
  }

  window.onblur = function (e) {
    windowFocused = false;
    force_redraw = true;
  };

  window.onfocus = function (e) {
    windowFocused = true;
    force_redraw = true;
  };

  updateBusyIndicator();
});
