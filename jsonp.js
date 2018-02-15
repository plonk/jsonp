'use strict';

window.onload = () => {
  var beepAudio = new Audio('beep.wav');
  var modalShown = false;

  function showInputModal() {
    $('#inputModal').modal('show');
  }

  function showAboutModal() {
    $('#aboutModal').modal('show');
  }

  function enterText() {
    var text = $('#text')[0].value;
    if (text === '') return;

    transmitter.paste(text);
    $('#inputModal').modal('hide');
  }

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
  var evaluator = new Evaluator({
    outfn: function (str) {
      receiver.feed("X:"+str.replace(/\n/g, "\r\n"));
      fullRedraw = true;
    }
  });
  var renderer = new Renderer(receiver);
  var keyboardBuffer = "";
  var interrupted = false;

  transmitter = new Transmitter({
    write: function (str) {
      console.log('transmitter write');
      keyboardBuffer += str;
      receiver.feed("Y:"+str);
      fullRedraw = true;
      if (evaluator.syscall) {
        handleSyscall(evaluator);
      }
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

  function handleSyscall(evaluator) {
    if (!evaluator.syscall) { throw new Error("not syscall'ed"); }

    if (evaluator.syscall[0] === "getchar") {
      console.log("getchar kbdbuf");
      console.dir(keyboardBuffer);
      if (keyboardBuffer.length > 0) {
        evaluator.syscallEnd(keyboardBuffer[keyboardBuffer.length-1]);
        console.log(keyboardBuffer[keyboardBuffer.length-1]);
        console.log(evaluator);
        keyboardBuffer = keyboardBuffer.slice(0, keyboardBuffer.length-1);
        setTimeout(loop, 0); // resume
        return;
      } else {
        console.log("getchar blocking");
      }
    } else {
      throw new Error("unknown syscall " + evaluator.syscall[0]);
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

    if (!modalShown) {
      e.preventDefault();

      var scrollAmount = receiver.rows;
      if (e.key === 'PageUp' && e.shiftKey) {
        receiver.scrollBack(scrollAmount);
        //renderScreen();
      } else if (e.key === 'PageDown' && e.shiftKey){
        receiver.scrollBack(-scrollAmount);
        //renderScreen();
      } else {
        if (transmitter) {
          if (stickyCtrl) {
            e.ctrlKey = true;
            switchStickyCtrl(false);
          }
          if (ctrlLock) {
            e.ctrlKey = true;
          }
          console.log("type in");
          transmitter.typeIn(e);
        }
      }
    }
  });

  $('#input-button').on('click', function () {
    showInputModal();
  });

  $('#connect-button').on('click', function () {
    setup();
  });

  $('#inputModal').on('shown.bs.modal', function () {
    modalShown = true;
    $('#text').focus().val('');
  });

  $('#inputModal').on('hidden.bs.modal', function () {
    modalShown = false;
  });

  $('#aboutModal').on('shown.bs.modal', function () {
    modalShown = true;
  });

  $('#aboutModal').on('hidden.bs.modal', function () {
    modalShown = false;
  });

  $('#modalInputButton').on('click', enterText);

  $('#version').html('0.0.2');

  $('#progn').on('focus', function () {
    modalShown = true;
  }).on('blue', function () {
    modalShown = false;
  });

  function loop() {
    if (interrupted) {
      // TOOD: evaluator.interrupt()
      interrupted = false;
      receiver.feed("Interrupted" + "\r\n");
      evaluator.value = null;
      evaluator.evaluating = false;
      fullRedraw = true;
      $('#indicator-busy').hide();
      $('#indicator-idle').show();
      return;
    }

    if (evaluator.syscall) {
      handleSyscall(evaluator);
      return;
    }

    if (!evaluator.evaluating) {
      console.log("eval done");
      $('#indicator-busy').hide();
      $('#indicator-idle').show();
      try {
        receiver.feed("A:" + JSON.stringify(evaluator.value) + "\r\n");
      } catch (e) {
        receiver.feed("B:" + e.message + "\r\n");
      }
      fullRedraw = true;
    } else {
      var t0 = +new Date();
      do {
        evaluator.step();
        if (evaluator.syscall) {
          handleSyscall(evaluator);
          return;
        }
      } while (evaluator.evaluating && +new Date() - t0 < 16);
      setTimeout(loop, 0);
    }
  }

  $('#prognSendButton').on('click', function () {
    var code = $('#progn')[0].value;
    var exp;

    try {
      exp = JSON.parse('["do", ' + code + ']')
    } catch(e) {
      alert(e.message);
      return;
    }

    if (evaluator.evaluating) {
      alert("Error: Runtime busy.");
      return;
    }

    evaluator.startEval(exp, []);
    $('#indicator-busy').show();
    $('#indicator-idle').hide();

    setTimeout(loop, 0);
  });

  window.onblur = function (e) {
    windowFocused = false;
    fullRedraw = true;
  };

  window.onfocus = function (e) {
    windowFocused = true;
    fullRedraw = true;
  };
};
