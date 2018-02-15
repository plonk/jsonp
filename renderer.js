'use strict';

// var pty = require('pty');
// var {ipcRenderer, remote, clipboard} = require('electron')
// var {Receiver}    = require('./receiver')
// var {Transmitter} = require('./transmitter');
// var {orElse, ord, chr, escapeHtml, padLeft, setUnion} = require('./util');


// Receiver の状態を描画する。ブロック要素 #screen-outer と、キャンバ
// ス #bottom-layer #top-layer を必要とする。
function Renderer(receiver) {
  var brailleKanaMode;

  var COLORS = [
    "rgb(0,0,0)",
    "rgb(194,54,33)",
    "rgb(37,188,36)",
    "rgb(173,173,39)",
    "rgb(73,46,225)",
    "rgb(211,56,211)",
    "rgb(51,187,200)",
    "rgb(203,204,205)",
    "rgb(129,131,131)",
    "rgb(252,57,31)",
    "rgb(49,231,34)",
    "rgb(234,236,35)",
    "rgb(88,51,255)",
    "rgb(249,53,248)",
    "rgb(20,240,240)",
    "rgb(233,235,235)",
  ];

  for (var r = 0; r <= 5; r++)
    for (var g = 0; g <= 5; g++)
      for (var b = 0; b <= 5; b++)
        COLORS.push("rgb(" +
                    Math.round(r*255/5) + "," +
                    Math.round(g*255/5) + "," +
                    Math.round(b*255/5) + ")");
  // グレースケール。
  for (var i = 0; i < 24; i++) {
    var intensity = 8 + i*10;
    COLORS.push("rgb(" + intensity + "," + intensity + "," + intensity + ")");
  }

  // -----------------
  var fontSpec = '16px monospace';
  var ctx = document.getElementById('bottom-layer').getContext('2d');
  ctx.font = fontSpec;
  var ctx2 = document.getElementById('top-layer').getContext('2d');
  var letterWidthInPixels = Math.round(ctx.measureText("m").width);
  var kanjiWidthInPixels  = Math.round(ctx.measureText("漢").width);
  var fontHeight = getTextHeight(ctx.font);
  fontHeight.height = Math.round(fontHeight.height);
  var frame = 0;
  var lastStaticRedraw = 0;

  $('#screen-outer').width(letterWidthInPixels * receiver.columns);
  $('#screen-outer').height(fontHeight.height * receiver.rows);
  $('#bottom-layer')[0].width = letterWidthInPixels * receiver.columns;
  $('#bottom-layer')[0].height = fontHeight.height * receiver.rows;
  $('#top-layer')[0].width = letterWidthInPixels * receiver.columns;
  $('#top-layer')[0].height = fontHeight.height * receiver.rows;

  // ひええ…。動的メソッド定義。
  this.screenCoordsToCellCoords = function(x, y) {
    return [Math.floor(x / letterWidthInPixels),
            Math.floor(y / fontHeight.height)];
  };

  // サイズ変更でキャンバスの状態が失われるので、フォントを設定しな
  // おす。
  ctx.font = fontSpec;
  ctx2.font = fontSpec;

  this.render = function(force_redraw, window_focused) {
    if (force_redraw) {
      this.renderScreenStatics(ctx, frame, letterWidthInPixels, kanjiWidthInPixels, fontHeight);
      lastStaticRedraw = frame;
      this.renderScreenDynamics(ctx2, frame, lastStaticRedraw, letterWidthInPixels, kanjiWidthInPixels, fontHeight, true, window_focused);
    } else {
      this.renderScreenDynamics(ctx2, frame, lastStaticRedraw, letterWidthInPixels, kanjiWidthInPixels, fontHeight, false, window_focused);
    }
    frame++;
  };

  this.setBrailleKana = function (flag) {
    brailleKanaMode = flag;
  };

  // -----------------

  function getTextHeight(font) {
    var text = $('<span>Hg</span>').css({ 'font': font });
    var block = $('<div style="display: inline-block; width: 1px; height: 0px;"></div>');

    var div = $('<div></div>');
    div.append(text, block);


    var body = $('body');
    body.append(div);

    try {

      var result = {};

      block.css({ verticalAlign: 'baseline' });
      result.ascent = block.offset().top - text.offset().top;

      block.css({ verticalAlign: 'bottom' });
      result.height = block.offset().top - text.offset().top;

      result.descent = result.height - result.ascent;

    } finally {
      div.remove();
    }

    return result;
  }

  function setRowClipAndTransform(ctx, y, fontHeight, halfWidthInPixels, type) {
    switch (type) {
    case 'double-width':
      ctx.scale(2,1);
      break;
    case 'top-half':
      ctx.beginPath();
      ctx.rect(0, y*fontHeight, halfWidthInPixels*receiver.columns, fontHeight);
      ctx.clip();
      ctx.translate(0, -y*fontHeight);
      ctx.scale(2,2);
      break;
    case 'bottom-half':
      ctx.beginPath();
      ctx.rect(0, y*fontHeight, halfWidthInPixels*receiver.columns, fontHeight);
      ctx.clip();
      ctx.translate(0, -y*fontHeight);
      ctx.scale(2,2);

      ctx.translate(0, -fontHeight/2);
      break;
    }
  }

  function colorStyles(attrs, defaultBackgroundColorIndex) {
    var bg;
    var fg;

    if (attrs.backgroundColorRGB) {
      var rgb = attrs.backgroundColorRGB;
      bg = "rgb("+rgb[0]+","+rgb[1]+","+rgb[2]+")";
    } else {
      bg = COLORS[attrs.backgroundColor !== null ? attrs.backgroundColor : defaultBackgroundColorIndex];
    }
    if (attrs.textColorRGB) {
      var rgb = attrs.textColorRGB;
      fg = "rgb("+rgb[0]+","+rgb[1]+","+rgb[2]+")";
    } else {
      var fgIndex = attrs.textColor !== null ? attrs.textColor : receiver.getDefaultTextColor();
      if (attrs.bold)
        fgIndex += 8;
      fg = COLORS[fgIndex];
    }

    if (attrs.reverseVideo) {
      return [bg, fg];
    } else {
      return [fg, bg];
    }
  }

  this.renderScreenStatics = function(ctx, frame, halfWidth, doubleWidth, metrics) {
    var defaultBackgroundColorIndex = (receiver.reverseScreenMode) ? 7 : 0;
    var yoffset = Math.round((metrics.height - metrics.ascent)/2);

    function renderRow(y) {
      ctx.save();
      setRowClipAndTransform(ctx, y, metrics.height, halfWidth, receiver.buffer.getLine(y).getType());

      for (var x  = 0; x < receiver.columns; x++) {
        var cell = receiver.buffer.getCellAt(y, x);
        var char = cell.character;
        var attrs = cell.attrs;
        var width = wcwidth(char);
        var [fg, bg] = colorStyles(attrs, defaultBackgroundColorIndex);

        ctx.fillStyle = bg;
        ctx.fillRect(x * halfWidth, y * metrics.height,
                     halfWidth * width, metrics.height);

        if (!attrs.blink) {
          renderCharacter(ctx, x, y, cell, fg, halfWidth, doubleWidth, metrics);
        }

        if (width == 2)
          x++;
      }

      ctx.restore();
    }

    ctx.clearRect(0, 0, halfWidth * receiver.columns, metrics.height * receiver.rows);

    for (var y = 0; y < receiver.rows; y++) {
      renderRow(y);
    }
  }

  function isBlockElement(char) {
    return !!blockElementMatrix(char);
  }

  function blockElementMatrix(char) {
    if (char === "▖") return [0, 0, 1, 0];
    if (char === "▗") return [0, 0, 0, 1];
    if (char === "▘") return [1, 0, 0, 0];
    if (char === "▙") return [1, 0, 1, 1];
    if (char === "▚") return [1, 0, 0, 1];
    if (char === "▛") return [1, 1, 1, 0];
    if (char === "▜") return [1, 1, 0, 1];
    if (char === "▝") return [0, 1, 0, 0];
    if (char === "▞") return [0, 1, 1, 0];
    if (char === "▟") return [0, 1, 1, 1];
    if (char === "▌") return [1, 0, 1, 0];
    if (char === "▐") return [0, 1, 0, 1];
    if (char === "▄") return [0, 0, 1, 1];
    if (char === "▀") return [1, 1, 0, 0];
    if (char === "█") return [1, 1, 1, 1];
  }

  var BRAILLE_KANA_TABLE ={
    "⠁": "あ",
    "⠃": "い",
    "⠉": "う",
    "⠋": "え",
    "⠊": "お",
    "⠡": "か",
    "⠣": "き",
    "⠩": "く",
    "⠫": "け",
    "⠪": "こ",
    "⠱": "さ",
    "⠳": "し",
    "⠹": "す",
    "⠻": "せ",
    "⠺": "そ",
    "⠕": "た",
    "⠗": "ち",
    "⠝": "つ",
    "⠟": "て",
    "⠞": "と",
    "⠅": "な",
    "⠇": "に",
    "⠍": "ぬ",
    "⠏": "ね",
    "⠎": "の",
    "⠥": "は",
    "⠧": "ひ",
    "⠭": "ふ",
    "⠯": "へ",
    "⠮": "ほ",
    "⠵": "ま",
    "⠷": "み",
    "⠽": "む",
    "⠿": "め",
    "⠾": "も",
    "⠌": "や",
    "⠬": "ゆ",
    "⠜": "よ",
    "⠑": "ら",
    "⠓": "り",
    "⠙": "る",
    "⠛": "れ",
    "⠚": "ろ",
    "⠄": "わ",
    "⠆": "ゐ",
    "⠖": "ゑ",
    "⠔": "を",
    "⠴": "ん",
    "⠂": "っ", //促音
    "⠒": "ー",
    "⠰": "、",
    "⠲": "。",
    "⠢": "？",
    "⠖": "！",
    "⠐": "゛", //濁音
    "⠈": "拗", //拗音
    "⠠": "゜", //半濁音
    "⠼": "数", //数符
    "⠘": "濁拗",
    "⠨": "半拗",
  };

  function renderCharacter(ctx, x, y, cell, fgStyle, halfWidth, doubleWidth, metrics) {
    var char;
    var width = wcwidth(cell.character);
    if (brailleKanaMode && isBraille(cell.character)) {
      char = BRAILLE_KANA_TABLE[cell.character] || cell.character;
    } else {
      char = cell.character;
    }

    ctx.fillStyle = fgStyle;

    if (width === 1 && isBlockElement(char)) {
      var [tl, tr, bl, br] = blockElementMatrix(char);
      var h1 = Math.ceil(metrics.height/2);
      var h2 = Math.floor(metrics.height - h1);
      if (tl)
        ctx.fillRect(x*halfWidth, y * metrics.height,
                     halfWidth/2, h1);
      if (tr)
        ctx.fillRect(x*halfWidth + halfWidth/2, y * metrics.height,
                     halfWidth/2, h1);
      if (bl)
        ctx.fillRect(x*halfWidth, y * metrics.height +h1,
                     halfWidth/2, h2);
      if (br)
        ctx.fillRect(x*halfWidth + halfWidth/2, y * metrics.height +h1,
                     halfWidth/2, h2);
    } else if (char !== "" && char !== " ") {
      var xoffset = (width == 1) ? 0 : Math.floor(Math.max(0,halfWidth*2 - doubleWidth)/2);
      var maxWidth = width*halfWidth;
      if (cell.attrs.bold) {
        ctx.fillText(char, xoffset + x*halfWidth + 0.5, y * metrics.height + metrics.ascent, maxWidth);
      }
      for (var i = 0; i < 2; i++)
        ctx.fillText(char, xoffset + x*halfWidth, y * metrics.height + metrics.ascent, maxWidth);
    }

    if (cell.attrs.underline) {
      ctx.strokeStyle = fgStyle;
      var underLineY = y * metrics.height + metrics.height - Math.floor(metrics.descent/2) + 0.5;
      ctx.beginPath();
      ctx.moveTo(x * halfWidth, underLineY)
      ctx.lineTo(x * halfWidth + width*halfWidth, underLineY);
      ctx.stroke();
    }
  }

  // t: [0, 1]
  function blinkAlpha(t) {
    var a = 1 - t;
    (a < 0.5) ? a * 2 : -2*a + 2
  }

  function cursorAlpha(t) {
    return Math.abs(Math.cos(t * Math.PI));
  }

  this.renderScreenDynamics = function(ctx, frame, lastStaticRedraw, halfWidth, doubleWidth, metrics, clearAll, window_focused) {
    var defaultBackgroundColorIndex = (receiver.reverseScreenMode) ? 7 : 0;

    function renderRow(y) {
      ctx.save();
      setRowClipAndTransform(y, metrics.height, halfWidth, receiver.buffer.getLine(y).getType());

      for (var x  = 0; x < receiver.columns; x++) {
        var cell = receiver.buffer.getCellAt(y, x);
        var char = cell.character;
        var attrs = cell.attrs;
        var cursor = (y === receiver.cursor_y &&
                      x === receiver.cursor_x &&
                      receiver.isCursorVisible &&
                      receiver.buffer.getScrollBackOffset() === 0);
        var width = wcwidth(char);
        var [fg, bg] = colorStyles(attrs, defaultBackgroundColorIndex);

        if (cursor) {
          ctx.clearRect(x*halfWidth, y*metrics.height, halfWidth*width, metrics.height);
          var t = ((frame - lastStaticRedraw) % 60)/59;
          ctx.save();
          ctx.globalAlpha = cursorAlpha(t);

          // カーソルの描画。
          if (window_focused) {
            ctx.fillStyle = 'magenta';
            ctx.fillRect(x * halfWidth, y * metrics.height,
                         halfWidth * width, metrics.height);
          } else {
            ctx.strokeStyle = 'magenta';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x * halfWidth + 1, y * metrics.height + 1);
            ctx.lineTo(x * halfWidth + (halfWidth * width) - 1, y * metrics.height + 1);
            ctx.lineTo(x * halfWidth + (halfWidth * width) - 1, (y+1) * metrics.height - 1);
            ctx.lineTo(x * halfWidth + 1, (y+1) * metrics.height - 1);
            ctx.closePath();
            ctx.stroke();
          }

          ctx.restore();
        }

        if (attrs.blink) {
          ctx.clearRect(x*halfWidth, y*metrics.height, halfWidth*width, metrics.height);
          ctx.save();
          ctx.globalAlpha = blinkAlpha((frame % 60)/59);
          //if (frame % 60 < 30)
          renderCharacter(ctx, x, y, cell, fg, halfWidth, doubleWidth, metrics);
          ctx.restore();
        } else if (cursor) {
          renderCharacter(ctx, x, y, cell, fg, halfWidth, doubleWidth, metrics);
        }

        if (width == 2)
          x++;
      }

      ctx.restore();
    }

    if (clearAll)
      ctx.clearRect(0, 0, halfWidth * receiver.columns, metrics.height * receiver.rows);

    for (var y = 0; y < receiver.rows; y++) {
      renderRow(y);
    }
  }
}
