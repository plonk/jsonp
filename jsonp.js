'use strict';

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
      return ["sexp", cons(intern("quote"), cons(value, null)), rest];
    else
      return [type, value, rest]; // error
  } else if (m = (/^#t/).exec(str)) {
    return ["sexp", true, str.slice(2)];
  } else if (m = (/^#f/).exec(str)) {
    return ["sexp", false, str.slice(2)];
  } else if (m = (/^\(/).exec(str)) {
    var res = [];
    var str = str.slice(1);
    while (true) {
      var [type, value, rest] = readFromString(str);
      if (type == "close-paren") {
        if (res.length > 0)
          return ["sexp", list.apply(null, res), rest];
        else
          return ["sexp", null, rest];
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

        value = arrayToImproperList(res, cdr);
        return ["sexp", value, rest];
      } else {
        res.push(value);
        str = rest;
      }
    }
  } else if (m = (/^\)/).exec(str)) {
    return ["close-paren", ")", str.slice(1)];
  } else if (m = (/^;.*(\n|$)/).exec(str)) { // コメントを読み飛ばす。
    return readFromString(str.slice(m[0].length));
  } else if (m = (/^[0-9]+\.[0-9]+/).exec(str)) {
    return ["sexp", parseFloat(m[0]), str.slice(m[0].length)];
  } else if (m = (/^[0-9]+/).exec(str)) {
    return ["sexp", parseInt(m[0]), str.slice(m[0].length)];
  } else if (m = (/^\s+/).exec(str)) {
    return readFromString(str.slice(m[0].length));
  } else if (m = (/^"([^"]*)"/).exec(str)) { // バックスラッシュエスケープ実装してない。
    return ["sexp", eval("\"" + m[1] + "\""), str.slice(m[0].length)];
  } else if (m = (/^[^\s\(\)]+/).exec(str)) {
    // 新しいSchemeではケースの正規化をしないようだから、小文字化は
    // 必要ないか？
    return ["sexp", intern(m[0]), str.slice(m[0].length)];
  } else {
    return ["error", 'parse error', str];
  }
}

