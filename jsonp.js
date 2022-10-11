// -*- mode: js; js-indent-level: 2 -*-
'use strict';

function delay(ms) {
  if (ms !== 0)
    console.log('delay', {ms})
  return new Promise((resolve, _reject) => setTimeout(resolve, ms));
}

function sleep(s) {
  return new Promise((resolve, _reject) => setTimeout(resolve, Math.round(s * 1000)));
}

class HeroDied // 何か例外クラスを継承したほうがいい？
{
}

class MessageLog
{
  static HISTORY_SIZE = 2000

  constructor()
  {
    this.lines = []
    this.history = []
  }

  add(msg)
  {
    this.lines.push(msg)
    while (this.history.length >= 2000)
      this.history.shift()

    this.history.push(msg)
  }

  clear()
  {
    this.lines.clear()
  }
}

let STDOUT
let STDIN

function print(val) {
  let str = ''
  if (val === undefined)
    str = 'undefined'
  else
    str = val.to_s()
  STDOUT.writeChar(str)
}

function u(n) {
  return String.fromCodePoint(n)
}

Number.prototype.mod = function(n)
{
  return ((this % n) + n) % n
}

Number.prototype.div = function(n)
{
  return Math.floor(this / n)
}

Number.prototype.fdiv = function(n)
{
  return this / n
}

String.prototype.times = function(n)
{
  return new Array(n+1).join(this)
}

Object.prototype.to_s = function()
{
  return ""+this;
}

const Curses = {
  cols: 80,
  lines: 24,

  KEY_BTAB:   '\x1b[Z',
  KEY_DC:     0x7f, // or \x1b[3~ ?
  KEY_DOWN:   '\x1b[B',
  KEY_END:    '\x1b[F',
  KEY_HOME:   '\x1b[H',
  KEY_LEFT:   '\x1b[D',
  KEY_NPAGE:  '\x1b[6~',
  KEY_PPAGE:  '\x1b[5~',
  KEY_RIGHT:  '\x1b[C',
  KEY_SF:     '\x1b[1;2B',
  KEY_SLEFT:  '\x1b[1;2D',
  KEY_SR:     '\x1b[1;2A',
  KEY_SRIGHT: '\x1b[1;2C',
  KEY_UP:     '\x1b[A',

  A_BOLD: 1,
  A_BLINK: 5,

  COLOR_BLACK: 0,
  COLOR_RED: 1,
  COLOR_GREEN: 2,
  COLOR_YELLOW: 3,
  COLOR_BLUE: 4,
  COLOR_MAGENTA: 5,
  COLOR_CYAN: 6,
  COLOR_WHITE: 7,

  _color_pairs: [],

  set timeout(ms) {
    this.stdscr.timeout = ms
  },

  get timeout() {
    return this.stdscr.timeout
  },

  Window: class {
    constructor(lines, cols, y, x)
    {
      console.log("Window ctor", lines, cols, y, x)
      this.lines = lines
      this.cols = cols
      this.y = y
      this.x = x
      this.maxy = lines
      this.maxx = cols
      this._attrs = []
      this._timeout = -1

      // 本来なら要らないのだけど。
      if (STDOUT)
        this.clear()
    }

    set timeout(ms) {
      this._timeout = ms
    }

    get timeout() {
      return this._timeout
    }

    keypad(flag)
    {
    }


    attron(attr)
    {
      this._attrs.push(attr)
    }

    attroff(attr)
    {
      this._attrs.delete(attr)
    }

    clear()
    {
      for (let y = 0; y < this.maxy; y++) {
        this.setpos(y, 0)
        this.addstr(" ".times(this.cols))
      }
      //print(`\x1b[${this.y};${this.y + this.lines};${this.x};${this.x + this.cols}$z`)
    }

    rounded_box()
    {
      this.setpos(0, 0)
      this.addstr(u(0x104230))
      this.addstr(u(0x104231).times(this.maxx - 2))
      this.addstr(u(0x104232))
      for (let y = 1; y <= this.maxy - 2; y++) {
        this.setpos(y, 0)
        this.addstr(u(0x104233))
        this.setpos(y, this.maxx-1)
        this.addstr(u(0x104235))
      }
      this.setpos(this.maxy - 1, 0)
      this.addstr(u(0x104234))
      this.addstr(u(0x104237).times(this.maxx - 2))
      this.addstr(u(0x104236))
    }

    setpos(y, x)
    {
      print(`\x1b[${this.y + y + 1};${this.x + x + 1}H`)
    }

    addstr(str)
    {
      const attrs = this._attrs.join(";")
      print(`\x1b[${attrs}m`)
      print(str)
      print("\x1b[0m")
    }

    async getch()
    {
      const time_limit = this._timeout !== -1 ? +new Date + this._timeout : null
      let c = await STDIN.readChar(time_limit)
      if (!c)
        return null // タイムアウト

      if (c == '\x1b') {
        // これだと F1 ~ F4 が取れない。
        let buf = c
        while (!c.match(/[A-Z~]/)) {
          c = await STDIN.readChar(+new Date + 10) // 10 ms
          if (!c) {
            STDIN.ungetch( buf.slice(1) )
            return 0x1b
          }
          buf += c
        }
        return buf
      } else {
        const cp = c.codePointAt(c)
        if (cp <= 0x7f) {
          if (cp == 0x7f || cp < 0x20)
            return cp
        }
        return c
      }
    }

    close()
    {
    }

    refresh()
    {
    }
    
    clrtoeol()
    {
      print("\x1b[0K")
    }
  },

  setpos(y, x)
  {
    print(`\x1b[${y + 1};${x + 1}H`)
  },

  addstr(str)
  {
    this.stdscr.addstr(str)
  },

  attron(attr)
  {
    this.stdscr.attron(attr)
  },

  attroff(attr)
  {
    this.stdscr.attroff(attr)
  },

  refresh()
  {
  },

  flushinp()
  {
    STDIN.flushinp()
  },

  curs_set(n) // 0 or 1
  {
    if (n)
      print("\x1b[?25h")
    else
      print("\x1b[?25l")
  },

  async getch()
  {
    return await this.stdscr.getch()
  },

  color_pair(n)
  {
    return this._color_pairs[n] || "30;40"
  },

  clrtoeol()
  {
    print("\x1b[0K")
  },

  init_screen()
  {
    print("\x1b[?1049h")
  },

  start_color()
  {
  },

  noecho()
  {
  },

  crmode()
  {
  },

  close_screen()
  {
    print("\x1b[?1049l")
    console.log("close screen")
  },

  init_pair(n, fg, bg)
  {
    this._color_pairs[n] = `3${fg};4${bg}`
  },
}

Curses.stdscr = new Curses.Window(24, 80, 0, 0)

