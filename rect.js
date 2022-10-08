// -*- mode: js; js-indent-level: 2 -*-
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

  async each_coords_async(block)
  {
    for (let y = this.top; y <= this.bottom; y++)
      for (let x = this.left; x <= this.right; x++)
        await block(x, y)
  }

  each(block) { this.each_coords(block) }

  include_p(x, y)
  {
    return x >= this.left && x <= this.right && y >= this.top && y <= this.bottom
  }
}

