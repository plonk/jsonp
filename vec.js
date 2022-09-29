// -*- mode: js; js-indent-level: 2 -*-
'use strict';

Number.prototype.abs = function() {
  return Math.abs(this)
}

class Vec
{
  static chess_distance([x, y], [ox, oy])
  {
    return [x - ox, y - oy].map(n => n.abs()).max()
  }

  static minus(v, ov)
  {
    return [v[0] - ov[0], v[1] - ov[1]]
  }

  static plus(v, u)
  {
    return [v[0] + u[0], v[1] + u[1]]
  }

  static negate(v)
  {
    return [-v[0], -v[1]]
  }

  static sign(n)
  {
    if (n == 0)
      return 0
    else if (n < 0)
      return -1
    else
      return 1
  }

  static normalize(v)
  {
    return [Vec.sign(v[0]), Vec.sign(v[1])]
  }

  static equals(a, b)
  {
    return a[0] === b[0] && a[1] === b[1]
  }

  static DIRS_CLOCKWISE = [[0,-1], [1,-1], [1,0], [1,1], [0,1], [-1,1], [-1,0], [-1,-1]]

  static rotate_clockwise_45(dir, times)
  {
    const i = Vec.DIRS_CLOCKWISE.findIndex(_ => Vec.equals(_, dir))
    if (i === -1)
      throw new Error( "out of range" )

    const j = (i + times) % 8
    return Vec.DIRS_CLOCKWISE[j]
  }
}
