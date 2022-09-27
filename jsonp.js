// -*- mode: js; js-indent-level: 2 -*-
'use strict';

function delay(ms) {
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

  KEY_DOWN: null,
  KEY_UP: null,
  A_BOLD: null,

  timeout: -1,

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
    }

    keypad(flag)
    {
    }


    attron(attr)
    {
    }

    attroff(attr)
    {
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
      print(str)
    }

    async getch()
    {
      const c = await STDIN.readChar()
      return c
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
    print(str)
  },

  refresh()
  {
  },

  flushinp()
  {
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
    const c = await STDIN.readChar()
    return c
  },

  attron(attr)
  {
  },

  attroff(attr)
  {
  },

  color_pair(x)
  {
  },

  clrtoeol()
  {
    print("\x1b[0K")
  },
}

Curses.stdscr = new Curses.Window(24, 80, 0, 0)

class Menu
{
  constructor(items, opts = {})
  {
    this.items = items
    this.y = opts.y || 0
    this.x = opts.x || 0
    this.cols = opts.cols || 25
    this.index = 0
    const winheight = Math.max(3, this.items.length + 2)
    this.win = new Curses.Window(winheight, this.cols, this.y, this.x)
    this.win.keypad(true)
    this.dispfunc = opts.dispfunc || ((win, data) => {
      win.addstr(data.to_s())
    })
    this.title = opts.title || ""
    this.sortable = opts.sortable || false
  }