window.onload = () => {
  var beepAudio = new Audio('beep.wav');
  var kbdBuffer = "";

  function isctrl(c) {
    var n = c.codePointAt(0);
    return (n <= 31);
  }

  var receiver = new Receiver(80, 24, {
    cursorKeyMode: function (mode) {
      transmitter.cursorKeyMode = mode;
    },
  });
  var transmitter;
  var windowFocused = true;
  var fullRedraw = false;
  var renderer = new Renderer(receiver);
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

  // fullRedraw の場合は文字画面とオーバーレイ画面の両方が再描画される。
  // 何も文字バッファーに変更がなければ fullRedraw は false。
  var render = function () {
    renderer.render(fullRedraw, windowFocused)
    fullRedraw = false;
    window.requestAnimationFrame(render)
  };
  window.requestAnimationFrame(render)

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
      interrupted = !interrupted;
      updateBusyIndicator();
    }

    if (true) {
      e.preventDefault();

      var scrollAmount = receiver.rows;
      if (e.key === 'PageUp' && e.shiftKey) {
        receiver.scrollBack(scrollAmount);
      } else if (e.key === 'PageDown' && e.shiftKey){
        receiver.scrollBack(-scrollAmount);
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
      if (ch === "\x0d")
        ch = "\x0a";
      kbdBuffer = kbdBuffer.slice(2);
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
      fullRedraw = true
    }
  }
  var ttyOutputPort = new TtyOutputPort;

  var initenv = [
    [intern("current-input-port"), function () {
      return ttyInputPort;
    }],
    [intern("current-output-port"), function () {
      return ttyOutputPort;
    }],
    [intern("input-port?"), function (port) {
      return port.isInputPort();
    }],
    [intern("char-ready?"), function (port) {
      port = port || ttyInputPort;
      return port.isCharReady();
    }],
    [intern("read-char-nonblock"), function (port) {
      port = port || ttyInputPort;
      if (port.isCharReady()) {
        return port.readChar();
      } else {
        return null;
      }
    }],
    [intern("write-char"), function () {
      var ch = arguments[0];
      var port = arguments[1] || ttyOutputPort;

      port.writeChar(ch);
      return intern("ok");
    }],
    [intern("newline"), function (port) {
      port = port || ttyOutputPort;

      port.writeChar("\x0d");
      port.writeChar("\x0a");
      return intern("ok");
    }],
    [intern("car"), function(pair) { return pair.first;  }],
    [intern("cdr"), function(pair) { return pair.second;  }],
    [intern("p"), function(val) {
      var str = (""+val) + "\n";
      receiver.feed(str.replace(/\n/, "\r\n"));
      fullRedraw = true
    }],
    [intern("print"), function(val) {
      console.log(val);
      var str = (""+val);
      receiver.feed(str.replace(/\n/, "\r\n"));
      fullRedraw = true
    }],
    [intern("display"), function(val) {
      var str = (""+val);
      for (var ch of str)
        ttyOutputPort.writeChar(ch);
    }],
    [intern("+"), function() {
      var sum = 0;
      for (var elt of arguments) { sum += elt; }
      return sum;
    }],
    [intern("str"), function() {
      var sum = "";
      for (var elt of arguments) { sum += elt; }
      return sum;
    }],
    [intern("getch"), function() {
      if (kbdBuffer.length > 0) {
        var res = kbdBuffer[0];
        kbdBuffer = kbdBuffer.slice(1);
        return res;
      } else {
        return null;
      }
    }],
    [intern("null?"), function(v) {
      return (v === null);
    }],
    [intern("random"), function(n) {
      return Math.floor(Math.random() * n);
    }],
    [intern("eq"), function(a, b) {
      return a === b;
    }],
    [intern("read-from-string"), function(str) {
      var res = readFromString(str);
      console.log(res);
      return res[1];
    }],
  ];
  // (begin
  //   (define f (lambda (x) (p x) (f (+ 1 x))))
  //   (f 0))
  // var vm = make_vm(list(intern("p"), list(intern("+"), 123, 987)), initenv);
  // var res = readFromString("(begin" +
  //                          "(define f (lambda (x) (print \"\\x1b[0;39;46mHOGE\\x1b[0m\") (print x) (f (+ 1 x))))" +
  //                          "(f 0))")
  // var res = readFromString("(progn "+
  //                          "(define f (lambda () (print (str \"\\x1b[38;5;\" (+ 232 (random 24)) \";48;5;\" (+ 232 (random 24)) \"m\")) (print 'A) (print \"\\x1b\[0m\") (f)))" +
  //                          ""+
  //                          "(f))")
  // var code = "(begin " +
  //            "  (define read-line " +
  //            "    (lambda () " +
  //            "      (define line \"\") " +
  //            "      (define iter " +
  //            "        (lambda () " +
  //            "          (define ch (getch)) " +
  //            "          (if (null? ch) (begin (iter)) (if (eq ch \"\\x0d\") " +
  //            "              (begin (print \"\\x0d\\x0a\") line) " +
  //            "            (begin " +
  //            "              (print ch) " + // エコーバック
  //            "              (set! line (str line ch)) " +
  //            "              (iter)))))) " +
  //            "      (iter))) " +
  //            "   (print (read-line))) ";
  var code = "(begin" +
             "  (define read-char (lambda (port)" +
             "       (if (char-ready? port)" +
             "           (begin (read-char-nonblock port))" +
             "           (begin (read-char port)))))" +
             "  (define read-line (lambda (port)" +
             "    (define ch (read-char port))" +
             "    (write-char ch (current-output-port))" +
             "    (if (eq ch \"\\x0a\")" +
             "       \"\"" +
             "       (str ch (read-line port)))))" +
             "  (define iter" +
             "    (lambda ()" +
             "      (display (read-from-string (read-line (current-input-port))))" +
             "      (newline)" +
             "      (iter)))" +
             "  (iter))";
  var res = readFromString(code);

  var vm = make_vm(res[1], initenv);

  function loop() {
    // 16ms VMを動かす。単純なループカウントで上限を設定して、アダプティ
    // ブに実時間に合わせて回数を調整したほうが効率的な気がする。
    var start = +new Date;
    while (!interrupted && vm.pc && (+new Date) - start < 16) {
      vm.step();
    }

    if (vm.pc) {
      window.requestAnimationFrame(loop);
    } else {
      // 終了(!)
      interrupted = true;
      updateBusyIndicator();
    }
  }
  window.requestAnimationFrame(loop);

  window.onblur = function (e) {
    windowFocused = false;
    fullRedraw = true;
  };

  window.onfocus = function (e) {
    windowFocused = true;
    fullRedraw = true;
  };

  updateBusyIndicator();
};
