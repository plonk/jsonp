// -*- mode: js; js-indent-level: 2 -*-

class StatusEffect
{
  constructor(type, remaining_duration = Float.INFINITY)
  {
    this.type = type
    this.remaining_duration = remaining_duration
    this.caster = null
  }

  get name()
  {
    return (
      {
        sleep:"睡眠",
        paralysis:"かなしばり",
        held:"はりつけ",
        confused:"混乱",
        hallucination:"まどわし",
        quick:"倍速",
        bomb:"爆弾",
        audition_enhancement:"兎耳",
        olfaction_enhancement:"豚鼻",
        nullification:"封印",
        blindness:"盲目",
        trap_detection:"ワナ感知",
      }
    )[this.type] || this.type
  }
}

class StatusEffectPredicates
{

  paralyzed_p()
  {
    return this.status_effects.some(e => e.type == 'paralysis')
  }

  asleep_p()
  {
    return this.status_effects.some(e => e.type == 'sleep')
  }

  held_p()
  {
    return this.status_effects.some(e => e.type == 'held')
  }

  confused_p()
  {
    return this.status_effects.some(e => e.type == 'confused')
  }

  hallucinating_p()
  {
    return this.status_effects.some(e => e.type == 'hallucination')
  }

  quick_p()
  {
    return this.status_effects.some(e => e.type == 'quick')
  }

  bomb_p()
  {
    return this.status_effects.some(e => e.type == 'bomb')
  }

  nullified_p()
  {
    return this.status_effects.some(e => e.type == 'nullification')
  }

  audition_enhanced_p()
  {
    return this.status_effects.some(e => e.type == 'audition_enhancement')
  }

  olfaction_enhanced_p()
  {
    return this.status_effects.some(e => e.type == 'olfaction_enhancement')
  }

  blind_p()
  {
    return this.status_effects.some(e => e.type == 'blindness')
  }

  trap_detecting_p()
  {
    return this.status_effects.some(e => e.type == 'trap_detection')
  }

}

