// -*- mode: js; js-indent-level: 2 -*-

class Gold
{
  constructor(amount)
  {
    this.amount = amount
    this.cursed = false
  }

  get char()
  {
    return '\u{104032}\u{104033}' 
  }

  get name()
  {
    return `${this.amount}ゴールド`
  }

  to_s()
  {
    return this.name
  }
}

class Range
{
  constructor(first, last, exclude_end = false)
  {
    this.first = first
    this.last = last
    this.exclude_end = exclude_end
  }

  to_a()
  {
    const arr = []
    const last = this.exclude_end ? this.last : this.last + 1
    for (let i = this.first; i < last; i++)
      arr.push(i)

    return arr
  }

  each(f)
  {
    const last = this.exclude_end ? this.last : this.last + 1
    for (let i = this.first; i < last; i++)
      f(i)
  }

  map(f)
  {
    const res = []
    this.each( elt => res.push(f(elt)) )
    return res
  }

  flat_map(f)
  {
    const res = []
    this.each( elt => res.push(... f(elt)) )
    return res
  }
}

function rand(arg)
{
  if (arg === undefined || arg === null) {
    // rand() は 0 <= r < 1.0 な値 r を返す。
    return Math.random()
  } else if (arg instanceof Range) {
    if (arg.exclude_end) {
      return rand(arg.last - arg.first) + arg.first
    } else {
      return rand(arg.last - arg.first + 1) + arg.first
    }
  } else if (typeof(arg) === 'number') {
    return Math.floor(Math.random() * arg)
  } else {
    throw new Error("Type error")
  }
}