const NamingScreen = {
  COMMAND_ROW: ["かなカナ英数", "おまかせ", "けす", "おわる"],

  LAYERS: [
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
  ],

  DAKUON_TABLE: {
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
  },

  HANDAKUON_TABLE: {
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
  },

  OMAKASE_NAMES: [
    "よてえもん",
    "ＸＡＸＡ",
    "ヌヌー",
    "ばんたけ",
    "ＯＬ",
  ],

  async run(default_name = null)
  {
    let name = default_name || ""
    let layer_index = 0
    let old_layer = null
    let y = 0, x = 0
    let input_complete = false

    // top margin
    // (Curses.lines - 13)/2
    const tm = 3

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

    const handle_input = (c) => {
      switch (c) {
      case 9:
        handle_input('l')
        break

      case Curses.KEY_BTAB:
        handle_input('h')
        break

      case 'h':
      case Curses.KEY_LEFT:
        x = (x - 1).mod(y == 0 ? this.COMMAND_ROW.length : this.LAYERS[layer_index][y-1].length)
        break

      case 'j':
      case Curses.KEY_DOWN:
        {
          const old_length = (y == 0 ? this.COMMAND_ROW.length : this.LAYERS[layer_index][y-1].length)
          y = (y + 1).mod(this.LAYERS[layer_index].length + 1)
          const new_length = (y == 0 ? this.COMMAND_ROW.length : this.LAYERS[layer_index][y-1].length)
          x = Math.floor(x / old_length * new_length)
        }
        break

      case 'k':
      case Curses.KEY_UP:
        {
          const old_length = (y == 0 ? this.COMMAND_ROW.length : this.LAYERS[layer_index][y-1].length)
          y = (y - 1).mod(this.LAYERS[layer_index].length + 1)
          const new_length = (y == 0 ? this.COMMAND_ROW.length : this.LAYERS[layer_index][y-1].length)
          x = Math.floor(x / old_length * new_length)
        }
        break

      case 'l':
      case Curses.KEY_RIGHT:
        x = (x + 1).mod(y == 0 ? this.COMMAND_ROW.length : this.LAYERS[layer_index][y-1].length)
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

      case 10:
        if (y == 0) {
          switch (this.COMMAND_ROW[x]) {
          case "かなカナ英数":
            layer_index = (layer_index + 1) % this.LAYERS.length
            break

          case "おまかせ":
            console.log("next omakase")
            name = next_omakase()
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
          keyboard.addstr("  " + this.COMMAND_ROW.join("　"))

          this.LAYERS[layer_index].forEach((row, ypos) => {
            ypos += 2
            keyboard.setpos(ypos, 3)
            keyboard.addstr(Array.from(row).join("　"))
          })
        }

        if (y == 0) {
          keyboard.setpos(1, 3 + this.COMMAND_ROW.slice(0, x).join("").length*2 + x*2)
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

class Float
{
  static INFINITY = 1/0
}

const Finalizers = []
function at_exit(f)
{
  Finalizers.push(f)
}

class Action
{
  constructor(type, direction)
  {
    this.type = type
    this.direction = direction
  }

}
class Program
{
  static DIRECTIONS = [[0,-1], [1,-1], [1,0], [1,1], [0,1], [-1,1], [-1,0], [-1,-1]]
  static SCORE_RANKING_FILE_NAME = "ranking-score.json"
  static TIME_RANKING_FILE_NAME = "ranking-time.json"
  static RECENT_GAMES_FILE_NAME = "ranking-recent.json"

  static HEALTH_BAR_COLOR_PAIR        = 1
  static UNIDENTIFIED_ITEM_COLOR_PAIR = 2
  static NICKNAMED_ITEM_COLOR_PAIR    = 3
  static CURSED_ITEM_COLOR_PAIR       = 4
  static SPECIAL_DUNGEON_COLOR_PAIR   = 5

  constructor()
  {
    this.debug = true
    this.hard_mode = false
    this.default_name = null

    // load_softfonts()

    Curses.init_screen()
    Curses.start_color()

    Curses.init_pair(Program.HEALTH_BAR_COLOR_PAIR, Curses.COLOR_GREEN, Curses.COLOR_RED)
    Curses.init_pair(Program.UNIDENTIFIED_ITEM_COLOR_PAIR, Curses.COLOR_YELLOW, Curses.COLOR_BLACK)
    Curses.init_pair(Program.NICKNAMED_ITEM_COLOR_PAIR, Curses.COLOR_GREEN, Curses.COLOR_BLACK)
    Curses.init_pair(Program.CURSED_ITEM_COLOR_PAIR, Curses.COLOR_WHITE, Curses.COLOR_BLUE)
    Curses.init_pair(Program.SPECIAL_DUNGEON_COLOR_PAIR, Curses.COLOR_MAGENTA, Curses.COLOR_BLACK)

    Curses.noecho()
    Curses.crmode()
    Curses.stdscr.keypad(true)

    at_exit(
      () => Curses.close_screen()
    )

    this.reset()
  }

  async readString(port)
  {
    let ch = null
    let buf = ""

    while (ch != "\n") {
      ch = await port.readChar()
      this.env.stdout.writeChar(ch)
      buf += ch
    }
    return buf
  }

  reset()
  {
    this.hero = new Hero( { x: null, y: null,
                            hp: 15, max_hp: 15,
                            raw_strength: 8,
                            raw_max_strength: 8,
                            gold: 0, exp: 0,
                            fullness: 100.0,
                            max_fullness: 100.0,
                            lv: 1 } )
    this.hero.inventory.push( Item.make_item("大きなパン") )

    this.level_number = 0
    this.dungeon = new Dungeon
    this._log = new MessageLog

    this.last_room = null

    this.start_time = null

    this.beat = false

    this.dash_direction = null

    this.last_rendered_at = +new Date

    this.last_message = ""
    this.last_message_shown_at = +new Date

    this.naming_table = this.create_naming_table()
  }

  addstr_ml(win, ml)
  {
    // addstr_ml(win = Curses, ml) を実装。
    if (arguments.length == 1) {
      ml = win
      win = Curses
    }

    if (typeof(ml) == 'string') {
      win.addstr(ml)
    } else if (ml instanceof Array && ml.length == 0) {
      throw new Error
    } else if (ml instanceof Array) {
      // ml.size >= 1
      let [tag, ...rest] = ml
      let attrs
      if (typeof(rest[0]) == 'object' && !(ml instanceof Array)) {
        [attrs, rest] = [rest[0], rest.slice(1)]
      } else {
        attrs = {}
      }
      this.tag_start(win, tag)
      rest.each( child => this.addstr_ml(win, child) )
      this.tag_end(win, tag)
    } else {
      this.addstr_ml(win, Kernel.inspect(ml))
    }
  }

  tag_start(win, tag)
  {
    switch (tag.toLowerCase()) {
    case "span":
      break
    case "b":
      win.attron(Curses.A_BOLD)
      break
    case "unidentified":
      win.attron(Curses.color_pair(Program.UNIDENTIFIED_ITEM_COLOR_PAIR))
      break
    case "nicknamed":
      win.attron(Curses.color_pair(Program.NICKNAMED_ITEM_COLOR_PAIR))
      break
    case "cursed":
      win.attron(Curses.color_pair(Program.CURSED_ITEM_COLOR_PAIR))
      break
    case "special":
      win.attron(Curses.color_pair(Program.SPECIAL_DUNGEON_COLOR_PAIR))
      break
    default:
      throw new Error("unknown tag " + tag)
    }
  }

  tag_end(win, tag)
  {
    switch (tag.toLowerCase()) {
    case "span":
      break
    case "b":
      win.attroff(Curses.A_BOLD)
      break
    case "unidentified":
      win.attroff(Curses.color_pair(Program.UNIDENTIFIED_ITEM_COLOR_PAIR))
      break
    case "nicknamed":
      win.attroff(Curses.color_pair(Program.NICKNAMED_ITEM_COLOR_PAIR))
      break
    case "cursed":
      win.attroff(Curses.color_pair(Program.CURSED_ITEM_COLOR_PAIR))
      break
    case "special":
      win.attroff(Curses.color_pair(Program.SPECIAL_DUNGEON_COLOR_PAIR))
      break
    default:
      throw new Error("unknown tag " + tag)
    }
  }

  create_naming_table()
  {
    return (this.hard_mode) ?
      this.create_naming_table_hard_mode() :
      this.create_naming_table_easy_mode()
  }

  create_naming_table_easy_mode()
  {
    const get_item_names_by_kind =
          specified => Item.ITEMS.filter( ([kind, name, number, desc]) => kind == specified ).map( ([_kind, name, _number, _desc]) => name )

    const take_strict = (n, arr) => {
      if ( arr.length < n )
        throw new Error("list too short")
      return arr.take(n)
    }

    let staves_false  = ["鉄の杖", "銅の杖", "鉛の杖", "銀の杖", "金の杖", "アルミの杖", "真鍮の杖",
                         "ヒノキの杖", "杉の杖", "桜の杖", "松の杖", "キリの杖", "ナラの杖", "ビワの杖"]
    let rings_false   = ["金剛石の指輪", "翡翠の指輪", "猫目石の指輪", "水晶の指輪", // "タイガーアイの指輪",
                         "瑪瑙の指輪", "天河石の指輪","琥珀の指輪","孔雀石の指輪","珊瑚の指輪","電気石の指輪",
                         "真珠の指輪","葡萄石の指輪","蛍石の指輪","紅玉の指輪","フォーダイトの指輪", "黒曜石の指輪"]

    const staves_true  = get_item_names_by_kind('staff')
    const rings_true   = get_item_names_by_kind('ring')

    staves_false  = take_strict(staves_true.length, staves_false.shuffle())
    rings_false   = take_strict(rings_true.length, rings_false.shuffle())

    return new NamingTable([].concat(staves_false, rings_false),
                           [].concat(staves_true, rings_true))
  }

  create_naming_table_hard_mode()
  {
    const get_item_names_by_kind =
          specified => Item.ITEMS.filter( ([kind, name, number, desc]) => kind == specified ).map( ([_kind, name, _number, _desc]) => name )

    const take_strict = (n, arr) => {
      if ( arr.length < n )
        throw new Error("list too short")
      return arr.take(n)
    }

    let herbs_false   = ["黒い草", "白い草", "赤い草", "青い草", "黄色い草", "緑色の草",
                         "まだらの草", "スベスベの草", "チクチクの草", "空色の草", "しおれた草",
                         "くさい草", "茶色い草", "ピンクの草"]
    let scrolls_false = ["αの巻物", "βの巻物", "γの巻物", "δの巻物", "εの巻物", "ζの巻物", "ηの巻物", "θの巻物",
                         "ιの巻物", "κの巻物", "λの巻物", "μの巻物", "νの巻物", "ξの巻物", "οの巻物", "πの巻物",
                         "ρの巻物", "σの巻物", "τの巻物", "υの巻物", "φの巻物", "χの巻物", "ψの巻物", "ωの巻物"]
    let staves_false  = ["鉄の杖", "銅の杖", "鉛の杖", "銀の杖", "金の杖", "アルミの杖", "真鍮の杖",
                         "ヒノキの杖", "杉の杖", "桜の杖", "松の杖", "キリの杖", "ナラの杖", "ビワの杖"]
    let rings_false   = ["金剛石の指輪", "翡翠の指輪", "猫目石の指輪", "水晶の指輪", // "タイガーアイの指輪",
                         "瑪瑙の指輪", "天河石の指輪","琥珀の指輪","孔雀石の指輪","珊瑚の指輪","電気石の指輪",
                         "真珠の指輪","葡萄石の指輪","蛍石の指輪","紅玉の指輪","フォーダイトの指輪", "黒曜石の指輪"]

    const herbs_true   = get_item_names_by_kind('herb')
    const scrolls_true = get_item_names_by_kind('scroll')
    const staves_true  = get_item_names_by_kind('staff')
    const rings_true   = get_item_names_by_kind('ring')

    herbs_false   = take_strict(herbs_true.length, herbs_false.shuffle())
    scrolls_false = take_strict(scrolls_true.length, scrolls_false.shuffle())
    staves_false  = take_strict(staves_true.length, staves_false.shuffle())
    rings_false   = take_strict(rings_true.length, rings_false.shuffle())

    return new NamingTable(herbs_false.concat(scrolls_false, staves_false, rings_false),
                           herbs_true.concat(scrolls_true, staves_true, rings_true))
  }

  // デバッグモードで動作中？
  debug_p()
  {
    return this.debug
  }

  async log(... args)
  {
    this._log.add(['span', ... args])
    this.stop_dashing()
    await this.render()
  }

  // 経験値が溜まっていればヒーローのレベルアップをする。
  async check_level_up(silent = false)
  {
    while (this.hero.lv < CharacterLevel.exp_to_lv(this.hero.exp)) {
      await this.log(`${this.hero.name}の レベルが 上がった。`)
      if (!silent) {
        await SoundEffects.fanfare()
        await render()
      }
      this.hero.lv += 1
      //hp_increase = 5
      this.hero.max_hp = [this.hero.max_hp + 5, 999].min()
      this.hero.hp = [this.hero.max_hp, this.hero.hp + 5].min()
    }
  }

  // ヒーローの攻撃力。(Lvと武器)
  get_hero_attack()
  {
    const basic = CharacterLevel.lv_to_attack(CharacterLevel.exp_to_lv(this.hero.exp))
    const weapon_score = this.hero.weapon ? this.hero.weapon.number : 0
    return (basic + basic * (weapon_score + this.hero.strength - 8)/16.0).round()
  }

  // ヒーローの投擲攻撃力。
  get_hero_projectile_attack(projectile_strength)
  {
    const basic = CharacterLevel.lv_to_attack(CharacterLevel.exp_to_lv(this.hero.exp))
    return (basic + basic * (projectile_strength - 8)/16.0).round()
  }

  // ヒーローの防御力。
  get_hero_defense()
  {
    return this.hero.shield ? this.hero.shield.number : 0
  }

  // モンスターの攻撃力。
  get_monster_attack(m)
  {
    return m.strength
  }

  async on_monster_taking_damage(monster, cell)
  {
    if (! monster.nullified_p()) {
      if (monster.divide_p() && rand() < 0.5) {
        const [x, y] = this.level.coordinates_of(monster)
        await this.monster_split(monster, cell, x, y)
      } else if (monster.teleport_on_attack_p()) {
        await this.log(`${this.display_character(monster)}は ワープした。`)
        await this.monster_teleport(monster, cell)
      }
    }
  }

  async monster_explode(monster, ground_zero_cell)
  {
    await this.log(`${this.display_character(monster)}は 爆発した！`)

    const [mx, my] = this.level.coordinates_of(monster)

    if (Vec.chess_distance([mx,my], this.hero.pos) <= 1)
      await this.take_damage((this.hero.hp / 2.0).ceil())

    const rect = this.level.surroundings(mx, my)
    rect.each_coords( (x, y) => {
      if (this.level.in_dungeon_p(x, y)) {
        const cell = this.level.cell(x, y)
        if (cell.monster)
          cell.remove_object(cell.monster)

        if (cell.item)
          cell.remove_object(cell.item)
      }
    })
  }

  // モンスターにダメージを与える。
  async monster_take_damage(monster, damage, cell)
  {
    if (monster.damage_capped_p())
      damage = [damage, 1].min()

    const set_to_explode = !monster.nullified_p() && monster.bomb_p() && monster.hp < monster.max_hp.div(2)

    monster.hp -= damage
    await this.log(`${this.display_character(monster)}に ${damage} のダメージを与えた。`)
    if (monster.hp >= 1.0) { // 生きている
      if (set_to_explode) {
        await this.monster_explode(monster, cell)
        return
      }

      await this.on_monster_taking_damage(monster, cell)
    }
    await this.check_monster_dead(cell, monster)
  }

  // ヒーローがモンスターを攻撃する。
  async hero_attack(cell, monster)
  {
    await this.log(`${this.hero.name}の攻撃！ `)
    this.on_monster_attacked(monster)
    if (!this.hero.no_miss_p() && rand() < 0.125) {
      await SoundEffects.miss()
      await this.log(`${this.hero.name}の攻撃は 外れた。`)
    } else {
      await SoundEffects.hit()
      const attack = this.get_hero_attack()
      let damage = ( ( attack * Math.pow(15.0/16.0, monster.defense) ) * (112 + rand(32))/128.0 ).to_i()
      if (monster.name == "竜" && this.hero.weapon?.name == "ドラゴンキラー")
        damage *= 2

      if (this.hero.critical_p() && rand() < 0.25) {
        await this.log("会心の一撃！")
        damage *= 2
      }
      await this.monster_take_damage(monster, damage, cell)
    }
  }

  // モンスターが死んでいたら、その場合の処理を行う。
  async check_monster_dead(cell, monster)
  {
    if (monster.hp < 1.0) {
      if (monster.invisible && !this.level.whole_level_lit) {
        const old = this.display_character(monster)
        monster.invisible = false
        monster.hp = 1
        await this.log(`${old}は ${this.display_character(monster)}だった!`)
        await this.render()
        monster.hp = 0
        await this.render()
      }
      monster.reveal_self() // 化けの皮を剥ぐ。

      cell.remove_object(monster)

      let thing
      if (monster.item)
        thing = monster.item
      else if (rand() < monster.drop_rate)
        thing = this.dungeon.make_random_item_or_gold(this.level_number)
      else
        thing = null

      if (thing) {
        const [x, y] = this.level.coordinates_of_cell(cell)
        await this.item_land(thing, x, y)
      }

      this.hero.exp += monster.exp
      await this.log(`${this.display_character(monster)}を たおして ${monster.exp} ポイントの経験値を得た。`)
      await this.check_level_up()

      const expired_effects = []
      this.hero.status_effects.reject_d(
        e => {
          if (e.caster === monster) {
            expired_effects.push(e)
            return true
          } else {
            return false
          }
        }
      )
      for (const e of expired_effects)
        await this.on_status_effect_expire(this.hero, e)
    }
  }

  async remove_status_effect(character, type)
  {
    const expired_effects = []
    character.status_effects.reject_d(e => {
      if (type == e.type) {
        expired_effects.push(e)
        return true
      } else {
        return false
      }
    })

    for (const e of expired_effects) {
      await this.on_status_effect_expire(character, e)
    }
  }

  // 移動キー定義。
  static KEY_TO_DIRVEC = {
    'h': [-1,  0],
    'j': [ 0, +1],
    'k': [ 0, -1],
    'l': [+1,  0],
    'y': [-1, -1],
    'u': [+1, -1],
    'b': [-1, +1],
    'n': [+1, +1],

    'H': [-1,  0],
    'J': [ 0, +1],
    'K': [ 0, -1],
    'L': [+1,  0],
    'Y': [-1, -1],
    'U': [+1, -1],
    'B': [-1, +1],
    'N': [+1, +1],

    // テンキー。
    [Curses.KEY_LEFT] : [-1, 0],
    [Curses.KEY_RIGHT]: [+1, 0],
    [Curses.KEY_UP]   : [0, -1],
    [Curses.KEY_DOWN] : [0, +1],

    [Curses.KEY_HOME] : [-1, -1],
    [Curses.KEY_END]  : [-1, +1],
    [Curses.KEY_PPAGE]: [+1, -1],
    [Curses.KEY_NPAGE]: [+1, +1],

    '7': [-1, -1],
    '8': [ 0, -1],
    '9': [+1, -1],
    '4': [-1,  0],
    '6': [+1,  0],
    '1': [-1, +1],
    '2': [ 0, +1],
    '3': [+1, +1],

    // nav cluster のカーソルキーをシフトすると以下になる。
    [Curses.KEY_SLEFT]: [-1, 0],
    [Curses.KEY_SRIGHT]: [+1, 0],
    [Curses.KEY_SR]: [0, -1], // scroll back
    [Curses.KEY_SF]: [0, +1], // scroll forward
  }

  hero_can_move_to_p(target)
  {
    if (Vec.chess_distance(this.hero.pos, target) != 1)
      return false

    const [dx, dy] = Vec.minus(target, this.hero.pos)
    if (dx * dy != 0) {
      return (this.level.passable_p(this.hero.x + dx, this.hero.y + dy) &&
              this.level.uncornered_p(this.hero.x + dx, this.hero.y) &&
              this.level.uncornered_p(this.hero.x, this.hero.y + dy))
    } else {
      return this.level.passable_p(this.hero.x + dx, this.hero.y + dy)
    }
  }

  // ヒーローの移動・攻撃。
  // String → :move | :action
  async hero_move(c)
  {
    let vec = Program.KEY_TO_DIRVEC[c]
    if (! vec)
      throw new Error("argument error: " +  `unknown movement key ${c}`)

    const shifted = ('H J K L Y U B N 7 8 9 4 6 1 2 3'.split(' ').concat([Curses.KEY_SLEFT, Curses.KEY_SRIGHT, Curses.KEY_SR, Curses.KEY_SF])).include_p(c)

    if (this.hero.confused_p())
      vec = Program.DIRECTIONS.sample()

    const target = Vec.plus(this.hero.pos, vec)
    if (!this.hero_can_move_to_p(target))
      return 'nothing'

    const cell = this.level.cell(... target)
    if (cell.monster) {
      await this.hero_attack(cell, cell.monster)
      return 'action'
    } else {
      if (this.hero.held_p()) {
        await this.log("その場に とらえられて 動けない！ ")
        return 'action'
      }

      if (shifted) {
        this.dash_direction = vec
      }
      await this.hero_walk(... target, !shifted)
      return 'move'
    }
  }

  async hero_walk(x1, y1, picking)
  {
    if (this.level.cell(x1, y1).item?.mimic) {
      const item = this.level.cell(x1, y1).item
      await this.log(this.display_item(item), "は ミミックだった!")
      const m = Monster.make_monster("ミミック")
      m.state = 'awake'
      m.action_point = m.action_point_recovery_rate // このターンに攻撃させる
      this.level.cell(x1, y1).remove_object(item)
      this.level.cell(x1, y1).put_object(m)
      this.stop_dashing()
      return
    }

    //SoundEffects.footstep()

    await this.hero_change_position(x1, y1)
    const cell = this.level.cell(x1, y1)

    const gold = cell.gold
    if (gold) {
      if (picking) {
        cell.remove_object(gold)
        this.hero.gold += gold.amount
        await this.log(`${gold.amount}G を拾った。`)
      } else {
        await this.log(`${gold.amount}G の上に乗った。`)
        this.stop_dashing()
      }
    }

    const item = cell.item
    if (item) {
      if (picking) {
        await this.pick(cell, item)
      }else {
        await this.log(this.display_item(item), "の上に乗った。")
        this.stop_dashing()
      }
    }

    const trap = cell.trap
    if (trap) {
      const activation_rate = trap.visible ? (1/4.0) : (3/4.0)
      trap.visible = true
      this.stop_dashing()
      if (this.hero.ring?.name != "ワナ抜けの指輪") {
        if (rand() < activation_rate)
          await this.trap_activate(trap)
        else
          await this.log(`${trap.name}は 発動しなかった。`)
      }
    }

    if (cell.staircase)
      this.stop_dashing()

    if (this.hero.ring?.name == "ワープの指輪") {
      if (rand() < 1.0/16) {
        await this.log(this.hero.name, "は ワープした！")
        this.stop_dashing() // 駄目押し
        await this.hero_teleport()
      }
    }
  }

  stop_dashing()
  {
    this.dash_direction = null
  }

  async hero_change_position(x1, y1)
  {
    [this.hero.x, this.hero.y] = [x1, y1]
    this.hero.status_effects.reject_d( e => e.type == 'held' )
    this.level.update_lighting(x1, y1)
    if (this.last_room != this.current_room) {
      await this.walk_in_or_out_of_room()
      this.last_room = this.current_room
    }
  }

  // 盾が錆びる。
  async take_damage_shield()
  {
    if (this.hero.shield) {
      if (this.hero.shield.rustproof_p()) {
        await this.log(`しかし ${this.hero.shield}は錆びなかった。`)
      } else {
        if (this.hero.shield.number > 0) {
          this.hero.shield.number -= 1
          await this.log("盾が錆びてしまった！ ")
        } else {
          await this.log("しかし 何も起こらなかった。")
        }
      }
    } else {
      await this.log("しかし なんともなかった。")
    }
  }

  // アイテムをばらまく。
  async strew_items()
  {
    if ( this.hero.inventory.some( x => x.name == "転ばぬ先の杖" ) ) {
      await this.log(`しかし ${this.hero.name}は 転ばなかった。`)
      return
    }

    let count = 0
    let candidates = this.hero.inventory.reject( x => this.hero.equipped_p(x) )
    candidates = candidates.shuffle()
    for (const [dx, dy] of [[0,-1], [1,-1], [1,0], [1,1], [0,1], [-1,1], [-1,0], [-1,-1]]) {
      if (candidates.size == 0)
        break

      const [x, y] = [this.hero.x + dx, this.hero.y + dy]

      if (this.level.in_dungeon_p(x, y) &&
          this.level.cell(x, y).can_place_p()) {
        const item = candidates.shift()
        if (item.name == "結界の巻物") {
          item.stuck = true
        }
        this.level.put_object(item, x, y)
        this.hero.remove_from_inventory(item)
        this.update_stairs_direction() // *
        count += 1
      }
    }

    if (count > 0)
      await this.log(`アイテムを ${count}個 ばらまいてしまった！ `)
  }

  // ヒーローがワープする。
  async hero_teleport()
  {
    await SoundEffects.teleport()

    const fov = this.level.fov(this.hero.x, this.hero.y)
    let [x, y] = this.level.find_random_place(
      (cell, x, y) => cell.type == 'FLOOR' && !cell.monster && !fov.include_p(x, y)
    ) || [null, null]

    if (x === null) {
      // 視界内でも良い条件でもう一度検索。
      [x, y] = this.level.find_random_place(
        (cell, x, y) => cell.type == 'FLOOR' && !cell.monster
      )
    }

    await this.hero_change_position(x, y)
  }

  // ヒーローに踏まれた罠が発動する。
  async trap_activate(trap)
  {
    switch ( trap.name ) {
    case "ワープゾーン":
      await this.log("ワープゾーンだ！ ")
      await this.wait_delay()
      await this.hero_teleport()
      break
    case "硫酸":
      await this.log("足元から酸がわき出ている！ ")
      await this.take_damage_shield()
      break
    case "トラばさみ":
      await this.log("トラばさみに かかってしまった！ ")
      if (! this.hero.held_p() ) {
        this.hero.status_effects.push( new StatusEffect('held', 10) )
      }
      break
    case "眠りガス":
      await this.log("足元から 霧が出ている！ ")
      await this.hero_fall_asleep()
      break
    case "石ころ":
      await this.log("石にけつまずいた！ ")
      await this.strew_items()
      break
    case "矢":
      await this.log("矢が飛んできた！ ")
      await this.take_damage(5)
      break
    case "毒矢":
      await this.log("矢が飛んできた！ ")
      await this.take_damage(5)
      await this.take_damage_strength(1)
      break
    case "地雷":
      await this.log("足元で爆発が起こった！ ")
      await this.mine_activate(trap)
      break
    case "落とし穴":
      await this.log("落とし穴だ！ ")
      await SoundEffects.trapdoor()
      await this.wait_delay()
      await this.new_level(+1, false)
      return // ワナ破損処理をスキップする
    default:
      throw new Error 
    }

    const [tx, ty] = this.level.coordinates_of(trap)
    if (rand() < 0.5)
      this.level.remove_object(trap, tx, ty)
  }

  // 地雷が発動する。
  async mine_activate(mine)
  {
    await this.take_damage( [(this.hero.hp / 2.0).floor(), 1.0].max() )

    const [tx, ty] = this.level.coordinates_of(mine)
    const rect = this.level.surroundings(tx, ty)
    const all_coords = []
    rect.each_coords( (x,y) => all_coords.push([x,y]) )

    for (const [x, y] of all_coords) {
      if (this.level.in_dungeon_p(x, y)) {
        const cell = this.level.cell(x, y)
        if (cell.item) {
          await this.log(this.display_item(cell.item), "は 消し飛んだ。")
          cell.remove_object(cell.item)
          await render()
        }
      }
    }

    for (const [x, y] of all_coords) {
      if (this.level.in_dungeon_p(x, y)) {
        const cell = this.level.cell(x, y)
        if (cell.monster) {
          cell.monster.hp = 0
          await render()
          await this.check_monster_dead(cell, cell.monster)
        }
      }
    }
  }

  // ヒーロー this.hero が item を拾おうとする。
  async pick(cell, item)
  {
    if (item.stuck) {
      await this.log(this.display_item(item), "は 床にはりついて 拾えない。")
    } else {
      if (this.hero.add_to_inventory(item)) {
        cell.remove_object(item)
        this.update_stairs_direction()
        await this.log(this.hero.name, "は ", this.display_item(item), "を 拾った。")
      } else {
        await this.log("持ち物が いっぱいで ", this.display_item(item), "が 拾えない。")
      }
    }
  }

  // (x,y) の罠を見つける。
  reveal_trap(x, y)
  {
    const cell = this.level.cell(x, y)
    const trap = cell.trap
    if ( trap && !trap.visible )
      trap.visible = true
  }

  // 周り8マスをワナチェックする
  search()
  {
    const [x, y] = [this.hero.x, this.hero.y]

    ;[[0,-1], [1,-1], [1,0], [1,1], [0,1], [-1,1], [-1,0], [-1,-1]].each( ( [xoff, yoff] ) => {
      // 敵の下のワナは発見されない。
      if (this.level.in_dungeon_p(x+xoff, y+yoff) &&
          !this.level.cell(x+xoff, y+yoff).monster)
        this.reveal_trap(x + xoff, y + yoff)
    })
    return 'action'
  }

  // 足元にある物の種類に応じて行動する。
  async activate_underfoot()
  {
    const cell = this.level.cell(this.hero.x, this.hero.y)
    if (cell.staircase) {
      return await this.go_downstairs()
    } else if (cell.item) {
      await this.pick(cell, cell.item)
      return 'action'
    } else if (cell.gold) {
      const gold = cell.gold
      cell.remove_object(gold)
      this.hero.gold += gold.amount
      await this.log(`${gold.amount}G を拾った。`)
      return 'action'
    } else if (cell.trap) {
      await this.trap_activate(cell.trap)
      return 'action'
    } else {
      await this.log("足元には何もない。")
      return 'nothing'
    }
  }

  // -> 'nothing' | ...
  async underfoot_menu()
  {
    // 足元にワナがある場合、階段がある場合、アイテムがある場合、なにもない場合。
    const cell = this.level.cell(this.hero.x, this.hero.y)
    if (cell.trap) {
      await this.log(`足元には ${cell.trap.name}がある。「>」でわざとかかる。`)
      return 'nothing'
    } else if (cell.staircase) {
      await this.log("足元には 階段がある。「>」で昇降。")
      return 'nothing'
    } else if (cell.item) {
      await this.log("足元には ", this.display_item(cell.item), "が ある。")
      return 'nothing'
    } else {
      await this.log("足元には なにもない。")
      return 'nothing'
    }
  }

  // String → :action | :move | :nothing
  async dispatch_command(c) {
    switch (c) {
    case ',':
      return await this.underfoot_menu()

    case '!':
      // if debug?
      //   require 'pry'
      //   Curses.close_screen
      //   self.pry
      //   Curses.refresh
      // end
      return 'nothing'

    case '\\':
      if (this.debug_p())
        await this.hero_levels_up(true)

      return 'nothing'

    case ']':
      if (this.debug_p())
        return await this.cheat_go_downstairs()
      else
        return 'nothing'

    case '[':
      if (this.debug_p())
        return await this.cheat_go_upstairs()
      else
        return 'nothing'

    case 'p':
      if (this.debug_p())
        await this.cheat_get_item()

      return 'nothing'
    case '`':
      if (this.debug_p())
        await this.shop_interaction()

      return 'nothing'

    case '?':
      return await this.help()

    case 'h': case 'j': case 'k': case 'l': case 'y': case 'u': case 'b': case 'n':
    case 'H': case 'J': case 'K': case 'L': case 'Y': case 'U': case 'B': case 'N':
    case Curses.KEY_LEFT: case  Curses.KEY_RIGHT: case  Curses.KEY_UP: case  Curses.KEY_DOWN:
    case Curses.KEY_HOME: case  Curses.KEY_END: case  Curses.KEY_PPAGE: case  Curses.KEY_NPAGE:
    case '7': case  '8': case  '9': case  '4': case  '6': case  '1': case  '2': case  '3':
    case Curses.KEY_SLEFT: case  Curses.KEY_SRIGHT: case  Curses.KEY_SR: case Curses.KEY_SF:
      return await this.hero_move(c)

    case 16: // ^P
      await this.open_history_window()
      return 'nothing'

    // case 12 // ^L
    //   if debug?
    //     Curses.close_screen
    //     load(File.dirname(__FILE__) + "/screen_test.rb")
    //     load(File.dirname(__FILE__) + "/dungeon.rb")
    //     load(File.dirname(__FILE__) + "/monster.rb")
    //     load(File.dirname(__FILE__) + "/item.rb")
    //     load(File.dirname(__FILE__) + "/level.rb")
    //     load(File.dirname(__FILE__) + "/shop.rb")
    //   end
    //   render
    //   'nothing'

    case 'i':
      return await this.open_inventory()

    case '>':
      return await this.activate_underfoot()

    case 'q':
      await this.log("冒険をあきらめるには大文字の Q を押してね。")
      return 'nothing'

    case 'Q':
      if (await this.confirm_give_up()) {
        await this.give_up_message()
        this.quitting = true
        return 'nothing'
      } else {
        return 'nothing'
      }

    case 's':
      return await this.main_menu()

    case 't':
      if (this.hero.projectile) {
        return await this.throw_item(this.hero.projectile)
      } else {
        await this.log("投げ物を装備していない。")
        return 'nothing'
      }

    case '.':
    case 10: // Enter
      return this.search()

    default:
      await this.log(`[${c}]なんて 知らない。[?]でヘルプ。`)
      return 'nothing'
    }
  }

  async open_history_window()
  {
    const win = new HistoryWindow(this._log.history, (win, msg) => this.addstr_ml(win, msg))
    await win.run()
  }

  async cheat_get_item()
  {
    const item_kinds = {
      "武器": 'weapon',
      "投げ物": 'projectile',
      "盾": 'shield',
      "草": 'herb',
      "巻物": 'scroll',
      "杖": 'staff',
      "指輪": 'ring',
      "食べ物": 'food',
      "箱": 'box',
    }

    const menu = new Menu(Object.keys(item_kinds))
    try {
      const [c, arg] = await menu.choose()
      switch (c) {
      case 'chosen':
        {
          const kind = item_kinds[arg]
          const names = Item.ITEMS.filter(row => row[0] == kind).map(row => row[1] /*name*/)
          const menu2 = new Menu(names)
          try {
            const [c2, arg2] = await menu2.choose()
            switch (c2) {
            case 'chosen':
              {
                const item = Item.make_item(arg2)
                if (this.hero.add_to_inventory(item)) {
                  await this.log(this.display_item(item), "を 手に入れた。")
                  return
                } else {
                  await this.item_land(item, this.hero.x, this.hero.y)
                }
              }
              break
            default:
              return
            }
          } finally {
            menu2.close()
          }
        }
        break
      default:
        return
      }
    } finally {
      menu.close()
    }
  }

  // 取扱説明。
  // () → 'nothing'
  async help()
  {
    const text =
          [
            '★ キャラクターの移動',
            '',
            '     y k u',
            '     h @ l',
            '     b j n',
            '',
            '★ コマンドキー',
            '',
            '     [Enter] 決定。周りを調べる。',
            '     [Shift] ダッシュ。アイテムの上に乗る。',
            '     s       メニューを開く。',
            '     i       道具一覧を開く。',
            '     >       階段を降りる。足元のワナを踏む、',
            '             アイテムを拾う。',
            '     ,       足元を調べる。',
            '     .       周りを調べる。',
            '     ?       このヘルプを表示。',
            '     Ctrl+P  メッセージ履歴。',
            '     t       装備している投げ物を使う。',
            '     q       キャンセル。',
            '     Q       冒険をあきらめる。',
          ]

    const win = new Curses.Window(23, 50, 1, 4) // lines, cols, y, x
    win.clear()
    win.rounded_box()
    text.forEach( (line, i) => {
      const y = i + 1
      win.setpos(y, 1)
      win.addstr(line)
    })
    await win.getch()
    win.close()

    return 'nothing'
  }

  // ダンジョンをクリアしたリザルト画面。
  async clear_message()
  {
    await SoundEffects.fanfare3()

    const item = this.hero.inventory.find(item => item.name == Dungeon.OBJECTIVE_NAME)
    const message = `${item?.number || '??'}階から魔除けを持って無事帰る！`
    const data = ResultScreen.to_data(this.hero)
    Object.assign(data,
                  {
                    "screen_shot"      : this.take_screen_shot(),
                    "time"             : +new Date - this.start_time,
                    "message"          : message,
                    "level"            : this.level_number,
                    "return_trip"      : this.dungeon.on_return_trip_p(this.hero),
                    "timestamp"        : +new Date,
                    "objective_number" : item?.number || -1,
                  })

    await ResultScreen.run(data)

    await this.add_to_rankings(data)
  }

  cleared_p(data)
  {
    return data["return_trip"] && data["level"] === 0
  }

  async add_to_rankings(data)
  {
    if ( this.add_to_ranking(data, Program.SCORE_RANKING_FILE_NAME, this.sort_ranking_by_score) )
      await this.message_window("スコア番付に載りました。")

    if ( this.cleared_p(data) && this.add_to_ranking(data, Program.TIME_RANKING_FILE_NAME, this.sort_ranking_by_time) )
      await this.message_window("タイム番付に載りました。")

    this.add_to_ranking(data, Program.RECENT_GAMES_FILE_NAME, this.sort_ranking_by_timestamp)
  }

  // ランキングに追加。
  add_to_ranking(data, ranking_file_name, sort_ranking)
  {
    let ranking
    try {
      ranking = JSON.parse(window.localStorage[ranking_file_name])
    } catch(e) {
      if (!(e instanceof SyntaxError))
        throw e
        
      window.localStorage[ranking_file_name] = '[]'
      return this.add_to_ranking(data, ranking_file_name, sort_ranking)
    }

    ranking = sort_ranking(ranking.concat([data]))
    ranking = ranking.slice(0, 20)

    const ranked_in = ranking.some(item => item === data)
    if ( ranked_in ) {
      window.localStorage[ranking_file_name] = JSON.stringify(ranking)
      return true
    } else {
      return false
    }
  }

  // アイテムに適用可能な行動
  actions_for_item(item)
  {
    const actions = item.actions.slice(0)
    if (!this.naming_table.include_p(item.name) || this.naming_table.identified_p(item.name)) {
    } else {
      actions.push("名前")
    }

    actions.push("説明")

    return actions
  }

  // 足元にアイテムを置く。
  async try_place_item(item)
  {
    if (this.level.cell(this.hero.x, this.hero.y).can_place_p()) {
      if ((this.hero.weapon === item || this.hero.shield === item || this.hero.ring === item) && item.cursed) {
        await this.log(this.display_item(item), "は 呪われていて 外れない！")
        return
      }

      this.hero.remove_from_inventory(item)
      if (item.name == "結界の巻物")
        item.stuck = true

      this.level.put_object(item, this.hero.x, this.hero.y)
      this.update_stairs_direction()
      await this.log(this.display_item(item), "を 置いた。")
    } else {
      await this.log("ここには 置けない。")
    }
  }

  display_item(item)
  {
    if (item instanceof Gold)
      return item.to_s()

    switch (item.type) {
    case 'weapon':
    case 'shield':
      if (item.inspected)
        return this.display_inspected_item(item)
      else
        return ["unidentified", item.name]

    case 'ring':
      if (item.inspected)
        return this.display_inspected_item(item)
      else
        return this.display_uninspected_item(item)

    case 'staff':
      if (item.inspected)
        return this.display_inspected_item(item)
      else
        return this.display_uninspected_item(item)

    default:
      return this.display_uninspected_item(item)
    }
  }

  display_inspected_item(item)
  {
    if (item.cursed)
      return ["cursed", item.to_s()]
    else
      return item.to_s()
  }

  display_uninspected_item(item)
  {
    if (this.naming_table.include_p(item.name)) {
      switch (this.naming_table.state(item.name)) {
      case 'identified':
        if (item.type == 'staff') // 杖の種類は判別しているが回数がわからない状態。
          return ["unidentified", item.name]
        else if ( item.type == 'ring' )
          return ["unidentified", item.name]
        else
          return item.to_s()

      case 'nicknamed':
        return this.display_item_by_nickname(item)

      case 'unidentified':
        return ["unidentified", this.naming_table.false_name(item.name)]

      default:
        throw new Error
      }
    } else {
      return item.to_s()
    }
  }

  display_item_by_nickname(item)
  {
    const kind_label =
          ({
            herb:  "草",
            scroll:  "巻物",
            ring:  "指輪",
            staff:  "杖",
          })[item.type] || "？"

    return ["nicknamed", kind_label, ":", this.naming_table.nickname(item.name)]
  }

  // 持ち物メニューを開く。
  // () → :action | :nothing
  async open_inventory()
  {
    const dispfunc = (win, item) => {
      const prefix = (this.hero.weapon === item ||
                      this.hero.shield === item ||
                      this.hero.ring === item ||
                      this.hero.projectile === item) ? "E" : " "
      this.addstr_ml(win, ["span", prefix, item.char, this.display_item(item)])
    }
    let menu = null
    let item = null
    let c = null

    try {
      while (true) {
        item = c = null
        menu = new Menu(this.hero.inventory,
                              { y: 1, x: 0, cols: 28,
                                dispfunc: dispfunc,
                                title: "持ち物 [s]ソート",
                                sortable: true })
        this.cancel_delay()
        await this.render()
        const [command, ... args] = await menu.choose()

        switch ( command ) {
        case  'cancel':
          //Curses.beep()
          return 'nothing'
        case  'chosen':
          item = args[0]

          c = await this.item_action_menu(item)
          if (!c)
            continue
          break
        case  'sort':
          this.hero.sort_inventory()
          break
        }

        if (item && c)
          break
      }

      switch (c) {
      case "置く":
        await this.try_place_item(item)
        break

      case "投げる":
        return await this.throw_item(item)

      case "食べる":
        await this.eat_food(item)
        break

      case "飲む":
        return await this.take_herb(item)

      case "装備":
        await this.equip(item)
        break

      case "読む":
        return await this.read_scroll(item)

      case "ふる":
        return await this.zap_staff(item)

      default:
        await this.log(`case not covered: ${item}を${c}。`)
        break
      }
      return 'action'
    } finally {
      menu?.close()
    }
  }

  async item_action_menu(item)
  {
    const action_menu = new Menu(this.actions_for_item(item), { y: 1, x: 27, cols: 9 })
    try {
      const [c, ...args] = await action_menu.choose()
      switch ( c ) {
      case 'cancel':
        return null
      case 'chosen':
        {
          const c = args[0]
          if (c == "説明") {
            await this.describe_item(item)
            return null
          } else if (c == "名前") {
            await this.render()
            let nickname
            if (this.naming_table.state(item.name) == 'nicknamed')
              nickname = this.naming_table.nickname(item.name)
            else
              nickname = null

            nickname = await NamingScreen.run(nickname)
            this.naming_table.set_nickname(item.name, nickname)
            return null
          } else {
            return c
          }
        }
      default:
        throw new Error
      }
    } finally {
      action_menu.close()
    }
  }

  async describe_item(item)
  {
    let desc
    if (this.naming_table.include_p(item.name) && !this.naming_table.identified_p(item.name))
      desc = "識別されていないので、よくわからない。"
    else
      desc = item.desc

    await this.message_window(desc, { y: 1, x: 27 })
  }

  // アイテム落下則
  // 20 18 16 17 19
  // 13  6  4  5 12
  // 11  3  1  2 10
  // 15  9  7  8 14
  // 25 23 21 22 24

  static LAND_POSITIONS = [
    [0,0], [1,0], [-1,0],
    [0,-1], [1,-1], [-1,-1],
    [0,1], [1,1], [-1,1],
    [2,0], [-2,0],
    [2,-1], [-2,-1],
    [2,1], [-2,1],
    [0,-2], [1,-2], [-1,-2], [2,-2], [-2,-2],
    [0,2], [1,2], [-1,2], [2,2], [-2,2]
  ]

  // 以下の位置(10~25)に落ちるためには、
  // 別の位置(2~9のいずれか)が床でなければならない。
  static LAND_DEPENDENT_POSITION = {
    // "2,0" : [1,0], etc ...
    [[2,0]]   : [1,0],
    [[-2,0]]  : [-1,0],
    [[2,-1]]  : [1,-1],
    [[-2,-1]] : [-1,-1],
    [[2,1]]   : [1,1],
    [[-2,1]]  : [-1,1],
    [[0,-2]]  : [0,-1],
    [[1,-2]]  : [1,-1],
    [[-1,-2]] : [-1,-1],
    [[2,-2]]  : [1,-1],
    [[-2,-2]] : [-1,-1],
    [[0,2]]   : [0,1],
    [[1,2]]   : [1,1],
    [[-1,2]]  : [-1,1],
    [[2,2]]   : [1,1],
    [[-2,2]]  : [-1,1]
  }

  // 投げられたアイテムが着地する。
  async item_land(item, x, y)
  {
    const cell = this.level.cell(x, y)

    if ( cell.trap && !cell.trap.visible )
      cell.trap.visible = true

    for (const [dx, dy] of Program.LAND_POSITIONS) {
      if (Program.LAND_DEPENDENT_POSITION[[dx,dy]]) {
        const [dx2, dy2] = Program.LAND_DEPENDENT_POSITION[[dx,dy]]
        if (! (this.level.in_dungeon_p(x+dx2, y+dy2) &&
               (this.level.cell(x+dx2, y+dy2).type == 'FLOOR' ||
                this.level.cell(x+dx2, y+dy2).type == 'PASSAGE'))
           ) {
          continue
        }
      }

      if (this.level.in_dungeon_p(x+dx, y+dy) &&
          this.level.cell(x+dx, y+dy).can_place_p()) {

        this.level.cell(x+dx, y+dy).put_object(item)
        if (item.name == "結界の巻物" )
          item.stuck = true

        await this.log(this.display_item(item), "は 床に落ちた。")
        return
      }
    }
    await this.log(this.display_item(item), "は消えてしまった。")
  }

  async use_health_item(character, amount, amount_maxhp)
  {
    await SoundEffects.heal()
    if (character.hp_maxed_p())
      await this.increase_max_hp(character, amount_maxhp)
    else
      await this.increase_hp(character, amount)
  }

  // 草がモンスターに当たった時の効果。
  async herb_hits_monster(item, monster, cell)
  {
    this.on_monster_attacked(monster)

    switch ( item.name ) {
    case "薬草":
      if (monster.undead_p()) {
        await this.monster_take_damage(monster, 25, cell)
      } else {
        await this.use_health_item(monster, 25, 2)
      }
      break
    case "高級薬草":
      if (monster.undead_p()) {
        await this.monster_take_damage(monster, 100, cell)
      } else {
        await this.use_health_item(monster, 100, 4)
      }
      break
    case "毒けし草":
      if (monster.poisonous_p()) {
        await this.monster_take_damage(monster, 50, cell)
      } else {
        await this.log("しかし 何も 起こらなかった。")
      }
      break
    case "ちからの種":
      monster.strength += 1
      await this.log(`${this.display_character(monster)}の ちからが 1 上がった。`)
      break
    case "幸せの種":
      // モンスターのレベルというパラメータがないので実装できない。
      await this.log("しかし 何も 起こらなかった。")
      break
    case "すばやさの種":
      switch (  monster.action_point_recovery_rate) {
      case 1:
        monster.action_point_recovery_rate = 2
        monster.action_point = 2
        await this.log(`${this.display_character(monster)}の 足はもう遅くない。`)
        break
      case 2:
        monster.action_point_recovery_rate = 4
        monster.action_point = 4
        await this.log(`${this.display_character(monster)}の 足が速くなった。`)
        break
      case 4:
        await this.log("しかし 何も起こらなかった。")
        break
      default:
        throw new Error
      }
      break
    case "毒草":
      if (monster.strength > 0) {
        monster.strength -= 1
        await this.log(`${this.display_character(monster)}の ちからが 1 下がった。`)
      } else {
        // await this.log("しかし 何も起こらなかった。")
      }

      switch ( monster.action_point_recovery_rate) {
      case 1:
        // await this.log("しかし 何も起こらなかった。")
        break
      case 2:
        monster.action_point_recovery_rate = 1
        monster.action_point = 1
        await this.log(`${this.display_character(monster)}の 足が遅くなった。`)
        break
      case 4:
        monster.action_point_recovery_rate = 2
        monster.action_point = 2
        await this.log(`${this.display_character(monster)}の 足はもう速くない。`)
        break
      default:
        throw new Error
      }
      break
    case "目つぶし草":
      if (! monster.blind_p()) {
        await this.log(`${this.display_character(monster)}は 目が見えなくなった。`)
        monster.status_effects.push(new StatusEffect('blindness', 50))
      }
      break
    case "まどわし草":
      if (! monster.hallucinating_p()) {
        await this.log(`${this.display_character(monster)}は おびえだした。`)
        monster.status_effects.push(new StatusEffect('hallucination', 50))
      }
      break
    case "混乱草":
      if (! monster.confused_p()) {
        await this.log(`${this.display_character(monster)}は 混乱した。`)
        monster.status_effects.push(new StatusEffect('confused', 10))
      }
      break
    case "睡眠草":
      await this.monster_fall_asleep(monster)
      break
    case "ワープ草":
      await this.monster_teleport(monster, cell)
      break
    case "火炎草":
      await this.monster_take_damage(monster, rand(new Range(30, 40, true) /* 30...40 */), cell)
      break
    default:
      await this.log("しかし 何も 起こらなかった。")
    }
  }

  // 杖がモンスターに当たった時の効果。
  async staff_hits_monster(item, monster, cell)
  {
    let [mx, my] = [null, null]
    // 書きなおしたい。
    this.level.all_monsters_with_position.each( ([m, x, y]) => {
      if (m === monster)
        [mx, my] = [x, y]
    })

    if (mx === null)
      throw new Error("staff_hits_monster: monster not found")

    await this.magic_bullet_hits_monster(item, monster, cell, mx, my)
  }

  // 盾がモンスターに当たる。
  async shield_hits_monster(item, monster, cell)
  {
    this.on_monster_attacked(monster)
    const damage = item.number
    await this.monster_take_damage(monster, damage, cell)
  }

  // 武器がモンスターに当たる。
  async weapon_hits_monster(item, monster, cell)
  {
    this.on_monster_attacked(monster)
    const damage = item.number
    await this.monster_take_damage(monster, damage, cell)
  }

  // 魔法弾がモンスターに当たる。
  async projectile_hits_monster(item, monster, cell)
  {
    this.on_monster_attacked(monster)
    const attack = this.get_hero_projectile_attack(item.projectile_strength)
    const damage = ( (attack * Math.pow(15.0/16.0, monster.defense)) * (112 + rand(32))/128.0 ).to_i()
    await this.monster_take_damage(monster, damage, cell)
  }

  // アイテムがモンスターに当たる。
  async item_hits_monster(item, monster, cell)
  {
    await this.log(this.display_item(item), "は ", monster.name, "に当たった。")
    switch (item.type) {
    case 'box':
    case 'food':
    case 'scroll':
    case 'ring':
      this.on_monster_attacked(monster)
      const damage = 1 + rand(1)
      await this.monster_take_damage(monster, damage, cell)
      break
    case 'herb':
      await this.herb_hits_monster(item, monster, cell)
      break
    case 'staff':
      await this.staff_hits_monster(item, monster, cell)
      break
    case 'shield':
      await this.shield_hits_monster(item, monster, cell)
      break
    case 'weapon':
      await this.weapon_hits_monster(item, monster, cell)
      break
    case 'projectile':
      await this.projectile_hits_monster(item, monster, cell)
      break
    default:
      throw new Error("case not covered")
    }
  }

  // アイテムがヒーローに当たる。(今のところ矢しか当たらない？)
  async item_hits_hero(item, monster)
  {
    await this.log(this.display_item(item), `が ${this.hero.name}に当たった。`)
    if (item.type == 'projectile')
      await this.take_damage(this.attack_to_hero_damage(item.projectile_strength))
    else if (item.type == 'weapon' || item.type == 'shield')
      await this.take_damage(this.attack_to_hero_damage(item.number))
    else
      await this.take_damage(this.attack_to_hero_damage(1))
  }

  // モンスターがアイテムを投げる。矢を撃つ敵の行動。
  async monster_throw_item(monster, item, mx, my, dir)
  {
    const [dx, dy] = dir
    let [x, y] = [mx, my]

    while (true) {
      if (!this.level.in_dungeon_p(x+dx, y+dy))
        throw new Error

      const cell = this.level.cell(x+dx, y+dy)
      switch (cell.type) {
      case 'WALL':
      case 'HORIZONTAL_WALL':
      case 'VERTICAL_WALL':
      case 'STATUE':
        await this.item_land(item, x, y)
        return

      case 'FLOOR':
      case 'PASSAGE':
        if ([x+dx, y+dy].eql_p( [this.hero.x, this.hero.y])) {
          if (rand() < 0.125) {
            await SoundEffects.miss()
            await this.item_land(item, x+dx, y+dy)
          } else {
            await SoundEffects.hit()
            await this.item_hits_hero(item, monster)
          }
          return
        } else if (cell.monster) {
          // FIXME: これだと主人公に経験値が入ってしまうな
          if (rand() < 0.125) {
            await SoundEffects.miss()
            await this.item_land(item, x+dx, y+dy)
          } else {
            await SoundEffects.hit()
            await this.item_hits_monster(item, cell.monster, cell)
          }
          return
        }
        break

      default:
        throw new Error ("case not covered")
      }
      [x, y] = [x+dx, y+dy]
    }
  }

  // ドラゴンの炎。
  async breath_of_fire(monster, mx, my, dir)
  {
    const [dx, dy] = dir
    let [x, y] = [mx, my]

    while (true) {
      if (this.level.in_dungeon_p(x+dx, y+dy))
        throw new Error

      const cell = this.level.cell(x+dx, y+dy)
      switch (cell.type) {
      case 'WALL':
      case 'HORIZONTAL_WALL':
      case 'VERTICAL_WALL':
      case 'STATUE':
        return

      case 'FLOOR':
      case 'PASSAGE':
        if ([x+dx, y+dy].eql_p(this.hero.pos)) {
          let damage = rand(new Range(17, 23))
          if (this.hero.shield?.name == "ドラゴンシールド") {
            damage = damage.div(2)
          }
          await this.take_damage(damage)
          return
        } else if (cell.monster) {
          // FIXME: これだと主人公に経験値が入ってしまうな
          await this.monster_take_damage(cell.monster, rand(new Range(17,23)), cell)
          return
        }
        break

      default:
        throw new Error( "case not covered")
      }
      [x, y] = [x+dx, y+dy]
    }
  }

  // ヒーローがアイテムを投げる。
  // (Item, Array)
  async do_throw_item(item, dir, penetrating, momentum)
  {
    const [dx, dy] = dir
    let [x, y] = [this.hero.x, this.hero.y]

    while (true) {
      if (momentum == 0) {
        await this.item_land(item, x, y)
        break
      }
      if (!this.level.in_dungeon_p(x+dx, y+dy) ) {
        await this.log(this.display_item(item), "は どこかに消えてしまった…。")
        break
      }

      const cell = this.level.cell(x+dx, y+dy)
      switch (cell.type) {
      case 'WALL':
      case 'HORIZONTAL_WALL':
      case 'VERTICAL_WALL':
      case 'STATUE':
        if (! penetrating ) {
          await this.item_land(item, x, y)
          return
        }
        break

      case 'FLOOR':
      case 'PASSAGE':
        if ( cell.monster ) {
          if (rand() < 0.125 ) {
            await SoundEffects.miss()
            if ( penetrating ) {
              await this.log(this.display_item(item), "は外れた。")
            } else {
              await this.item_land(item, x+dx, y+dy)
              return
            }
          } else {
            await SoundEffects.hit()
            await this.item_hits_monster(item, cell.monster, cell)
            if (!penetrating)
              return
          }
        }
        break

      default:
        throw new Error( "case not covered" )
      }
      [x, y] = [x+dx, y+dy]
      momentum -= 1
    }
  }

  // 方向を入力させて、その方向のベクトルを返す。
  async ask_direction()
  {
    const text =[
      "y k u",
      "h   l",
      "b j n",
    ]
    const win = new Curses.Window(5, 7, 5, 33) // lines, cols, y, x
    try {
      win.keypad(true)
      win.clear()
      win.rounded_box()
      win.setpos(0, 1)
      win.addstr("方向")
      text.forEach(
        (line, i) => {
          const y = i + 1
          win.setpos(y, 1)
          win.addstr(line.chomp())
        }
      )
      win.setpos(2, 3)
      while (true) {
        const c = await win.getch()
        if (Program.KEY_TO_DIRVEC[c])
          return Program.KEY_TO_DIRVEC[c]
        else if (c == 'q') // キャンセル
          return null
      }
    } finally {
      win.close()
    }
  }

  // アイテムを投げるコマンド。
  // Item -> 'action' | 'nothing'
  async throw_item(item)
  {
    if ( (this.hero.weapon === item || this.hero.shield === item || this.hero.ring === item) &&
         item.cursed ) {
      await this.log(this.display_item(item), "は 呪われていて 外れない！")
      return 'action'
    }

    const dir = await this.ask_direction()
    if (!dir)
      return 'nothing'

    const penetrating = (item.name == "銀の矢")
    const momentum = (item.name == "銀の矢") ? Float.INFINITY : 10
    if (item.type == 'projectile' && item.number > 1) {
      const one = Item.make_item(item.name)
      one.number = 1
      item.number -= 1
      await this.do_throw_item(one, dir, penetrating, momentum)
    } else {
      this.hero.remove_from_inventory(item)
      this.update_stairs_direction()
      await this.do_throw_item(item, dir, penetrating, momentum)
    }
    return 'action'
  }

  // 杖を振るコマンド。
  // Item -> 'nothing' | 'action'
  async zap_staff(item)
  {
    if (item.type != 'staff')
      throw new Error    

    const dir = await this.ask_direction()
    if (!dir) {
      return 'nothing'
    } else {
      if (item.number == 0) {
        await this.log("しかしなにも起こらなかった。")
      } else if (item.number > 0) {
        item.number -= 1
        await this.do_zap_staff(item, dir)
      } else {
        throw new Error( "negative staff number")
      }
      return 'action'
    }
  }

  // モンスターが睡眠状態になる。
  async monster_fall_asleep(monster)
  {
    if (! monster.asleep_p() ) {
      monster.status_effects.push(new StatusEffect('sleep', 5))
      await this.log(`${this.display_character(monster)}は 眠りに落ちた。`)
    }
  }

  // モンスターがワープする。
  async monster_teleport(monster, cell)
  {
    await SoundEffects.teleport()

    const fov = this.level.fov(this.hero.x, this.hero.y)
    const [x, y] = this.level.find_random_place(
      (cell, x, y) => cell.type == 'FLOOR' && !cell.monster && !(x==this.hero.x && y==this.hero.y) && !fov.include_p(x, y)
    ) || [null, null]
    if (x === null) {
      // 視界内でも良い条件でもう一度検索。
      [x, y] = this.level.find_random_place(
        (cell, x, y) => cell.type == 'FLOOR' && !cell.monster && !(x==this.hero.x && y==this.hero.y)
      ) || [null, null]
    }
    if (x === null)
      throw new Error
    cell.remove_object(monster)
    this.level.put_object(monster, x, y)
    monster.goal = null
  }

  // モンスターが変化する。
  async monster_metamorphose(monster, cell, x, y)
  {
    let m
    while (true) {
      m = this.dungeon.make_monster_from_dungeon()
      if (m.name !== monster.name)
        break 
      // 病的なケースで無限ループになる。
    }
    m.state = 'awake'
    cell.remove_object(monster)
    this.level.put_object(m, x, y)
    m.action_point = m.action_point_recovery_rate
    await this.log(`${this.display_character(monster)}は ${m.name}に変わった！ `)
  }

  // モンスターが分裂する。
  async monster_split(monster, cell, x, y)
  {
    const m = Monster.make_monster(monster.name)
    m.state = 'awake'
    const rect = this.level.surroundings(x, y)
    let placed = false
    try {
      rect.each_coords( (x, y) => {
        const cell = this.level.cell(x, y)
        if ( (cell.type == 'PASSAGE' || cell.type == 'FLOOR') &&
             !cell.monster &&
             !(x==this.hero.x && y==this.hero.y)
           )
        {
          this.level.put_object(m, x, y)
          placed = true
          throw 'break'
        }
      })
    } catch (v) {
      if (v != 'break')
        throw v
    }
    if (placed) {
      await this.log(`${this.display_character(monster)}は 分裂した！ `)
    } else {
      await this.log(`${this.display_character(monster)}は 分裂できなかった。`)
    }
  }

  async monster_fall_over(monster, cell, x, y)
  {
    const item = monster.item || (monster.drop_rate > 0 ? this.dungeon.make_item(this.level_number) : null)

    monster.item = null
    monster.drop_rate = 0 // 二度目に転んでも何も落とさない。

    if (item) {
      await this.item_land(item, x, y)
    }

    await this.monster_take_damage(monster, 5, cell)
  }

  // 魔法弾がモンスターに当たる。
  async magic_bullet_hits_monster(staff, monster, cell, x, y)
  {
    this.on_monster_attacked(monster)
    switch ( staff.name ) {
    case "いかずちの杖":
      await this.monster_take_damage(monster, rand(new Range(18, 22, true)), cell)
      break
    case "睡眠の杖":
      await this.monster_fall_asleep(monster)
      break
    case "ワープの杖":
      await this.monster_teleport(monster, cell)
      break
    case "変化の杖":
      await this.monster_metamorphose(monster, cell, x, y)
      break
    case "転ばぬ先の杖":
      await this.monster_fall_over(monster, cell, x, y)
      break
    case "分裂の杖":
      await this.monster_split(monster, cell, x, y)
      break
    case "もろ刃の杖":
      monster.hp = 1
      this.hero.hp = this.hero.hp - (this.hero.hp / 2.0).ceil()
      await this.log(`${this.display_character(monster)}の HP が 1 になった。`)
      break
    case "鈍足の杖":
      switch ( monster.action_point_recovery_rate ) {
      case 1:
        await this.log("しかし 何も起こらなかった。")
        break
      case 2:
        monster.action_point_recovery_rate = 1
        monster.action_point = 1
        await this.log(`${this.display_character(monster)}の 足が遅くなった。`)
        break
      case 4:
        monster.action_point_recovery_rate = 2
        monster.action_point = 2
        await this.log(`${this.display_character(monster)}の 足はもう速くない。`)
        break
      default:
        throw new Error
      }
      break
    case "封印の杖":
      if (!monster.nullified_p()) {
        monster.reveal_self()
        monster.status_effects.push(new StatusEffect('nullification', Float.INFINITY))

        // 通常速度に変更する。
        monster.action_point = 2
        monster.action_point_recovery_rate = 2

        await this.log(`${this.display_character(monster)}の特技は 封印された。`)
      }
      break
    case "即死の杖":
      monster.hp = 0
      await this.check_monster_dead(cell, monster)
      break
    case "とうめいの杖":
      if (!monster.invisible) {
        monster.invisible = true
      }
      break
    case "混乱の杖":
      if (!monster.confused_p() ) {
        monster.status_effects.push(new StatusEffect('confused', 10))
        await this.log(`${this.display_character(monster)}は 混乱した。`)
      }
      break
    default:
      throw new Error("case not covered")
    }
  }

  // 杖を振る。
  async do_zap_staff(staff, dir)
  {
    const [dx, dy] = dir
    let [x, y] = [this.hero.x, this.hero.y]

    while (true) {
      if (!this.level.in_dungeon_p(x+dx, y+dy)) {
        throw new Error 
      }

      const cell = this.level.cell(x+dx, y+dy)
      switch (cell.type) {
      case 'WALL':
      case 'HORIZONTAL_WALL':
      case 'VERTICAL_WALL':
        await this.log("魔法弾は壁に当たって消えた。")
        return

      case 'STATUE':
        await this.log("魔法弾は石像に当たって消えた。")
        return

      case 'FLOOR':
      case 'PASSAGE':
        if (cell.monster) {
          await this.magic_bullet_hits_monster(staff, cell.monster, cell, x+dx, y+dy)
          return
        }
        break
      default:
        throw new Error( "case not covered")
      }
      [x, y] = [x+dx, y+dy]
    }
  }

  // 最大HPが増える。
  async increase_max_hp(character, amount)
  {
    if (character.max_hp >= 999) {
      await this.log("これ以上 HP は増えない！ ")
    } else {
      const increment = [amount, 999 - character.max_hp].min()
      character.max_hp += amount
      character.hp = character.max_hp
      await this.log(`最大HPが ${increment}ポイント 増えた。`)
    }
  }

  // HPが回復する。
  async increase_hp(character, amount)
  {
    const increment = [character.max_hp - character.hp, amount].min()
    character.hp += increment
    await this.log(`HPが ${increment.ceil()}ポイント 回復した。`)
  }

  // ヒーローのちからが回復する。
  async recover_strength()
  {
    this.hero.raw_strength = this.hero.raw_max_strength
    await this.log("ちからが 回復した。")
    await SoundEffects.heal()
  }

  // 巻物を読む。
  // Item -> 'nothing' | 'action'
  async read_scroll(item)
  {
    if (item.type != 'scroll')
      throw new Error( "not a scroll" )

    if ( this.hero.nullified_p() ) {
      await this.log(this.hero.name, "の 口は封じられていて使えない!")
      return 'action'
    }

    if ( item.targeted_scroll_p() ) {
      return await this.read_targeted_scroll(item)
    } else {
      return await this.read_nontargeted_scroll(item)
    }
  }

  async read_targeted_scroll(scroll)
  {
    const target = await this.choose_target()
    if (! target )
      return 'nothing' 

    this.hero.remove_from_inventory(scroll)
    await this.log(this.display_item(scroll), "を 読んだ。")
    await SoundEffects.magic()

    if (this.naming_table.include_p(scroll.name) && ! this.naming_table.identified_p(scroll.name) ) {
      this.naming_table.identify(scroll.name)
      await this.log(`なんと！ ${scroll.name}だった！`)
    }

    switch ( scroll.name ) {
    case "同定の巻物":
      {
        const prevdesc = this.display_item(target)

        let did_identify
        if ( this.naming_table.include_p(target.name) && !this.naming_table.identified_p(target.name) ) {
          this.naming_table.identify(target.name)
          did_identify = true
        } else {
          did_identify = false
        }

        let did_inspect
        if ( ['ring', 'weapon', 'shield', 'staff'].include_p(target.type) && !target.inspected ) {
          target.inspected = true
          did_inspect = true
        } else {
          did_inspect = false
        }

        if ( did_identify || did_inspect ) {
          await this.log(prevdesc, "は ", this.display_item(target), "だった。")
        } else {
          await this.log("これは ", this.display_item(target), "に 間違いない！")
        }
      }
      break

    case "パンの巻物":
      {
        // 装備中のアイテムだったら装備状態を解除する。
        if ( this.hero.weapon === target ) {
          this.hero.weapon = null
        }
        if ( this.hero.shield === target ) {
          this.hero.shield = null
        }
        if ( this.hero.ring === target ) {
          this.hero.ring = null
        }

        const index = this.hero.inventory.index( i => target === i )
        if ( index !== null ) {
          this.hero.inventory[index] = Item.make_item("大きなパン")
          await this.log(this.display_item(target), "は ", this.display_item(this.hero.inventory[index]), "に変わってしまった！")
          await sleep(0.5)
          await SoundEffects.mealtime()
        } else { // パンの巻物にパンの巻物を読んだ。
          await this.log("しかし 何も起こらなかった。")
        }
      }
      break

    case "祈りの巻物":
      if ( target.type == 'staff' ) {
        const old = this.display_item(target)
        const r = rand(new Range(1,5))
        target.number += r
        await this.log(old, `の回数が${r}増えた。`)
      } else {
        await this.log("しかし 何も起こらなかった。")
      }
      break

    default:
      await this.log("実装してない「どれを」巻物だよ。")
    }
    return 'action'
  }

  // () -> Item
  async choose_target()
  {
    const dispfunc = (win, item) => {
      const prefix = (this.hero.weapon === item ||
                      this.hero.shield === item ||
                      this.hero.ring === item   ||
                      this.hero.projectile === item) ? "E" : " "
      this.addstr_ml(win, ["span", prefix, item.char, this.display_item(item)])
    }

    let menu = null

    try {
      while (true) {
        menu = new Menu(this.hero.inventory,
                        {y: 1, x: 0, cols: 28,
                         dispfunc: dispfunc,
                         title: "どれを？",
                         sortable: false})
        await this.render()
        const [command, ...args] = await menu.choose()

        switch ( command ) {
        case 'cancel':
          return null
        case 'chosen':
          return args[0] // item
        }
      }
    } finally {
      if (menu)
        menu.close()
    }
  }

  async read_nontargeted_scroll(item)
  {
    this.hero.remove_from_inventory(item)

    await this.log(this.display_item(item), "を 読んだ。")
    await SoundEffects.magic()

    if (this.naming_table.include_p(item.name) && !this.naming_table.identified_p(item.name) ) {
      this.naming_table.identify(item.name)
      await this.log(`なんと！ ${item.name}だった！`)
    }

    switch ( item.name ) {
    case "あかりの巻物":
      this.level.whole_level_lit = true
      await this.log("ダンジョンが あかるくなった。")
      break
    case "武器強化の巻物":
      if ( this.hero.weapon ) {
        this.hero.weapon.number += 1
        await this.log(`${this.hero.weapon.name}が 少し強くなった。`)
        if ( this.hero.weapon.cursed ) {
          this.hero.weapon.cursed = false
          await this.log("剣の呪いが 解けた。")
        }
      } else {
        await this.log("しかし 何も起こらなかった。")
      }
      break
    case "盾強化の巻物":
      if ( this.hero.shield ) {
        this.hero.shield.number += 1
        await this.log(`${this.hero.shield.name}が 少し強くなった。`)
        if ( this.hero.shield.cursed ) {
          this.hero.shield.cursed = false
          await this.log("盾の呪いが 解けた。")
        }
      } else {
        await this.log("しかし 何も起こらなかった。")
      }
      break
    case "メッキの巻物":
      if ( this.hero.shield && !this.hero.shield.gold_plated ) {
        await this.log(`${this.hero.shield}に メッキがほどこされた！ `)
        this.hero.shield.gold_plated = true
      } else if (this.hero.shield) {
        await this.log("しかし 盾はすでにメッキされている。")
      } else {
        await this.log("しかし 何も起こらなかった。")
      }
      if ( this.hero.shield?.cursed ) {
        this.hero.shield.cursed = false
        await this.log("盾の呪いが 解けた。")
      }
      break
    case "かなしばりの巻物":
      {
        const monsters = []
        const rect = this.level.surroundings(this.hero.x, this.hero.y)
        rect.each_coords( (x, y) => {
          if ( this.level.in_dungeon_p(x, y) ) {
            const m = this.level.cell(x, y).monster
            if (m)
              monsters.push( m )
          }
        })
        if (monsters.size > 0 ) {
          monsters.each(m => {
            if (!m.paralyzed_p()) {
              m.status_effects.push(new StatusEffect('paralysis', 50))
            }
          })
          await this.log("まわりの モンスターの動きが 止まった。")
        } else {
          await this.log("しかし 何も起こらなかった。")
        }
      }
      break
    case "結界の巻物":
      await this.log("何も起こらなかった。足元に置いて使うようだ。")
      break
    case "やりなおしの巻物":
      if ( this.dungeon.on_return_trip_p(this.hero) ) {
        await this.log("帰り道では 使えない。")
      } else if ( this.level_number <= 1 ) {
        await this.log("しかし何も起こらなかった。")
      } else {
        await this.log("不思議なちからで 1階 に引き戻された！ ")
        await SoundEffects.teleport()
        await this.new_level(1 - this.level_number, false)
      }
      break
    case "爆発の巻物":
      await this.log("空中で 爆発が 起こった！ ")
      await this.attack_monsters_in_room(new Range(5,35))
      break
    case "ワナの巻物":
      await this.log("実装してないよ。")
      break
    case "ワナけしの巻物":
      this.level.all_cells_and_positions.each( ([cell, x, y]) => {
        if ( cell.trap ) {
          cell.remove_object(cell.trap)
        }
      })
      await this.log("このフロアから ワナが消えた。")
      break
    case "大部屋の巻物":
      this.level.all_cells_and_positions.each( ([cell, x, y]) => {
        if ( x == 0 || x == 79 ) {
          cell.type = 'VERTICAL_WALL'
        } else if  ( y == 0 || y == 23 ) {
          cell.type = 'HORIZONTAL_WALL'
        } else {
          cell.type = 'FLOOR'
        }
      })
      this.level.rooms.replace([new Room(0, 23, 0, 79)])
      this.level.update_lighting(this.hero.x, this.hero.y)
      await this.log("ダンジョンの壁がくずれた！ ")
      break
    case "解呪の巻物":
      {
        const cursed_items = this.hero.inventory.filter( i => i.cursed )
        if ( cursed_items.size > 0 ) {
          cursed_items.each(item => item.cursed = false)
          await this.log("アイテムの呪いが 解けた。")
        } else {
          await this.log("しかし呪われたアイテムは なかった。")
        }
      }
      break
    case "兎耳の巻物":
      if ( this.hero.audition_enhanced_p() ) {
        await this.log("しかし 何も起こらなかった。")
      } else {
        this.hero.status_effects.push(new StatusEffect('audition_enhancement'))
        await this.log("モンスターの気配を 察知できるようになった。")
      }
      break
    case "豚鼻の巻物":
      if ( this.hero.olfaction_enhanced_p() ) {
        await this.log("しかし 何も起こらなかった。")
      } else {
        this.hero.status_effects.push( new StatusEffect('olfaction_enhancement') )
        await this.log("アイテムを 嗅ぎ付けられるようになった。")
      }
      break
    case "封印の巻物":
      if ( this.hero.nullified_p() ) {
        await this.log("しかし 何も起こらなかった。")
      } else {
        this.hero.status_effects.push(new StatusEffect('nullification'))
      }
      break
    default:
      await this.log("実装してないよ。")
    }
    return 'action'
  }

  on_monster_attacked(monster)
  {
    this.wake_monster(monster)
    // かなしばり状態も解ける。
    monster.status_effects.reject_d(e => e.type == 'paralysis')

    switch ( monster.name ) {
    case "動くモアイ像":
      monster.status_effects.reject_d(e => e.type == 'held')
      break

    case "四人トリオ":
      if (monster.group) { // 単独湧きの場合は無い。
        monster.group.each(friend => {
          if (friend === monster)
            return // 自分は処理しなくていい。

          this.wake_monster(friend)
          // かなしばり状態も解ける。
          friend.status_effects.reject_d(e => e.type == 'paralysis')
        })
      }
      break
    }
  }

  // モンスターを起こす。
  wake_monster(monster)
  { 
    if (monster.state == 'asleep')
      monster.state = 'awake'
  }

  // 爆発の巻物の効果。視界全体に攻撃。
  async attack_monsters_in_room(range)
  {
    const rect = this.level.fov(this.hero.x, this.hero.y)
    const points = []
    await rect.each_coords_async(async (x, y) => {
      if (this.level.in_dungeon_p(x, y)) {
        const cell = this.level.cell(x, y)
        const monster = cell.monster
        if (monster) {
          this.on_monster_attacked(monster)
          await this.monster_take_damage(monster, rand(range), cell)
        }
      }
    })
  }

  // 草を飲む。
  // Item -> :nothing | :action
  async take_herb(item)
  {
    if (item.type != 'herb')
      throw new Error ("not a herb")

    if (this.hero.nullified_p()) {
      await this.log(this.hero.name, "の 口は封じられていて使えない!")
      return 'action'
    }

    let vec
    if (item.name == "火炎草") {
      vec = await this.ask_direction()
      if (!vec) {
        return 'nothing'
      }
    }

    // 副作用として満腹度5%回復。
    this.hero.increase_fullness(5.0)

    this.hero.remove_from_inventory(item)
    await this.log(this.display_item(item), "を 薬にして 飲んだ。")

    if (this.naming_table.include_p(item.name) && !this.naming_table.identified_p(item.name)) {
      this.naming_table.identify(item.name)
      await this.log(`なんと！ ${item.name}だった！`)
    }

    switch (item.name) {
    case "薬草":
      await this.use_health_item(this.hero, 25, 2)
      await this.remove_status_effect(this.hero, 'blindness')
      break

    case "高級薬草":
      await this.use_health_item(this.hero, 100, 4)
      await this.remove_status_effect(this.hero, 'blindness')
      await this.remove_status_effect(this.hero, 'confused')
      await this.remove_status_effect(this.hero, 'hallucination')
      break

    case "毒けし草":
      if (!this.hero.strength_maxed_p()) {
        await this.recover_strength()
      }
      break

    case "ちからの種":
      if (this.hero.strength_maxed_p()) {
        this.hero.raw_max_strength += 1
        this.hero.raw_strength = this.hero.raw_max_strength
        await this.log("ちからの最大値が 1 ポイント ふえた。")
      } else {
        this.hero.raw_strength += 1
        await this.log("ちからが 1 ポイント 回復した。")
      }
      break

    case "幸せの種":
      await this.hero_levels_up()
      break

    case "すばやさの種":
      switch (this.hero.quick_p()) {
      case true:
        await this.log("しかし 何も起こらなかった。")
        break

      case false:
        this.hero.status_effects.push(new StatusEffect('quick', 3))
        await this.log(`${this.hero.name}の 足が速くなった。`)
        this.hero.action_point = 2
        break
      }
      break

    case "目薬草":
      if (!this.hero.trap_detecting_p()) {
        this.hero.status_effects.push(new StatusEffect('trap_detection'))
        await this.log("ワナが見えるようになった。")
      }
      await this.remove_status_effect(this.hero, 'blindness')
      break

    case "毒草":
      await this.take_damage(5)
      await this.take_damage_strength(3)
      await this.remove_status_effect(this.hero, 'confused')
      await this.remove_status_effect(this.hero, 'hallucination')
      break

    case "目つぶし草":
      if (!this.hero.blind_p()) {
        this.hero.status_effects .push( new StatusEffect('blindness', 50) )
        await this.log(this.hero.name, "の 目が見えなくなった。")
      }
      break

    case "まどわし草":
      if (!this.hero.hallucinating_p()) {
        this.hero.status_effects .push( new StatusEffect('hallucination', 50))
        await this.log("ウェーイ！")
      }
      break

    case "睡眠草":
      await this.hero_fall_asleep()
      break

    case "ワープ草":
      await this.log(`${this.hero.name}は ワープした。`)
      await this.wait_delay()
      await this.hero_teleport()
      break

    case "火炎草":
      {
        await this.log(`${this.hero.name}は 口から火を はいた！ `)

        const [tx, ty] = Vec.plus([this.hero.x, this.hero.y], vec)
        if (! this.level.in_dungeon_p(tx, ty)) {
          throw new Error 
        }
        const cell = this.level.cell(tx, ty)

        const thing = cell.item || cell.gold
        if (thing) {
          cell.remove_object(thing)
          await this.log(`${thing}は 燃え尽きた。`)
        }

        if (cell.monster) {
          await this.monster_take_damage(cell.monster, rand(new Range(65, 75, true)), cell)
        }
      }
      break

    case "混乱草":
      if (!this.hero.confused_p()) {
        this.hero.status_effects.push(new StatusEffect('confused', 10))
        await this.log(`${this.hero.name}は 混乱した。`)
      }
      break

    default:
      throw new Error( `uncoverd case: ${item}`)
    }
    return 'action'
  }

  // ヒーローのレベルが上がる効果。
  async hero_levels_up(silent = false)
  {
    const required_exp = CharacterLevel.lv_to_exp(this.hero.lv + 1)
    if (required_exp) {
      this.hero.exp = required_exp
      await this.check_level_up(silent)
    } else {
      await this.log("しかし 何も起こらなかった。")
    }
  }

  // ヒーローのレベルが下がる効果。
  async hero_levels_down()
  {
    if (this.hero.lv == 1) {
      await this.log("しかし 何も起こらなかった。")
    } else {
      const exp = CharacterLevel.lv_to_exp(this.hero.lv) - 1
      this.hero.lv = this.hero.lv - 1
      this.hero.exp = exp
      this.hero.max_hp = [this.hero.max_hp - 5, 1].max()
      this.hero.hp = [this.hero.hp, this.hero.max_hp].min()
      await this.log(`${this.hero.name}の レベルが下がった。`)
    }
  }

  // ヒーローが眠る効果。
  async hero_fall_asleep()
  {
    if (this.hero.sleep_resistent_p()) {
      await this.log("しかし なんともなかった。")
    } else {
      if (!this.hero.asleep_p()) {
        this.hero.status_effects.push(new StatusEffect('sleep', 5))
        await this.log(`${this.hero.name}は 眠りに落ちた。`)
      }
    }
  }

  // 装備する。
  async equip(item)
  {
    if (!this.hero.inventory.find(i => i === item))
      throw new Error( "not in inventory" )

    switch ( item.type ) {
    case 'weapon':
      await this.equip_weapon(item)
      break
    case 'shield':
      await this.equip_shield(item)
      break
    case 'ring':
      await this.equip_ring(item)
      break
    case 'projectile':
      await this.equip_projectile(item)
      break
    default:
      throw new Error( "equip" )
    }
  }

  // 武器を装備する。
  async equip_weapon(item)
  {
    if (this.hero.weapon?.cursed) {
      await this.log(this.display_item(this.hero.weapon), "は 呪われていて 外れない！")
    } else if (this.hero.weapon === item) { // coreferential?
      this.hero.weapon = null
      await this.log("武器を 外した。")
    } else {
      this.hero.weapon = item
      if (!item.inspected) {
        item.inspected = true
      }
      await this.log(this.display_item(item), "を 装備した。")
      await SoundEffects.weapon()
      if (item.cursed) {
        await this.log("なんと！ ", this.display_item(item), "は呪われていた！")
      }
    }
  }

  // 盾を装備する。
  async equip_shield(item)
  {
    if (this.hero.shield?.cursed) {
      await this.log(this.display_item(this.hero.shield), "は 呪われていて 外れない！")
    } else if (this.hero.shield === item) {
      this.hero.shield = null
      await this.log("盾を 外した。")
    } else {
      this.hero.shield = item
      if (!item.inspected) {
        item.inspected = true
      }
      await this.log(this.display_item(item), "を 装備した。")
      await SoundEffects.weapon()
      if (item.cursed) {
        await this.log("なんと！ ", this.display_item(item), "は呪われていた！")
      }
    }
  }

  // 指輪を装備する。
  async equip_ring(item)
  {
    if (this.hero.ring?.cursed) {
      await this.log(this.display_item(this.hero.ring), "は 呪われていて 外れない！")
    } else if (this.hero.ring === item) {
      this.hero.ring = null
      await this.log(this.display_item(item), "を 外した。")
    } else {
      this.hero.ring = item
      // if (!item.inspected) {
      //   item.inspected = true
      // }
      await this.log(this.display_item(item), "を 装備した。")
      await SoundEffects.weapon()
      if (item.cursed) {
        await this.log("なんと！ ", this.display_item(item), "は呪われていた！")
      }
    }
  }

  // 矢を装備する。
  async equip_projectile(item)
  {
    if (this.hero.projectile === item) {
      this.hero.projectile = null
      await this.log(this.display_item(item), "を 外した。")
    } else {
      this.hero.projectile = item
      await this.log(this.display_item(item), "を 装備した。")
      await SoundEffects.weapon()
    }
  }

  async increase_max_fullness(amount)
  {
    const old = this.hero.max_fullness
    if (this.hero.max_fullness < 200.0) {
      this.hero.increase_max_fullness(amount)
      this.hero.fullness = this.hero.max_fullness
      await this.log(
        sprintf("最大満腹度が %.0f%% 増えた。", this.hero.max_fullness - old)
      )
    }
  }

  // 満腹度が回復する。
  async increase_fullness(amount)
  {
    this.hero.increase_fullness(amount)
    if (this.hero.full_p()) {
      await this.log("おなかが いっぱいに なった。")
    } else {
      await this.log("少し おなかが ふくれた。")
    }
  }

  // ヒーローがダメージを受ける。
  async take_damage(amount, opts = {})
  {
    if (opts.quiet) {
      this.stop_dashing()
    } else {
      await this.log(
        sprintf("%.0f ポイントの ダメージを受けた。", amount)
      )
    }

    this.hero.hp -= amount
    if (this.hero.hp < 1.0) {
      this.hero.hp = 0.0
      throw new HeroDied
    }
  }

  // ちからの現在値にダメージを受ける。
  async take_damage_strength(amount)
  {
    if (this.hero.poison_resistent_p())
      return

    const decrement = [amount, this.hero.raw_strength].min()
    if (this.hero.raw_strength > 0) {
      await this.log(`ちからが ${decrement} ポイント下がった。`)
      this.hero.raw_strength -= decrement
    } else {
      // ちから 0 だから平気だもん。
    }
  }

  // パンを食べる。
  async eat_food(food)
  {
    if (food.type !== 'food')
      throw new Error( "not a food" )

    if (this.hero.nullified_p()) {
      await this.log(this.hero.name, "の 口は封じられていて使えない!")
      return 'action'
    }

    this.hero.remove_from_inventory(food)
    await this.log(`${this.hero.name}は ${food.name}を 食べた。`)
    switch ( food.name ) {
    case "パン":
      if (this.hero.full_p()) {
        await this.increase_max_fullness(5.0)
      } else {
        await this.increase_fullness(50.0)
      }
      break
    case "くさったパン":
      if (this.hero.full_p()) {
        await this.increase_max_fullness(10.0)
      } else {
        await this.increase_fullness(100.0)
      }
      await this.take_damage(10)
      await this.take_damage_strength(3)
      break
    case "大きなパン":
      if (this.hero.full_p()) {
        await this.increase_max_fullness(10.0)
      } else {
        await this.increase_fullness(100.0)
      }
      break
    default:
      throw new Error (`food? ${food}`)
    }
  }

  // 下の階へ移動。
  async cheat_go_downstairs()
  {
    if (this.level_number < 99) {
      await this.new_level(+1, false)
    }
    return 'nothing'
  }

  // 上の階へ移動。
  async cheat_go_upstairs()
  {
    if (this.level_number > 1) {
      await this.new_level(-1, false)
    }
    return 'nothing'
  }

  // 階段を降りる。
  // () -> :nothing
  async go_downstairs()
  {
    const st = this.level.cell(this.hero.x, this.hero.y).staircase
    if (st) {
      await SoundEffects.staircase()
      await this.new_level(st.upwards ? -1 : +1, true)
    } else {
      await this.log("ここに 階段は ない。")
    }
    return 'nothing'
  }

  // 階段の方向を更新。
  update_stairs_direction()
  {
    this.level.stairs_going_up = this.dungeon.on_return_trip_p(this.hero)
  }

  async shop_interaction()
  {
    Curses.stdscr.clear()
    Curses.stdscr.refresh()
    await this.message_window("階段の途中で行商人に出会った。")
    Curses.stdscr.clear()
    Curses.stdscr.refresh()
    const shop = new Shop(this.hero, this.display_item.bind(this), this.addstr_ml.bind(this))
    await shop.run()
  }

  // 新しいフロアに移動する。
  async new_level(dir = +1, shop)
  {
    this.level_number += dir
    if (this.level_number == 0) {
      this.beat = true
      await this.clear_message()
      this.quitting = true
    } else {
      if (this.level_number == 100)
        this.level_number = 99

      if (shop && this.level_number != 1 && dir == +1 && rand() < 0.1)
        await this.shop_interaction()

      this.level = this.dungeon.make_level(this.level_number, this.hero)
      this.update_stairs_direction()

      // 状態異常のクリア
      this.hero.status_effects.clear()

      // 主人公を配置する。
      const [x, y] = this.level.get_random_character_placeable_place()
      await this.hero_change_position(x, y)

      if (this.level.has_type_at(Item, x, y) ||
          this.level.has_type_at(StairCase, x, y) ||
          this.level.has_type_at(Trap, x, y))
        await this.log("足元になにかある。")

      // 視界
      this.level.update_lighting(this.hero.x, this.hero.y)

      // 行動ポイントの回復。上の階で階段を降りる時にあまったポイントに
      // 影響されたくないので下の代入文で合ってる。
      this.hero.action_point = this.hero.action_point_recovery_rate
      this.recover_monster_action_point()
    }
  }

  // キー入力。
  async read_command(message_status)
  {
    Curses.flushinp()
    if (message_status == 'no_message')
      Curses.timeout = -1
    else
      Curses.timeout = 1000 // milliseconds

    Curses.curs_set(0)
    const c = await Curses.getch()
    Curses.curs_set(1)
    return c
  }

  display_character(character)
  {
    if ( character instanceof Monster && character.invisible && !this.level.whole_level_lit )
      return "見えない敵"
    else
      return character.name
  }

  trap_visible_to_hero(trap)
  {
    if ( !(trap instanceof Trap) )
      throw new Error('type error')

    return (this.hero.trap_detecting_p() || this.hero.ring?.name == "よくみえの指輪" || trap.visible)
  }

  visible_to_hero_p(obj, lit, globally_lit, explored)
  {
    if (obj instanceof Trap) {
      return (explored || globally_lit) && this.trap_visible_to_hero(obj)
    } else if (obj instanceof Monster) {
      if (this.hero.audition_enhanced_p() || lit || globally_lit) {
        const invisible = obj.invisible && !globally_lit && !(this.hero.trap_detecting_p() || this.hero.ring?.name == "よくみえの指輪")
        if (invisible)
          return false
        else
          return true
      } else
        return false
    } else if (obj instanceof Gold || obj instanceof Item) {
      return this.hero.olfaction_enhanced_p() || explored || globally_lit
    } else if (obj instanceof StairCase) {
      return explored || globally_lit
    } else {
      throw new Error
    }
  }

  dungeon_char(x, y)
  {
    if (this.hero.x == x && this.hero.y == y)
      return this.hero.char
    else if (this.hero.blind_p())
      return "  "
    else if (!(y >= 0 && y < this.level.height &&
               x >= 0 && x < this.level.width)) {
      if (this.level.whole_level_lit)
        return this.level.tileset['WALL']
      else
        return "  "
    } else {
      const obj = this.level.first_visible_object(x, y, this.visible_to_hero_p.bind(this))

      if (obj) {
        if (this.hero.hallucinating_p()) {
          if ( obj instanceof Monster )
            return u(0x10417e) + u(0x10417f) // 色違いの主人公
          else if (obj instanceof Trap || obj instanceof StairCase || obj instanceof Gold || obj instanceof Item)
            return u(0x10416a) + u(0x10416b) // 花
          else
            return '??'
        } else
          return obj.char
      } else {
        const tile = this.level.background_char(x, y) 
        if (this.hero.hallucinating_p()) {
          if (tile == '\u{104124}\u{104125}')
            return u(0x104168) + u(0x104169)
          else
            return tile
        } else
          return tile
      }
    }
  }

  // マップを表示。
  render_map()
  {
    // マップの描画
    for (let y = 0; y < Curses.lines; y++) {
      for (let x = 0; x < Curses.cols.div(2); x++) {
        Curses.setpos(y, x*2)
        // 画面座標から、レベル座標に変換する。
        const y1 = y + this.hero.y - Curses.lines.div(2)
        const x1 = x + this.hero.x - Curses.cols.div(4)
        Curses.addstr(this.dungeon_char(x1, y1))
      }
    }
  }

  // 主人公を中心として 5x5 の範囲を撮影する。
  // 返り値は String の Array。要素数は 5。
  // 個々の String の文字数は 10。
  take_screen_shot()
  {
    let rows = []
    for (let dy = -2; dy <= 2; dy++) {
      let buf = ""
      for (let dx = -7; dx <= 7; dx++) {
        const y1 = this.hero.y + dy
        const x1 = this.hero.x + dx
        if (this.level.in_dungeon_p(x1, y1))
          buf += this.dungeon_char(x1, y1)
        else
          buf += '  '
      }
      rows.push(buf)
    }
    return rows
  }

  // static DELAY_SECONDS = 0.4
  static DELAY_MILLISECONDS = 400

  // 画面の表示。
  async render()
  {
    await this.wait_delay()

    this.render_map()
    this.render_status()
    const message_status = this.render_message()
    // console.log(message_status)
    Curses.refresh()

    this.last_rendered_at = +new Date
    return message_status
  }

  async wait_delay()
  {
    const t = +new Date
    // console.log({t, last_rendered_at: this.last_rendered_at, DELAY_MILLISECONDS:Program.DELAY_MILLISECONDS})
    if (t - this.last_rendered_at < Program.DELAY_MILLISECONDS) {
      await delay( (this.last_rendered_at + Program.DELAY_MILLISECONDS) - t )
    }
    // else {
    //   console.log ('no delay')
    // }
  }

  cancel_delay()
  {
    // const epoch = new Date
    // epoch.setTime(0)
    this.last_rendered_at = 0
  }

  static FRACTIONS = {
    "1": "▏",
    "2": "▎",
    "3": "▍",
    "4": "▌",
    "5": "▋",
    "6": "▊",
    "7": "▉",
  }

  // () -> String
  render_health_bar()
  {
    const eighths = ((this.hero.hp.fdiv(this.hero.max_hp)) * 80).round()
    const ones = eighths.div(8)
    const fraction = eighths % 8
    if (fraction == 0)
      return "█".times(ones) +  " ".times(10 - ones)
    else
      return "█".times(ones) + Program.FRACTIONS[fraction] + " ".times(10 - ones - 1)
  }

  // 画面最上部、ステータス行の表示。
  render_status()
  {
    const low_hp   = this.hero.hp.floor() <= (this.hero.max_hp / 10.0).ceil()
    const starving = this.hero.fullness <= 0.0
    const dungeon  = this.hard_mode ? "special" : "span"

    Curses.setpos(0, 0)
    Curses.clrtoeol()
    this.addstr_ml(Curses, ["span", sprintf("%d", this.level_number), [dungeon, "F"], "  "])
    this.addstr_ml(Curses, ["span", [dungeon, "Lv"], sprintf(" %d  ", this.hero.lv)])
    if(low_hp)
      Curses.attron(Curses.A_BLINK)
    this.addstr_ml(Curses, [dungeon, "HP"])
    if (low_hp)
      Curses.attroff(Curses.A_BLINK)
    Curses.addstr(sprintf(" %3d", this.hero.hp))
    this.addstr_ml(Curses, [dungeon, "/"])
    Curses.addstr(sprintf("%d  ", this.hero.max_hp))
    Curses.attron(Curses.color_pair(Program.HEALTH_BAR_COLOR_PAIR))
    Curses.addstr(this.render_health_bar())
    Curses.attroff(Curses.color_pair(Program.HEALTH_BAR_COLOR_PAIR))
    Curses.addstr(sprintf("  %d", this.hero.gold))
    this.addstr_ml(["span", [dungeon, "G"], "  "])
    if (starving)
      Curses.attron(Curses.A_BLINK)
    this.addstr_ml(Curses, [dungeon, "満"])
    if (starving)
      Curses.attroff(Curses.A_BLINK)
    Curses.addstr(sprintf(" %d",  this.hero.fullness.ceil()))
    this.addstr_ml([dungeon, "% "])
    Curses.addstr(sprintf("%s ",    this.hero.status_effects.map(_ => _.name).join(' ')))
    this.addstr_ml([dungeon, "["])
    Curses.addstr(sprintf("%04d", this.level.turn))
    this.addstr_ml([dungeon, "]"])
  }

  // メッセージの表示。
  render_message()
  {
    if (this._log.lines.length > 0) {
      Curses.setpos(Curses.lines-1, 0)
      const msg = ["span", ... this._log.lines]
      this.addstr_ml(Curses, msg)
      Curses.clrtoeol()
      this._log.lines.clear()
      this.last_message = msg
      this.last_message_shown_at = +new Date
      return 'message_displayed'
    } else if (+new Date - this.last_message_shown_at < Program.DELAY_MILLISECONDS) {
      Curses.setpos(Curses.lines-1, 0)
      this.addstr_ml(Curses, this.last_message)
      Curses.clrtoeol()
      return 'last_message_redisplayed'
    } else {
      return 'no_message'
    }
  }

  // 死んだ時のリザルト画面。
  async gameover_message()
  {
    await SoundEffects.gameover()

    let message
    if (this.dungeon.on_return_trip_p(this.hero))
      message = `魔除けを持って${this.level_number}階で力尽きる。`
    else
      message = `${this.level_number}階で力尽きる。`

    const data = Object.assign(
      ResultScreen.to_data(this.hero),
      {
        "screen_shot": this.take_screen_shot(),
        "time": +new Date - this.start_time,
        "message": message,
        "level": this.level_number,
        "return_trip": this.dungeon.on_return_trip_p(this.hero),
        "timestamp": +new Date,
      }
    )

    await ResultScreen.run(data)

    await this.add_to_rankings(data)
  }

  async give_up_message()
  {
    let message
    if (this.dungeon.on_return_trip_p(this.hero))
      message = `魔除けを持って${this.level_number}階であきらめた。`
    else
      message = `${this.level_number}階で冒険をあきらめた。`
 
    const data = ResultScreen.to_data(this.hero)

    Object.assign(data,
                  {"screen_shot": this.take_screen_shot(),
                   "time": +new Date - this.start_time,
                   "message": message,
                   "level": this.level_number,
                   "return_trip": this.dungeon.on_return_trip_p(this.hero),
                   "timestamp": +new Date,
                  })

    await ResultScreen.run(data)

    await this.add_to_rankings(data)
  }

  // 次のレベルまでに必要な経験値。
  exp_until_next_lv()
  {
    if (this.hero.lv == 37)
      return null
    else
      return CharacterLevel.lv_to_exp(this.hero.lv + 1) - this.hero.exp
  }

  async main_menu()
  {
    const menu = new Menu(["道具",
                           "足元",
                           "メッセージ履歴",
                           "あきらめる",
                          ],
                          { cols: 18, y: 1, x: 0 })
    let status = null
    try {
      while (true) {
        this.cancel_delay()
        await this.render()
        status = this.create_status_window(13, 0)
        status.refresh()
        const [command, arg] = await menu.choose()
        status.close()
        status = null
        switch ( command ) {
        case 'chosen':
          switch ( arg ) {
          case "道具":
            const result = await this.open_inventory()
            if (result == 'nothing')
              continue
            else
              return result
            break
          case "足元":
            {
              const result = await this.activate_underfoot()
              // 階段を降りる場合があるので、何もなくてもメニューを閉じる。
              return result
            }
            break
          case "メッセージ履歴":
            await this.open_history_window()
            continue
            break
          case "あきらめる":
            if (await this.confirm_give_up()) {
              this.give_up_message()
              this.quitting = true
              return 'nothing'
            } else {
              continue
            }
          }
          break
        case 'cancel':
          return 'nothing'
        }
      }
    } finally {
      console.log(status)
      status?.close()
      menu.close()
    }
  }

  // Returns: Curses.Window
  create_status_window(winy = 1, winx = 0)
  {
    const until_next_lv = this.exp_until_next_lv() ? this.exp_until_next_lv().to_s() : "∞"
    const disp = item => !item ? 'なし' : this.display_item(item)
    const text =
      [
        ["span", sprintf(" 攻撃力 %d", this.get_hero_attack())],
        ["span", sprintf(" 防御力 %d", this.get_hero_defense())],
        ["span", "   武器 ", disp(this.hero.weapon)],
        ["span", "     盾 ", disp(this.hero.shield)],
        ["span", "   指輪 ", disp(this.hero.ring)],
        ["span", sprintf(" ちから %d/%d", this.hero.strength, this.hero.max_strength)],
        ["span", sprintf(" 経験値 %d", this.hero.exp)],
        ["span", sprintf(" つぎのLvまで %s", until_next_lv)],
        ["span", sprintf(" 満腹度 %d%%/%d%%", this.hero.fullness.ceil(), this.hero.max_fullness)],
      ]

    const win = new Curses.Window(text.size + 2, 32, winy, winx) // lines, cols, y, x
    win.clear()
    win.rounded_box()
    win.setpos(0, 1)
    win.addstr(this.hero.name)
    text.forEach( (line, i) => {
      const y = 1 + i
      win.setpos(y, 1)
      this.addstr_ml(win, line)
    })
    return win
  }

  async status_window()
  {
    const win = this.create_status_window()
    try {
      await win.getch()
    } finally {
      win.close()
    }
  }

  // 位置 v1 と v2 は縦・横・ナナメのいずれかの線が通っている。
  aligned_p(v1, v2)
  {
    const diff = Vec.minus(v1, v2)
    return diff[0] === 0 ||
           diff[1] === 0 ||
           diff[0].abs() == diff[1].abs()
  }

  // モンスターの特技が使える位置にヒーローが居るか？
  trick_in_range_p(m, mx, my)
  {
    switch ( m.trick_range ) {
    case 'none':
      return false

    case 'sight':
      return this.level.fov(mx, my).include_p(this.hero.x, this.hero.y)

    case 'line':
      return ( this.level.fov(mx, my).include_p(this.hero.x, this.hero.y) &&
               this.aligned_p([mx, my], [this.hero.x, this.hero.y]) )
    case 'reach':
      return ( this.level.can_attack_p(m, mx, my, this.hero.x, this.hero.y) )

    default:
      throw new Error
    }
  }

  // 特技を使う条件が満たされているか？
  trick_applicable_p(m)
  {
    const [mx, my] = this.level.coordinates_of(m)
    let able
    switch ( m.name ) {
    case "目玉":
      able = !this.hero.confused_p()
      break
    case "白い手":
      able = !this.hero.held_p()
      break
    case "どろぼう猫":
      able = !m.hallucinating_p()
      break
    default:
      able = true
    }

    return this.trick_in_range_p(m, mx, my) && able
  }

  // (Monster, Integer, Integer) → Action
  monster_move_action(m, mx, my)
  {
    console.log({m, mx, my})
    // 動けない。
    if (m.held_p()) {
      return new Action('rest', null)
    }

    // * モンスターの視界内にヒーローが居れば目的地を再設定。
    if (!(!m.nullified_p() && m.hallucinating_p()) && this.level.fov(mx, my).include_p(this.hero.x, this.hero.y)) {
      m.goal = [this.hero.x, this.hero.y]
    }

    // * 目的地がある場合...
    if (m.goal) {
      // * 目的地に到着していれば目的地をリセット。
      if (m.goal.eql_p( [mx, my] )) {
        m.goal = null
      }
    }

    if (m.goal) {
      // * 目的地があれば目的地へ向かう。(方向のpreferenceが複雑)
      const dir = Vec.normalize(Vec.minus(m.goal, [mx, my]))
      const i = Program.DIRECTIONS.index(dir)
      console.log({name:m.name, goal:m.goal, dir, i })
      for (let [dx, dy] of [i, ...[i - 1, i + 1].shuffle(), ...[i - 2, i + 2].shuffle()].map(j => Program.DIRECTIONS[j.mod(8)])) {
        if (this.level.can_move_to_p(m, mx, my, mx+dx, my+dy) &&
           ![mx+dx, my+dy].eql_p( [this.hero.x, this.hero.y] )&&
           this.level.cell(mx+dx, my+dy).item?.name != "結界の巻物") {
          return new Action('move', [dx, dy])
        }
      }

      // 目的地に行けそうもないのであきらめる。(はやっ!)
      m.goal = null
      return new Action('rest', null)
    } else {
      // * 目的地が無ければ...

      // * 部屋の中に居れば、出口の1つを目的地に設定する。
      const room = this.level.room_at(mx, my)
      if (room) {
        const exit_points = this.level.room_exits(room)
        const preferred = exit_points.reject(
          ([x,y]) => [x,y].eql_p( [mx - m.facing[0], my - m.facing[1]]) // 今入ってきた出入口は除外する。
        )
        if (preferred.length > 0) {
          m.goal = preferred.sample()
          return this.monster_action(m, mx, my)
        } else if (exit_points.length > 0) {
          // 今入ってきた出入口でも選択する。
          m.goal = exit_points.sample()
          return this.monster_action(m, mx, my)
        } else {
          return new Action('rest', null) // どうすりゃいいんだい
        }
      } else {
        // * 部屋の外に居れば

        // * 反対以外の方向に進もうとする。
        const dirs = [
          Vec.rotate_clockwise_45(m.facing, +2),
          Vec.rotate_clockwise_45(m.facing, -2),
          Vec.rotate_clockwise_45(m.facing, +1),
          Vec.rotate_clockwise_45(m.facing, -1),
          Vec.rotate_clockwise_45(m.facing,  0),
        ].shuffle()
        for (const [dx, dy] of dirs) {
          if (this.level.can_move_to_p(m, mx, my, mx+dx, my+dy) &&
              ![mx+dx, my+dy].eql_p( [this.hero.x, this.hero.y] ) &&
              this.level.cell(mx+dx, my+dy).item?.name != "結界の巻物") {
            return new Action('move', [dx,dy])
          }
        }

        // * 進めなければその場で足踏み。反対を向く。
        m.facing = Vec.negate(m.facing)
        return new Action('rest', null)
      }
    }
  }

  // (Monster, Integer, Integer) → Action
  monster_tipsy_move_action(m, mx, my)
  {
    const candidates = []
    const rect = this.level.surroundings(mx, my)
    rect.each_coords( (x, y) => {
      if ( !(this.level.in_dungeon_p(x, y) &&
             (this.level.cell(x, y).type == 'FLOOR' ||
              this.level.cell(x, y).type == 'PASSAGE')) )
        return

      if (![x,y].eql_p( [this.hero.x,this.hero.y] ) &&
          this.level.can_move_to_p(m, mx, my, x, y) &&
          this.level.cell(x, y).item?.name != "結界の巻物")
        candidates.push( [x, y] )
    })

    if (candidates.length > 0) {
      const [x, y] = candidates.sample()
      return new Action('move', [x - mx, y - my])
    } else {
      return new Action('rest', null)
    }
  }

  monster_confused_action(m, mx, my)
  {
    const candidates = []
    const rect = this.level.surroundings(mx, my)
    rect.each_coords((x, y) => {
      if (!( this.level.in_dungeon_p(x, y) &&
             (this.level.cell(x, y).type == 'FLOOR' ||
              this.level.cell(x, y).type == 'PASSAGE'))) {
        return
      }

      if (this.level.can_move_to_terrain_p(m, mx, my, x, y) &&
          this.level.cell(x, y).item?.name !== "結界の巻物") {
        candidates.push([x, y])
      }
    })

    if (candidates.size > 0) {
      const [x, y] = candidates.sample()
      if ([x,y].eql_p(this.hero.pos) || this.level.cell(x,y).monster) {
        return new Action('attack', [x-mx, y-my])
      } else {
        return new Action('move', [x - mx, y - my])
      }
    } else {
      return new Action('rest', null)
    }
  }

  monster_blind_action(m, mx, my)
  {
    const [dx, dy] = m.facing
    const applicable_p =
          (x, y) => (this.level.in_dungeon_p(x,y) &&
                     (this.level.cell(x,y).type=='FLOOR' || this.level.cell(x,y).type=='PASSAGE') &&
                     this.level.can_move_to_terrain_p(m, mx, my, x, y) &&
                     this.level.cell(x,y).item?.name != "結界の巻物")

    const attack_or_move =
          (x, y) => ([x,y].eql_p(this.hero.pos) || this.level.cell(x,y).monster) ? new Action('attack', [x-mx, y-my]) : new Action('move', [x-mx, y-my])
    
    if (applicable_p(mx+dx, my+dy)) {
      return attack_or_move(mx+dx, my+dy)
    } else {
      const candidates = []
      this.level.surroundings(mx, my).each_coords((x, y) => {
        if (applicable_p(x, y)) {
          candidates.push([x,y])
        }
      })

      if (candidates.size > 0) {
        const [x, y] = candidates.sample()
        m.facing = [x-mx, y-my]
      }
      return new Action('rest', null)
    }
  }

  adjacent_p(v1, v2)
  {
    return Vec.chess_distance(v1, v2) == 1
  }

  // (Monster, Integer, Integer) → Action
  monster_action(m, mx, my)
  {
    switch ( m.name ) {
    // 特殊な行動パターンを持つモンスターはここに case ラベルを追加。
    default:
      switch ( m.state ) {
      case 'asleep':
        // ヒーローがに周囲8マスに居れば1/2の確率で起きる。
        if ( this.hero.ring?.name != "盗賊の指輪" &&
             this.level.surroundings(mx, my).include_p(this.hero.x, this.hero.y) ) {
          if (rand() < 0.5) {
            m.state = 'awake'
          }
        }
        return new Action('rest', null)

      case 'awake':
        // ジェネリックな行動パターン。

        if (m.paralyzed_p())
          return new Action('rest', null)

        else if (m.asleep_p())
          return new Action('rest', null)

        else if (!m.nullified_p() && m.bomb_p() && m.hp <= m.max_hp.div(2))
          return new Action('rest', null)

        else if (m.confused_p())
          return this.monster_confused_action(m, mx, my)

        else if (m.blind_p())
          return this.monster_blind_action(m, mx, my)

        else if (!m.nullified_p() && m.hallucinating_p() ) // まどわし状態では攻撃しない。
          return this.monster_move_action(m, mx, my)

        else if (!m.nullified_p() && m.tipsy_p() && rand() < 0.5 ) // ちどり足。
          return this.monster_tipsy_move_action(m, mx, my)

        else if ( this.adjacent_p([mx, my], [this.hero.x, this.hero.y]) &&
                  this.level.cell(this.hero.x, this.hero.y).item?.name == "結界の巻物" )
          return this.monster_move_action(m, mx, my) // new Action('rest', null)

        else if (!m.nullified_p() && this.trick_applicable_p(m) && rand() < m.trick_rate)
          return new Action('trick', null)

        else if (this.level.can_attack_p(m, mx, my, this.hero.x, this.hero.y)) {
          // * ヒーローに隣接していればヒーローに攻撃。
          if (m.name == "動くモアイ像")
            m.status_effects.reject_d(x => x.type == 'held')

          return new Action('attack', Vec.minus([this.hero.x, this.hero.y], [mx, my]))
        } else
          return this.monster_move_action(m, mx, my)

      default:
        throw new Error
      }
    }
  }

  // 敵の攻撃力から、実際にヒーローが受けるダメージを計算する。
  attack_to_hero_damage(attack)
  {
    return ( attack * Math.pow(15.0/16.0, this.get_hero_defense() ) * (112 + rand(32))/128.0 ).to_i()
  }

  async monster_attacks_hero(m)
  {
    const attack = this.get_monster_attack(m)

    if (attack === 0) {
      await this.log(`${this.display_character(m)}は 様子を見ている。`)
    } else {
      await this.log(`${this.display_character(m)}の こうげき！ `)
      if (rand() < 0.125) {
        await SoundEffects.miss()
        await this.log(`${this.hero.name}は ひらりと身をかわした。`)
      } else {
        await SoundEffects.hit()
        const damage = this.attack_to_hero_damage(attack)
        await this.take_damage(damage)
      }
    }
  }

  // モンスターが攻撃する。
  async monster_attack(assailant, dir)
  {
    const [mx, my] = this.level.coordinates_of(assailant)
    const target = Vec.plus([mx, my], dir)
    const defender = this.level.cell(... target).monster

    if (this.hero.pos.eql_p(target)) {
      await this.monster_attacks_hero(assailant)
    } else if (defender) {
      const attack = this.get_monster_attack(assailant)
      const damage = ( ( attack * Math.pow(15.0/16.0, defender.defense) ) * (112 + rand(32))/128.0 ).to_i()

      if (attack === 0) {
        await this.log(`${assailant.name}は 様子を見ている。`)
      } else {
        await this.log(`${assailant.name}の こうげき！ `)
        this.on_monster_attacked(defender)
        await this.monster_take_damage(defender, damage, this.level.cell(... target))
      }
    }else {
      // 誰もいない
    }
  }

  // モンスターが特技を使用する。
  async monster_trick(m)
  {
    switch ( m.name ) {
    case '催眠術師':
      await this.log(`${m.name}は 手に持っている物を 揺り動かした。`)
      await SoundEffects.magic()
      await this.hero_fall_asleep()
      break

    case 'ファンガス':
      await this.log(`${m.name}は 毒のこなを 撒き散らした。`)
      await this.take_damage_strength(1)
      break

    case 'ノーム':
      {
        const potential = rand(new Range(250, 1500))
        const actual = [potential, this.hero.gold].min()
        if (actual == 0) {
          await this.log(`${this.hero.name}は お金を持っていない！ `)
        } else {
          await this.log(`${m.name}は ${actual}ゴールドを盗んでワープした！ `)

          this.hero.gold -= actual
          m.item = new Gold(actual)

          if (! m.hallucinating_p()) {
            m.status_effects.push( new StatusEffect('hallucination', Float.INFINITY) )
          }

          await this.monster_teleport(m, this.level.cell(... this.level.coordinates_of(m)))
        }
      }
      break

    case '白い手':
      if (!this.hero.held_p()) {
        await this.log(`${m.name}は ${this.hero.name}の足をつかんだ！ `)
        const effect = new StatusEffect('held', 10)
        effect.caster = m
        this.hero.status_effects.push( effect )
      }
      break

    case 'ピューシャン':
      {
        const [mx, my] = this.level.coordinates_of(m)
        const dir = Vec.normalize(Vec.minus([this.hero.x, this.hero.y], [mx, my]))
        const arrow = Item.make_item('木の矢')
        arrow.number = 1
        await this.monster_throw_item(m, arrow, mx, my, dir)
      }
      break

    case 'アクアター':
      await this.log(`${m.name}は 酸を浴せた。`)
      if (this.hero.shield) {
        await this.take_damage_shield()
      }

      break
    case 'パペット':
      await this.log(`${m.name}は おどりをおどった。`)
      await SoundEffects.fanfare2()
      if (this.hero.puppet_resistent_p())
        await this.log(`しかし ${this.hero.name}は平気だった。`)
      else
        await this.hero_levels_down()

      break

    case '土偶':
      if (rand() < 0.5) {
        await this.log(`${m.name}が ${this.hero.name}のちからを吸い取る！`)
        if (this.hero.puppet_resistent_p())
          await this.log(`しかし ${this.hero.name}は平気だった。`)
        else
          await this.take_damage_max_strength(1)
      } else {
        await this.log(`${m.name}が ${this.hero.name}の生命力を吸い取る！`)
        if (this.hero.puppet_resistent_p())
          await this.log(`しかし ${this.hero.name}は平気だった。`)
        else
          await this.take_damage_max_hp(5)
      }

      break
    case '目玉':
      await this.log(`目玉は${this.hero.name}を睨んだ！`)
      if (! this.hero.confused_p() ) {
        this.hero.status_effects.push(new StatusEffect('confused', 10))
        await this.log(`${this.hero.name}は 混乱した。`)
      }

      break

    case 'どろぼう猫':
      {
        const candidates = this.hero.inventory.reject(x => this.hero.equipped_p(x) )

        if (candidates.size > 0) {
          const item = candidates.sample()
          this.hero.remove_from_inventory(item)
          m.item = item
          await this.log(`${m.name}は `, this.display_item(item), `を盗んでワープした。`)

          if (! m.hallucinating_p() ) {
            m.status_effects.push( new StatusEffect('hallucination', Float.INFINITY) )
          }

          await this.monster_teleport(m, this.level.cell(... this.level.coordinates_of(m)))
        } else {
          await this.log(`${this.hero.name}は 何も持っていない。`)
        }
      }
      break

    case '竜':
      {
        const [mx, my] = this.level.coordinates_of(m)
        const dir = Vec.normalize(Vec.minus([this.hero.x, this.hero.y], [mx, my]))
        await this.log(`${m.name}は 火を吐いた。`)
        await this.breath_of_fire(m, mx, my, dir)
      }

      break
    case 'ソーサラー':
      await this.log(`${m.name}は ワープの杖を振った。`)
      await SoundEffects.magic()
      await this.wait_delay()
      await this.hero_teleport()
      break

    default:
      throw new Error
    }
  }

  // ヒーローがちからの最大値にダメージを受ける。
  async take_damage_max_strength(amount)
  {
    if (amount != 1)
      throw new Error

    if (this.hero.raw_max_strength <= 1) {
      await this.log(`${this.hero.name}の ちからは これ以上さがらない。`)
    } else {
      this.hero.raw_max_strength -= 1
      this.hero.raw_strength = [this.hero.raw_strength, this.hero.raw_max_strength].min()
      await this.log(`${this.hero.name}の ちからの最大値が 下がった。`)
    }
  }

  // ヒーローが最大HPにダメージを受ける。
  async take_damage_max_hp(amount)
  {
    this.hero.max_hp = [this.hero.max_hp - amount, 1].max()
    this.hero.hp = [this.hero.hp, this.hero.max_hp].min()
    await this.log(`${this.hero.name}の 最大HPが 減った。`)
  }

  // モンスターが移動する。
  monster_move(m, mx, my, dir)
  {
    this.level.cell(mx, my).remove_object(m)
    this.level.cell(mx + dir[0], my + dir[1]).put_object(m)
    m.facing = dir
  }

  // move 以外のアクションを実行。
  async dispatch_action(m, action)
  {
    switch ( action.type ) {
    case 'attack':
      await this.monster_attack(m, action.direction)
      break
    case 'trick':
      await this.monster_trick(m)
      break
    case 'rest':
      // 何もしない。
      break
    default:
    }
  }

  // 行動により満腹度が消費される。満腹度が無い時はHPが減る。
  async hero_fullness_decrease()
  {
    const old = this.hero.fullness
    if (this.hero.fullness > 0.0) {
      if ( !this.dungeon.on_return_trip_p(this.hero) ) {
        this.hero.fullness -= this.hero.hunger_per_turn
        if (old >= 20.0 && this.hero.fullness <= 20.0)
          await this.log("おなかが 減ってきた。")
        else if (old >= 10.0 && this.hero.fullness <= 10.0)
          await this.log("空腹で ふらふらしてきた。")
        else if (this.hero.fullness <= 0.0)
          await this.log("早く何か食べないと死んでしまう！ ")
      }

      // 自然回復
      this.hero.hp = [this.hero.hp + this.hero.max_hp/150.0, this.hero.max_hp].min()
    } else {
      await this.take_damage(1, { quiet: true })
    }
  }

  // 64ターンに1回の敵湧き。
  spawn_monster()
  {
    this.dungeon.place_monster(this.level, this.level_number, this.level.fov(this.hero.x, this.hero.y))
  }

  // ヒーローが居る部屋。
  get current_room()
  {
    return this.level.room_at(this.hero.x, this.hero.y)
  }

  // 部屋の出入りでモンスターが起きる。
  wake_monsters_in_room(room, probability)
  {
    if (!(room instanceof Room)) {
      console.log(room)
      throw new Error('room')
    }

    if (this.hero.ring?.name == "盗賊の指輪")
      probability = 0.0

    for (let y = room.top+1; y <= room.bottom-1; y++) {
      for (let x = room.left+1; x <= room.right-1; x++) {
        const monster = this.level.cell(x, y).monster
        if (monster && monster.state == 'asleep' && rand() < probability) {
          monster.state = 'awake'
          monster.action_point = 0
        }
      }
    }
  }

  // 状態異常が解けた時のメッセージ。
  async on_status_effect_expire(character, effect)
  {
    switch ( effect.type ) {
    case 'paralysis':
      await this.log(`${this.display_character(character)}の かなしばりがとけた。`)
      break
    case 'sleep':
      await this.log(`${this.display_character(character)}は 目をさました。`)
      break
    case 'held':
      await this.log(`${this.display_character(character)}の 足が抜けた。`)
      break
    case 'confused':
      await this.log(`${this.display_character(character)}の 混乱がとけた。`)
      break
    case 'quick':
      await this.log(`${this.display_character(character)}の 足はもう速くない。`)
      break
    default:
      await this.log(`${this.display_character(character)}の ${effect.name}状態がとけた。`)
      break
    }
  }

  // 状態異常の残りターン数減少処理。
  async status_effects_wear_out()
  {
    const monsters = this.level.all_monsters_with_position.map( ([m, x, y]) =>  m )

    for (const m of monsters.concat( [this.hero] )) {
      m.status_effects.each( e => e.remaining_duration -= 1 )

      const expired_effects = []
      m.status_effects.reject_d(
        e => {
          const expired = e.remaining_duration <= 0
          if (expired)
            expired_effects.push(e)
          return expired
        }
      )
      for (const e of expired_effects) {
        await this.on_status_effect_expire(m, e)
      }
    }
  }

  // ヒーローの名前を付ける。
  async naming_screen()
  {
    // 背景画面をクリア
    Curses.stdscr.clear()
    Curses.stdscr.refresh()

    const name = await NamingScreen.run(this.default_name)
    if (name)
    {
      this.default_name = name
      while (true) {
        this.reset()
        this.hero.name = name
        await this.play()
        if (this.beat)
          break

        if (!await this.ask_retry())
          break
      }
    }
  }

  async confirm_give_up()
  {
    const menu = new Menu(["冒険をあきらめる", "あきらめない"],
                          {cols: 20, y: 8, x: 30})
    const [type, item] = await menu.choose()
    switch ( type ) {
    case 'chosen':
      switch ( item ) {
      case "冒険をあきらめる":
        return true
      case "あきらめない":
        return false
      default:
        throw new Error
      }
    case 'cancel':
      return false
    default:
      throw new Error
    }
  }

  async ask_retry()
  {
    Curses.stdscr.clear()
    Curses.stdscr.refresh()

    const menu = new Menu(["もう一度挑戦する", "やめる"],
                          {cols: 20, y: 8, x: 30})
    const [type, item] = await menu.choose()
    switch (type) {
    case 'chosen':
      switch ( item ) {
      case "もう一度挑戦する":
        return true
      case  "やめる":
        return false
      default:
        throw new Error
      }
    case 'cancel':
      return false
    default:
      throw new Error
    }
  }

  validate_ranking(data)
  {
    return data instanceof Array // ... それだけ？
  }

  // メッセージボックス。
  async message_window(message, opts = {})
  {
    const cols = opts.cols || message.size * 2 + 2
    const y = opts.y || (Curses.lines - 3).div(2)
    const x = opts.x || (Curses.cols - cols).div(2)

    const win = new Curses.Window(3, cols, y, x) // lines, cols, y, x
    win.clear()
    win.rounded_box()

    win.setpos(1, 1)
    win.addstr(message.chomp())

    Curses.flushinp()
    await win.getch()
    win.clear()
    win.refresh()
    win.close()
  }

  //ランキングでの登録日時フォーマット。
  format_timestamp(unix_time)
  {
    // unix_time is in milliseconds.
    return strftime("%y-%m-%d", new Date(unix_time))
  }

  // These sorting functions below should really be stable-sorting.

  sort_ranking_by_score(ranking)
  {
    return ranking.sort( (a,b) => b["gold"] - a["gold"] )
  }

  sort_ranking_by_time(ranking)
  {
    return ranking.sort( (a,b) => a["time"] - b["time"] )
  }

  sort_ranking_by_timestamp(ranking)
  {
    return ranking.sort( (a,b) => b["timestamp"] - a["timestamp"] )
  }

  // ランキング表示画面。
  async ranking_screen(title, ranking_file_name, dispfunc)
  {
    Curses.stdscr.clear()
    Curses.stdscr.refresh()

    let ranking
    if (!window.localStorage[ranking_file_name]) {
      ranking = []
    } else {
      try {
        ranking = JSON.parse(window.localStorage[ranking_file_name])
      } catch (e) {
        if (!(e instanceof SyntaxError))
          throw e

        await this.message_window("番付ファイルが壊れています。")
        return
      }
      if (!this.validate_ranking(ranking)) {
        await this.message_window("番付ファイルが壊れています。")
        return
      }
    }

    if (ranking.length === 0) {
      await this.message_window("まだ記録がありません。")
    } else {
      const menu = new Menu(ranking, { y: 0, x: 5, cols: 70, dispfunc: dispfunc, title: title })
      while (true) {
        Curses.stdscr.clear()
        Curses.stdscr.refresh()

        const [cmd, ...args] = await menu.choose()
        switch (cmd) {
        case 'cancel':
          return
        case 'chosen':
          const data = args[0]

          await ResultScreen.run(data)
        }
      }
    }
  }

  format_time(milliseconds)
  {
    const seconds = milliseconds.div(1000)
    const h = seconds / 3600
    const m = (seconds % 3600) / 60
    const s = seconds % 60
    return sprintf("%2d:%02d:%02d", h, m, s)
  }

  async initial_menu()
  {
    this.reset()

    Curses.stdscr.clear()

    Curses.stdscr.setpos(Curses.stdscr.maxy-2, 0)
    Curses.stdscr.addstr("決定: Enter")
    Curses.stdscr.setpos(Curses.stdscr.maxy-1, 0)
    Curses.stdscr.addstr("もどる: q")

    Curses.stdscr.refresh()

    const menu = new Menu(
      [
        "冒険に出る",
        "スコア番付",
        "タイム番付",
        "最近のプレイ",
        "サウンドテスト",
        "終了",
      ],
      { y: 0, x: 0, cols: 16 })
    const [cmd, ... args] = await menu.choose()
    switch (cmd) {
    case 'cancel':
      return

    case 'chosen':
      const item = args[0]
      switch (item) {
      case "冒険に出る":
        await this.naming_screen()
        break

      case "スコア番付":
        await this.ranking_screen("スコア番付", Program.SCORE_RANKING_FILE_NAME,
                                  (win, data) => {
                                    const name = data["hero_name"] + ('　'.times(6-data["hero_name"].size))
                                    const gold = sprintf("%7dG", data["gold"])
                                    win.addstr(`${gold}  ${name}  ${this.format_timestamp(data["timestamp"])}  ${data["message"]}`)
                                  }
                                 )
        break

      case "タイム番付":
        await this.ranking_screen("タイム番付", Program.TIME_RANKING_FILE_NAME,
                                  (win, data) =>{
                                    const name = data["hero_name"] + ('　'.times(6-data["hero_name"].size))
                                    const time = format_time(data["time"])
                                    win.addstr(`${time}  ${name}  ${this.format_timestamp(data["timestamp"])}  ${data["message"]}`)
                                  }
                                 )
        break

      case "最近のプレイ":
        await this.ranking_screen("最近のプレイ", Program.RECENT_GAMES_FILE_NAME,
                                  (win, data) => {
                                    const name = data["hero_name"] + ('　'.times(6-data["hero_name"].size))
                                    win.addstr(`${this.format_timestamp(data["timestamp"])}  ${name}  ${data["message"]}`)
                                  }
                                 )
        break

      case "サウンドテスト":
        await this.sound_test()
        break

      case "終了":
        return

      default:
        throw new Error(item)
      }
    }
    await this.initial_menu()
  }

  async sound_test()
  {
    const tunes = []
    for (let prop of Object.getOwnPropertyNames(SoundEffects)) {
      if (prop === 'name' || prop === 'length' || prop === 'prototype')
        continue

      tunes.push(prop)
    }

    const menu = new Menu(tunes, { y: 0, x: 0, cols: 16 })

    while (true) {
      const [c, tune] = await menu.choose()
      if (c === 'cancel')
        break

      if (c === 'chosen') {
        await SoundEffects[tune]()
      }
    }
  }

  async intrude_party_room()
  {
    if (this.hero.audition_enhanced_p()) {
      this.hero.status_effects.push(new StatusEffect('audition_enhancement'))
    }

    await this.log("魔物の巣窟だ！ ")
    await SoundEffects.partyroom()
    await this.render()

    if (this.hero.ring?.name != "盗賊の指輪") {
      this.wake_monsters_in_room(this.level.party_room, 1.0)

      const room = this.level.party_room
      new Range(room.top+1, room.bottom-1).each(y => {
        new Range(room.left+1, room.right-1).each(x => {

          const monster = this.level.cell(x, y).monster
          if (monster) {
            monster.on_party_room_intrusion()
            monster.action_point = 0
          }
        })
      })
    }
    this.level.party_room = null
  }

  async walk_in_or_out_of_room()
  {
    if (this.last_room)
      this.wake_monsters_in_room(this.last_room, 0.5)

    if (this.current_room) {
      if (this.current_room === this.level.party_room)
        await this.intrude_party_room()
      else
        this.wake_monsters_in_room(this.current_room, 0.5)
    }
  }

  //  十字路、T字路で止まる。
  fork_p(point)
  {
    if (this.level.room_at(... point))
      return false

    if ( ![[-1,-1],[+1,-1],[-1,+1],[+1,+1],[-1,0],[0,-1],[+1,0],[0,+1]]
         .every(d => this.level.in_dungeon_p(... Vec.plus(point,d))) )
      return false

    if ( !([[-1,0],[0,-1],[+1,0],[0,+1]].count(d => this.level.cell(... Vec.plus(point,d)).type == 'PASSAGE' || this.level.cell(... Vec.plus(point,d)).type == 'FLOOR') >= 3) )
      return false

    return true
  }

  should_keep_dashing_p()
  {
    const target = Vec.plus(this.hero.pos, this.dash_direction)
    const index = Program.DIRECTIONS.index(this.dash_direction)
    const forward_area = new Range(-2, +2).to_a().map(
      ioff => Vec.plus(this.hero.pos, Program.DIRECTIONS[(index+ioff).mod(8)])
    )

    // if (this.hero.status_effects.length > 0)
    //   return false
    if (!this.hero_can_move_to_p(target))
      return false
    else if (this.level.cell(... target).monster) // ありえなくない？
      return false
    else if (forward_area.some(([x,y]) => {
      const cell = this.level.cell(x,y)
      return (cell.staircase ||
              cell.item ||
              cell.gold ||
              (cell.trap && this.trap_visible_to_hero(cell.trap)) ||
              cell.monster ||
              cell.type == 'STATUE')
    }))
      return false
    else if (this.current_room && this.level.first_cells_in(this.current_room).include_p(this.hero.pos))
      return false
    else if (!this.current_room && this.level.room_at(... target) &&
             this.level.first_cells_in(this.level.room_at(... target)).include_p(target))
      return false
    else if (this.fork_p(this.hero.pos))
      return false
    else
      return true
  }

  async hero_dash()
  {
    if (this.should_keep_dashing_p()) {
      await this.hero_walk(... Vec.plus(this.hero.pos, this.dash_direction), false)
      return 'move'
    } else {
      this.dash_direction = null
      return 'nothing'
    }
  }

  // () -> :action | :nothing | :move
  async hero_phase()
  {
    if (this.hero.asleep_p()) {
      await this.log("眠くて何もできない。")
      return 'action'
    } else if (this.dash_direction) { // ダッシュ中
      return await this.hero_dash()
    } else {
      while (true) {
        // 画面更新
        this.cancel_delay()
        const message_status = this.render()
        this.cancel_delay()

        const c = await this.read_command(message_status)

        if (c)
          return await this.dispatch_command(c)
      }
    }
  }

  recover_monster_action_point()
  {
    this.level.all_monsters_with_position.each(
      ( [m, _x, _y] ) => m.action_point += m.action_point_recovery_rate
    )
  }

  async next_turn()
  {
    this.level.turn += 1
console.log("next_turn", {turn: this.level.turn})
    this.hero.action_point += this.hero.action_point_recovery_rate
    this.recover_monster_action_point()
    await this.status_effects_wear_out()
    await this.hero_fullness_decrease()
    if (this.level.turn % 64 == 0 && this.level.monster_count < 25)
      this.spawn_monster()

  }

  all_monsters_moved_p()
  {
    console.log(this.level.all_monsters_with_position)
    return this.level.all_monsters_with_position.every(
      ( [m, ... pos] ) => m.action_point < 2
    )
  }

  // モンスターの移動・行動フェーズ。
  async monster_phase()
  {
    // 移動フェーズ。
    const doers = []
    this.level.all_monsters_with_position.each(
      ( [m, mx, my] ) => {
        if (m.action_point < 2)
          return

        const action = this.monster_action(m, mx, my)
        if (action.type == 'move') {
          // その場で動かす。
          this.monster_move(m, mx, my, action.direction)
          m.action_point -= 2
        } else {
          doers.push( [m, action] )
        }
      }
    )

    // 行動フェーズ。
    for (const [m, action] of doers) {
      if (m.hp < 1.0)
        return

      await this.dispatch_action(m, action)
      if (m.single_attack_p()) {
        // 攻撃するとAPを使いはたす。
        m.action_point = 0
      } else {
        m.action_point -= 2
      }
    }
  }

  async play()
  {
    this.start_time = +new Date
    this.quitting = false

    await this.new_level(+1, false)
    await this.render()

    try {
      while (!this.quitting) {
        if (this.hero.action_point >= 2) {
          const old = this.hero.action_point
          this.hero.action_point -= 2
          switch (await this.hero_phase()) {
          case 'move':
          case 'action':
            break
          case 'nothing':
            this.hero.action_point = old
          }
        } else if (this.all_monsters_moved_p()) {
          await this.next_turn()
        } else {
          if (this.hero.ring?.name == "退魔の指輪") {
            const rect = this.level.fov(this.hero.x, this.hero.y)
            rect.each_coords((x, y) => {
              if (!this.level.in_dungeon_p(x, y))
                return

              const m = this.level.cell(x, y).monster
              if (m && !m.hallucinating_p()) {
                m.status_effects.push(new StatusEffect('hallucination', Float.INFINITY))
              }
            })
          }
          await this.monster_phase()
        }
      }
    } catch(e) {
      if (!(e instanceof HeroDied))
        throw e

      await this.log(`${this.hero.name}は ちからつきた。`)
      await this.render()
      await this.gameover_message()
    }
  }

  async key_test()
  {
    const w = Curses.stdscr
    let c = null
      w.clear()
      w.setpos(0,0)
      w.addstr("key wo ositene")
      w.setpos(1,0)
    while (true) {
      w.addstr(JSON.stringify(c))
      w.addstr(" ")
      c = await w.getch()
    }
  }

  async curses_test()
  {
    const text = " YT45をリリースしました。これまでYTの、YPブラウザとしての機能は最低限だったのですが、今回PecaRecorderを真似して多機能化しました。……とはいっても録画はできませんが（笑）、フィルターによる色分けや無視ができます。\n\nまた、PecaRecorderの設定ファイルを指定して既存のフィルタ設定をインポートすることもできますから、ブラウザでの視聴環境には抵抗のある方もいらっしゃると思いますが、視聴環境の移行とまではいかなくても、サブの環境として整えやすくなったかなと思います。ご査収下さい。\n"
    print (text)
    await sleep(500)
    // Curses.init_screen()
    // at_exit(() => {
    //   Curses.close_screen()
    // })
    // Curses.noecho()
    // Curses.crmode()

    // const w = Curses.stdscr
    // w.addstr(text)
    // w.refresh

    // while (true) {
    //   const c = await w.getch()
    // }
  }

  async main()
  {
    for (const fn of ["font.txt", "font-2.txt", "font-3.txt"]) {
      STDOUT.writeChar(`Loading ${fn} ... `)
      const font = $ASSETS[fn]
      STDOUT.writeChar(font)
      STDOUT.writeChar(`${font.length} bytes \n`)
    }
    STDOUT.writeChar(String.fromCodePoint(0x104026) + String.fromCodePoint(0x104027))

    // await this.key_test()
    // await this.curses_test()
    await this.initial_menu()

    Curses.stdscr.clear()
    Curses.stdscr.setpos(0,0)
    Curses.stdscr.addstr("おつ")
    return

    const tune = Sound.compile([
      ['note', Math.round(800 * 0.6), 'c5', 40],
      ['note', Math.round(600 * 0.6), 'b4', 40],
      ['note', Math.round(200 * 0.6), 'f4', 40],
      ['note', Math.round(400 * 0.6), 'a4', 40],
      ['note', Math.round(400 * 0.6), 'g4', 40],
      ['note', Math.round(400 * 0.6), 'f4', 40],
      ['note', Math.round(400 * 0.6), 'd4', 40],

      ['note', Math.round(400 * 0.6), 'c4', 40],
      ['note', Math.round(200 * 0.6), 'b3', 40],
      ['note', Math.round(200 * 0.6), 'c4', 40],

      ['note', Math.round(400 * 0.6), 'e4', 40],
      ['note', Math.round(200 * 0.6), 'd4', 40],
      ['note', Math.round(200 * 0.6), 'e4', 40],
      ['note', Math.round(800 * 0.6), 'd4', 40],
      ['note', Math.round(400 * 0.6), 'c4', 40],
    ])

    await Sound.play(tune)

    //const win = new Curses.Window(5, 7, 5, 33)
    const win = new Curses.Window(5, 7, 5, 33)
    win.clear()
    win.rounded_box()
    win.setpos(0, 1)
    win.addstr("方向")
    // for (let cp = 0x104230; cp <= 0x104237; cp++)
    //   win.addstr(String.fromCodePoint(cp))
    win.setpos(1, 1)
    win.addstr("y k u")
    win.setpos(2, 1)
    win.addstr("h   l")
    win.setpos(3, 1)
    win.addstr("b j n")
    win.setpos(2, 3)
    await win.getch()
    print("[Program Exited]")
  }
}

let $prog
window.addEventListener('load', async () => {
  var kbdBuffer = "";
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
    async readChar(time_limit) {
      while (true) {
        if (!this.isCharReady()) {
          if (time_limit && +new Date > time_limit)
            return null
          await delay(0);
          continue;
        }

        var ch = kbdBuffer[0];
        // CR を LF に変換。
        if (ch === "\x0d")
          ch = "\x0a";
        kbdBuffer = kbdBuffer.slice(1);
        return ch;
      }
    }

    ungetch(str) {
      kbdBuffer = str + kbdBuffer
    }

    flushinp() {
      kbdBuffer = ""
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
      receiver.feed(ch.replace(/\x0a/g, "\x0d\x0a"))
      // if (ch === "\x0a") { // CR
      //   receiver.feed("\x0d\x0a"); // CR+LF
      // } else {
      //   receiver.feed(ch);
      // }
      force_redraw = true
    }
  }
  var ttyOutputPort = new TtyOutputPort;

  window.onblur = function (e) {
    windowFocused = false;
    force_redraw = true;
  };

  window.onfocus = function (e) {
    windowFocused = true;
    force_redraw = true;
  };

  updateBusyIndicator();

  STDIN = ttyInputPort
  STDOUT = ttyOutputPort
  const prog = new Program()
  $prog = prog
  try {
    await prog.main()
  } finally {
    for (let i = Finalizers.length - 1; i >= 0; i--)
      Finalizers[i]()
  }

  print("おつ")

  //ttyOutputPort.writeChar("[Program Exited]")
});

function eql_p(a, b)
{
  if (a === undefined || a === null)
    return a === b
  else
    return a.eql_p(b)
}

Array.prototype.include_p = function(val) {
  return this.some(elt => eql_p(elt, val))
}

Number.prototype.to_i = function()
{
  return Math.floor(this)
}

Array.prototype.shuffle = function() {
  const indices = new Array(this.length)
  for (let i = 0; i < this.length; i++)
    indices[i] = i

  const res = []
  while (indices.length > 0) {
    const j = Math.floor( Math.random() * indices.length )
    res.push( this[indices[j]] )
    indices.splice(j, 1)
  }

  return res
}

Array.prototype.eql_p = function(other)
{
  if (this === other)
    return true

  if (!(other instanceof Array))
    return false

  if (this.length != other.length)
    return false

  for (let i = 0; i < this.length; i++)
    if ( !eql_p(this[i], other[i]) )
      return false

  return true
}

Object.prototype.eql_p = function(other)
{
  return this.valueOf() === other
}

Array.prototype.reject = function(f)
{
  return this.filter(elt => !f(elt))
}

Array.prototype.index = function(value)
{
  if (value instanceof Function) {
    const i = this.findIndex(value)
    if (i === -1)
      return null
    else
      return i
  } else {
    const i = this.findIndex( elt => eql_p(elt,value) )
    if (i == -1)
      return null
    else
      return i
  }
}

Array.prototype.take = function(n)
{
  const arr = []
  n = Math.min(n, this.length)
  for (let i = 0; i < n; i++)
    arr.push(this[i])
  return arr
}

Object.defineProperty(Array.prototype, 'size', { get() { return this.length } })

String.prototype.chomp = function()
{
  let str = this.valueOf()
  while (str.length > 0 && ( str[str.length - 1] == '\n' || str[str.length - 1] == '\r' )) {
    str = str.slice(0, str.length - 1)
  }
  return str
}

Array.prototype.replace = function(arr)
{
  this.splice(0, this.length, ... arr)
  return this
}

class Kernel
{
  static inspect(v)
  {
    if (v === undefined) {
      return "undefined"
    } else {
      return JSON.stringify(v)
    }
  }
}
