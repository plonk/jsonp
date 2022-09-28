// -*- mode: js; js-indent-level: 2 -*-
class Cell
{
  constructor(type)
  {
    this.type = type
    this.lit = false
    this.explored = false
    this.objects = []
  }

  first_visible_object(globally_lit, visible_p)
  {
    return this.objects.find(
      obj => visible_p(obj, this.lit, globally_lit, this.explored)
    )
  }

  background_char(hero_sees_everything, tileset)
  {
    const lit = this.lit || hero_sees_everything
    switch ( this.type ) {
    case 'STATUE':
      if (lit)
        return '􄄤􄄥' // モアイ像
      else if (this.explored)
        return '􄀾􄀿' // 薄闇
      else
        return '　'
      
    case 'WALL':
      if (lit || this.explored)
        return tileset['WALL']
      else
        return '　'
      
    case 'HORIZONTAL_WALL':
      if (lit || this.explored)
        return tileset['HORIZONTAL_WALL']
      else
        return '　'
      
    case 'VERTICAL_WALL':
      if (lit || this.explored)
        return tileset['VERTICAL_WALL']
      else
        return '　'
      
    case 'FLOOR':
      if (lit)
        return '􄀪􄀫' // 部屋の床
      else if (this.explored)
        return '􄀾􄀿' // 薄闇
      else
        return '　'
      
    case 'PASSAGE':
      if (lit)
        return '􄀤􄀥' // 通路
      else if (this.explored)
        return '􄀾􄀿' // 薄闇
      else
        return '　'
      
    default:
      return '？'
    }
  }

  wall_p()
  {
    switch (this.type) {
    case 'WALL':
    case 'HORIZONTAL_WALL':
    case 'VERTICAL_WALL':
      return true
    default:
      return false
    }
  }

  score(object)
  {
    if (object instanceof Monster)
      return 10
    else if (object instanceof Gold ||
             object instanceof Item ||
             object instanceof StairCase ||
             object instanceof Trap)
      return 20
    else
      throw new Error(object.constructor.name)
  }

  put_object(object)
  {
    this.objects.push(object)
    this.objects.sort((a, b) => this.score(a) < this.score(b))
  }

  remove_object(object)
  {
    this.objects.delete(object)
  }

  can_place_p()
  {
    return (this.type == "FLOOR" || this.type == "PASSAGE") && this.objects.none(
      x => (x instanceof StairCase || x instanceof Trap || x instanceof Item || x instanceof Gold)
    )
  }

  get trap()
  {
    return this.objects.find ( x => x instanceof Trap )
  }

  get monster()
  {
    return this.objects.find( x => x instanceof Monster )
  }

  get item()
  {
    return this.objects.find ( x => x instanceof Item)
  }

  get gold()
  {
    return this.objects.find(x => x instanceof Gold)
  }

  get staircase()
  {
    return this.objects.find(x => x instanceof StairCase)
  }
  
}

class StairCase
{
  constructor(upwards = false)
  {
    this.upwards = upwards
  }

  get char()
  {
    if (this.upwards)
      return '􄄸􄄹'
    else
      return '􄀨􄀩'
  }
}

class Rect
{

  constructor(top, bottom, left, right) 
  {
    this.top = top
    this.bottom = bottom
    this.left = left
    this.right = right
  }

  each_coords(block)
  {
    for (let y = this.top; y <= this.bottom; y++)
      for (let x = this.left; x <= this.right; x++)
        block(x, y)
  }

  each(block) { this.each_coords(block) }

  include_p(x, y)
  {
    return x >= this.left && x <= this.right && y >= this.top && y <= this.bottom
  }
}

Array.new = function(n, f) {
  const arr = new Array(n)
  if (f)
    for (let i = 0; i < arr.length; i++)
      arr[i] = f(i)

  return arr
}

