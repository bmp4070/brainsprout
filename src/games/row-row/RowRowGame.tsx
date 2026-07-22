import { useCallback, useEffect, useRef, useState } from 'react';
import { getMetaForPath } from '../../seo/meta';
import { usePageMeta } from '../../seo/usePageMeta';
import JsonLd from '../../seo/JsonLd';
import { gameSchema } from '../../seo/schema';
import { useRowRow, segmentIndexAt } from './hooks/useRowRow';
import { recordResult } from './lib/storage';
import type { DifficultyConfig } from './lib/types';
import { getNextScene, advanceScene } from './scenes/rotation';
import { sceneToDataUri } from './scenes';
import type { RowRowScene } from './scenes';
import DifficultyPicker from './components/DifficultyPicker';
import Hud from './components/Hud';
import BoatScene from './components/BoatScene';
import RowControl from './components/RowControl';
import CelebrationOverlay from './components/CelebrationOverlay';
import {
  ensureAudioReady,
  isMuted,
  playDrum,
  playSlip,
  setMuted,
} from '../../shared/audio/sounds';
import styles from './RowRowGame.module.css';

const META = getMetaForPath('/games/row-row');
const SCHEMA = gameSchema({
  name: 'BrainSprout Row Row',
  description: META.description,
  path: '/games/row-row',
});