class Item
{
  // type, name, number, description, furigana
  static ITEMS = [
    ["weapon", "こん棒", 1, null, null],
    ["weapon", "金の剣", 2, null, null],
    ["weapon", "銅の剣", 3, null, null],
    ["weapon", "鉄の斧", 4, null, null],
    ["weapon", "ドラゴンキラー", 5, null, null],
    ["weapon", "メタルヨテイチの剣", 7, null, null],
    ["weapon", "正義の電卓", 10, null, null],
    ["weapon", "必中会心剣", 20, "必ず当たり、会心の一撃が出る事もある強さ20の剣。", null],
    ["projectile", "木の矢", null, "強さ4の矢。", null],
    ["projectile", "鉄の矢", null, "強さ12の矢。", null],
    ["projectile", "銀の矢", null, "強さ12の矢。後ろの敵にも貫通する。", null],
    ["shield", "皮の盾", 2, "強さ2の盾。腹が減りにくくなる。", null],
    ["shield", "青銅の盾", 3, null, null],
    ["shield", "うろこの盾", 4, "強さ4の盾。毒を受けなくなる。", null],
    ["shield", "銀の盾", 5, null, null],
    ["shield", "鋼鉄の盾", 6, null, null],
    ["shield", "ドラゴンシールド", 7, "強さ7の盾。炎のダメージを半減する。", null],
    ["shield", "メタルヨテイチの盾", 10, null, null],
    ["herb", "薬草", null, "HPを25回復する。", 'やくそう'],
    ["herb", "高級薬草", null, "HPを100回復する。", 'こうきゅう'],
    ["herb", "毒けし草", null, "ちからが回復する。", 'どくけし'],
    ["herb", "ちからの種", null, "ちからが満タンの時に最大値を1つ増やす。", 'ちから'],
    ["herb", "幸せの種", null, "レベルが1つ上がる。", 'しあわせ'],
    ["herb", "すばやさの種", null, "行動速度が二倍になる。", 'すばやさ'],
    ["herb", "目薬草", null, "ワナが見えるようになる。", 'めぐすり'],
    ["herb", "毒草", null, "ダメージを受け、ちからが3下がる。敵は鈍足に。", 'どくそう'],
    ["herb", "目つぶし草", null, "目が見えなくなる。", 'めつぶし'],
    ["herb", "まどわし草", null, "敵に当てると逃げていく。", 'まどわし'],
    ["herb", "混乱草", null, "混乱してしまう。投げて使おう。", 'こんらん'],
    ["herb", "睡眠草", null, "眠ってしまう。投げて使おう。", 'すいみん'],
    ["herb", "ワープ草", null, "フロアの別の場所にワープする。", 'わーぷ'],
    ["herb", "火炎草", null, "口から火をはく。敵に投げても使える。", 'かえん'],
    ["scroll", "やりなおしの巻物", null, "1階に引き戻される。", 'やりなおし'],
    ["scroll", "武器強化の巻物", null, "武器が少し強くなる。", 'ぶききょうか'],
    ["scroll", "盾強化の巻物", null, "盾が少し強くなる。", 'たてきょうか'],
    ["scroll", "メッキの巻物", null, "盾が錆びなくなる。", 'めっき'],
    ["scroll", "解呪の巻物", null, "アイテムの呪いが解ける。", 'かいじゅ'],
    ["scroll", "同定の巻物", null, "何のアイテムか判別する。", 'どうてい'],
    ["scroll", "あかりの巻物", null, "フロア全体が見えるようになる。", 'あかり'],
    ["scroll", "かなしばりの巻物", null, "隣接している敵をかなしばり状態にする。", 'かなしばり'],
    ["scroll", "結界の巻物", null, "床に置くと敵に攻撃されなくなる。", 'けっかい'],
    ["scroll", "さいごの巻物", null, null, 'さいご'],
    ["scroll", "証明の巻物", null, null, 'しょうめい'],
    ["scroll", "豚鼻の巻物", null, "アイテムの位置がわかるようになる。", 'ぶたばな'],
    ["scroll", "兎耳の巻物", null, "モンスターの位置がわかるようになる。", 'うさぎみみ'],
    ["scroll", "パンの巻物", null, "アイテムを大きなパンに変えてしまう。", 'ぱん'],
    ["scroll", "祈りの巻物", null, "杖の回数を増やす。", 'いのり'],
    ["scroll", "爆発の巻物", null, "部屋の敵にダメージを与える。", 'ばくはつ'],
    ["scroll", "封印の巻物", null, "口が使えなくなる。", 'ふういん'],
    ["scroll", "時の砂の巻物", null, null, 'ときのすな'],
    ["scroll", "ワナの巻物", null, null, 'わな'],
    ["scroll", "パルプンテの巻物", null, null, 'ぱるぷんて'],
    ["scroll", "ワナけしの巻物", null, null, 'わなけし'],
    ["scroll", "大部屋の巻物", null, null, 'おおべや'],
    ["staff", "いかずちの杖", null, "敵にダメージを与える。", 'いかずち'],
    ["staff", "鈍足の杖", null, "敵の動きをにぶくする。", 'どんそく'],
    ["staff", "睡眠の杖", null, "敵を眠らせる。", 'すいみん'],
    ["staff", "混乱の杖", null, "敵を混乱させる。", 'こんらん'],
    ["staff", "封印の杖", null, "敵の特技を封じる。", 'ふういん'],
    ["staff", "ワープの杖", null, "敵をワープさせる。", 'わーぷ'],
    ["staff", "変化の杖", null, "敵を別の種類のモンスターに変化させる。", 'へんげ'],
    ["staff", "ピオリムの杖", null, null, 'ぴおりむ'],
    ["staff", "とうめいの杖", null, "敵をとうめい状態にする。", 'とうめい'],
    ["staff", "転ばぬ先の杖", null, "持っていれば転ばない。", 'ころばぬさき'],
    ["staff", "分裂の杖", null, "敵を分裂させてしまう。", 'ぶんれつ'],
    ["staff", "即死の杖", null, "モンスターを即死させる。", 'そくし'],
    ["staff", "もろ刃の杖", null, "敵のHPを残り1にするが、自分のHPが半分になる。", 'もろは'],
    ["staff", "大損の杖", null, null, 'おおぞん'],
    ["ring", "ちからの指輪", null, "ちからが3つ上がる。呪われていれば3つ下がる。", 'ちから'],
    ["ring", "毒けしの指輪", null, "毒を受けなくなる。", 'どくけし'],
    ["ring", "眠らずの指輪", null, "眠らなくなる。", 'ねむらず'],
    ["ring", "ワープの指輪", null, "歩くとたまにワープしてしまう。", 'わーぷ'],
    ["ring", "ハラヘラズの指輪", null, "腹が減らなくなる。", 'はらへらず'],
    ["ring", "盗賊の指輪", null, "敵を起こさずに部屋を出入りできる。", 'とうぞく'],
    ["ring", "きれいな指輪", null, null, 'きれいな'],
    ["ring", "よくみえの指輪", null, "ワナや見えない敵が見えるようになる。", 'よくみえ'],
    ["ring", "ハラペコの指輪", null, null, 'はらぺこ'],
    ["ring", "ワナ抜けの指輪", null, "ワナにかからなくなる。", 'わなぬけ'],
    ["ring", "人形よけの指輪", null, "敵にレベルやHPを下げられなくなる。", 'にんぎょうよけ'],
    ["ring", "ザメハの指輪", null, null, 'ざめは'],
    ["ring", "退魔の指輪", null, "敵がおびえて逃げていく。", 'たいま'],
    ["food", "パン", null, "満腹度が50%回復する。", null],
    ["food", "大きなパン", null, "満腹度が100%回復する。", null],
    ["food", "くさったパン", null, "満腹度100%回復。ダメージを受けてちからが減る。", null],
    ["box", "鉄の金庫", null, null, null],
    ["box", "王様の宝石箱", null, null, null],
    ["box", "イェンダーの魔除け", null, "これを取ったら帰り道。", null],
    ["box", "奇妙な箱", null, null, null],
  ]

