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
    "ワープゾーン" : "\u{104128}\u{104129}",
    "硫酸" : "\u{104126}\u{104127}",
    "トラばさみ" : "\u{10412a}\u{10412b}",
    "眠りガス" : "\u{10412c}\u{10412d}",
    "石ころ" : "\u{10412e}\u{10412f}",
    "矢" : "\u{104130}\u{104131}",
    "毒矢" : "\u{104132}\u{104133}",
    "地雷" : "\u{104134}\u{104135}",
    "落とし穴" : "\u{104136}\u{104137}",
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
