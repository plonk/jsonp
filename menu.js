// -*- mode: js; js-indent-level: 2 -*-
'use strict';

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
    this.win = new Curses.Window(winheight, this.cols + 1, this.y, this.x)
    this.win.keypad(true)
    this.dispfunc = opts.dispfunc || ((win, data) => {
      win.addstr(data.to_s())
    })
    this.title = opts.title || ""
    this.sortable = opts.sortable || false
  }

  close()
  {
    this.win.clear()
    this.win.refresh()
    this.win.close()
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
      while (true) {
        for (let i = 0; i < this.items.length; i++) {
          this.win.setpos(i + 1, 1)
          if (i == this.index)
            this.win.attron(Curses.A_BOLD)

          if (i == 9)
            this.win.addstr('0' + " ")
          else if (i < 9)
            this.win.addstr("" + (i + 1) + " ")
          else
            this.win.addstr("  ")

          this.dispfunc.apply(null, [this.win, this.items[i]])
          if (i == this.index)
            this.win.attroff(Curses.A_BOLD)
        }

        this.win.setpos(this.index + 1, 1)
        const c = await this.win.getch()

        switch (c) {
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          if (+c - 1 < this.items.length)
            this.index = +c - 1
          return ['chosen', this.items[this.index]]
          break

        case '0':
          if (9 < this.items.length)
            this.index = 9
          return ['chosen', this.items[this.index]]
          break

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

        case 10:
          return ['chosen', this.items[this.index]]
          break
        }
      }
    }
  }
}

