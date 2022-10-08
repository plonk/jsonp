// -*- mode: js; js-indent-level: 2 -*-
class StairCase
{
  constructor(upwards = false)
  {
    this.upwards = upwards
  }

  get char()
  {
    if (this.upwards)
      return '\u{104138}\u{104139}'
    else
      return '\u{104028}\u{104029}'
  }
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

    this._stairs_going_up = false
    this.whole_level_lit = false
    this.turn = 0

    this.tileset = tileset
  }

  make_maze(room)
  {
    // 出入口(PASSAGE)は残して部屋の内側をすべて WALL にする。
    new Range((room.top), (room.bottom)).each(y => {
      new Range((room.left), (room.right)).each(x => {
        if (this.dungeon[y][x].type !== 'PASSAGE') {
          this.dungeon[y][x].type = 'WALL'
        }
      })
    })

    const visited = {}

    const f = (x, y) => {
      this.dungeon[y][x].type = 'FLOOR'
      visited[[x,y]] = true
      ;[[-2,0], [0,-2], [+2,0], [0,+2]].shuffle().each( ([dx, dy]) => {
        if (!( !room.properly_in_p(x+dx, y+dy) || visited[[x+dx,y+dy]] ) ) {
          this.dungeon[y+dy/2][x+dx/2].type = 'FLOOR'
          f(x+dx, y+dy)
        }
      })
    }

    f(room.left + 1, room.top + 1)
  }

  replace_floor_to_passage(room)
  {
    new Range((room.top), (room.bottom)).each( y => {
      new Range((room.left), (room.right)).each( x => {
        if (this.dungeon[y][x].type === 'FLOOR') {
          this.dungeon[y][x].type = 'PASSAGE'
        }
      })
    })
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

  // pred: Proc(cell, x, y)
  find_random_place(pred)
  {
    const candidates = []
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (pred(this.dungeon[y][x], x, y)) {
          candidates.push( [x, y] )
        }
      }
    }
    return candidates.sample()
  }

  all_cells_and_positions()
  {
    const res = []
    new Range(0, this.height, true).each(y => {
      new Range(0, this.width, true).each(x => {
        res.push( [this.dungeon[y][x], x, y] )
      })
    })
    return res
  }

  each_coords(f)
  {
    new Range(0, this.height, true).each(y => {
      new Range(0, this.width, true).each( x => {
        f(x, y)
      })
    })
  }

  // def r(n)
  //   if false
  //     0
  //   else
  //     rand(n)
  //   end
  // end

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
      (x, y) => {
        if (this.dungeon[y][x].type == 'PASSAGE')
          res.push( [x, y])
      }
    )
    return res
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

  surroundings(x, y)
  {
    const top = [0, y-1].max()
    const bottom = [this.height-1, y+1].min()
    const left = [0, x-1].max()
    const right = [this.width-1, x+1].min()
    return new Rect(top, bottom, left, right)
  }

  light_up(fov)
  {
    fov.each_coords((x, y) => this.dungeon[y][x].lit = true)
  }

  mark_explored(fov)
  {
    fov.each_coords((x, y) => this.dungeon[y][x].explored = true)
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

  remove_object(object, x, y)
  {
    this.dungeon[y][x].remove_object(object)
  }

  // this is confused ...
  get stairs_going_up()
  {
    return this._stairs_going_up
  }

  set stairs_going_up(bool)
  {
    try {
      new Range(0, this.height, true).each(y => {
        new Range(0, this.width, true).each(x => {
          const st = this.dungeon[y][x].objects.find(obj => obj instanceof StairCase)
          if (st) {
            st.upwards = bool
            this._stairs_going_up = bool
            throw 'stairs found'
          }
        })
      })
    } catch (v) {
      if (v == 'stairs found')
        return
      else
        throw v
    }
    throw new Error("no stairs!")
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

  get monster_count()
  {
    return this.all_monsters_with_position.length
  }

  can_move_to_p(m, mx, my, tx, ty)
  {
    return (!this.dungeon[ty][tx].monster &&
            Vec.chess_distance([mx, my], [tx, ty]) == 1 &&
            this.passable_p(tx, ty) &&
            this.uncornered_p(tx, my) &&
            this.uncornered_p(mx, ty))
  }

  can_move_to_terrain_p(m, mx, my, tx, ty)
  {
    return (Vec.chess_distance([mx, my], [tx, ty]) == 1 &&
           this.passable_p(tx, ty) &&
           this.uncornered_p(tx, my) &&
           this.uncornered_p(mx, ty))
  }

  can_attack_p(m, mx, my, tx, ty)
  {
    // m の特性によって場合分けすることもできる。

    return Vec.chess_distance([mx, my], [tx, ty]) == 1 &&
           this.passable_p(tx, ty) &&
           this.uncornered_p(tx, my) &&
           this.uncornered_p(mx, ty)
  }

  get_random_character_placeable_place()
  {
    while (true) {
      const [x, y] = this.get_random_place('FLOOR')
      if (!this.has_type_at(Monster, x, y))
        return [x, y]
    }
  }

  coordinates_of_cell(cell)
  {
    if (! (cell instanceof Cell) )
      throw new Error('type error')

    try {
      new Range(0, this.height, true).each( y => {
        new Range(0,this. width, true).each( x => {
          if (this.dungeon[y][x] === cell)
            throw [x, y]
        })
      })
    } catch (v) {
      return v
    }
    return null
  }

  coordinates_of(obj)
  {
    try {
      new Range(0, this.height, true).each( y => {
        new Range(0, this.width, true).each( x => {
          if (this.dungeon[y][x].objects.some( z => z === obj ))
            throw [x, y]
        })
      })
    } catch (v) {
      return v
    }
    return null
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

  first_cells_in(room)
  {
    const res = []
    new Range(room.left+1, room.right-1).each(x => {
      if ( this.cell(x, room.top).type == 'PASSAGE' )
        res.push( [x, room.top+1] )

      if ( this.cell(x, room.bottom).type == 'PASSAGE' )
        res.push( [x, room.bottom-1] )
    })

    new Range(room.top+1, room.bottom-1).each(y => {
      if ( this.cell(room.left, y).type == 'PASSAGE' )
        res.push( [room.left+1, y] )

      if ( this.cell(room.right, y).type == 'PASSAGE' )
        res.push( [room.right-1, y] )
    })

    return res
  }
  
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

Array.prototype.count = function(){
  if (arguments.length == 0)
    return this.length
  else if (arguments.length == 1 && arguments[0] instanceof Function) {
    let i = 0
    this.forEach(elt => {
      if (arguments[0](elt))
        i++
    })
    return i
  } else if (arguments.length == 1) {
    let i = 0
    this.forEach(elt => {
      if (eql_p(elt, arguments[0]))
        i++
    })
    return i
  } else {
    throw new Error("0 or 1 arguments expected")
  }
}

Array.new = function(n, f) {
  const arr = new Array(n)
  if (f)
    for (let i = 0; i < arr.length; i++)
      arr[i] = f(i)

  return arr
}
