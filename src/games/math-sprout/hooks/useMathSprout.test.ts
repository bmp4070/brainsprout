import { describe, expect, it } from 'vitest';
import { initialState, reducer } from './useMathSprout';
import type { GameState } from './useMathSprout';
import { DIFFICULTIES, ROUND_LENGTH } from '../lib/types';
import type { Problem } from '../lib/types';

/** A trivial deterministic problem: correctIndex is always 0, answer 4. */
function makeProblem(): Problem {
  return {
    a: 6,
    b: 2,
    operation: 'subtract',
    answer: 4,
    choices: [4, 5, 3, 6],
    correctIndex: 0,
  };
}

function makeRound(): Problem[] {
  return Array.from({ length: ROUND_LENGTH }, () => makeProblem());
}

function start(problems: Problem[] = makeRound()): GameState {
  return reducer(initialState, {
    type: 'START',
    operation: 'subtract',
    difficulty: DIFFICULTIES.easy,
    problems,
  });
}

describe('reducer', () => {
  it('START enters playing at question 0 with counts zeroed', () => {
    const s = start();
    expect(s.phase).toBe('playing');
    expect(s.operation).toBe('subtract');
    expect(s.difficulty).toEqual(DIFFICULTIES.easy);
    expect(s.index).toBe(0);
    expect(s.selected).toBeNull();
    expect(s.correctCount).toBe(0);
    expect(s.streak).toBe(0);
    expect(s.bestStreak).toBe(0);
    expect(s.result).toBeNull();
  });

  it('ANSWER with the correct choice records selection, correctCount, and streak', () => {
    const s = reducer(start(), { type: 'ANSWER', choiceIndex: 0 });
    expect(s.selected).toBe(0);
    expect(s.correctCount).toBe(1);
    expect(s.streak).toBe(1);
    expect(s.bestStreak).toBe(1);
  });

  it('ANSWER with a wrong choice records selection but resets streak', () => {
    let s = start();
    s = reducer(s, { type: 'ANSWER', choiceIndex: 0 }); // correct, streak 1
    s = reducer(s, { type: 'NEXT' });
    s = reducer(s, { type: 'ANSWER', choiceIndex: 1 }); // wrong
    expect(s.selected).toBe(1);
    expect(s.correctCount).toBe(1);
    expect(s.streak).toBe(0);
    expect(s.bestStreak).toBe(1);
  });

  it('a second ANSWER on the same question is a no-op', () => {
    let s = start();
    s = reducer(s, { type: 'ANSWER', choiceIndex: 0 });
    const afterFirst = s;
    s = reducer(s, { type: 'ANSWER', choiceIndex: 2 });
    expect(s).toEqual(afterFirst);
  });

  it('NEXT is a no-op before the question has been answered', () => {
    const s0 = start();
    const s1 = reducer(s0, { type: 'NEXT' });
    expect(s1).toEqual(s0);
  });

  it('NEXT advances to the next question and clears selected', () => {
    let s = start();
    s = reducer(s, { type: 'ANSWER', choiceIndex: 0 });
    s = reducer(s, { type: 'NEXT' });
    expect(s.index).toBe(1);
    expect(s.selected).toBeNull();
    expect(s.phase).toBe('playing');
  });

  it('finishes to "won" with a result after the last question', () => {
    let s = start();
    for (let i = 0; i < ROUND_LENGTH; i += 1) {
      s = reducer(s, { type: 'ANSWER', choiceIndex: 0 });
      s = reducer(s, { type: 'NEXT' });
    }
    expect(s.phase).toBe('won');
    expect(s.result).not.toBeNull();
    expect(s.correctCount).toBe(ROUND_LENGTH);
  });

  it('a full 10-correct run earns 3 stars', () => {
    let s = start();
    for (let i = 0; i < ROUND_LENGTH; i += 1) {
      s = reducer(s, { type: 'ANSWER', choiceIndex: 0 });
      s = reducer(s, { type: 'NEXT' });
    }
    expect(s.result?.stars).toBe(3);
  });

  it('RESET returns to the initial picking state', () => {
    let s = start();
    s = reducer(s, { type: 'ANSWER', choiceIndex: 0 });
    s = reducer(s, { type: 'RESET' });
    expect(s).toEqual(initialState);
  });
});
