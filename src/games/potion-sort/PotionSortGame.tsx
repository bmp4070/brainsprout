import { useCallback, useEffect, useRef, useState } from 'react';
import { getMetaForPath } from '../../seo/meta';
import { usePageMeta } from '../../seo/usePageMeta';
import JsonLd from '../../seo/JsonLd';
import { gameSchema } from '../../seo/schema';
import { usePotionSort } from './hooks/usePotionSort';
import { recordResult } from './lib/storage';
import { applyPour, canPour } from './lib/rules';
import { CAPACITY } from './lib/types';
import type { BoardState, DifficultyConfig } from './lib/types';
import DifficultyPicker from './components/DifficultyPicker';
import Hud from './components/Hud';
import DeadEndBanner from './components/DeadEndBanner';
import Shelf from './components/Shelf';
import CelebrationOverlay from './components/CelebrationOverlay';
import { ensureAudioReady, isMuted, playFound, playTick, playWrong, setMuted } from '../../shared/audio/sounds';
import styles from './PotionSortGame.module.css';

const META = getMetaForPath('/games/potion-sort');
const SCHEMA = gameSchema({
  name: 'BrainSprout Potion Sort',
  description: META.description,
  path: '/games/potion-sort',
});

/** True when a bottle is full and holds a single pure color. */
function isComplete(bottle: BoardState[number]): boolean {
  return bottle.length === CAPACITY && bottle.every((c) => c === bottle[0]);
}

/**
 * Decides the sound cue for a tap BEFORE the reducer runs, since the reducer
 * only knows the state it produces, not the "why" (select vs. deselect vs.
 * switch). Mirrors the reducer's own TAP_BOTTLE branching so the sound always
 * matches what actually happens.
 */
function playTapSound(board: BoardState, selected: number | null, tapped: number): void {
  if (selected === null) {
    if (board[tapped].length > 0) playTick(0);
    return;
  }
  if (selected === tapped) {
    playTick(0);
    return;
  }
  if (canPour(board[selected], board[tapped])) {
    playFound();
    const next = applyPour(board, selected, tapped);
    if (isComplete(next[tapped]) && !isComplete(board[tapped])) {
      // A little extra flourish when the pour actually finishes a bottle.
      playFound();
    }
    return;
  }
  // Illegal target: switch selection to it if non-empty, else just deselect.
  if (board[tapped].length > 0) {
    playWrong();
  } else {
    playTick(0);
  }
}

export default function PotionSortGame() {
  usePageMeta(META);

  const { state, dispatch, start } = usePotionSort();
  const [muted, setMutedState] = useState(() => isMuted());
  const [isNewBest, setIsNewBest] = useState(false);

  const recordedRef = useRef(false);

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

  const handleTapBottle = useCallback(
    (index: number) => {
      ensureAudioReady();
      if (state.board) {
        playTapSound(state.board, state.selected, index);
      }
      dispatch({ type: 'TAP_BOTTLE', index });
    },
    [dispatch, state.board, state.selected],
  );

  const handleUndo = useCallback(() => {
    playTick(0);
    dispatch({ type: 'UNDO' });
  }, [dispatch]);

  const handleRestart = useCallback(() => {
    playTick(0);
    dispatch({ type: 'RESTART' });
  }, [dispatch]);

  const handleHint = useCallback(() => {
    playTick(0);
    dispatch({ type: 'HINT' });
  }, [dispatch]);

  const handleToggleMute = useCallback(() => {
    setMuted(!muted);
    setMutedState(!muted);
  }, [muted]);

  const handleBackToMenu = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, [dispatch]);

  const handleNewGame = useCallback(() => {
    if (state.difficulty) {
      start(state.difficulty);
    }
  }, [start, state.difficulty]);

  if (state.phase === 'picking' || !state.difficulty || !state.puzzle || !state.board) {
    return (
      <>
        <JsonLd data={SCHEMA} />
        <DifficultyPicker onPick={handlePick} />
      </>
    );
  }

  const completed = state.board.filter(isComplete).length;

  return (
    <div className={styles.page}>
      <Hud
        completed={completed}
        colorCount={state.difficulty.colorCount}
        pours={state.pours}
        undoDisabled={state.history.length === 0}
        hintDisabled={state.phase !== 'playing'}
        muted={muted}
        onUndo={handleUndo}
        onRestart={handleRestart}
        onHint={handleHint}
        onToggleMute={handleToggleMute}
        onBackToMenu={handleBackToMenu}
      />
      <div className={styles.playArea}>
        {state.deadEnd && (
          <DeadEndBanner
            onUndo={handleUndo}
            onRestart={handleRestart}
            canUndo={state.history.length > 0}
          />
        )}
        <Shelf
          board={state.board}
          selected={state.selected}
          hint={state.hint}
          disabled={state.phase !== 'playing'}
          onTapBottle={handleTapBottle}
        />
      </div>
      {state.phase === 'won' && state.result && (
        <CelebrationOverlay
          result={state.result}
          pours={state.pours}
          par={state.puzzle.par}
          parExact={state.puzzle.parExact}
          isNewBest={isNewBest}
          onNewGame={handleNewGame}
          onHome={handleBackToMenu}
        />
      )}
    </div>
  );
}
