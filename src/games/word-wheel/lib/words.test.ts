import { describe, expect, it } from 'vitest';
import { canMake, letterCounts } from './words';

describe('words multiset helpers', () => {
  it('computes letter counts case-insensitively', () => {
    expect(letterCounts('Apple')).toEqual({ a: 1, p: 2, l: 1, e: 1 });
  });

  it('checks if word can be made from rack', () => {
    expect(canMake('cat', ['C', 'A', 'T', 'S'])).toBe(true);
    expect(canMake('cats', ['C', 'A', 'T'])).toBe(false);
    expect(canMake('apple', ['A', 'P', 'L', 'E'])).toBe(false); // needs 2 'p's
    expect(canMake('apple', ['A', 'P', 'P', 'L', 'E', 'S'])).toBe(true);
    expect(canMake('', ['A', 'B'])).toBe(true);
  });
});
