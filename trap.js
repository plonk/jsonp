// -*- mode: js; js-indent-level: 2 -*-

class Trap
{
  static TRAPS = [
    "ワープゾーン",
    "硫酸",
    "トラばさみ",
    "眠りガス",
    "石ころ",
    "矢",
    "毒矢",
    "地雷",
    "落とし穴",
  ]

  static NAME_TO_CHAR = {
    "ワープゾーン" : "􄄨􄄩",
    "硫酸" : "􄄦􄄧",
    "トラばさみ" : "􄄪􄄫",
    "眠りガス" : "􄄬􄄭",
    "石ころ" : "􄄮􄄯",
    "矢" : "􄄰􄄱",
    "毒矢" : "􄄲􄄳",
    "地雷" : "􄄴􄄵",
    "落とし穴" : "􄄶􄄷",
  }

  constructor(name, visible = false)
  {
    this.name = name
    this.visible = visible
  }

  get char()
  {
    const ch = Trap.NAME_TO_CHAR[this.name]
    if (!ch)
      throw new Error
    return ch
  }
}
