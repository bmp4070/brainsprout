import { describe, expect, it } from 'vitest';
import { generateRound } from './generator';
import { ITEM_IDS } from './items';
import { DIFFICULTIES } from './types';

describe('generateRound', () => {
  it('is deterministic for a given seed', () => {
    const a = generateRound(DIFFICULTIES.medium, 12345);
    const b = generateRound(DIFFICULTIES.medium, 12345);
    expect(b).toEqual(a);
  });

  it('produces different rounds for different seeds', () => {
    const a = generateRound(DIFFICULTIES.medium, 1);
    const b = generateRound(DIFFICULTIES.medium, 2);
    expect(b.studied).not.toEqual(a.studied);
  });

  for (const difficulty of Object.values(DIFFICULTIES)) {
    describe(difficulty.id, () => {
      const round = generateRound(difficulty, 999);

      it('studies the configured number of distinct items', () => {
        expect(round.studied).toHaveLength(difficulty.studyCount);
        expect(new Set(round.studied).size).toBe(difficulty.studyCount);
      });

      it('has the configured target count, all drawn from the studied set', () => {
        expect(round.targetIds).toHaveLength(difficulty.targetCount);
        expect(new Set(round.targetIds).size).toBe(difficulty.targetCount);
        for (const id of round.targetIds) {
          expect(round.studied).toContain(id);
        }
      });

      it('builds a belt of targets + distractors with unique keys', () => {
        expect(round.belt).toHaveLength(difficulty.targetCount + difficulty.distractorCount);
        const keys = round.belt.map((b) => b.key);
        expect(new Set(keys).size).toBe(keys.length);
      });

      it('marks exactly the targets on the belt, and decoys are never studied', () => {
        const beltTargets = round.belt.filter((b) => b.isTarget).map((b) => b.itemId);
        expect(new Set(beltTargets)).toEqual(new Set(round.targetIds));
        for (const b of round.belt) {
          if (!b.isTarget) expect(round.studied).not.toContain(b.itemId);
        }
      });

      it('only uses real catalogue items', () => {
        for (const b of round.belt) expect(ITEM_IDS).toContain(b.itemId);
      });
    });
  }

  it('never throws even across many seeds', () => {
    for (let seed = 0; seed < 300; seed += 1) {
      expect(() => generateRound(DIFFICULTIES.hard, seed)).not.toThrow();
    }
  });
});
