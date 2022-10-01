// -*- mode: js; js-indent-level: 2 -*-
'use strict';

class ResultScreen
{

  static format_time(milliseconds)
  {
    const seconds = milliseconds.div(1000)
    const h = seconds / 3600
    const m = (seconds % 3600) / 60
    const s = seconds % 60
    let nonzero_seen = false
    return [[h, "%2d時間", "      "],
            [m, "%2d分", "    "],
            [s, "%2d秒", "    "]].map( ( [n, fmt, blank] ) => {
              if (n !== 0) {
                nonzero_seen = true
              }
              return (!nonzero_seen && n === 0) ? blank : sprintf(fmt, n)
            }).join('')
  }

  static to_data(hero)
  {
    return (
      {
        "hero_name": hero.name,
        "hero_lv": hero.lv,
        "max_hp": hero.max_hp,
        "max_fullness": hero.max_fullness,
        "strength": hero.strength,
        "max_strength": hero.max_strength,
        "exp": hero.exp,
        "weapon": hero.weapon?.to_s(),
        "shield": hero.shield?.to_s(),
        "ring": hero.ring?.to_s(),
        "gold": hero.gold,
      }
    )
  }

  static async run(data)
  {
    const tm = 1 // top margin
    const win = new Curses.Window(11 + 5, 34, tm, (Curses.cols - 34).div(2)) // lines, cols, y, x
    win.rounded_box()
    win.keypad(true)

    try {
      win.setpos(1,1)
      win.addstr(`${data['hero_name']}`)
      win.setpos(1, 1 + 12 + 3)
      win.addstr(`Lv${data['hero_lv']}`)

      const g = `${data['gold']}G`
      win.setpos(1, 34 - g.size - 1)
      win.addstr(g)

      win.setpos(2, 19)
      win.addstr(this.format_time(data["time"]))

      win.setpos(3, 1)
      win.addstr(data["message"])

      win.setpos(5, 1)
      win.addstr(
        sprintf("最大HP    %3d  最大満腹度 %3d％", data['max_hp'], data['max_fullness'])
      )

      win.setpos(6, 1)
      win.addstr(
        sprintf("ちから %6s  経験値 %9d", `${data['strength']}/${data['max_strength']}`, data['exp'])
      )

      win.setpos(7, 1)
      if (data['weapon'])
        win.addstr(
          sprintf("%s%s", '􄀬􄀭', data['weapon'])
        )


      win.setpos(8, 1)
      if (data['shield'])
        win.addstr(
          sprintf("%s%s", '􄀮􄀯', data['shield'])
        )

      win.setpos(9, 1)
      if (data['ring'])
        win.addstr(
          sprintf("%s%s", '􄀸􄀹', data['ring'])
        )

      data["screen_shot"].forEach((row, i) => {
        const y = i + 10
        win.setpos(y, 2)
        win.addstr(row)
      })

      Curses.flushinp()
      await win.getch()
    } finally {
      win.close()
    }
  }
}

Object.defineProperty(String.prototype, 'size', { get() { return this.length } })