  async choose()
  {
    this.win.clear()
    this.win.rounded_box()
    this.win.setpos(0, 1)
    this.win.addstr(this.title)

    if (this.items.length == 0)
    {
      this.win.setpos(1,1)
      this.win.attron(Curses.A_BOLD)
      this.win.addstr(" 何も持っていない")
      this.win.attroff(Curses.A_BOLD)
      this.win.setpos(1, 1)
      this.win.refresh()
      await this.win.getch()
      return ["cancel"]
    } else {
        console.log('piyo')
      while (true) {
        console.log('fuga')
        for (let i = 0; i < this.items.length; i++) {
          this.win.setpos(i + 1, 1)
          if (i == this.index)
            this.win.attron(Curses.A_BOLD)

          this.win.addstr(" ")
          this.dispfunc.apply(null, [this.win, this.items[i]])
          if (i == this.index)
            this.win.attroff(Curses.A_BOLD)
        }

        this.win.setpos(this.index + 1, 1)
        console.log('hoge')
        const c = await this.win.getch()
        console.log(JSON.stringify(c))

        switch (c)
        {
          case 'j':
          case Curses.KEY_DOWN:
          this.index = (this.index + 1).mod(this.items.length)
          break

          case 'k':
          case Curses.KEY_UP:
          this.index = (this.index - 1).mod(this.items.length)
          break

          case 's':
          if (this.sortable)
            return ['sort']

          break

          case 'q':
          return ['cancel']
          break

          case '\n':
          return ['chosen', this.items[this.index]]
          break
        }
      }
    }
  }
}

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
      case '\t':
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
        
      case '\b':
      case Curses.KEY_DC:
      case 'x':
        // Backspace, Delete Character or x
        name = name.slice(0, name.length - 1)
        break

      case 'q':
        return null

      case '\n':
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
          if (c == "゛" && DAKUON_TABLE[name[name.length-1]])
            name[name.length-1] = DAKUON_TABLE[name[name.length-1]]
          else if (c == "゜" && HANDAKUON_TABLE[name[name.length-1]])
            name[name.length-1] = HANDAKUON_TABLE[name[name.length-1]]
          else {
            if (name.length == 6)
              name[5] = c
            else
              name += c
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

class Program
{
  constructor()
  {
    // ...

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

    this.last_rendered_at = new Date

    this.last_message = ""
    this.last_message_shown_at = new Date

   // this.naming_table = this.create_naming_table()
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

  log(... args)
  {
    this._log.add(['span', ... args])
    this.stop_dashing()
    this.render()
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
        this.hero_levels_up(true)

      return 'nothing'

    case ']':
      if (this.debug_p())
        return this.cheat_go_downstairs()
      else
        return 'nothing'

    case '[':
      if (this.debug_p())
        return this.cheat_go_upstairs()
      else
        return 'nothing'

    case 'p':
      if (this.debug_p())
        this.cheat_get_item()

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
      return this.hero_move(c)

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
      return this.activate_underfoot()

    case 'q':
      this.log("冒険をあきらめるには大文字の Q を押してね。")
      return 'nothing'

    case 'Q':
      if (this.confirm_give_up_p()) {
        this.give_up_message()
        this.quitting = true
        return 'nothing'
      } else {
        return 'nothing'
      }

    case 's':
      return await this.main_menu()

    case 't':
      if (this.hero.projectile()) {
        return this.throw_item(this.hero.projectile)
      } else {
        this.log("投げ物を装備していない。")
        return 'nothing'
      }

    case '.':
    case 10: // Enter
      return this.search()

    default:
      this.log(`[${c}]なんて 知らない。[?]でヘルプ。`)
      return 'nothing'
    }
  }

  stop_dashing()
  {
    this.dash_direction = null
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
        "終了",
      ],
      { y: 0, x: 0, cols: 16 })
    const [cmd, ... args] = await menu.choose()
    switch (cmd)
    {
      case 'cancel':
      return

      case 'chosen':
      const item = args[0]
      switch (item)
      {
        case "冒険に出る":
        await this.naming_screen()
        break

        case "スコア番付":
        break

        case "タイム番付":
        break

        case "最近のプレイ":
        break

        case "終了":
        return

        default:
        throw new Error(item)
      }
    }
    this.initial_menu()
  }

  // 階段の方向を更新。
  update_stairs_direction()
  {
    this.level.stairs_going_up = this.dungeon.on_return_trip_p(this.hero)
  }

  // 部屋の出入りでモンスターが起きる。
  wake_monsters_in_room(room, probability)
  {
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

  async intrude_party_room()
  {
    if (this.hero.audition_enhanced_p()) {
      this.hero.status_effects.push(new StatusEffect('audition_enhancement'))
    }

    this.log("魔物の巣窟だ！ ")
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
      if (this.current_room == this.level.party_room)
        await this.intrude_party_room()
      else
        this.wake_monsters_in_room(this.current_room, 0.5)
    }
  }

  // ヒーローが居る部屋。
  get current_room()
  {
    return this.level.room_at(this.hero.x, this.hero.y)
  }


  hero_change_position(x1, y1)
  {
    [this.hero.x, this.hero.y] = [x1, y1]
    this.hero.status_effects.reject_d( e => e.type == 'held' )
    this.level.update_lighting(x1, y1)
    if (this.last_room != this.current_room) {
      this.walk_in_or_out_of_room()
      this.last_room = this.current_room
    }
  }

  // 新しいフロアに移動する。
  async new_level(dir = +1, shop)
  {
    this.level_number += dir
    if (this.level_number == 0) {
      this.beat = true
      this.clear_message()
      this.quitting = true
    } else {
      if (this.level_number == 100)
        this.level_number = 99

      if (shop && this.level_number != 1 && dir == +1 && rand() < 0.1)
        await this.shop_interaction()

      this.level = this.dungeon.make_level(this.level_number, this.hero)

      // 状態異常のクリア
      this.hero.status_effects.clear()

      // 主人公を配置する。
      const [x, y] = this.level.get_random_character_placeable_place()
      this.hero_change_position(x, y)

      if (this.level.has_type_at(Item, x, y) ||
          this.level.has_type_at(StairCase, x, y) ||
          this.level.has_type_at(Trap, x, y))
        this.log("足元になにかある。")

      // 視界
      this.level.update_lighting(this.hero.x, this.hero.y)

      this.update_stairs_direction()

      // 行動ポイントの回復。上の階で階段を降りる時にあまったポイントに
      // 影響されたくないので下の代入文で合ってる。
      this.hero.action_point = this.hero.action_point_recovery_rate
      this.recover_monster_action_point()
    }
  }

  // キー入力。
  read_command(message_status)
  {
    Curses.flushinp()
    if (message_status == 'no_message')
      Curses.timeout = -1
    else
      Curses.timeout = 1000 // milliseconds

    Curses.curs_set(0)
    const c = Curses.getch()
    Curses.curs_set(1)
    return c
  }

  hero_dash()
  {
    if (this.should_keep_dashing_p()) {
      this.hero_walk(... Vec.plus(this.hero.pos, this.dash_direction), false)
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
      this.log("眠くて何もできない。")
      return 'action'
    } else if (this.dash_direction) { // ダッシュ中
      return this.hero_dash()
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
      (m, _x, _y) => m.action_point += m.action_point_recovery_rate
    )
  }

  next_turn()
  {
    this.level.turn += 1
    this.hero.action_point += this.hero.action_point_recovery_rate
    this.recover_monster_action_point()
    this.status_effects_wear_out()
    this.hero_fullness_decrease()
    if (this.level.turn % 64 == 0 && this.level.monster_count < 25)
      this.spawn_monster()

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
      return "　"
    else if (!(y >= 0 && y < this.level.height &&
               x >= 0 && x < this.level.width)) {
      if (this.level.whole_level_lit)
        return this.level.tileset['WALL']
      else
        return "　"
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
          if (tile == '􄄤􄄥')
            return u(0x104168) + u(0x104169)
          else
            return tile
        } else
          return tile
      }
    }
  }

  // static DELAY_SECONDS = 0.4
  static DELAY_MILLLISECONDS = 400

  // 画面の表示。
  async render()
  {
    await this.wait_delay()

    this.render_map()
    this.render_status()
    const message_status = this.render_message()
    Curses.refresh()

    this.last_rendered_at = new Date
    return message_status
  }

  async wait_delay()
  {
    const t = new Date
    if (t - this.last_rendered_at < Program.DELAY_MILLLISECONDS)
      await delay( (this.last_rendered_at + Program.DELAY_MILLISECONDS) - t )
  }

  cancel_delay()
  {
    const epoch = new Date
    epoch.setTime(0)
    this.last_rendered_at = epoch
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
      this.last_message_shown_at = new Date
      return 'message_displayed'
    } else if ((new Date) - this.last_message_shown_at < Program.DELAY_MILLISECONDS) {
      Curses.setpos(Curses.lines-1, 0)
      this.addstr_ml(Curses, this.last_message)
      Curses.clrtoeol()
      return 'last_message_redisplayed'
    } else {
      return 'no_message'
    }
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
      this.addstr_ml(win, ml.toString())
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

  async play()
  {
    this.start_time = new Date
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
          this.next_turn()
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
          this.monster_phase()
        }
      }
    } catch(e) {
      if (!(e instanceof HeroDied))
        throw e

      this.log(`${this.hero.name}は ちからつきた。`)
      await this.render()
      this.gameover_message()
    }
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

    await this.initial_menu()
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
    async readChar() {
      while (true) {
        if (!this.isCharReady()) {
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
  await prog.main()
  //ttyOutputPort.writeChar("[Program Exited]")
});
