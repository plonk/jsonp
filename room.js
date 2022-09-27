// -*- mode: js; js-indent-level: 2 -*-

class Room
{
  constructor (... args)
  {
    [this.top, this.bottom, this.left, this.right] = args
  }

  // 座標は部屋の中？
  in_p(x, y)
  {
    return x >= this.left && x <= this.right  &&
           y >= this.top  && y <= this.bottom
  }

  // 座標は部屋の中？ 境界に当たる、入口や壁は含まない
  properly_in_p(x, y)
  {
    return x > this.left && x < this.right  &&
           y > this.top  && y < this.bottom
  }

  distort(opts = {})
  {
    const min_height = opts["min_height"] || 5
    const min_width = opts["min_width"] || 5

    const width = this.right - this.left + 1
    const height = this.bottom - this.top + 1
    const t = Math.ceil((height - min_height) / 2)
    const b = Math.floor((height - min_height) / 2)
    const l = Math.ceil((width - min_width) / 2)
    const r = Math.floor((width - min_width) /2)

    this.top    = rand(new Range(this.top, (this.top+t)))
    this.bottom = rand(new Range(this.bottom-b, this.bottom))
    this.left   = rand(new Range(this.left, this.left+l))
    this.right  = rand(new Range(this.right-r, this.right))
  }
}

class Connection
{

  constructor(room1, room2, direction)
  {
    this.room1 = room1
    this.room2 = room2
    this.direction = direction
    this.realized = false
  }

  other_room(r)
  {
    if (r === this.room1)
      return this.room2
    else if (r === this.room2)
      return this.room1
    else
      throw new Error( 'invalid argument' )
  }

  draw(dungeon)
  {
    if (this.direction == 'horizontal') {
      const y1 = new Range(this.room1.top+1, this.room1.bottom-1).to_a().filter(y => (y - this.room1.top) % 2 == 1 ).sample()
      const y2 = new Range(this.room2.top+1, this.room2.bottom-1).to_a().filter(y => (y - this.room2.top) % 2 == 1 ).sample()
      const midway = (this.room1.right + this.room2.left).div(2)
      new Range(this.room1.right, midway).each(x => dungeon[y1][x] = new Cell("PASSAGE"))

      const hoge = (y1 > y2 ? new Range(y2, y1) : new Range(y1, y2)).to_a()
      hoge.each(y => dungeon[y][midway] = new Cell("PASSAGE"))
      new Range(midway, this.room2.left).each(x => dungeon[y2][x] = new Cell("PASSAGE"))
    } else if (this.direction == 'vertical') {
      const x1 = new Range(this.room1.left+1, this.room1.right-1).to_a().filter(x => (x - this.room1.left) % 2 == 1).sample()
      const x2 = new Range(this.room2.left+1, this.room2.right-1).to_a().filter(x => (x - this.room2.left) % 2 == 1).sample()
      const midway = (this.room1.bottom + this.room2.top).div(2)
      new Range(this.room1.bottom, midway).each(y => dungeon[y][x1] = new Cell("PASSAGE"))

      const hoge = (x1 > x2 ? new Range(x2, x1) : new Range(x1, x2)).to_a()
      hoge.each(x => dungeon[midway][x] = new Cell("PASSAGE"))

      new Range(midway, this.room2.top).each(y => dungeon[y][x2] = new Cell("PASSAGE"))
    } else {
      throw new Error
    }
  }
}
