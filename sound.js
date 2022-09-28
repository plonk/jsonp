// -*- mode: js; js-indent-level: 2 -*-
'use strict';

class Sound {
  static LETTER_TO_OFFSET_FROM_A = {
    "c": -9,
    "d": -7,
    "e": -5,
    "f": -4,
    "g": -2,
    "a":  0,
    "b": 2,
  }

  static key_to_offset_from_a440(key)
  {
    const $ = key.match(/^([a-g])(#?)([0-8])$/)
    if ($) {
      const letter = $[1]
      const sharp = ($[2] === "#") ? 1 : 0
      const octave = +$[3]
      const offset = (octave - 4) * 12 + this.LETTER_TO_OFFSET_FROM_A[letter] + sharp
      if (offset >= 0)
        return offset
      else
        return 256 + offset
    } else {
      throw new Error(`invalid key designation: ${key}`)
    }
  }

  static translate_rest(duration)
  {
    return `\x1b[0;${duration};0-~` // vol dur note
  }

  static translate_note(duration, note, volume)
  {
    let note_number

    if (typeof(note) == 'string')
      note_number = this.key_to_offset_from_a440(note)
    else if (typeof(note) == 'number')
      note_number = note % 256
    else
      throw new Error()

    return `\x1b[${volume};${duration};${note_number}-~`
  }

  static compile(sequence)
  {
    let total_duration = 0
    const compiled = sequence.map(command => {
      const [inst, ... args] = command
      if (inst === "rest") {
        const duration = args[0]
        total_duration += duration
        return this.translate_rest(duration)
      } else if (inst === "note") {
        const [duration, note, volume] = args
        total_duration += duration
        return this.translate_note(duration, note, volume)
      } else
        throw new Error()
    }).join('')
    return { tune: compiled, duration: total_duration }
  }

  static async play(tune) {
    print(tune.tune)
    await sleep(tune.duration / 1000)
  }
}

class SoundEffects extends Sound {
  static async fanfare()
  {
    const tune = this.compile([
                     ['note', (800 * 0.6).round(), 'c5', 40],
                     ['note', (600 * 0.6).round(), 'b4', 40],
                     ['note', (200 * 0.6).round(), 'f4', 40],
                     ['note', (400 * 0.6).round(), 'a4', 40],
                     ['note', (400 * 0.6).round(), 'g4', 40],
                     ['note', (400 * 0.6).round(), 'f4', 40],
                     ['note', (400 * 0.6).round(), 'd4', 40],

                     ['note', (400 * 0.6).round(), 'c4', 40],
                     ['note', (200 * 0.6).round(), 'b3', 40],
                     ['note', (200 * 0.6).round(), 'c4', 40],

                     ['note', (400 * 0.6).round(), 'e4', 40],
                     ['note', (200 * 0.6).round(), 'd4', 40],
                     ['note', (200 * 0.6).round(), 'e4', 40],
                     ['note', (800 * 0.6).round(), 'd4', 40],
                     ['note', (400 * 0.6).round(), 'c4', 40],
                   ])
    await this.play(tune)
  }

  static async fanfare2()
  {
    const tune = this.compile([
                     ['note', (200/1.75).round(), 'c6', 50],
                     ['rest', (200/1.75).round()],

                     ['note', (150/1.75).round(), 'b5', 40],
                     ['rest', (150/1.75).round()],

                     ['note', (100/1.75).round(), 'f5', 40],

                     ['note', (100/1.75).round(), 'a5', 40],
                     ['rest', (100/1.75).round()],
                     ['note', (100/1.75).round(), 'g5', 40],
                     ['rest', (100/1.75).round()],
                     ['note', (100/1.75).round(), 'f5', 40],
                     ['rest', (100/1.75).round()],
                     ['note', (100/1.75).round(), 'd5', 40],
                     ['rest', (100/1.75).round()],

                     ['note', (200/1.75).round(), 'c5', 40],
                     ['note', (100/1.75).round(), 'b4', 40],
                     ['note', (100/1.75).round(), 'c5', 40],
                     ['note', (200/1.75).round(), 'e5', 40],
                     ['note', (100/1.75).round(), 'd5', 40],
                     ['note', (100/1.75).round(), 'e5', 40],
                     ['note', (400/1.75).round(), 'd5', 40],
                     ['note', (200/1.75).round(), 'c5', 40],
                   ])
    await this.play(tune)
  }

  static async fanfare3()
  {
    const tune = this.compile([
                     ['note', 800, 'c5', 40],
                     ['note', 600, 'b4', 40],
                     ['note', 200, 'f4', 40],
                     ['note', 400, 'a4', 40],
                     ['note', 400, 'g4', 40],
                     ['note', 400, 'f4', 40],
                     ['note', 400, 'd4', 40],

                     ['note', 50, 'c4', 40],
                     ['note', 50, 'd4', 40],
                     ['note', 50, 'c4', 40],
                     ['note', 50, 'd4', 40],
                     ['note', 50, 'c4', 40],
                     ['note', 50, 'd4', 40],
                     ['note', 50, 'c4', 40],
                     ['note', 50, 'd4', 40],
                     ['note', 50, 'c4', 40],
                     ['note', 50, 'd4', 40],
                     ['note', 50, 'c4', 40],
                     ['note', 50, 'd4', 40],
                     ['note', 50, 'c4', 40],
                     ['note', 50, 'd4', 40],
                     ['note', 33, 'c4', 40],
                     ['note', 33, 'b3', 40],
                     ['note', 33, 'c4', 40],

                     ['note', 400, 'e4', 40],
                     ['note', 200, 'd4', 40],
                     ['note', 200, 'e4', 40],
                     ['note', 800, 'd4', 40],
                     ['note', 400, 'c4', 40],
                   ])
    await this.play(tune)
  }

  static async gameover()
  {
    const tune = this.compile([
                     ['note', 400, 12, 40],
                     ['note', 400, 8, 40],
                     ['note', 400, 5, 40],
                     ['note', 400, 3, 40],

                     ['note', 50, 2, 40],
                     ['note', 50, 3, 40],
                     ['note', 50, 2, 40],
                     ['note', 50, 3, 40],
                     ['note', 50, 2, 40],
                     ['note', 50, 3, 40],
                     ['note', 50, 2, 40],
                     ['note', 50, 3, 40],
                     ['note', 50, 2, 40],
                     ['note', 50, 3, 40],
                     ['note', 50, 2, 40],
                     ['note', 50, 3, 40],

                     ['note', 600, 2, 40],

                     ['note', 380, 3, 40],
                     ['rest', 20],
                     ['note', 1600, 3, 40],
                   ])
    await this.play(tune)
  }

  static async trapdoor()
  {
    const tune = this.compile([
      ... new Range(18, 30).to_a().reverse().map(offset => ['note', 50, offset, 40] ),
      ['note', 50, 17, 40],
      ['note', 50, 18, 40],
      ['note', 50, 17, 40],
      ['note', 50, 18, 40],
      ['note', 50, 17, 40],
      ['note', 50, 18, 40],
      ['note', 50, 17, 40],
      ['note', 50, 18, 40],
      ['note', 50, 17, 40],
      ['note', 50, 18, 40],
      ['note', 200, 17, 40],
    ])
    await this.play(tune)
  }

  static async staircase()
  {
    print("\x1b[0;100;0-~")
    print("\x1b[100;2;208-~")
    print("\x1b[0;250;0-~")
    print("\x1b[100;2;206-~")
    print("\x1b[0;250;0-~")
    print("\x1b[100;2;220-~")
    print("\x1b[0;250;0-~")
    print("\x1b[100;2;218-~")
    await sleep(1)
  }

  static async partyroom()
  {
    print("\x1b[0;60;8-~") // 無音

    print("\x1b[50;30;8-~")
    print("\x1b[50;30;252-~")
    print("\x1b[50;30;7-~")
    print("\x1b[50;30;251-~")
    print("\x1b[50;30;6-~")
    print("\x1b[50;30;250-~")
    print("\x1b[50;30;5-~")
    print("\x1b[50;30;249-~")
    print("\x1b[50;30;4-~")
    print("\x1b[50;30;248-~")
    print("\x1b[50;30;3-~")
    print("\x1b[50;30;247-~")
    print("\x1b[50;30;8-~")
    print("\x1b[50;30;252-~")
    print("\x1b[50;30;7-~")
    print("\x1b[50;30;251-~")
    print("\x1b[50;30;6-~")
    print("\x1b[50;30;250-~")
    print("\x1b[50;30;5-~")
    print("\x1b[50;30;249-~")
    print("\x1b[50;30;4-~")
    print("\x1b[50;30;248-~")
    print("\x1b[50;30;3-~")
    print("\x1b[50;30;247-~")
    await sleep(1)
  }

  static async hit()
  {
    print("\x1b[0;60;247-~")
    print("\x1b[50;30;247-~")
    print("\x1b[0;30;247-~")
    print("\x1b[50;30;3-~")
    // sleep(0.12)
  }

  static async miss()
  {
    print("\x1b[0;60;0-~")
    print("\x1b[40;100;9-~")
    print("\x1b[0;25;9-~")
    print("\x1b[40;100;6-~")
    // sleep(0.285)
  }

  static async footstep()
  {
    print("\x1b[0;50;0-~")
    print("\x1b[100;2;240-~")
    await sleep(0.052)
  }

  static async heal()
  {
    print("\x1b[50;50;3-~")
    print("\x1b[50;50;7-~")
    print("\x1b[50;50;10-~")
    print("\x1b[50;50;15-~")
    // sleep(0.2)
  }

  static async teleport()
  {
    print("\x1b[0;60;0-~")

    const tune = this.compile([
                     ['note', 15, 'a3', 40],
                     ['note', 15, 'b3', 40],
                     ['note', 15, 'c4', 40],
                     ['note', 15, 'd4', 40],
                     ['note', 15, 'e4', 40],
                     ['note', 15, 'f4', 40],
                     ['note', 15, 'g#4', 40],
                     ['note', 15, 'a4', 40],
                     ['note', 15, 'g#4', 40],
                     ['note', 15, 'f4', 40],
                     ['note', 15, 'e4', 40],
                     ['note', 15, 'd4', 40],
                     ['note', 15, 'c4', 40],
                     ['note', 15, 'b3', 40],
                     ['note', 15, 'a3', 40],
                     ['rest', 50],
                   ].times(4))
    await this.play(tune)
  }

  static async magic()
  {
    print("\x1b[0;60;0-~")

    const tune = this.compile([
                     ['note', 100, 'a4', 40],
                     ['note', 100, 'c5', 40],
                     ['note', 100, 'b4', 40],
                     ['note', 100, 'd5', 40],
                     ['note', 100, 'c5', 40],
                     ['note', 100, 'd#5', 40],
                   ])
    await this.play(tune)
  }

  static async weapon()
  {
    print("\x1b[0;60;0-~")

    const tune = this.compile([
                     ['note', 20, 'c5', 40],
                     ['note', 20, 'c#6', 40],
                     ['rest', 20],
                     ['note', 20, 'c5', 40],
                     ['note', 20, 'c#6', 40],
                   ])
    await this.play(tune)
  }

}
