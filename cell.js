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
        return '\u{104124}\u{104125}' // モアイ像
      else if (this.explored)
        return '\u{10403e}\u{10403f}' // 薄闇
      else
        return '  '
      
    case 'WALL':
      if (lit || this.explored)
        return tileset['WALL']
      else
        return '  '
      
    case 'HORIZONTAL_WALL':
      if (lit || this.explored)
        return tileset['HORIZONTAL_WALL']
      else
        return '  '
      
    case 'VERTICAL_WALL':
      if (lit || this.explored)
        return tileset['VERTICAL_WALL']
      else
        return '  '
      
    case 'FLOOR':
      if (lit)
        return '\u{10402a}\u{10402b}' // 部屋の床
      else if (this.explored)
        return '\u{10403e}\u{10403f}' // 薄闇
      else
        return '  '
      
    case 'PASSAGE':
      if (lit)
        return '\u{104024}\u{104025}' // 通路
      else if (this.explored)
        return '\u{10403e}\u{10403f}' // 薄闇
      else
        return '  '
      
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
    this.objects.sort((a, b) => this.score(a) - this.score(b))
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