class Level
{
  constructor(tileset, type = 'grid2')
  {
    this.dungeon = Array.new(24, () => Array.new(80, () => new Cell('WALL') ) )

    switch (type) {
    case 'bigmaze':
      this.rooms = []
      this.make_maze(new Room(0, 23, 20, 59))
      break

    case 'grid9':
      // 0 1 2
      // 3 4 5
      // 6 7 8
      this.rooms = []
      this.rooms.push( new Room(0, 7, 0, 24) )
      this.rooms.push( new Room(0, 7, 26, 51) )
      this.rooms.push( new Room(0, 7, 53, 79) )
      this.rooms.push( new Room(9, 15, 0, 24) )
      this.rooms.push( new Room(9, 15, 26, 51) )
      this.rooms.push( new Room(9, 15, 53, 79) )
      this.rooms.push( new Room(17, 23, 0, 24) )
      this.rooms.push( new Room(17, 23, 26, 51) )
      this.rooms.push( new Room(17, 23, 53, 79) )

      this.connections = []

      this.add_connection(this.rooms[0], this.rooms[1], 'horizontal')
      this.add_connection(this.rooms[0], this.rooms[3], 'vertical')
      this.add_connection(this.rooms[1], this.rooms[2], 'horizontal')
      this.add_connection(this.rooms[1], this.rooms[4], 'vertical')
      this.add_connection(this.rooms[2], this.rooms[5], 'vertical')
      this.add_connection(this.rooms[3], this.rooms[4], 'horizontal')
      this.add_connection(this.rooms[3], this.rooms[6], 'vertical')
      this.add_connection(this.rooms[4], this.rooms[5], 'horizontal')
      this.add_connection(this.rooms[4], this.rooms[7], 'vertical')
      this.add_connection(this.rooms[5], this.rooms[8], 'vertical')
      this.add_connection(this.rooms[6], this.rooms[7], 'horizontal')
      this.add_connection(this.rooms[7], this.rooms[8], 'horizontal')

      while (! this.all_connected_p (this.rooms) ) {
        const conn = this.connections.sample()
        conn.realized = true
      }

      for (const room of this.rooms)
        room.distort()

      for (const room of this.rooms)
        this.render_room(this.dungeon, room)

      for (const conn of this.connections)
        if (conn.realized)
          conn.draw(this.dungeon)

      break

    case 'grid2':
      // 0 1
      this.rooms = []
      this.rooms.push( new Room(0, 22, 0, 38) )
      this.rooms.push( new Room(0, 22, 40, 78) )

      this.connections = []

      this.add_connection(this.rooms[0], this.rooms[1], 'horizontal')

      this.connections[0].realized = true

      for (const room of this.rooms)
        room.distort({ min_width: 30, min_height: 18 })

      for (const room of this.rooms)
        this.render_room(this.dungeon, room)

      this.connections[0].draw(this.dungeon)
      break

    case  'grid4':
      // 0 1
      // 2 3
      this.rooms = []
      this.rooms.push( new Room(0, 10, 0, 38) )
      this.rooms.push( new Room(0, 10, 40, 78) )
      this.rooms.push( new Room(12, 22, 0, 38) )
      this.rooms.push( new Room(12, 22, 40, 78) )

      this.connections = []

      this.add_connection(this.rooms[0], this.rooms[1], 'horizontal')
      this.add_connection(this.rooms[2], this.rooms[3], 'horizontal')
      this.add_connection(this.rooms[0], this.rooms[2], 'vertical')
      this.add_connection(this.rooms[1], this.rooms[3], 'vertical')

      for (const conn of this.connections)
        conn.realized = true

      for (const room of this.rooms)
        room.distort({ min_width: 30, min_height: 8 })

      for (const room of this.rooms)
        this.render_room(this.dungeon, room)

      for (const conn of this.connections)
        conn.draw(this.dungeon)

      break

    case 'grid10':
      // 0 1 2 3
      // 4     5
      // 6 7 8 9
      this.rooms = []
      this.rooms.push( new Room(0, 6, 0, 18) )
      this.rooms.push( new Room(0, 6, 20, 38) )
      this.rooms.push( new Room(0, 6, 40, 58) )
      this.rooms.push( new Room(0, 6, 60, 78) )
      this.rooms.push( new Room(8, 14, 0, 18) )
      this.rooms.push( new Room(8, 14, 60, 78) )
      this.rooms.push( new Room(16, 22, 0, 18) )
      this.rooms.push( new Room(16, 22, 20, 38) )
      this.rooms.push( new Room(16, 22, 40, 58) )
      this.rooms.push( new Room(16, 22, 60, 78) )

      this.connections = []

      this.add_connection(this.rooms[1], this.rooms[7], 'vertical')
      this.add_connection(this.rooms[2], this.rooms[8], 'vertical')
      this.add_connection(this.rooms[4], this.rooms[5], 'horizontal')
      for (const conn of this.connections)
        conn.realized = true

      this.add_connection(this.rooms[0], this.rooms[1], 'horizontal')
      this.add_connection(this.rooms[1], this.rooms[2], 'horizontal')
      this.add_connection(this.rooms[2], this.rooms[3], 'horizontal')

      this.add_connection(this.rooms[6], this.rooms[7], 'horizontal')
      this.add_connection(this.rooms[7], this.rooms[8], 'horizontal')
      this.add_connection(this.rooms[8], this.rooms[9], 'horizontal')

      this.add_connection(this.rooms[0], this.rooms[4], 'vertical')
      this.add_connection(this.rooms[4], this.rooms[6], 'vertical')

      this.add_connection(this.rooms[3], this.rooms[5], 'vertical')
      this.add_connection(this.rooms[5], this.rooms[9], 'vertical')


      while (! this.all_connected_p(this.rooms) ) {
        const conn = this.connections.sample()
        conn.realized = true
      }

      for (const room of this.rooms)
        room.distort({ min_width: 5, min_height: 5 })

      for (const room of this.rooms)
        this.render_room(this.dungeon, room)

      for (const conn of this.connections)
        if (conn.realized)
          conn.draw(this.dungeon)

      break

    default:
      throw new Error( `unknown type ${type}` )
    }

    this.stairs_going_up = false
    this.whole_level_lit = false
    this.turn = 0

    this.tileset = tileset
  }


