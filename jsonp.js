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

// console.log(readFromString("(p x)"));
  // (begin
  //   (define f (lambda (x) (p x) (f (+ 1 x))))
  //   (f 0))

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
  // var evaluator = new Evaluator({
  //   outfn: function (str) {
  //     receiver.feed(str.replace(/\n/, "\r\n"));
  //   },
  // });
  var renderer = new Renderer(receiver);
  var interrupted = false;

  transmitter = new Transmitter({
    write: function (str) {
      kbdBuffer += str;
    }
  });
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
      interrupted = true;
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

  var initenv = [
    [intern("p"), function(val) {
      var str = (""+val) + "\n";
      receiver.feed(str.replace(/\n/, "\r\n"));
      fullRedraw = true
    }],
    [intern("print"), function(val) {
      var str = (""+val);
      receiver.feed(str.replace(/\n/, "\r\n"));
      fullRedraw = true
    }],
    [intern("+"), function() {
      var sum = 0;
      for (var elt of arguments) { sum += elt; }
      return sum;
    }],
  ];
  // (begin
  //   (define f (lambda (x) (p x) (f (+ 1 x))))
  //   (f 0))
  // var vm = make_vm(list(intern("p"), list(intern("+"), 123, 987)), initenv);
  var res = readFromString("(begin" +
                           "(define f (lambda (x) (print \"\\x1b[0;39;46mHOGE\\x1b[0m\") (print x) (f (+ 1 x))))" +
                           "(f 0))")
  var vm = make_vm(res[1], initenv);

  function loop() {
    var start = +new Date;
    while (vm.pc && (+new Date) - start < 16) {
      vm.step();
    }

    if (vm.pc) {
      window.requestAnimationFrame(loop);
    } else {
      // 終了(!)
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
};