  static CHARS = {
    "box" : "\u{10413a}\u{10413b}",
    "food" : "\u{104036}\u{104037}",
    "herb" : "\u{104030}\u{104031}",
    "projectile" : "\u{10404c}\u{10404d}",
    "ring" : "\u{104038}\u{104039}",
    "scroll" : "\u{104034}\u{104035}",
    "shield" : "\u{10402e}\u{10402f}",
    "staff" : "\u{10403a}\u{10403b}",
    "weapon" : "\u{10402c}\u{10402d}",
  }

  static make_item(name)
  {
    const row = Item.ITEMS.find(r => r[1] == name)
    if (!row)
      throw new Error(`no such item: ${name}`)

    const [type, _name, number, desc] = row
    const item = new Item(type, _name, number, desc)

    switch (item.type) {
    case "staff":
      switch (item.name) {
      case "転ばぬ先の杖":
      case "即死の杖":
        item.number = 0
        break
      default:
        // 杖の場合 5~8 で回数を設定する。
        item.number = 3 + rand(5)
      }
      break
    case "projectile":
      switch (item.name) {
      case "木の矢":
        item.number = rand(new Range(10, 20))
        break
      case "鉄の矢":
        item.number = rand(new Range(5, 15))
        break
      case "銀の矢":
        item.number = rand(new Range(5, 10))
        break
      default:
        item.number = 1
      }
      break
    case "weapon":
      {
        const r = rand(new Range(-1, +3))
        item.number = item.number + r
        item.cursed = r == -1
      }
      break
    case "shield":
      {
        const r = rand(new Range(-1, +3))
        item.number = item.number + r
        item.cursed = r == -1
      }
      break
    case "ring":
      item.cursed = rand(5) == 0
      break
    }

    return item
  }

  constructor(type, name, number, desc)
  {
    this.type   = type
    this.name   = name
    this.number = number
    this._desc   = desc
    if (type == "shield") {
      if (name == "銀の盾" || name == "皮の盾")
        this.rustproof = true
      else
        this.rustproof = false
    } else {
      this.rustproof = null
    }
    this.stuck = false
    this.mimic = false
    this.cursed = false
    this.inspected = false
  }