class Monster extends StatusEffectPredicates
{
  static SPECIES = [
    // char, name, max_hp, exp, strength, defense, drop, asleep_rate, range
    ['􄁂􄁃', 'スライム', 5, 1, 2, 1, 0.01, 0.5, "none"],            // 弱い
    ['􄁆􄁇', 'コウモリ', 7, 2, 3, 1, 0.01, 0.5, "none"],            // ふらふら
    ['􄁈􄁉', 'オオウミウシ', 7, 3, 2, 4, 0.01, 0.5, "none"],        // 体当たり
    ['􄁊􄁋', 'ツバメ', 5, 2, 3, 9, 0.01, 0.5, "none"],              // 速い
    ['􄁎􄁏', 'ワラビー', 8, 5, 4, 9, 0.01, 0.5, "none"],            // 蹴ってくる
    ['􄁐􄁑', '催眠術師', 16, 12, 6, 11, 0.33, 0.0, "reach"],        // 寝てる。眠らせる
    ['􄁒􄁓', 'ピューシャン', 9, 5, 4, 15, 0.01, 0.5, "line"],       // 矢を打つ
    ['􄁔􄁕', 'ファンガス', 17, 6, 6, 8, 0.16, 0.5, "reach"],        // 胞子で力を下げる
    ['􄁖􄁗', 'グール', 10, 7, 4, 15, 0.01, 0.5, "none"],            // 増える
    ['􄁘􄁙', '木乃伊', 16, 16, 10, 19, 0.01, 0.5, "none"],          // 回復アイテムでダメージ
    ['􄁚􄁛', 'ノーム', 20, 10, 0, 16,1.0, 0.5, "reach"],            // 金を盗む
    ['􄁜􄁝', 'ハゲタカ', 27, 25, 10, 16, 0.16, 0.5, "none"],        // クチバシが痛い
    ['􄁞􄁟', 'ソーサラー', 23, 15, 10, 16, 0.01, 0.5, "reach"],     // 瞬間移動の杖を振る
    ['􄁄􄁅', 'メタルヨテイチ', 3, 500, 30, 49, 1.0, 0.0, "none"],   // 回避性のレアモン
    ['􄁠􄁡', 'おめん武者', 35, 40, 15, 26, 0.16, 0.5, "none"],      // 鎧の中は空洞だ
    ['􄁢􄁣', 'アクアター', 30, 25, 0, 19, 0.01, 0.5, "reach"],      // ガッポーン。盾が錆びるぞ
    ['􄁤􄁥', 'どろぼう猫', 40, 20, 0, 17, 0.0, 0.0, "reach"],       // アイテムを盗む
    ['􄄤􄄥', '動くモアイ像', 45, 50, 18, 27, 0.33, 0.0, "none"],    // 石像のふりをしている
    ['􄁨􄁩', '四人トリオ', 60, 10, 11, 3, 0.0, 1.0, "none"],        // 4人で固まって出現する
    ['􄁪􄁫', '白い手', 72, 40, 7, 23, 0.0, 0.0, "reach"],           // つかまると倒すまで動けない
    ['􄁬􄁭', 'ゴーレム', 52, 180, 32, 27, 0.33, 0.5, "none"],       // 巨大な泥人形
    ['􄈬􄈭', 'ボンプキン', 70, 30, 12, 23, 0.01, 0.5, "none"],      // 爆発する
    ['􄁰􄁱', 'パペット', 36, 40, 13, 23, 0.16, 0.5, "reach"],       // レベルを下げる
    ['􄁲􄁳', 'ゆうれい', 60, 150, 17, 27, 0.0, 0.5, "none"],        // 見えない。ふらふら
    ['􄁴􄁵', 'ミミック', 50, 30, 24, 24, 0.0, 0.0, "none"],         // アイテム・階段に化ける
    ['􄄠􄄡', 'トロール', 51, 380, 51, 21, 0.16, 0.5, "none"],       // 強い
    ['􄁶􄁷', '目玉', 62, 250, 31, 27, 0.16, 0.5, "sight"],          // 混乱させてくる
    ['􄁸􄁹', '化け狸', 80, 20, 9, 14, 0.0, 0.5, "none"],            // 別のモンスターに化ける
    ['􄁺􄁻', '土偶', 70, 150, 17, 24, 0.0, 0.5, "reach"],           // HP、ちから最大値を下げる
    ['􄄢􄄣', 'デビルモンキー', 78, 600, 26, 25, 0.16, 0.5, "none"], // 二倍速
    ['􄁼􄁽', 'マルスボース', 75, 750, 51, 29, 0.16, 0.5, "none"],   // 強い
    ['􄁾􄁿', '竜', 100, 3000, 68, 30, 0.75, 0.5, "line"],           // テラ強い。火を吐く
  ]

  static make_monster(name)
  {
      const row = Monster.SPECIES.find(r => r[1] == name)
      if (!row)
          throw new Error(`no such monster: ${name}`)

      const [char, _, max_hp, exp, strength, defense, drop_rate, asleep_rate, trick_range] = row
      const state = (rand() < asleep_rate) ? 'asleep' : 'awake'
      return new Monster(char, name, max_hp, strength, defense, exp, drop_rate,
                         state, [1,1], null, trick_range)
  }
    
  // include StatusEffectPredicates

  constructor(char, name, max_hp, strength, defense, exp, drop_rate,
             state, facing, goal, trick_range)
  {
    super()

    this._char      = char
    this._name      = name
    this.max_hp    = max_hp
    this.strength  = strength
    this.defense   = defense
    this.exp       = exp
    this.drop_rate = drop_rate

    this.state = state
    this.facing = facing
    this.goal = goal

    this.hp = this.max_hp

    this.status_effects = []
    this.item = null
    switch ( this._name ) {
    case "催眠術師": case "どろぼう猫": case "四人トリオ":
      // 攻撃されるまで動き出さないモンスター
      this.status_effects.push(new StatusEffect('paralysis', Float.INFINITY))
      break
    case "ノーム":
      this.item = new Gold(rand(new Range(250, 1500)))
      break
    case "白い手": case "動くモアイ像":
      this.status_effects.push(new StatusEffect('held', Float.INFINITY))
      break
    case "メタルヨテイチ":
      this.status_effects.push(new StatusEffect('hallucination', Float.INFINITY))
      this.item = Item.make_item("幸せの種")
      break
    case "化け狸":
      this.impersonating_name = this._name
      this.impersonating_char = this.char
      break
    case "ボンプキン":
      this.status_effects.push(new StatusEffect("bomb", Float.INFINITY))
      break
    }

    this.trick_range = trick_range

    if (this._name == "ゆうれい")
      this.invisible = true
    else
      this.invisible = false

    this.action_point = 0
    this.action_point_recovery_rate = this.double_speed_p() ? 4 : 2
  }

