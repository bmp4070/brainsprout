import { useCallback, useEffect, useRef, useState } from 'react';
import { getMetaForPath } from '../../seo/meta';
import { usePageMeta } from '../../seo/usePageMeta';
import JsonLd from '../../seo/JsonLd';
import { gameSchema } from '../../seo/schema';
import { useMemoryBelt } from './hooks/useMemoryBelt';
import { recordResult } from './lib/storage';
import type { DifficultyConfig } from './lib/types';
import DifficultyPicker from './components/DifficultyPicker';
import StudyGrid from './components/StudyGrid';
import ConveyorBelt from './components/ConveyorBelt';
import Hud from './components/Hud';
import CelebrationOverlay from './components/CelebrationOverlay';
import {
  ensureAudioReady,
  isMuted,
  playFanfare,
  playFound,
  playWrong,
  setMuted,
} from '../../shared/audio/sounds';
import styles from './MemoryBeltGame.module.css';

const META = getMetaForPath('/games/memory-belt');
const SCHEMA = gameSchema({
  name: 'BrainSprout Memory Belt',
  description: META.description,
  path: '/games/memory-belt',
});

export default function MemoryBeltGame() {
  usePageMeta(META);

  const { state, dispatch, start } = useMemoryBelt();
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [muted, setMutedState] = useState(() => isMuted());
  const [isNewBest, setIsNewBest] = useState(false);
  const recordedRef = useRef(false);

  // Record the result exactly once per completed round.
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

  const handleReady = useCallback(() => {
    ensureAudioReady();
    dispatch({ type: 'READY', now: Date.now() });
  }, [dispatch]);

  const handleTap = useCallback(
    (itemId: string) => {
      ensureAudioReady();
      if (state.phase === 'recall' && state.round) {
        const isTarget = state.round.targetIds.includes(itemId);
        const alreadyFound = state.found.includes(itemId);
        if (isTarget && !alreadyFound) {
          const isLastOne = state.found.length + 1 === state.round.targetIds.length;
          if (isLastOne) playFanfare();
          else playFound();
        } else if (!isTarget) {
          playWrong();
        }
      }
      dispatch({ type: 'TAP', itemId, now: Date.now() });
    },
    [state.phase, state.round, state.found, dispatch],
  );

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

  if (state.phase === 'picking' || !state.difficulty || !state.round) {
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

  if (state.phase === 'study') {
    return (
      <div className={styles.page}>
        <StudyGrid
          studied={state.round.studied}
          msLeft={state.studyMsLeft}
          msTotal={state.studyMsTotal}
          targetCount={state.difficulty.targetCount}
          onReady={handleReady}
        />
      </div>
    );
  }

  const total = state.round.targetIds.length;

  return (
    <div className={styles.page}>
      <Hud
        found={state.found.length}
        total={total}
        elapsedMs={state.elapsedMs}
        timerEnabled={timerEnabled}
        muted={muted}
        onToggleMute={handleToggleMute}
        onBackToMenu={handleBackToMenu}
      />
      <p className={styles.prompt}>
        🎯 Tap the {total} items you memorized as they ride by!
      </p>
      <div className={styles.beltWrap}>
        <ConveyorBelt
          belt={state.round.belt}
          found={state.found}
          lastWrong={state.lastWrong}
          wrongSeq={state.wrongSeq}
          onTap={handleTap}
        />
      </div>
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
