import { useCallback, useEffect, useRef, useState } from 'react';
import { getMetaForPath } from '../../seo/meta';
import { usePageMeta } from '../../seo/usePageMeta';
import JsonLd from '../../seo/JsonLd';
import { gameSchema } from '../../seo/schema';
import { useWordWheel } from './hooks/useWordWheel';
import { recordResult } from './lib/storage';
import { canMake } from './lib/words';
import type { DifficultyConfig } from './lib/types';
import { mulberry32, randInt } from '../../shared/lib/rng';
import DifficultyPicker from './components/DifficultyPicker';
import Hud from './components/Hud';
import LetterCircle from './components/LetterCircle';
import WordSlots from './components/WordSlots';
import CelebrationOverlay from './components/CelebrationOverlay';
import {
  ensureAudioReady,
  isMuted,
  playFanfare,
  playFound,
  playTick,
  playWrong,
  setMuted,
} from '../../shared/audio/sounds';
import styles from './WordWheelGame.module.css';

const META = getMetaForPath('/games/word-wheel');
const SCHEMA = gameSchema({
  name: 'BrainSprout Word Wheel',
  description: META.description,
  path: '/games/word-wheel',
});

/** A long found word gets the bigger "fanfare" cue instead of the regular
 * "found" cue, in addition to always getting it on the final word. */
const LONG_WORD_FLOURISH_LENGTH = 6;

/** A random permutation of [0, n) for the SHUFFLE action, using the shared
 * mulberry32 PRNG seeded from the current time (this is a cosmetic shuffle
 * gesture, not puzzle generation, so a fresh seed each press is correct). */
function shuffledOrder(n: number): number[] {
  const rng = mulberry32(Date.now());
  const order = Array.from({ length: n }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = randInt(rng, i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

export default function WordWheelGame() {
  usePageMeta(META);

  const { state, dispatch, start } = useWordWheel();
  const [muted, setMutedState] = useState(() => isMuted());
  const [isNewBest, setIsNewBest] = useState(false);

  const recordedRef = useRef(false);

  // Play a rising tick each time a letter is added to the in-progress
  // selection (covers both the drag-connect gesture and one-at-a-time
  // taps, since both funnel through TAP_LETTER and grow `state.selection`).
  const prevSelectionLenRef = useRef(state.selection.length);
  useEffect(() => {
    if (state.selection.length > prevSelectionLenRef.current) {
      playTick(state.selection.length);
    }
    prevSelectionLenRef.current = state.selection.length;
  }, [state.selection]);

  // Record the result exactly once per completed wheel.
  useEffect(() => {
    if (state.phase === 'won' && state.difficulty && state.result && !recordedRef.current) {
      recordedRef.current = true;
      const { isNewBest: newBest } = recordResult(state.difficulty.id, state.result.score);
      setIsNewBest(newBest);
    }
    if (state.phase !== 'won') {
      recordedRef.current = false;
    }
  }, [state.phase, state.difficulty, state.result]);

  const handlePick = useCallback(
    (difficulty: DifficultyConfig) => {
      ensureAudioReady();
      start(difficulty);
    },
    [start],
  );

  const handleAddLetter = useCallback(
    (index: number) => {
      dispatch({ type: 'TAP_LETTER', index });
    },
    [dispatch],
  );

  // The SUBMIT sound cue is decided *before* dispatching, by mirroring the
  // reducer's own correct/already/invalid classification from the current
  // state (selection + puzzle.words + found). This is picked over "compare
  // state before vs. after the dispatch" because it's computed fresh on
  // every call and can't go stale if the same outcome (e.g. two invalid
  // guesses in a row) repeats and produces an unchanged `lastResult` string.
  const handleSubmit = useCallback(() => {
    const { puzzle, selection, found } = state;
    if (!puzzle || selection.length === 0) return;

    const word = selection.map((i: number) => puzzle.letters[i]).join('').toLowerCase();
    const spellable = canMake(word, puzzle.letters);
    const isTarget = spellable && puzzle.words.includes(word);
    const alreadyFound = isTarget && found.includes(word);

    if (isTarget && !alreadyFound) {
      const willComplete = found.length + 1 === puzzle.words.length;
      const isLongWord = word.length >= LONG_WORD_FLOURISH_LENGTH;
      if (willComplete || isLongWord) {
        playFanfare();
      } else {
        playFound();
      }
    } else if (alreadyFound) {
      playTick(0);
    } else {
      playWrong();
    }

    dispatch({ type: 'SUBMIT' });
  }, [state, dispatch]);

  const handleBackspace = useCallback(() => {
    dispatch({ type: 'BACKSPACE' });
  }, [dispatch]);

  const handleClear = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTION' });
  }, [dispatch]);

  const handleShuffle = useCallback(() => {
    if (!state.puzzle) return;
    ensureAudioReady();
    playTick(0);
    dispatch({ type: 'SHUFFLE', order: shuffledOrder(state.puzzle.letters.length) });
  }, [state.puzzle, dispatch]);

  const handleHint = useCallback(() => {
    dispatch({ type: 'HINT' });
  }, [dispatch]);

  const handleToggleMute = useCallback(() => {
    setMuted(!muted);
    setMutedState(!muted);
  }, [muted]);

  const handleBackToMenu = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, [dispatch]);

  const handleNewWheel = useCallback(() => {
    if (state.difficulty) {
      start(state.difficulty);
    }
  }, [start, state.difficulty]);

  if (state.phase === 'picking' || !state.difficulty || !state.puzzle) {
    return (
      <>
        <JsonLd data={SCHEMA} />
        <DifficultyPicker onPick={handlePick} />
      </>
    );
  }

  return (
    <div className={styles.page}>
      <Hud
        found={state.found.length}
        total={state.puzzle.words.length}
        shuffleDisabled={state.phase !== 'playing'}
        hintDisabled={state.phase !== 'playing'}
        muted={muted}
        onShuffle={handleShuffle}
        onHint={handleHint}
        onToggleMute={handleToggleMute}
        onBackToMenu={handleBackToMenu}
      />
      <div className={styles.board}>
        <div className={`${styles.sideColumn} ${styles.leftColumn}`}>
          <WordSlots
            words={state.puzzle.words}
            found={state.found}
            revealed={state.revealed}
            side="left"
          />
        </div>
        <div className={styles.centerColumn}>
          <LetterCircle
            letters={state.puzzle.letters}
            selection={state.selection}
            lastResult={state.lastResult}
            onAddLetter={handleAddLetter}
            onSubmit={handleSubmit}
            onBackspace={handleBackspace}
            onClear={handleClear}
          />
        </div>
        <div className={`${styles.sideColumn} ${styles.rightColumn}`}>
          <WordSlots
            words={state.puzzle.words}
            found={state.found}
            revealed={state.revealed}
            side="right"
          />
        </div>
      </div>
      <p className={styles.rulesReminder}>
        🎡 Connect letters to spell words · 3 letters or more · ✨ Find them all!
      </p>
      {state.phase === 'won' && state.result && (
        <CelebrationOverlay
          result={state.result}
          isNewBest={isNewBest}
          onNewWheel={handleNewWheel}
          onHome={handleBackToMenu}
        />
      )}
    </div>
  );
}
