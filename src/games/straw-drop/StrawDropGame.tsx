import { useCallback, useEffect, useRef, useState } from 'react';
import { getMetaForPath } from '../../seo/meta';
import { usePageMeta } from '../../seo/usePageMeta';
import JsonLd from '../../seo/JsonLd';
import { gameSchema } from '../../seo/schema';
import { useStrawDrop } from './hooks/useStrawDrop';
import { recordResult } from './lib/storage';
import type { DifficultyConfig } from './lib/types';
import DifficultyPicker from './components/DifficultyPicker';
import PlayField from './components/PlayField';
import Hud from './components/Hud';
import CelebrationOverlay from './components/CelebrationOverlay';
import { ensureAudioReady, isMuted, playFound, playWrong, setMuted } from '../../shared/audio/sounds';
import styles from './StrawDropGame.module.css';

const META = getMetaForPath('/games/straw-drop');
const SCHEMA = gameSchema({
  name: 'BrainSprout Straw Drop',
  description: META.description,
  path: '/games/straw-drop',
});

export default function StrawDropGame() {
  usePageMeta(META);

  const { state, dispatch, start } = useStrawDrop();
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

  // Sound cue on each drop resolving (keyed on dropSeq so repeats retrigger).
  useEffect(() => {
    if (state.dropSeq === 0 || state.lastDrop === null) return;
    if (state.lastDrop === 'hit') playFound();
    else playWrong();
  }, [state.dropSeq, state.lastDrop]);

  const handlePick = useCallback(
    (difficulty: DifficultyConfig) => {
      ensureAudioReady();
      start(difficulty);
    },
    [start],
  );

  const handleHit = useCallback(() => {
    ensureAudioReady();
    dispatch({ type: 'HIT', now: Date.now() });
  }, [dispatch]);

  const handleMiss = useCallback(() => {
    dispatch({ type: 'MISS' });
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

  if (state.phase === 'picking' || !state.difficulty) {
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

  return (
    <div className={styles.page}>
      <Hud
        filled={state.filled}
        target={state.difficulty.target}
        elapsedMs={state.elapsedMs}
        timerEnabled={timerEnabled}
        muted={muted}
        onToggleMute={handleToggleMute}
        onBackToMenu={handleBackToMenu}
      />
      <PlayField
        // Remount for a fresh belt each round (positions live in refs).
        key={state.startTime}
        difficulty={state.difficulty}
        playing={state.phase === 'playing'}
        onHit={handleHit}
        onMiss={handleMiss}
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
