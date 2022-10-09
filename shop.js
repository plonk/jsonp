// -*- mode: js; js-indent-level: 2 -*-
'use strict';

class Shop
{
  static MERCHANDISE = [
    ["大きなパン", null, 500],
    ["人形よけの指輪", null, 20000],
    ["ワナ抜けの指輪", null, 10000],
    ["毒けしの指輪", null, 5000],
    ["盗賊の指輪", null, 10000],
    ["メタルヨテイチの剣", 7, 10000],
    ["銀の盾", 5, 8000],
    ["ドラゴンキラー", 5, 8000],
    ["結界の巻物", null, 5000],
    ["爆発の巻物", null, 1500],
    ["あかりの巻物", null, 1000],
    ["高級薬草", null, 500],
    ["薬草", null, 250],
    ["毒けし草", null, 1500],
    ["幸せの種", null, 5000],
    ["ちからの種", null, 3000],
    ["メッキの巻物", null, 4000],
    ["木の矢", 25, 2500],
    ["同定の巻物", null, 500],
  ]

  constructor(hero, display_item, addstr_ml)
  {
    this.hero = hero

    // 関数
    this.display_item = display_item
    this.addstr_ml = addstr_ml

    this.msgwin = new Curses.Window(3, 40, 0, 0)
    this.merchandise = Shop.MERCHANDISE.sample(6).sort((a,b) => a[2] - b[2])
    this.goldwin = new Curses.Window(3, 17, 0, 40)
  }

  async confirm_purchase(price)
  {
    this.update_message(`${price}Gだけどいいかい？`)
    const menu = new Menu(["買う", "やっぱり買わない"], {cols: 20, y: 3, x: 0})
    try {
      const [cmd, arg] = await menu.choose()
      if (cmd == 'chosen' && arg == "買う")
        return true
      else
        return false
    } finally {
      menu.close()
    }
  }

  make_item(name, number)
  {
    const item = Item.make_item(name)
    if (number !== null)
      item.number = number

    item.cursed = false
    return item
  }

  async merchandise_screen()
  {
    const cols = 30
    const menu = new Menu(this.merchandise,
                          {
                            cols: cols, y: 3, x: 0,
                            dispfunc:
                            (win, [name, number, price]) => {
                              const item = this.make_item(name, number)
                              this.addstr_ml(win,
                                             [
                                               "span",
                                               this.display_item(item),
                                               " ",
                                               price.to_s(),
                                               "G"
                                             ])
                            }
                          })
    try {
      const [cmd, arg] = await menu.choose()
      switch ( cmd ) {
      case 'chosen':
        const [name, number, price] = arg
        if (this.hero.gold < price) {
          this.update_message("お金が足りないよ。")
        } else {
          if (await this.confirm_purchase(price)) {
            const item = this.make_item(name, number)
            if (this.hero.add_to_inventory(item)) {
              this.update_message("まいどあり！")
              this.hero.gold -= price
              this.update_gold()
            } else {
              this.update_message("持ち物がいっぱいだよ！")
            }
          }
        }
        break
      case 'cancel':
        return
      }
    } finally {
      menu.close()
    }
  }

  update_message(msg)
  {
    this.msgwin.clear()
    this.msgwin.rounded_box()
    this.msgwin.setpos(1, 1)
    this.msgwin.addstr(` \u{10422e}\u{10422f} ${msg}`)
    this.msgwin.refresh()
  }

  update_gold()
  {
    this.goldwin.clear()
    this.goldwin.rounded_box()
    this.goldwin.setpos(1,1)
    this.goldwin.addstr(sprintf("所持金 %7dG", this.hero.gold))
    this.goldwin.refresh()
  }

  actions_for_item(item)
  {
    return ["すてる"]
  }

  // メッセージボックス。
  async message_window(message, opts = {})
  {
    const cols = opts['cols'] || message.size * 2 + 2
    const y = opts['y'] || (Curses.lines - 3).div(2)
    const x = opts['x'] || (Curses.cols - cols).div(2)

    const win = new Curses.Window(3, cols, y, x) // lines, cols, y, x
    win.clear()
    win.rounded_box()

    win.setpos(1, 1)
    win.addstr(message.chomp())

    //Curses.flushinp
    await win.getch()
    win.clear()
    win.refresh()
    win.close()
  }

  async item_action_menu(item)
  {
    const action_menu = new Menu(this.actions_for_item(item), {y: 3, x: 27, cols: 9})
    try {
      const [c, ...args] = await action_menu.choose()
      switch (c) {
      case 'cancel':
        return null
      case 'chosen':
        return args[0]
      default:
        throw new Error()
      }
    } finally {
      action_menu.close()
    }
  }

  async inventory_screen()
  {
    const dispfunc = (win, item) => {
      const prefix = (this.hero.weapon === item ||
                      this.hero.shield === item ||
                      this.hero.ring === item ||
                      this.hero.projectile === item) ? "E" : " "

      this.addstr_ml(win, ["span", prefix, item.char, this.display_item(item)])
    }

    let menu = null
    let item = null
    let c = null

    try {
      while (true) {
        item = c = null
        menu = new Menu(this.hero.inventory,
                        {y: 3, x: 0, cols: 27,
                         dispfunc: dispfunc,
                         title: "持ち物 [s]ソート",
                         sortable: true})
        const [command, ...args] = await menu.choose()

        switch (command) {
        case 'cancel':
          //Curses.beep
          return
        case 'chosen':
          item = args[0]

          c = await this.item_action_menu(item)
          if (!c)
            continue

          break
        case 'sort':
          this.hero.sort_inventory()
        }

        if (item && c) {
          switch ( c ) {
          case "すてる":
            this.hero.remove_from_inventory(item)
            menu.close()
            break
          default:
            throw new Error
          }
        }
      }
    } finally {
      if (menu)
        menu.close()
    }
  }

  async run()
  {
    this.update_message("何か買って行かないかい？")
    this.update_gold()

    const menu = new Menu(["買い物をする", "持ち物を見る", "立ち去る"],
                          {cols: 20, y: 3, x: 0})
    try {
      while (true) {
        const [cmd, arg] = await menu.choose()
        switch ( cmd ) {
        case 'chosen':
          switch (arg) {
          case "買い物をする":
            await this.merchandise_screen()
            break
          case "持ち物を見る":
            await this.inventory_screen()
            break
          case "立ち去る":
            await this.bye()
            return
          }
          break
        case 'cancel':
          await this.bye()
          return
        }
      }
    } finally {
      menu.close()
    }
  }

  async bye()
  {
  }
}
