// -*- mode: js; js-indent-level: 2 -*-
'use strict';

class NamingScreen
{
  static LAYERS = [
    [
      "あいうえおはひふへほ",
      "かきくけこまみむめも",
      "さしすせそやゆよっー",
      "たちつてとらりるれろ",
      "なにぬねのわをん゛゜",
      "ぁぃぅぇぉゃゅょ？　"
    ],

    [
      "アイウエオハヒフヘホ",
      "カキクケコマミムメモ",
      "サシスセソヤユヨッー",
      "タチツテトラリルレロ",
      "ナニヌネノワヲン゛゜",
      "ァィゥェォャュョ　　"
    ],

    [
      "０１２３４５６７８９",
      "ＡＢＣＤＥＦＧＨＩＪ",
      "ＫＬＭＮＯＰＱＲＳＴ",
      "ＵＶＷＸＹＺ＋－！？",
      "ａｂｃｄｅｆｇｈｉｊ",
      "ｋｌｍｎｏｐｑｒｓｔ",
      "ｕｖｗｘｙｚ　　　　",
    ],
  ]

  static DAKUON_TABLE = {
    "う" : "ゔ",
    "は" : "ば",
    "ひ" : "び",
    "ふ" : "ぶ",
    "へ" : "べ",
    "ほ" : "ぼ",
    "か" : "が",
    "き" : "ぎ",
    "く" : "ぐ",
    "け" : "げ",
    "こ" : "ご",
    "さ" : "ざ",
    "し" : "じ",
    "す" : "ず",
    "せ" : "ぜ",
    "そ" : "ぞ",
    "た" : "だ",
    "ち" : "ぢ",
    "つ" : "づ",
    "て" : "で",
    "と" : "ど",

    "ウ" : "ヴ",
    "ハ" : "バ",
    "ヒ" : "ビ",
    "フ" : "ブ",
    "ヘ" : "ベ",
    "ホ" : "ボ",
    "カ" : "ガ",
    "キ" : "ギ",
    "ク" : "グ",
    "ケ" : "ゲ",
    "コ" : "ゴ",
    "サ" : "ザ",
    "シ" : "ジ",
    "ス" : "ズ",
    "セ" : "ゼ",
    "ソ" : "ゾ",
    "タ" : "ダ",
    "チ" : "ヂ",
    "ツ" : "ヅ",
    "テ" : "デ",
    "ト" : "ド",
  }

  static HANDAKUON_TABLE = {
    "は" : "ぱ",
    "ひ" : "ぴ",
    "ふ" : "ぷ",
    "へ" : "ぺ",
    "ほ" : "ぽ",

    "ハ" : "パ",
    "ヒ" : "ピ",
    "フ" : "プ",
    "ヘ" : "ペ",
    "ホ" : "ポ",
  }

  static OMAKASE_NAMES = [
    "よてえもん",
    "ＸＡＸＡ",
    "ヌヌー",
    "ばんたけ",
    "ＯＬ",
  ]

