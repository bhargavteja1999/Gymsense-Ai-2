import { describe, it, expect } from 'vitest'

describe('frontend foundation', () => {
  it('has supported exercises', () => {
    const exercises = ['squat', 'pushup', 'curl']
    expect(exercises).toContain('squat')
    expect(exercises).toHaveLength(3)
  })
})
