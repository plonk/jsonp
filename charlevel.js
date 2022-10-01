// -*- mode: js; js-indent-level: 2 -*-
'use strict';

class CharacterLevel
{
  static EXP_LV_TABLE = [[0, 1],
                  [10, 2],
                  [30, 3],
                  [60, 4],
                  [100, 5],
                  [150, 6],
                  [230, 7],
                  [350, 8],
                  [500, 9],
                  [700, 10],
                  [950, 11],
                  [1200, 12],
                  [1500, 13],
                  [1800, 14],
                  [2300, 15],
                  [3000, 16],
                  [4000, 17],
                  [6000, 18],
                  [9000, 19],
                  [15000, 20],
                  [23000, 21],
                  [33000, 22],
                  [45000, 23],
                  [60000, 24],
                  [80000, 25],
                  [100000, 26],
                  [130000, 27],
                  [180000, 28],
                  [240000, 29],
                  [300000, 30],
                  [400000, 31],
                  [500000, 32],
                  [600000, 33],
                  [700000, 34],
                  [800000, 35],
                  [900000, 36],
                  [999999, 37]]

  static lv_to_exp(level)
  {
    for (const [e, lv] of CharacterLevel.EXP_LV_TABLE) {
      if (level === lv)
        return e
    }
    return null
  }

  static exp_to_lv(exp)
  {
    let last_lv = null
    for (const [e, lv] of CharacterLevel.EXP_LV_TABLE) {
      if (exp < e)
        return last_lv

      last_lv = lv
    }
    return last_lv // 37
  }

  static lv_to_attack(lv)
  {
    if (typeof( lv ) != 'number')
      throw new Error('type error')

    if (lv >= 37)
      lv = 37

    const table = {
      '1': 5,
      '2': 7,
      '3': 9,
      '4': 11,
      '5': 13,
      '6': 16,
      '7': 19,
      '8': 22,
      '9': 25,
      '10': 29,
      '11': 33,
      '12': 37,
      '13': 41,
      '14': 46,
      '15': 51,
      '16': 56,
      '17': 61,
      '18': 65,
      '19': 71,
      '20': 74,
      '21': 77,
      '22': 80,
      '23': 83,
      '24': 86,
      '25': 89,
      '26': 90,
      '27': 91,
      '28': 92,
      '29': 93,
      '30': 94,
      '31': 95,
      '32': 96,
      '33': 97,
      '34': 98,
      '35': 99,
      '36': 100,
      '37': 100,
    }
    if (! table[lv])
      throw new Error

    return table[lv]
  }

}
