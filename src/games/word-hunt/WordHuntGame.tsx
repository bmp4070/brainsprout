import { useCallback, useEffect, useRef, useState } from 'react';
import { getMetaForPath } from '../../seo/meta';
import { usePageMeta } from '../../seo/usePageMeta';
import JsonLd from '../../seo/JsonLd';
import { gameSchema } from '../../seo/schema';
import { useWordHunt } from './hooks/useWordHunt';
import { recordResult } from './lib/storage';
import type { Cell, DifficultyConfig } from './lib/types';
import DifficultyPicker from './components/DifficultyPicker';
import Board from './components/Board';
import FoundWords from './components/FoundWords';
import Hud from './components/Hud';
import CelebrationOverlay from './components/CelebrationOverlay';
import {
  ensureAudioReady,
  isMuted,
  playFound,
  playTick,
  playWrong,
  setMuted,
} from '../../shared/audio/sounds';
import styles from './WordHuntGame.module.css';

const META = getMetaForPath('/games/word-hunt');
const SCHEMA = gameSchema({
  name: 'BrainSprout Word Hunt',
  description: META.description,
  path: '/games/word-hunt',
});

export default function WordHuntGame() {
  usePageMeta(META);

  const { state, dispatch, start } = useWordHunt();
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [muted, setMutedState] = useState(() => isMuted());
  const [isNewBest, setIsNewBest] = useState(false);
  const [flash, setFlash] = useState<'good' | 'bad' | null>(null);
  const recordedRef = useRef(false);

  // Record the result exactly once per completed board.
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

  // React to each submit: sound + a brief board flash. Keyed on outcomeSeq so
  // repeat outcomes (e.g. two rejects in a row) still retrigger.
  useEffect(() => {
    if (state.outcomeSeq === 0 || state.lastOutcome === null) return;
    if (state.lastOutcome === 'found') {
      playFound();
      setFlash('good');
    } else {
      playWrong();
      setFlash('bad');
    }
    const t = setTimeout(() => setFlash(null), 350);
    return () => clearTimeout(t);
  }, [state.outcomeSeq, state.lastOutcome]);

  // Auto-clear a hint flash after a couple seconds.
  useEffect(() => {
    if (state.hintPath === null) return;
    const t = setTimeout(() => dispatch({ type: 'CLEAR_HINT' }), 2200);
    return () => clearTimeout(t);
  }, [state.hintPath, dispatch]);

  const handlePick = useCallback(
    (difficulty: DifficultyConfig) => {
      ensureAudioReady();
      start(difficulty);
    },
    [start],
  );

  const handleSubmit = useCallback(
    (path: Cell[]) => {
      ensureAudioReady();
      dispatch({ type: 'SUBMIT', path });
    },
    [dispatch],
  );

  const handleHint = useCallback(() => {
    ensureAudioReady();
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

  const handlePlayAgain = useCallback(() => {
    if (state.difficulty) {
      ensureAudioReady();
      start(state.difficulty);
    }
  }, [start, state.difficulty]);

  if (state.phase === 'picking' || !state.difficulty || !state.puzzle) {
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

  const target = state.difficulty.targetWords;

  return (
    <div className={styles.page}>
      <Hud
        found={state.found.length}
        total={target}
        elapsedMs={state.elapsedMs}
        timerEnabled={timerEnabled}
        hintDisabled={state.phase !== 'playing'}
        muted={muted}
        onHint={handleHint}
        onToggleMute={handleToggleMute}
        onBackToMenu={handleBackToMenu}
      />
      <Board grid={state.puzzle.grid} hintPath={state.hintPath} flash={flash} onSubmit={handleSubmit} />
      <FoundWords found={state.found} target={target} total={state.puzzle.solutions.length} />
      {state.phase === 'won' && state.result && (
        <CelebrationOverlay
          result={state.result}
          wordsFound={state.found.length}
          isNewBest={isNewBest}
          onPlayAgain={handlePlayAgain}
          onHome={handleBackToMenu}
        />
      )}
    </div>
  );
}
