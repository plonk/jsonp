// -*- mode: js; js-indent-level: 2 -*-
'use strict';

class Hero extends StatusEffectPredicates
{
  constructor(opts)
  {
    super()
    this.x                = opts.x
    this.y                = opts.y
    this.hp               = opts.hp
    this.max_hp           = opts.max_hp
    this.raw_strength     = opts.raw_strength
    this.raw_max_strength = opts.raw_max_strength
    this.gold             = opts.gold
    this.exp              = opts.exp
    this.fullness         = opts.fullness
    this.max_fullness     = opts.max_fullness
    this.lv               = opts.lv

    this.inventory = []
    this.status_effects = []
    this.name = "名無しさん"
    this.action_point = 0
    this.invisible = false

    this.weapon = null
    this.shield = null
    this.ring = null
    this.projectile = null
  }

  get strength()
  {
    if (this.ring?.name == "ちからの指輪")
      return this.raw_strength + (3 * (this.ring.cursed ? -1 : +1))
    else
      return this.raw_strength
  }

  get max_strength()
  {
    if (this.ring?.name == "ちからの指輪")
      return this.raw_max_strength + (3 * (this.ring.cursed ? -1 : +1))
    else
      return this.raw_max_strength
  }

  get action_point_recovery_rate()
  {
    if (this.quick_p())
      return 4
    else
      return 2
  }

  get state()
  {
    return "awake"
  }

  get char()
  {
    if (this.hp < 1.0)
      return '\u{104142}\u{104143}'
    else if (this.asleep_p())
      return '\u{104142}\u{104143}'
    else {
      if (this.weapon && this.shield)
        return '\u{104026}\u{104027}'
      else if (this.weapon)
        return '\u{10413e}\u{10413f}'
      else if (this.shield)
        return  '\u{10413c}\u{10413d}'
      else
        return '\u{104140}\u{104141}'
    }
  }

  equipped_p(x)
  {
    return x === this.weapon ||
      x === this.shield ||
      x === this.ring ||
      x === this.projectile
  }

  remove_from_inventory(item)
  {
    if (item === this.weapon)
      this.weapon = null
    if (item === this.shield)
      this.shield = null
    if (item === this.ring)
      this.ring = null
    if (item === this.projectile)
      this.projectile = null
    const old_length = this.inventory.length
    this.inventory = this.inventory.filter(x => x !== item)
    if (this.inventory.length != old_length - 1)
      throw new Error()
  }

  // 成功したら true。さもなくば false。
  add_to_inventory(item)
  {
    if (item.type == "projectile") {
      const stock = this.inventory.find(x => x.name == item.name)
      if (stock) {
        stock.number = Math.min(stock.number + item.number, 99)
        return true
      }
    }

    if (this.inventory.size >= 20)
      return false
    else {
      this.inventory.push(item)
      return true
    }
  }

  full_p()
  {
    return this.fullness > this.max_fullness - 1.0
  }

  increase_fullness(amount)
  {
    this.fullness = Math.min(this.fullness + amount, this.max_fullness)
  }

  increase_max_fullness(amount)
  {
    this.max_fullness = Math.min(this.max_fullness + amount, 200.0)
  }

  strength_maxed_p()
  {
    return this.strength >= this.max_strength
  }

  hp_maxed_p()
  {
    return this.hp >= this.max_hp
  }

  get hunger_per_turn()
  {
    if (this.ring?.name == "ハラヘラズの指輪")
      return 0.0
    else if (this.shield?.name == "皮の盾")
      return 0.05
    else
      return 0.1
  }

  poison_resistent_p()
  {
    return this.ring?.name == "毒けしの指輪" || this.shield?.name == "うろこの盾"    
  }

  sleep_resistent_p()
  {
    return this.ring?.name == "眠らずの指輪"
  }

  puppet_resistent_p()
  {
    return this.ring?.name == "人形よけの指輪"
  }

  // アイテムの種類でソートしてから、同じ名前のアイテムをまとめる。
  sort_inventory()
  {
    // self.inventory = inventory.map.with_index.sort { |(a,i), (b,j)|
    //   [a.sort_priority, i] <=> [b.sort_priority, j]
    // }.map(&:first).group_by { |i| i.name }.values.flatten(1)

    // ※モダンなブラウザでは Array.prototype.sort は安定ソートである。
    let items = this.inventory.sort( (a, b) => a.sort_priority - b.sort_priority )

    // Map はキーの挿入順を覚えているので、同じ名前のアイテム間での順番は変わらない。
    const groups = new Map
    for (const item of items) {
      if (!groups.has(item.name))
        groups.set(item.name, [])

      groups.get(item.name).push(item)
    }
    const result = []
    for (const [key, value] of groups) {
      result.push(... value)
    }

    this.inventory = result
  }

  get pos()
  {
    return [this.x, this.y]
  }

  critical_p()
  {
    return this.weapon?.name == "必中会心剣"
  }

  no_miss_p()
  {
    return this.weapon?.name == "必中会心剣"
  }
}