  static async run(default_name = null, candidates = [])
  {
    let name = default_name || ""
    let layer_index = 0
    let old_layer = null
    let y = 0, x = 0
    let input_complete = false

    // top margin
    // (Curses.lines - 13)/2
    const tm = 3

    candidates.sort()

    let command_row
    if (candidates.size > 0) {
      command_row = ["かなカナ英数", "おぎなう", "けす", "おわる"]
    } else {
      command_row = ["かなカナ英数", "おまかせ", "けす", "おわる"]
    }

    const next_omakase = () => {
      let i = this.OMAKASE_NAMES.findIndex((elt) => elt === name)
      if (i != -1) {
        i = (i + 1) % this.OMAKASE_NAMES.length
        return this.OMAKASE_NAMES[i]
      } else {
        return this.OMAKASE_NAMES[0]
      }
    }

    const field = new Curses.Window(3, 14, tm+0, (Curses.cols - 14).div(2)) // lines, cols, y, x
    field.rounded_box()
    field.setpos(0, 3)
    field.addstr("なまえ？")
    const update_name = () => {
      const s = name + "＊".times(6 - name.length)
      field.setpos(1, 1)
      field.addstr(s)
      field.refresh()
    }
    update_name()

    const keyboard = new Curses.Window(10, 44, tm+3, (Curses.cols - 44).div(2))
    keyboard.keypad(true)

    const sharedPrefix = function (...words) {
      if (words.length === 0)
        return ""//throw "no arguments given"
      const minlen = Math.min(... words.map(w => w.length))
      let result = ""
      for (let i = 0; i < minlen; i++) {
        for (let j = 1; j < words.length; j++) {
          if (words[j][i] !== words[0][i])
            return result
        }
        result += words[0][i]
      }
      return result
    }

    const handle_input = (c) => {
      switch (c) {
      case 'h':
      case Curses.KEY_LEFT:
        x = (x - 1).mod(y == 0 ? command_row.length : this.LAYERS[layer_index][y-1].length)
        break

      case 'j':
      case Curses.KEY_DOWN:
        {
          const old_length = (y == 0 ? command_row.length : this.LAYERS[layer_index][y-1].length)
          y = (y + 1).mod(this.LAYERS[layer_index].length + 1)
          const new_length = (y == 0 ? command_row.length : this.LAYERS[layer_index][y-1].length)
          x = Math.floor(x / old_length * new_length)
        }
        break

      case 'k':
      case Curses.KEY_UP:
        {
          const old_length = (y == 0 ? command_row.length : this.LAYERS[layer_index][y-1].length)
          y = (y - 1).mod(this.LAYERS[layer_index].length + 1)
          const new_length = (y == 0 ? command_row.length : this.LAYERS[layer_index][y-1].length)
          x = Math.floor(x / old_length * new_length)
        }
        break

      case 'l':
      case Curses.KEY_RIGHT:
        x = (x + 1).mod(y == 0 ? command_row.length : this.LAYERS[layer_index][y-1].length)
        break

      case 'y':
        handle_input('h')
        handle_input('k')
        break

      case 'u':
        handle_input('l')
        handle_input('k')
        break

      case 'b':
        handle_input('h')
        handle_input('j')
        break

      case 'n':
        handle_input('l')
        handle_input('j')
        break
        
      case 8:
      case Curses.KEY_DC:
      case 'x':
        // Backspace, Delete Character or x
        name = name.slice(0, name.length - 1)
        break

      case 'q':
        throw null

      case Curses.KEY_BTAB:
        if (candidates.index(name) !== null) {
          const i = (candidates.index(name) - 1).mod(candidates.length)
          name = candidates[i]
        } else {
          Curses.beep()
        }
        break

      case 9:
        // おぎなう
        {
          if (candidates.index(name) !== null) {
            const i = (candidates.index(name) + 1).mod(candidates.length)
            name = candidates[i]
          } else {
            const arr = candidates.filter(str => str.startsWith(name))
            if (arr.length) {
              name = arr[0]
            } else {
              Curses.beep()
            }
          }
        }
        break

      case 10:
        if (y == 0) {
          switch (command_row[x]) {
          case "かなカナ英数":
            layer_index = (layer_index + 1) % this.LAYERS.length
            break

          case "おまかせ":
            name = next_omakase()
            break

          case "おぎなう":
            handle_input(9)
            break

          case "けす":
            name = name.slice(0, name.length - 1)
            break

          case "おわる":
            if (name != "")
            {
              input_complete = true
              return
            }
            break
          }
        } else {
          const c = this.LAYERS[layer_index][y-1][x]
          console.log( { name, c })
          if (c == "゛" || c == "゜") {
            if (c == "゛" && name.length > 0 && NamingScreen.DAKUON_TABLE[name[name.length-1]]) {
              name = name.slice(0, name.length - 1) + NamingScreen.DAKUON_TABLE[name[name.length-1]]
            } else if (c == "゜" && name.length > 0 && NamingScreen.HANDAKUON_TABLE[name[name.length-1]]) {
              name = name.slice(0, name.length - 1) + NamingScreen.HANDAKUON_TABLE[name[name.length-1]]
            }
          } else {
            if (name.length == 6) {
              name = name.slice(0, 5) + c
            } else {
              name += c
            }
          }
        }
        break

      default:
        break
      }
    }

    try {
      while (true) {
        update_name()

        if (old_layer != layer_index) {
          (old_layer = layer_index)

          keyboard.clear()
          keyboard.rounded_box()
          keyboard.setpos(1, 1)
          keyboard.addstr("  " + command_row.join("　"))

          this.LAYERS[layer_index].forEach((row, ypos) => {
            ypos += 2
            keyboard.setpos(ypos, 3)
            keyboard.addstr(Array.from(row).join("　"))
          })
        }

        if (y == 0) {
          keyboard.setpos(1, 3 + command_row.slice(0, x).join("").length*2 + x*2)
        } else {
          keyboard.setpos(1 + y, 3 + 4*x)
        }

        const c = await keyboard.getch()
        handle_input(c)
        if (input_complete)
          return name
      }
    } catch (v) {
      if (v === null)
        return
      else
        throw v
    } finally {
      field.close()
      keyboard.close()
    }
  }
}
