// -*- mode: js; js-indent-level: 2 -*-
'use strict';

// 未識別名 本当の名前 プレーヤーが付けた名前
// A        a          α
// B        b          β
class NamingTable
{
  constructor(false_names, true_names)
  {
    if (false_names.length != true_names.length)
      throw new Error("list length mismatch")

    if (false_names.uniq().length != false_names.length)
      throw new Error("duplicate items in false_names")

    if (true_names.uniq().length != true_names.length)
      throw new Error("duplicate items in true_names")

    this.false_names = false_names.slice()
    this.true_names  = true_names.slice()
    const n = true_names.length
    this.nicknames = [null].times(n)
    this.identified = [false].times(n)
  }

  false_name(true_name)
  {
    if (typeof(true_name) != 'string')
      throw new Error("string expected" )

    if (!this.include_p(true_name))
      throw new Error( "not in table" )

    return this.false_names[this.true_names.index(true_name)]
  }

  true_name(true_name)
  {
    if (typeof(true_name) != 'string')
      throw new Error("string expected" )

    if (!this.include_p(true_name))
      throw new Error( "not in table" )

    return true_name
  }

  nickname(true_name)
  {
    if (typeof(true_name) != 'string')
      throw new Error("string expected" )

    if (!this.include_p(true_name))
      throw new Error( "not in table" )

    return this.nicknames[this.true_names.index(true_name)]
  }

  identified_p(true_name)
  {
    if (typeof(true_name) != 'string')
      throw new Error("string expected" )

    if (!this.include_p(true_name))
      throw new Error( "not in table" )

    const index = this.true_names.index(true_name)
    return this.identified[index]
  }

  state(true_name)
  {
    if (typeof(true_name) != 'string')
      throw new Error("string expected" )

    if (!this.include_p(true_name))
      throw new Error( "not in table" )

    const index = this.true_names.index(true_name)
    if (this.identified[index])
      return 'identified'
    else if (this.nicknames[index])
      return 'nicknamed'
    else
      return 'unidentified'
  }

  include_p(true_name)
  {
    if (typeof(true_name) != 'string')
      throw new Error("string expected" )

    const index = this.true_names.index(true_name)
    return index != null
  }

  set_nickname(true_name, nickname)
  {
    if (typeof(true_name) != 'string')
      throw new Error("string expected" )

    if (!this.include_p(true_name))
      throw new Error( "not in table" )

    const index = this.true_names.index(true_name)
    this.nicknames[index] = nickname
  }

  identify(true_name)
  {
    if (typeof(true_name) != 'string')
      throw new Error("string expected" )

    if (!this.include_p(true_name))
      throw new Error( "not in table" )

    const index = this.true_names.index(true_name)
    this.identified[index] = true
  }

  forget()
  {
    this.nicknames = [null].times(n)
    this.identified = [false].times(n)
  }

}
