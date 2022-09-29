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
      this._attrs = []
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
  },

  init_pair(n, fg, bg)
  {
    this._color_pairs[n] = `3${fg};4${bg}`
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

  static HEALTH_BAR_COLOR_PAIR        = 1
  static UNIDENTIFIED_ITEM_COLOR_PAIR = 2
  static NICKNAMED_ITEM_COLOR_PAIR    = 3
  static CURSED_ITEM_COLOR_PAIR       = 4
  static SPECIAL_DUNGEON_COLOR_PAIR   = 5

  constructor()
  {
    this.debug = false
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

    this.last_rendered_at = new Date

    this.last_message = ""
    this.last_message_shown_at = new Date

   // this.naming_table = this.create_naming_table()
  }

  // 状態異常が解けた時のメッセージ。
  on_status_effect_expire(character, effect)
  {
    switch ( effect.type ) {
    case 'paralysis':
      this.log(`${this.display_character(character)}の かなしばりがとけた。`)
      break
    case 'sleep':
      this.log(`${this.display_character(character)}は 目をさました。`)
      break
    case 'held':
      this.log(`${this.display_character(character)}の 足が抜けた。`)
      break
    case 'confused':
      this.log(`${this.display_character(character)}の 混乱がとけた。`)
      break
    case 'quick':
      this.log(`${this.display_character(character)}の 足はもう速くない。`)
      break
    default:
      this.log(`${this.display_character(character)}の ${effect.name}状態がとけた。`)
      break
    }
  }

  // 状態異常の残りターン数減少処理。
  status_effects_wear_out()
  {
    const monsters = this.level.all_monsters_with_position.map( ([m, x, y]) =>  m )

    monsters.concat( [this.hero] ).each(
      m => {
        m.status_effects.each( e => e.remaining_duration -= 1 )

        m.status_effects.reject_d(
          e => {
            const expired = e.remaining_duration <= 0
            if (expired)
              on_status_effect_expire(m, e)
            return expired
          }
        )
      }
    )
  }

  // ヒーローの攻撃力。(Lvと武器)
  get_hero_attack()
  {
    const basic = this.lv_to_attack(this.exp_to_lv(this.hero.exp))
    const weapon_score = this.hero.weapon ? this.hero.weapon.number : 0
    return (basic + basic * (weapon_score + this.hero.strength - 8)/16.0).round()
  }

  // ヒーローの投擲攻撃力。
  get_hero_projectile_attack(projectile_strength)
  {
    const basic = this.lv_to_attack(this.exp_to_lv(this.hero.exp))
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

  // モンスターにダメージを与える。
  monster_take_damage(monster, damage, cell)
  {
    if (monster.damage_capped_p())
      damage = [damage, 1].min()

    const set_to_explode = !monster.nullified_p() && monster.bomb_p() && monster.hp < monster.max_hp.div(2)

    monster.hp -= damage
    this.log(`${this.display_character(monster)}に ${damage} のダメージを与えた。`)
    if (monster.hp >= 1.0) { // 生きている
      if (set_to_explode) {
        this.monster_explode(monster, cell)
        return
      }

      this.on_monster_taking_damage(monster, cell)
    }
    this.check_monster_dead(cell, monster)
  }

  // ヒーローがモンスターを攻撃する。
  hero_attack(cell, monster)
  {
    this.log(`${this.hero.name}の攻撃！ `)
    this.on_monster_attacked(monster)
    if (!this.hero.no_miss_p() && rand() < 0.125) {
      SoundEffects.miss()
      this.log(`${this.hero.name}の攻撃は 外れた。`)
    } else {
      SoundEffects.hit()
      const attack = this.get_hero_attack()
      let damage = ( ( attack * Math.pow(15.0/16.0, monster.defense) ) * (112 + rand(32))/128.0 ).to_i()
      if (monster.name == "竜" && this.hero.weapon?.name == "ドラゴンキラー")
        damage *= 2

      if (this.hero.critical_p() && rand() < 0.25) {
        this.log("会心の一撃！")
        damage *= 2
      }
      this.monster_take_damage(monster, damage, cell)
    }
  }

  // モンスターが死んでいたら、その場合の処理を行う。
  check_monster_dead(cell, monster)
  {
    if (monster.hp < 1.0) {
      if (monster.invisible && !this.level.whole_level_lit) {
        const old = this.display_character(monster)
        monster.invisible = false
        monster.hp = 1
        this.log(`${old}は ${this.display_character(monster)}だった!`)
        this.render()
        monster.hp = 0
        this.render()
      }
      this.monster.reveal_self() // 化けの皮を剥ぐ。

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
        this.item_land(thing, x, y)
      }

      this.hero.exp += monster.exp
      this.log(`${this.display_character(monster)}を たおして ${monster.exp} ポイントの経験値を得た。`)
      this.check_level_up()

      this.hero.status_effects.reject_d(
        e => {
          if (e.caster === monster) {
            this.on_status_effect_expire(this.hero, e)
            return true
          } else {
            return false
          }
        }
      )
    }
  }

  // ...

  // # 敵の攻撃力から、実際にヒーローが受けるダメージを計算する。
  // def attack_to_hero_damage(attack)
  //   return ( ( attack * (15.0/16.0)**get_hero_defense ) * (112 + rand(32))/128.0 ).to_i
  // end

  // def monster_attacks_hero(m)
  //   attack = get_monster_attack(m)

  //   if attack == 0
  //     log("#{display_character(m)}は 様子を見ている。")
  //   else
  //     log("#{display_character(m)}の こうげき！ ")
  //     if rand() < 0.125
  //       SoundEffects.miss
  //       log("#{@hero.name}は ひらりと身をかわした。")
  //     else
  //       SoundEffects.hit
  //       damage = attack_to_hero_damage(attack)
  //       take_damage(damage)
  //     end
  //   end
  // end

  // モンスターが攻撃する。
  monster_attack(assailant, dir)
  {
    const [mx, my] = this.level.coordinates_of(assailant)
    const target = Vec.plus([mx, my], dir)
    const defender = this.level.cell(... target).monster

    if (this.hero.pos.eql_p(target)) {
      this.monster_attacks_hero(assailant)
    } else if (defender) {
      const attack = this.get_monster_attack(assailant)
      const damage = ( ( attack * Math.pow(15.0/16.0, defender.defense) ) * (112 + rand(32))/128.0 ).to_i()

      if (attack === 0) {
        this.log("${assailant.name}は 様子を見ている。")
      } else {
        this.log("${assailant.name}の こうげき！ ")
        this.on_monster_attacked(defender)
        this.monster_take_damage(defender, damage, this.level.cell(... target))
      }
    }else {
      // 誰もいない
    }
  }

  // # モンスターが特技を使用する。
  // def monster_trick(m)
  //   case m.name
  //   when '催眠術師'
  //     log("#{m.name}は 手に持っている物を 揺り動かした。")
  //     SoundEffects.magic
  //     hero_fall_asleep
  //   when 'ファンガス'
  //     log("#{m.name}は 毒のこなを 撒き散らした。")
  //     take_damage_strength(1)
  //   when 'ノーム'
  //     potential = rand(250..1500)
  //     actual = [potential, @hero.gold].min
  //     if actual == 0
  //       log("#{@hero.name}は お金を持っていない！ ")
  //     else
  //       log("#{m.name}は #{actual}ゴールドを盗んでワープした！ ")

  //       @hero.gold -= actual
  //       m.item = Gold.new(actual)

  //       unless m.hallucinating?
  //         m.status_effects << StatusEffect.new(:hallucination, Float::INFINITY)
  //       end

  //       monster_teleport(m, @level.cell(*@level.coordinates_of(m)))
  //     end
  //   when "白い手"
  //     if !@hero.held?
  //       log("#{m.name}は #{@hero.name}の足をつかんだ！ ")
  //       effect = StatusEffect.new(:held, 10)
  //       effect.caster = m
  //       @hero.status_effects << effect
  //     end

  //   when "ピューシャン"
  //     mx, my = @level.coordinates_of(m)
  //     dir = Vec.normalize(Vec.minus([@hero.x, @hero.y], [mx, my]))
  //     arrow = Item.make_item("木の矢")
  //     arrow.number = 1
  //     monster_throw_item(m, arrow, mx, my, dir)

  //   when "アクアター"
  //     log("#{m.name}は 酸を浴せた。")
  //     if @hero.shield
  //       take_damage_shield
  //     end

  //   when "パペット"
  //     log("#{m.name}は おどりをおどった。")
  //     if @hero.puppet_resistent?
  //       log("しかし #{@hero.name}は平気だった。")
  //     else
  //       hero_levels_down
  //     end

  //   when "土偶"
  //     if rand() < 0.5
  //       log("#{m.name}が #{@hero.name}のちからを吸い取る！")
  //       if @hero.puppet_resistent?
  //         log("しかし #{@hero.name}は平気だった。")
  //       else
  //         take_damage_max_strength(1)
  //       end
  //     else
  //       log("#{m.name}が #{@hero.name}の生命力を吸い取る！")
  //       if @hero.puppet_resistent?
  //         log("しかし #{@hero.name}は平気だった。")
  //       else
  //         take_damage_max_hp(5)
  //       end
  //     end

  //   when "目玉"
  //     log("目玉は#{@hero.name}を睨んだ！")
  //     unless @hero.confused?
  //       @hero.status_effects.push(StatusEffect.new(:confused, 10))
  //       log("#{@hero.name}は 混乱した。")
  //     end

  //   when "どろぼう猫"
  //     candidates = @hero.inventory.reject { |x| @hero.equipped?(x) }

  //     if candidates.any?
  //       item = candidates.sample
  //       @hero.remove_from_inventory(item)
  //       m.item = item
  //       log("#{m.name}は ", display_item(item), "を盗んでワープした。")

  //       unless m.hallucinating?
  //         m.status_effects << StatusEffect.new(:hallucination, Float::INFINITY)
  //       end

  //       monster_teleport(m, @level.cell(*@level.coordinates_of(m)))
  //     else
  //       log("#{@hero.name}は 何も持っていない。")
  //     end

  //   when "竜"
  //     mx, my = @level.coordinates_of(m)
  //     dir = Vec.normalize(Vec.minus([@hero.x, @hero.y], [mx, my]))
  //     log("#{m.name}は 火を吐いた。")
  //     breath_of_fire(m, mx, my, dir)

  //   when "ソーサラー"
  //     log("#{m.name}は ワープの杖を振った。")
  //     SoundEffects.magic
  //     wait_delay
  //     hero_teleport

  //   else
  //     fail
  //   end
  // end

  // # ヒーローがちからの最大値にダメージを受ける。
  // def take_damage_max_strength(amount)
  //   fail unless amount == 1
  //   if @hero.raw_max_strength <= 1
  //     log("#{@hero.name}の ちからは これ以上さがらない。")
  //   else
  //     @hero.raw_max_strength -= 1
  //     @hero.raw_strength = [@hero.raw_strength, @hero.raw_max_strength].min
  //     log("#{@hero.name}の ちからの最大値が 下がった。")
  //   end
  // end

  // # ヒーローが最大HPにダメージを受ける。
  // def take_damage_max_hp(amount)
  //   @hero.max_hp = [@hero.max_hp - amount, 1].max
  //   @hero.hp = [@hero.hp, @hero.max_hp].min
  //   log("#{@hero.name}の 最大HPが 減った。")
  // end

  // モンスターが移動する。
  monster_move(m, mx, my, dir)
  {
    this.level.cell(mx, my).remove_object(m)
    this.level.cell(mx + dir[0], my + dir[1]).put_object(m)
    m.facing = dir
  }

  // move 以外のアクションを実行。
  dispatch_action(m, action)
  {
    switch ( action.type ) {
    case 'attack':
      this.monster_attack(m, action.direction)
      break
    case 'trick':
      this.monster_trick(m)
      break
    case 'rest':
      // 何もしない。
      break
    default:
    }
  }

  // 行動により満腹度が消費される。満腹度が無い時はHPが減る。
  hero_fullness_decrease()
  {
    const old = this.hero.fullness
    if (this.hero.fullness > 0.0) {
      if ( this.dungeon.on_return_trip_p(this.hero) ) {
        this.hero.fullness -= this.hero.hunger_per_turn
        if (old >= 20.0 && this.hero.fullness <= 20.0)
          this.log("おなかが 減ってきた。")
        else if (old >= 10.0 && this.hero.fullness <= 10.0)
          this.log("空腹で ふらふらしてきた。")
        else if (this.hero.fullness <= 0.0)
          this.log("早く何か食べないと死んでしまう！ ")
      }

      // 自然回復
      this.hero.hp = [this.hero.hp + this.hero.max_hp/150.0, this.hero.max_hp].min()
    } else {
      this.take_damage(1, { quiet: true })
    }
  }

  // ヒーローがダメージを受ける。
  take_damage(amount, opts = {})
  {
    if (opts.quiet) {
      this.stop_dashing()
    } else {
      this.log(
        sprintf("%.0f ポイントの ダメージを受けた。", amount)
      )
    }

    this.hero.hp -= amount
    if (this.hero.hp < 1.0) {
      this.hero.hp = 0.0
      throw new HeroDied
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
  hero_move(c)
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
      this.hero_attack(cell, cell.monster)
      return 'action'
    } else {
      if (this.hero.held_p()) {
        this.log("その場に とらえられて 動けない！ ")
        return 'action'
      }

      if (shifted) {
        this.dash_direction = vec
      }
      this.hero_walk(... target, !shifted)
      return 'move'
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

  hero_walk(x1, y1, picking)
  {
    if (this.level.cell(x1, y1).item?.mimic) {
      const item = this.level.cell(x1, y1).item
      this.log(this.display_item(item), "は ミミックだった!")
      const m = Monster.make_monster("ミミック")
      m.state = 'awake'
      m.action_point = m.action_point_recovery_rate // このターンに攻撃させる
      this.level.cell(x1, y1).remove_object(item)
      this.level.cell(x1, y1).put_object(m)
      this.stop_dashing()
      return
    }

    //SoundEffects.footstep()

    this.hero_change_position(x1, y1)
    const cell = this.level.cell(x1, y1)

    const gold = cell.gold
    if (gold) {
      if (picking) {
        cell.remove_object(gold)
        this.hero.gold += gold.amount
        this.log(`${gold.amount}G を拾った。`)
      } else {
        this.log(`${gold.amount}G の上に乗った。`)
        this.stop_dashing()
      }
    }

    const item = cell.item
    if (item) {
      if (picking) {
        this.pick(cell, item)
      }else {
        this.log(this.display_item(item), "の上に乗った。")
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
          this.trap_activate(trap)
        else
          this.log(`${trap.name}は 発動しなかった。`)
      }
    }

    if (cell.staircase)
      this.stop_dashing()

    if (this.hero.ring?.name == "ワープの指輪") {
      if (rand() < 1.0/16) {
        this.log(this.hero.name, "は ワープした！")
        this.stop_dashing() // 駄目押し
        this.hero_teleport()
      }
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

  //  十字路、T字路で止まる。
  fork_p(point)
  {
    if (this.level.room_at(... point))
      return false

    if ( ![[-1,-1],[+1,-1],[-1,+1],[+1,+1],[-1,0],[0,-1],[+1,0],[0,+1]]
         .every(d => this.level.in_dungeon_p(... Vec.plus(point,d))) )
      return false

    if ( ![[-1,0],[0,-1],[+1,0],[0,+1]].count(d => this.level.cell(... Vec.plus(point,d)).type == 'PASSAGE' || this.level.cell(... Vec.plus(point,d)).type == 'FLOOR') >= 3 )
      return false

    return true
  }

  should_keep_dashing_p()
  {
    const target = Vec.plus(this.hero.pos, this.dash_direction)
    const index = DIRECTIONS.index(this.dash_direction)
    const forward_area = new Range(-2, +2).to_a().map(
      ioff => Vec.plus(this.hero.pos, DIRECTIONS[(index+ioff) % 8])
    )

    // if (this.hero.status_effects.length > 0)
    //   return false
    if (!hero_can_move_to_p(target))
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
    else if (current_room && this.level.first_cells_in(current_room).include_p(this.hero.pos))
      return false
    else if (!current_room && this.level.room_at(... target) &&
             this.level.first_cells_in(this.level.room_at(... target)).include_p(target))
      return false
    else if (this.fork_p(this.hero.pos))
      return false
    else
      return true
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
      ( [m, _x, _y] ) => m.action_point += m.action_point_recovery_rate
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

  all_monsters_moved_p()
  {
    console.log(this.level.all_monsters_with_position)
    return this.level.all_monsters_with_position.every(
      ( [m, ... pos] ) => m.action_point < 2
    )
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

  // ヒーロー this.hero が item を拾おうとする。
  pick(cell, item)
  {
    if (item.stuck) {
      this.log(this.display_item(item), "は 床にはりついて 拾えない。")
    } else {
      if (this.hero.add_to_inventory(item)) {
        cell.remove_object(item)
        this.update_stairs_direction()
        this.log(this.hero.name, "は ", this.display_item(item), "を 拾った。")
      } else {
        this.log("持ち物が いっぱいで ", this.display_item(item), "が 拾えない。")
      }
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
      ;[i, ...[i - 1, i + 1].shuffle(), ...[i - 2, i + 2].shuffle()].map(j => Program.DIRECTIONS[j % 8]).each( ([dx, dy]) => {
        if (this.level.can_move_to_p(m, mx, my, mx+dx, my+dy) &&
           ![mx+dx, my+dy].eql_p( [this.hero.x, this.hero.y] )&&
           this.level.cell(mx+dx, my+dy).item?.name != "結界の巻物") {
          return new Action('move', [dx, dy])
        }
      })

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
        dirs.each( ([dx, dy]) => {
          if (this.level.can_move_to_p(m, mx, my, mx+dx, my+dy) &&
              ![mx+dx, my+dy].eql_p( [this.hero.x, this.hero.y] ) &&
              this.level.cell(mx+dx, my+dy).item?.name != "結界の巻物") {
            return new Action('move', [dx,dy])
          }
        })

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

  // def monster_confused_action(m, mx, my)
  //   candidates = []
  //   rect = @level.surroundings(mx, my)
  //   rect.each_coords do |x, y|
  //     next unless @level.in_dungeon?(x, y) &&
  //                 (@level.cell(x, y).type == :FLOOR ||
  //                  @level.cell(x, y).type == :PASSAGE)
  //     if @level.can_move_to_terrain?(m, mx, my, x, y) &&
  //        @level.cell(x, y).item&.name != "結界の巻物"
  //       candidates << [x, y]
  //     end
  //   end
  //   if candidates.any?
  //     x, y = candidates.sample
  //     if [x,y] == @hero.pos || @level.cell(x,y).monster
  //       return Action.new(:attack, [x-mx, y-my])
  //     else
  //       return Action.new(:move, [x - mx, y - my])
  //     end
  //   else
  //     return Action.new(:rest, nil)
  //   end
  // end

  // def monster_blind_action(m, mx, my)
  //   target = nil
  //   dx, dy = m.facing
  //   applicable_p = lambda { |x, y|
  //     if @level.in_dungeon?(x,y) &&
  //        (@level.cell(x,y).type==:FLOOR || @level.cell(x,y).type==:PASSAGE) &&
  //        @level.can_move_to_terrain?(m, mx, my, x, y) &&
  //        @level.cell(x,y).item&.name != "結界の巻物"
  //       true
  //     else
  //       false
  //     end
  //   }
  //   attack_or_move = lambda { |x, y|
  //     if [x,y] == @hero.pos || @level.cell(x,y).monster
  //       return Action.new(:attack, [x-mx, y-my])
  //     else
  //       return Action.new(:move, [x-mx, y-my])
  //     end
  //   }

  //   if applicable_p.(mx+dx, my+dy)
  //     return attack_or_move.(mx+dx, my+dy)
  //   else
  //     candidates = []
  //     @level.surroundings(mx, my).each_coords do |x, y|
  //       if applicable_p.(x, y)
  //         candidates << [x,y]
  //       end
  //     end

  //     if candidates.any?
  //       x, y = candidates.sample
  //       m.facing = [x-mx, y-my]
  //     end
  //     return Action.new(:rest, nil)
  //   end
  // end

  // モンスターの移動・行動フェーズ。
  monster_phase()
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
    doers.each(
      ( [m, action] ) => {
        if (m.hp < 1.0)
          return

        this.dispatch_action(m, action)
        if (m.single_attack_p()) {
          // 攻撃するとAPを使いはたす。
          m.action_point = 0
        } else {
          m.action_point -= 2
        }
      }
    )
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
            console.log('nothing')
            this.hero.action_point = old
          }
          console.log("hoge")
        } else if (this.all_monsters_moved_p()) {
          console.log('next_turn')
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
          console.log('monster_phase')
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
  try {
    await prog.main()
  } finally {
    for (let i = Finalizers.length - 1; i >= 0; i--)
      Finalizers[i]()
  }
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
  console.log(this)
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
  console.log('index', value)
  const i = this.findIndex( elt => eql_p(elt,value) )
  console.log('i', i)
  if (i == -1)
    return null
  else
    return i
}
