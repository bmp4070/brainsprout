import { describe, expect, it } from 'vitest';
import { themes, getTheme } from './index';
import { DIFFICULTIES } from '../lib/types';
import type { DifficultyId } from '../lib/types';

const A_TO_Z_ONLY = /^[A-Z]+$/;
const DIFFICULTY_IDS: DifficultyId[] = ['easy', 'medium', 'hard'];

describe('theme registry', () => {
  it('has at least one theme, each with a unique id', () => {
    expect(themes.length).toBeGreaterThan(0);
    const ids = themes.map((theme) => theme.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('getTheme looks up by id and returns undefined for unknown ids', () => {
    for (const theme of themes) {
      expect(getTheme(theme.id)).toBe(theme);
    }
    expect(getTheme('does-not-exist')).toBeUndefined();
  });

  for (const theme of themes) {
    describe(`${theme.id} theme`, () => {
      for (const id of DIFFICULTY_IDS) {
        it(`every ${id} word is uppercase A-Z, at least the tier's word count, and fits the ${id} grid`, () => {
          const words = theme.words[id];
          const config = DIFFICULTIES[id];
          expect(words.length).toBeGreaterThanOrEqual(config.wordCount);
          for (const word of words) {
            expect(word).toMatch(A_TO_Z_ONLY);
            expect(word.length).toBeLessThanOrEqual(config.gridSize);
          }
        });
      }

      it('has no duplicate or reversed-pair words within a tier', () => {
        // A duplicate word in a tier can be placed twice, making the puzzle
        // unwinnable (found words de-dupe by string but win requires one find
        // per placement). An equal-length reversed pair double-credits a drag.
        for (const id of DIFFICULTY_IDS) {
          const words = theme.words[id];
          expect(new Set(words).size).toBe(words.length);
          for (const word of words) {
            const reversed = [...word].reverse().join('');
            if (reversed !== word) {
              expect(words, `${word} has reversed twin in ${id}`).not.toContain(reversed);
            }
          }
        }
      });

      it('harder difficulties include all easier-difficulty words', () => {
        for (const word of theme.words.easy) {
          expect(theme.words.medium).toContain(word);
          expect(theme.words.hard).toContain(word);
        }
        for (const word of theme.words.medium) {
          expect(theme.words.hard).toContain(word);
        }
      });

      it('has a short, non-empty fact for every word in every tier', () => {
        for (const id of DIFFICULTY_IDS) {
          for (const word of theme.words[id]) {
            const fact = theme.facts[word];
            expect(fact, `missing fact for ${word}`).toBeTruthy();
            expect(fact.length).toBeGreaterThan(0);
            expect(fact.length).toBeLessThan(220);
          }
        }
      });
    });
  }
});
