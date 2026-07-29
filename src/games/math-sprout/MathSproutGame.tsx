import { useCallback, useEffect, useRef, useState } from 'react';
import { getMetaForPath } from '../../seo/meta';
import { usePageMeta } from '../../seo/usePageMeta';
import JsonLd from '../../seo/JsonLd';
import { gameSchema } from '../../seo/schema';
import { useMathSprout } from './hooks/useMathSprout';
import { recordResult } from './lib/storage';
import { ROUND_LENGTH } from './lib/types';
import type { DifficultyConfig, OperationId } from './lib/types';
import OperationPicker from './components/OperationPicker';
import Hud from './components/Hud';
import QuestionCard from './components/QuestionCard';
import CelebrationOverlay from './components/CelebrationOverlay';
import { ensureAudioReady, isMuted, playFound, playWrong, setMuted } from '../../shared/audio/sounds';
import styles from './MathSproutGame.module.css';

const META = getMetaForPath('/games/math-sprout');
const SCHEMA = gameSchema({
  name: 'BrainSprout Math Sprout',
  description: META.description,
  path: '/games/math-sprout',
});

export default function MathSproutGame() {
  usePageMeta(META);

  const { state, dispatch, start } = useMathSprout();
  const [muted, setMutedState] = useState(() => isMuted());
  const [isNewBest, setIsNewBest] = useState(false);

  const recordedRef = useRef(false);

  // Record the result exactly once per completed round.
  useEffect(() => {
    if (
      state.phase === 'won' &&
      state.operation &&
      state.difficulty &&
      state.result &&
      !recordedRef.current
    ) {
      recordedRef.current = true;
      const { isNewBest: newBest } = recordResult(
        state.operation,
        state.difficulty.id,
        state.result.score,
      );
      setIsNewBest(newBest);
    }
    if (state.phase !== 'won') {
      recordedRef.current = false;
    }
  }, [state.phase, state.operation, state.difficulty, state.result]);

  const handleStart = useCallback(
    (operation: OperationId, difficulty: DifficultyConfig) => {
      ensureAudioReady();
      start(operation, difficulty);
    },
    [start],
  );

  const handleAnswer = useCallback(
    (choiceIndex: number) => {
      ensureAudioReady();
      const problem = state.problems[state.index];
      if (problem) {
        if (choiceIndex === problem.correctIndex) {
          playFound();
        } else {
          playWrong();
        }
      }
      dispatch({ type: 'ANSWER', choiceIndex });
    },
    [dispatch, state.problems, state.index],
  );

  const handleNext = useCallback(() => {
    dispatch({ type: 'NEXT' });
  }, [dispatch]);

  const handleToggleMute = useCallback(() => {
    setMuted(!muted);
    setMutedState(!muted);
  }, [muted]);

  const handleBackToMenu = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, [dispatch]);

  const handlePlayAgain = useCallback(() => {
    if (state.operation && state.difficulty) {
      start(state.operation, state.difficulty);
    }
  }, [start, state.operation, state.difficulty]);

  if (state.phase === 'picking' || !state.operation || !state.difficulty) {
    return (
      <>
        <JsonLd data={SCHEMA} />
        <OperationPicker onStart={handleStart} />
      </>
    );
  }

  const problem = state.problems[state.index];

  return (
    <div className={styles.page}>
      <Hud
        questionNumber={Math.min(state.index + 1, ROUND_LENGTH)}
        total={ROUND_LENGTH}
        streak={state.streak}
        muted={muted}
        onToggleMute={handleToggleMute}
        onBackToMenu={handleBackToMenu}
      />
      {state.phase === 'playing' && problem && (
        <QuestionCard
          problem={problem}
          selected={state.selected}
          onAnswer={handleAnswer}
          onNext={handleNext}
        />
      )}
      {state.phase === 'won' && state.result && (
        <CelebrationOverlay
          result={state.result}
          correctCount={state.correctCount}
          isNewBest={isNewBest}
          onPlayAgain={handlePlayAgain}
          onHome={handleBackToMenu}
        />
      )}
    </div>
  );
}
