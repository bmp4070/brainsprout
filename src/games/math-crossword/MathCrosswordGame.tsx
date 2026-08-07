import { useCallback, useEffect, useRef, useState } from 'react';
import { getMetaForPath } from '../../seo/meta';
import { usePageMeta } from '../../seo/usePageMeta';
import JsonLd from '../../seo/JsonLd';
import { gameSchema } from '../../seo/schema';
import { useMathCrossword } from './hooks/useMathCrossword';
import { recordResult } from './lib/storage';
import type { DifficultyConfig } from './lib/types';
import DifficultyPicker from './components/DifficultyPicker';
import CrosswordGrid from './components/CrosswordGrid';
import ChoiceRow from './components/ChoiceRow';
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
import styles from './MathCrosswordGame.module.css';

const META = getMetaForPath('/games/math-crossword');
const SCHEMA = gameSchema({
  name: 'BrainSprout Math Crossword',
  description: META.description,
  path: '/games/math-crossword',
});

export default function MathCrosswordGame() {
  usePageMeta(META);

  const { state, dispatch, start } = useMathCrossword();
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [muted, setMutedState] = useState(() => isMuted());
  const [isNewBest, setIsNewBest] = useState(false);
  const recordedRef = useRef(false);
  const solvedCountRef = useRef(0);

  // Record the result exactly once per completed puzzle.
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

  // Sound on a correct fill (solved count grew).
  const solvedCount = Object.keys(state.solved).length;
  useEffect(() => {
    if (solvedCount > solvedCountRef.current && state.phase === 'playing') {
      playFound();
    }
    solvedCountRef.current = solvedCount;
  }, [solvedCount, state.phase]);

  // Sound on a wrong tap.
  useEffect(() => {
    if (state.wrongSeq > 0) playWrong();
  }, [state.wrongSeq]);

  const handlePick = useCallback(
    (difficulty: DifficultyConfig) => {
      ensureAudioReady();
      solvedCountRef.current = 0;
      start(difficulty);
    },
    [start],
  );

  const handleSelectBlank = useCallback(
    (blankId: number) => {
      dispatch({ type: 'SELECT', blankId });
    },
    [dispatch],
  );

  const handleAnswer = useCallback(
    (blankId: number, choiceIndex: number) => {
      ensureAudioReady();
      dispatch({ type: 'ANSWER', blankId, choiceIndex });
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
      solvedCountRef.current = 0;
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

  const total = state.puzzle.blanks.length;
  const activeBlank =
    state.activeBlankId === null
      ? null
      : state.puzzle.blanks.find((b) => b.id === state.activeBlankId) ?? null;

  return (
    <div className={styles.page}>
      <Hud
        solved={solvedCount}
        total={total}
        elapsedMs={state.elapsedMs}
        timerEnabled={timerEnabled}
        hintDisabled={state.phase !== 'playing'}
        muted={muted}
        onHint={handleHint}
        onToggleMute={handleToggleMute}
        onBackToMenu={handleBackToMenu}
      />
      <CrosswordGrid
        grid={state.puzzle.grid}
        solved={state.solved}
        activeBlankId={state.activeBlankId}
        onSelectBlank={handleSelectBlank}
      />
      <ChoiceRow
        blank={activeBlank}
        wrongChoiceIndex={state.wrongChoiceIndex}
        wrongSeq={state.wrongSeq}
        onAnswer={handleAnswer}
      />
      {state.phase === 'won' && state.result && (
        <CelebrationOverlay
          result={state.result}
          isNewBest={isNewBest}
          onPlayAgain={handlePlayAgain}
          onHome={handleBackToMenu}
        />
      )}
    </div>
  );
}
