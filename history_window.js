// -*- mode: js; js-indent-level: 2 -*-
'use strict';

class HistoryWindow
{
  constructor(history, disp_func)
  {
    this.history = history
    this.top = [this.history.size - 22, 0].max()
    this.disp_func = disp_func
  }

  async run()
  {
    Curses.curs_set(0)
    const win = new Curses.Window(24, 80, 0, 0)
    try {
      win.keypad(true)
      while (true) {
        win.rounded_box()
        win.setpos(0, 1)
        win.addstr("メッセージ履歴")

        for (let i = this.top; i <= this.history.size-1; i++) {
          const y = 1 + i
          if (y == 23)
            break

          win.setpos(y, 1)
          this.disp_func(win, this.history[i])
        }

        const c = await win.getch()
        switch (c) {
        case 'j':
        case Curses.KEY_DOWN:
          if ((this.history.length - this.top) <= 22) {
            //Curses.beep
          } else {
            this.top = [this.top+1, this.history.length].min()
          }
          break
        case 'k':
        case Curses.KEY_UP:
          if (this.top == 0) {
            //Curses.beep
          } else {
            this.top = [this.top-1, 0].max()
          }
          break

        case 'q':
          return
        }
        win.clear()
      }
    } finally {
      win.close()
      Curses.curs_set(1)
    }
  }
}
