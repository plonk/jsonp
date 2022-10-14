// -*- mode: js; js-indent-level: 2 -*-

Array.prototype.sample = function(n) {
  if (n === undefined) {
    const index = Math.floor(Math.random() * this.length)
    return this[index]
  } else if (Number.isInteger(n) && n >= 0) {
    const src = [... this]
    const dest = []

    for (let i = 0; i < n; i++) {
      if (src.length === 0)
        break

      const index = Math.floor(Math.random() * src.length)      
      dest.push( src[index] )
      src.splice(index, 1)
    }
    return dest
  } else {
    throw new Error("argument range error")
  }
}

Array.prototype.uniq = function() {
  const map = new Map

  for (const elt of this)
    map.set(elt, true)

  return Array.from(map.keys())
}

Array.prototype.assoc = function(key) {
  for (const row of this)
    if (row[0] === key)
      return row
}

Array.prototype.times = function(n) {
  let arr = []
  for (let i = 0; i < n; i++)
    arr.push(... this)

  return arr
}

Array.prototype.none = function(pred) {
  return ! this.some(pred)
}

Array.prototype.delete = function(val) {
  let deleted = null

  for (let i = 0; i < this.length; ) {
    if (val === this[i]) {
      deleted = this[i]
      this.splice(i, 1)
    } else
      i++
  }
  return deleted
}

Number.prototype.times = function(f) {
  const n = +this // unbox
  if (!Number.isInteger(n))
    throw new Error("range error")

  for (let i = 0; i < n; i++)
    f(i)
}

Number.prototype.round = function() {
  return Math.round(this)
}

Number.prototype.floor = function() {
  return Math.floor(this)
}

Number.prototype.ceil = function() {
  return Math.ceil(this)
}

Array.prototype.clear = function() {
  this.length = 0
}

function eql_p(a, b)
{
  if (a === undefined || a === null)
    return a === b
  else
    return a.eql_p(b)
}

Array.prototype.include_p = function(val) {
  return this.some(elt => eql_p(elt, val))
}

Number.prototype.to_i = function()
{
  return Math.floor(this)
}

Array.prototype.shuffle = function() {
  const indices = new Array(this.length)
  for (let i = 0; i < this.length; i++)
    indices[i] = i

  const res = []
  while (indices.length > 0) {
    const j = Math.floor( Math.random() * indices.length )
    res.push( this[indices[j]] )
    indices.splice(j, 1)
  }

  return res
}

Array.prototype.eql_p = function(other)
{
  if (this === other)
    return true

  if (!(other instanceof Array))
    return false

  if (this.length != other.length)
    return false

  for (let i = 0; i < this.length; i++)
    if ( !eql_p(this[i], other[i]) )
      return false

  return true
}

Object.prototype.eql_p = function(other)
{
  return this.valueOf() === other
}

Array.prototype.reject = function(f)
{
  return this.filter(elt => !f(elt))
}

Array.prototype.index = function(value)
{
  if (value instanceof Function) {
    const i = this.findIndex(value)
    if (i === -1)
      return null
    else
      return i
  } else {
    const i = this.findIndex( elt => eql_p(elt,value) )
    if (i == -1)
      return null
    else
      return i
  }
}

Array.prototype.take = function(n)
{
  const arr = []
  n = Math.min(n, this.length)
  for (let i = 0; i < n; i++)
    arr.push(this[i])
  return arr
}

Object.defineProperty(Array.prototype, 'size', { get() { return this.length } })

String.prototype.chomp = function()
{
  let str = this.valueOf()
  while (str.length > 0 && ( str[str.length - 1] == '\n' || str[str.length - 1] == '\r' )) {
    str = str.slice(0, str.length - 1)
  }
  return str
}

Array.prototype.replace = function(arr)
{
  this.splice(0, this.length, ... arr)
  return this
}

class Kernel
{
  static inspect(v)
  {
    if (v === undefined) {
      return "undefined"
    } else {
      return JSON.stringify(v)
    }
  }
}

Array.new = function(n, f) {
  const arr = new Array(n)
  if (f)
    for (let i = 0; i < arr.length; i++)
      arr[i] = f(i)

  return arr
}

// Array#reject!
Array.prototype.reject_d = function(pred) {
  for (let i = 0; i < this.length; ) {
    if (pred(this[i])) {
      this.splice(i, 1)
    } else
      i++
  }
  return this
}

Object.defineProperty(String.prototype, 'size', { get() { return this.length } })