  // add potential connection between rooms
  add_connection(room1, room2, direction)
  {
    const conn = new Connection(room1, room2, direction)
    this.connections.push( conn)
  }

  connected_rooms(room)
  {
    const res = []
    this.connections.each(conn => {
      if (!conn.realized)
        return

      if (conn.room1 == room || conn.room2 == room)
        res.push(conn.other_room(room))
    })
    return res
  }

  all_connected_p(rooms)
  {
    const visited = []

    const visit = (r) => {
      if (visited.includes(r))
        return 

      visited.push( r)
      this.connected_rooms(r).each(other => visit(other))
    }

    visit(rooms[0])
    return visited.length == rooms.length
  }
  
  render_room(dungeon, room)
  {
    new Range(room.top, room.bottom).each( y =>
      new Range(room.left, room.right).each( x => {
        if (y == room.top || y == room.bottom)
          this.dungeon[y][x] = new Cell('HORIZONTAL_WALL')
        else if (x == room.left || x == room.right)
          this.dungeon[y][x] = new Cell('VERTICAL_WALL')
        else
          this.dungeon[y][x] = new Cell('FLOOR')
      })
    )
  }

  passable_p(x, y)
  {
    if (! ( x.between_p(0, this.width - 1) && y.between_p(0, this.height - 1) )) {
      // 画面外
      return false
    }

    return (this.dungeon[y][x].type == 'FLOOR' || this.dungeon[y][x].type == 'PASSAGE')
  }