  get original_number()
  {
    const row = Item.ITEMS.find(r => r[1] == this.name)
    if (row)
      return row[2]
    else
      return null
  }

  relative_number()
  {
    const n = this.original_number
    if (n)
      return this.number - n
    else
      return null
  }

  get char()
  {
    if (this.type == 'scroll' && this.stuck)
      return '\u{104144}\u{104145}'
    else {
      const c = Item.CHARS[this.type]
      if (!c)
        throw new Error(`type: ${this.type}`)

      return c
    }
  }

  toString()
  {
    return this.to_s()
  }

  to_s()
  {
    const ws_num_fmt = (r) => {
      if (r === null || r === undefined)
        return "?"
      else if (r == 0)
        return ""
      else if (r < 0)
        return r.to_s()
      else
        return `+${r}`
    }

    let prefix
    switch (this.type) {
    case  "ring":
      if (this.cursed)
        prefix = u(0x10423C)
      else
        prefix = ""

      return `${prefix}${this.name}`
      break

    case  "weapon":
    case "shield":
      if (this.cursed)
        prefix = u(0x10423C)
      else if (this.gold_plated)
        prefix = "★"
      else
        prefix = ""

      return `${prefix}${this.name}${ws_num_fmt(this.relative_number())}`
      break

    case  "staff":
      return `${this.name}[${this.number}]`
      break

    case  "projectile":
      if (this.number == 1)
        return this.name
      else
        return `${this.number}本の${this.name}`
      break

    default:
      return this.name
    }
  }

  get actions()
  {
    const basics = ["投げる", "置く"]
    switch (this.type) {
    case "box":
      return [].concat(basics)
      break
    case "food":
      return ["食べる"].concat(basics)
      break
    case "herb":
      return ["飲む"].concat(basics)
      break
    case "projectile":
      return ["装備"].concat(basics)
      break
    case "ring":
      return ["装備"].concat(basics)
      break
    case "scroll":
      return ["読む"].concat(basics)
      break
    case "shield":
      return ["装備"].concat(basics)
      break
    case "staff":
      return ["ふる"].concat(basics)
      break
    case "weapon":
      return ["装備"].concat(basics)
      break
    default:
      throw new Error("uncovered case")
    }
  }

  rustproof_p()
  {
    return this.rustproof || this.gold_plated
  }

  get sort_priority()
  {
    switch (this.type) {
    case "weapon":
      return 1
      break
    case "shield":
      return 2
      break
    case "ring":
      return 3
      break
    case "projectile":
      return 4
      break
    case "food":
      return 5
      break
    case "herb":
      return 6
      break
    case "scroll":
      return 7
      break
    case "staff":
      return 8
      break
    case "box":
      return 9
      break
    default:
      throw new Error(`unknown item type ${type}`)
    }
  }

  get projectile_strength()
  {
    if (this.type != 'projectile')
      throw new Error()

    switch (this.name) {
    case "木の矢":
      return 4
      break
    case "鉄の矢":
      return 12
      break
    case "銀の矢":
      return 12
    default:
      throw new Error(`projectile strength not defined: ${this.name}`)
    }
  }

  get desc() {
    if (this._desc)
      return this._desc

    switch (this.type) {
    case "weapon":
      return `強さ${this.original_number}の武器だ。`
      break
    case "shield":
      return `強さ${this.original_number}の盾だ。`
      break
    case "projectile":
      return "投げて使う。"
      break
    default:
      return "(なし)"
    }
  }

  targeted_scroll_p()
  {
    if (this.type != 'scroll')
      return false

    switch (this.name) {
    case "同定の巻物":
    case "パンの巻物":
    case "祈りの巻物":
      return true
    default:
      return false
    }
  }

}
