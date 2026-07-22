import { useCallback, useEffect, useRef, useState } from 'react';
import { getMetaForPath } from '../../seo/meta';
import { usePageMeta } from '../../seo/usePageMeta';
import JsonLd from '../../seo/JsonLd';
import { gameSchema } from '../../seo/schema';
import { useCatNap } from './hooks/useCatNap';
import { recordResult } from './lib/storage';
import { cellKey } from './lib/types';
import type { DifficultyConfig } from './lib/types';
import DifficultyPicker from './components/DifficultyPicker';
import Hud from './components/Hud';
import PuzzleGrid from './components/PuzzleGrid';
import CelebrationOverlay from './components/CelebrationOverlay';
import { ensureAudioReady, isMuted, playFound, playWrong, setMuted } from '../../shared/audio/sounds';
import styles from './CatNapGame.module.css';

const META = getMetaForPath('/games/cat-nap');
const SCHEMA = gameSchema({
  name: 'BrainSprout Cat Nap',
  description: META.description,
  path: '/games/cat-nap',
});

export default function CatNapGame() {
  usePageMeta(META);

  const { state, dispatch, start } = useCatNap();
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [muted, setMutedState] = useState(() => isMuted());
  const [isNewBest, setIsNewBest] = useState(false);

  const recordedRef = useRef(false);
  // Set right before a CYCLE_CELL dispatch that turns a cell into a cat, so
  // the effect below knows to check that specific cell for a sound cue.
  // Paw-print and clear cycles leave this null, so they stay silent.
  const pendingCatCellRef = useRef<{ row: number; col: number } | null>(null);

  // Elapsed-time ticking is handled internally by useCatNap (word-search-style
  // 250ms setInterval), so there's nothing to drive from here.

  // Play a found/wrong cue after a cell placement resolves into a cat,
  // based on whether that cell ended up in the conflict set.
  useEffect(() => {
    const pending = pendingCatCellRef.current;
    if (!pending) return;
    pendingCatCellRef.current = null;
    if (state.conflicts.has(cellKey(pending))) {
      playWrong();
    } else {
      playFound();
    }
  }, [state.marks, state.conflicts]);

  // Record the result exactly once per completed puzzle.
  useEffect(() => {
    if (state.phase === 'won' && state.difficulty && !recordedRef.current) {
      recordedRef.current = true;
      const { isNewBest: newBest } = recordResult(state.difficulty.id, state.score);
      setIsNewBest(newBest);
    }
    if (state.phase !== 'won') {
      recordedRef.current = false;
    }
  }, [state.phase, state.difficulty, state.score]);

  const handlePick = useCallback(
    (difficulty: DifficultyConfig) => {
      ensureAudioReady();
      start(difficulty);
    },
    [start],
  );

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      ensureAudioReady();
      const currentMark = state.marks?.[row]?.[col] ?? 'empty';
      pendingCatCellRef.current = currentMark === 'empty' ? { row, col } : null;
      dispatch({ type: 'CYCLE_CELL', row, col });
    },
    [state.marks, dispatch],
  );

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

  const handlePlayAgain = useCallback(() => {
    if (state.difficulty) {
      start(state.difficulty);
    }
  }, [start, state.difficulty]);

  if (state.phase === 'picking' || !state.difficulty || !state.puzzle || !state.marks) {
    return (
      <>
        <JsonLd data={SCHEMA} />
        <DifficultyPicker
          timerEnabled={timerEnabled}
          onToggleTimer={() => setTimerEnabled((v) => !v)}
          onPick={handlePick}
        />
      </>
    );
  }

  const catsPlaced = state.marks.reduce(
    (total, row) => total + row.filter((mark) => mark === 'cat').length,
    0,
  );

  return (
    <div className={styles.page}>
      <Hud
        catsPlaced={catsPlaced}
        size={state.puzzle.size}
        elapsedMs={state.elapsedMs}
        timerEnabled={timerEnabled}
        hintDisabled={state.phase !== 'playing'}
        muted={muted}
        onHint={handleHint}
        onToggleMute={handleToggleMute}
        onBackToMenu={handleBackToMenu}
      />
      <PuzzleGrid
        puzzle={state.puzzle}
        marks={state.marks}
        conflicts={state.conflicts}
        disabled={state.phase !== 'playing'}
        onCellClick={handleCellClick}
      />
      <p className={styles.rulesReminder}>
        🐱 One cat per color · 🚫 No sharing rows or columns · 🙅 No touching!
      </p>
      {state.phase === 'won' && (
        <CelebrationOverlay
          elapsedMs={state.elapsedMs}
          score={state.score}
          isNewBest={isNewBest}
          showTime={timerEnabled}
          catCount={state.puzzle.size}
          onPlayAgain={handlePlayAgain}
          onHome={handleBackToMenu}
        />
      )}
    </div>
  );
}