  // ナナメ移動を阻害しないタイル。
  uncornered_p(x, y)
  {
    if (! ( x.between_p(0, this.width - 1) && y.between_p(0, this.height - 1) ) ) {
      // 画面外
      return false
    }

    return (this.dungeon[y][x].type == 'FLOOR' ||
            this.dungeon[y][x].type == 'PASSAGE' ||
            this.dungeon[y][x].type == 'STATUE')
  }

  room_at(x, y)
  {
    for (const room of this.rooms) {
      if (room.properly_in_p(x, y))
        return room
    }
    return null
  }

  room_exits(room)
  {
    const res = []
    const rect = new Rect(room.top, room.bottom, room.left, room.right)
    rect.each_coords(
      ([x, y]) => {
        if (this.dungeon[y][x].type == 'PASSAGE')
          res.push( [x, y])
      }
    )
    return res
  }

  first_visible_object(x, y, visible_p)
  {
    return this.dungeon[y][x].first_visible_object(this.whole_level_lit, visible_p)
  }

  background_char(x, y)
  {
    return this.dungeon[y][x].background_char(this.whole_level_lit, this.tileset)
  }

  get width()
  {
    return this.dungeon[0].length
  }

  get height()
  {
    return this.dungeon.length
  }

  get_random_place(kind)
  {
    const candidates = new Range(0, this.height, true /* exclude_end */).to_a().flatMap(
      y => new Range(0, this.width, true).to_a().flatMap(
        x => this.dungeon[y][x].type == kind ? [[x, y]] : []
      )
    )
    return candidates.sample()
  }

  has_type_at(type, x, y)
  {
    return this.dungeon[y][x].objects.some(x => x instanceof type)
  }

  get all_monsters_with_position()
  {
    const res = []
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.dungeon[y][x].objects.filter( obj => obj instanceof Monster).each( m => res.push([m, x, y]) )
      }
    }
    return res
  }

  get_random_character_placeable_place()
  {
    while (true) {
      const [x, y] = this.get_random_place('FLOOR')
      if (!this.has_type_at(Monster, x, y))
        return [x, y]
    }
  }

  surroundings(x, y)
  {
    const top = [0, y-1].max()
    const bottom = [this.height-1, y+1].min()
    const left = [0, x-1].max()
    const right = [this.width-1, x+1].min()
    return new Rect(top, bottom, left, right)
  }

  cell(x, y)
  {
    return this.dungeon[y][x]
  }

  put_object(object, x, y)
  {
    if (! (Number.isInteger(x) && Number.isInteger(y)) )
      throw new Error("type error")
    if (! this.in_dungeon_p(x, y) )
      throw new Error("range error")

    this.dungeon[y][x].put_object(object)
  }

  in_dungeon_p(x, y)
  {
    return x.between_p(0, this.width-1) && y.between_p(0, this.height-1)
  }

  // (x, y)地点での視野 Rect を返す。
  fov(x, y)
  {
    const r = this.room_at(x, y)
    if (r)
      return new Rect(r.top, r.bottom, r.left, r.right)
    else
      return this.surroundings(x, y)
  }

  light_up(fov)
  {
    fov.each_coords((x, y) => this.dungeon[y][x].lit = true)
  }

  mark_explored(fov)
  {
    fov.each_coords((x, y) => this.dungeon[y][x].explored = true)
  }

  darken()
  {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.dungeon[y][x].lit = false
      }
    }
  }

  update_lighting(x, y)
  {
    this.darken()
    const rect = this.fov(x, y)
    this.mark_explored(rect)
    this.light_up(rect)
  }

  // ...
  
}

Number.prototype.between_p = function(left, right_inclusive) {
  return this >= left && this <= right_inclusive
}

Array.prototype.each = function(f){
  for (const elt of this)
    f(elt)

  return this
}

Array.prototype.max = function(){
  return Math.max(... this);
}

Array.prototype.min = function(){
  return Math.min(... this);
}