export default function RowRowGame() {
  usePageMeta(META);

  // `upNextScene` is what the difficulty picker offers for the crossing
  // that's about to start; `activeScene` is whatever scene the crossing
  // currently on screen (or just completed) was actually built from.
  const [upNextScene, setUpNextScene] = useState<RowRowScene>(() => getNextScene());
  const [activeScene, setActiveScene] = useState<RowRowScene>(upNextScene);
  const { state, dispatch, start } = useRowRow();
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [muted, setMutedState] = useState(() => isMuted());
  const [isNewBest, setIsNewBest] = useState(false);

  const recordedRef = useRef(false);
  const lastTsRef = useRef<number | null>(null);
  const lastSegmentIndexRef = useRef(-1);
  const wasMistakeRef = useRef(false);

  // requestAnimationFrame loop: advances real elapsed time into TICK while
  // playing. Uses a ref for the last timestamp so this effect never needs
  // elapsedMs in its deps (which would tear the loop down every frame).
  useEffect(() => {
    if (state.phase !== 'playing') {
      lastTsRef.current = null;
      return;
    }
    let rafId: number;
    // Cap the per-tick delta so a backgrounded tab (rAF pauses, but wall
    // clock keeps moving) can't feed one giant TICK that teleports the boat
    // or auto-wins the crossing on resume.
    const MAX_DELTA_MS = 100;
    const step = (ts: number) => {
      if (lastTsRef.current === null) {
        lastTsRef.current = ts;
      }
      const deltaMs = Math.min(ts - lastTsRef.current, MAX_DELTA_MS);
      lastTsRef.current = ts;
      dispatch({ type: 'TICK', deltaMs });
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [state.phase, dispatch]);

  // Drum on every new row beat, "womp" on entering a timing mistake -- each
  // guarded by a ref so it fires once per transition, not once per frame.
  useEffect(() => {
    if (state.phase !== 'playing' || !state.pattern) return;
    const idx = segmentIndexAt(state.pattern, state.patternLoopMs, state.elapsedMs);
    const segment = state.pattern[idx];
    if (idx !== lastSegmentIndexRef.current) {
      lastSegmentIndexRef.current = idx;
      if (segment.type === 'row') {
        playDrum();
      }
    }
    const mistake = state.rowing && segment.type === 'rest';
    if (mistake && !wasMistakeRef.current) {
      playSlip();
    }
    wasMistakeRef.current = mistake;
  }, [state.phase, state.pattern, state.patternLoopMs, state.elapsedMs, state.rowing]);

  useEffect(() => {
    if (state.phase === 'won' && state.difficulty && !recordedRef.current) {
      recordedRef.current = true;
      const { isNewBest: newBest } = recordResult(activeScene.id, state.difficulty.id, state.score);
      setIsNewBest(newBest);
    }
    if (state.phase !== 'won') {
      recordedRef.current = false;
    }
  }, [state.phase, state.difficulty, state.score, activeScene]);

  const startWithRotation = useCallback(
    (difficulty: DifficultyConfig) => {
      const sceneToPlay = upNextScene;
      const following = advanceScene();
      setActiveScene(sceneToPlay);
      setUpNextScene(following);
      lastSegmentIndexRef.current = -1;
      wasMistakeRef.current = false;
      start(difficulty);
    },
    [start, upNextScene],
  );

  const handlePick = useCallback(
    (difficulty: DifficultyConfig) => {
      ensureAudioReady();
      startWithRotation(difficulty);
    },
    [startWithRotation],
  );

  const handleSkipScene = useCallback(() => {
    setUpNextScene(advanceScene());
  }, []);

  const handleToggleMute = useCallback(() => {
    setMuted(!muted);
    setMutedState(!muted);
  }, [muted]);

  const handleBackToMenu = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, [dispatch]);

  const handlePlayAgain = useCallback(() => {
    if (state.difficulty) {
      startWithRotation(state.difficulty);
    }
  }, [startWithRotation, state.difficulty]);

  const handleRowStart = useCallback(() => {
    ensureAudioReady();
    dispatch({ type: 'ROW_START' });
  }, [dispatch]);

  const handleRowEnd = useCallback(() => {
    dispatch({ type: 'ROW_END' });
  }, [dispatch]);

  // Desktop keyboard binding: hold Space to row.
  useEffect(() => {
    if (state.phase !== 'playing') return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || event.repeat) return;
      event.preventDefault();
      handleRowStart();
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code !== 'Space') return;
      event.preventDefault();
      handleRowEnd();
    };
    // Alt-tab / app switch while Space (or a touch) is held never delivers a
    // keyup/pointerup, so rowing would otherwise stay stuck true.
    const handleReleaseOnHide = () => handleRowEnd();
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleReleaseOnHide);
    document.addEventListener('visibilitychange', handleReleaseOnHide);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleReleaseOnHide);
      document.removeEventListener('visibilitychange', handleReleaseOnHide);
    };
  }, [state.phase, handleRowStart, handleRowEnd]);

  if (state.phase === 'picking' || !state.difficulty || !state.pattern) {
    return (
      <>
        <JsonLd data={SCHEMA} />
        <DifficultyPicker
          scene={upNextScene}
          timerEnabled={timerEnabled}
          onToggleTimer={() => setTimerEnabled((v) => !v)}
          onPick={handlePick}
          onSkipScene={handleSkipScene}
        />
      </>
    );
  }

  const backgroundUri = sceneToDataUri(activeScene);
  const currentSegment = state.pattern[
    segmentIndexAt(state.pattern, state.patternLoopMs, state.elapsedMs)
  ];
  const mistake = state.rowing && currentSegment.type === 'rest';

  return (
    <div className={styles.page}>
      <Hud
        sceneTitle={activeScene.title}
        sceneEmoji={activeScene.emoji}
        elapsedMs={state.elapsedMs}
        timerEnabled={timerEnabled}
        muted={muted}
        onToggleMute={handleToggleMute}
        onBackToMenu={handleBackToMenu}
      />
      <BoatScene
        backgroundUri={backgroundUri}
        positionFraction={state.position / state.difficulty.totalDistance}
        rowing={state.rowing}
        segmentType={currentSegment.type}
        mistake={mistake}
      />
      <RowControl rowing={state.rowing} onRowStart={handleRowStart} onRowEnd={handleRowEnd} />
      {state.phase === 'won' && (
        <CelebrationOverlay
          elapsedMs={state.elapsedMs}
          score={state.score}
          isNewBest={isNewBest}
          showTime={timerEnabled}
          onPlayAgain={handlePlayAgain}
          onHome={handleBackToMenu}
        />
      )}
    </div>
  );
}
