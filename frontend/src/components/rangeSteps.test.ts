import { describeRange, fromIndexRange, toIndexRange } from './rangeSteps'

const steps = [512, 1024, 2048, 4096, 8192]
const format = (n: number) => `${n}`

describe('rangeSteps', () => {
  it('maps no limits to the slider ends and back', () => {
    expect(toIndexRange(steps, {})).toEqual([0, 4])
    expect(fromIndexRange(steps, [0, 4])).toEqual({ min: undefined, max: undefined })
  })

  it('round-trips values on a step', () => {
    expect(toIndexRange(steps, { min: 1024, max: 4096 })).toEqual([1, 3])
    expect(fromIndexRange(steps, [1, 3])).toEqual({ min: 1024, max: 4096 })
  })

  it('snaps values between steps inwards', () => {
    expect(toIndexRange(steps, { min: 1500, max: 3000 })).toEqual([2, 2])
  })

  it('handles values outside the steps', () => {
    expect(toIndexRange(steps, { min: 99999 })).toEqual([4, 4])
    expect(toIndexRange(steps, { max: 1 })).toEqual([0, 0])
  })

  it.each([
    [{}, 'Any'],
    [{ min: 1024 }, '≥ 1024'],
    [{ max: 2048 }, '≤ 2048'],
    [{ min: 1024, max: 2048 }, '1024 – 2048'],
    [{ min: 1024, max: 1024 }, '1024'],
  ])('describes %o as %s', (range, expected) => expect(describeRange(range, format)).toBe(expected))
})