  // state = "awake" の操作は別。モンスターの特殊な状態を解除して動き出
  // させる。
  on_party_room_intrusion()
  {
    switch (this._name) {
    case "催眠術師": case "どろぼう猫": case "四人トリオ":
      // 攻撃されるまで動き出さないモンスター
      this.status_effects.reject_d( e =>  e.type == "paralysis" )
      break
    case "動くモアイ像":
      this.status_effects.reject_d( e =>  e.type == "held" )
      break
    }
  }

  get char()
  {
    switch ( this._name ) {
    case  "ボンプキン":
      if (this.hp < 1.0)
        return u(0x104238) + u(0x104239) // puff of smoke
      else if (!this.nullified_p() && this.bomb_p() && this.hp <= this.max_hp.idiv(2))
        return '􄁮􄁯'
      else
        return this._char
      break

    case "化け狸" :
      if (this.hp < 1.0)
        return this._char
      else
        return this.impersonating_char
      break

    case "動くモアイ像" :
      if (this.held_p())
        return this._char
      else
        return u(0x104066) + u(0x104067)
      break

    default:
      if (this.hp < 1.0)
        return u(0x104238) + u(0x104239) // puff of smoke
      else
        return this._char

    }
  }

  reveal_self()
  {
    if (this._name == "化け狸") {
      this.impersonating_name = this._name
      this.impersonating_char = this.char
    }
  }

  get name()
  {
    if (this._name == "化け狸")
      return this.impersonating_name
    else
      return this._name
  }

  tipsy_p()
  {
    return this._name == "コウモリ" || this._name == "ゆうれい"
  }

  get trick_rate()
  {
    return ({
      "白い手": 1.0,
      '催眠術師': 0.25,
      'ファンガス': 0.33,
      'ノーム': 0.5,
      'ピューシャン': 0.75,
      "アクアター": 0.5,
      "パペット": 0.5,
      "土偶": 0.5 /* HP 0.25 / ちから 0.25 */,
      "目玉": 0.25,
      "どろぼう猫": 0.5,
      "竜": 0.5,
      "ソーサラー": 0.33,
    })[this._name] || 0.0
  }

  single_attack_p()
  {
    switch ( this._name ) {
    case "ツバメ": case "四人トリオ":
      return true
    default:
      return false
    }
  }

  divide_p()
  {
    if (this._name == "グール")
      return true
    else
      return false
  }

  poisonous_p()
  {
    switch ( this._name ) {
    case  'ファンガス': case  '土偶':
      return true
    default:
      return false
    }
  }

  undead_p()
  {
    switch (this._name) {
    case '木乃伊': case 'ゆうれい':
      return true
    default:
      return false
    }
  }

  hp_maxed_p()
  {
    return this.hp == this.max_hp
  }

  damage_capped_p()
  {
    return this._name == "メタルヨテイチ"
  }

  teleport_on_attack_p()
  {
    return this._name == "メタルヨテイチ"
  }

  double_speed_p()
  {
    switch ( this._name ) {
    case "デビルモンキー": case "ツバメ": case "四人トリオ": case "メタルヨテイチ":
      return true
    default:
      return false
    }
  }

}

// Array#reject!
Array.prototype.reject_d = function(pred) {
  for (let i = 0; i < this.length; ) {
    if (pred(val)) {
      this.splice(i, 1)
    } else
      i++
  }
  return this
}
