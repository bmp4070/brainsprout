import { useCallback, useEffect, useRef, useState } from 'react';
import { getMetaForPath } from '../../seo/meta';
import { usePageMeta } from '../../seo/usePageMeta';
import JsonLd from '../../seo/JsonLd';
import { gameSchema } from '../../seo/schema';
import { useJigsaw } from './hooks/useJigsaw';
import { recordResult } from './lib/storage';
import type { DifficultyConfig } from './lib/types';
import { pieceCount } from './lib/types';
import { getNextScene, advanceScene } from './scenes/rotation';
import { sceneToDataUri } from './scenes';
import type { JigsawScene } from './scenes';
import DifficultyPicker from './components/DifficultyPicker';
import Hud from './components/Hud';
import PlayArea from './components/PlayArea';
import CelebrationOverlay from './components/CelebrationOverlay';
import { ensureAudioReady, isMuted, setMuted } from '../../shared/audio/sounds';
import styles from './JigsawGame.module.css';

const HINT_DURATION_MS = 3000;
const INTRO_FLASH_MS = 1000;

const META = getMetaForPath('/games/jigsaw');
const SCHEMA = gameSchema({
  name: 'BrainSprout Jigsaw Puzzle',
  description: META.description,
  path: '/games/jigsaw',
});

export default function JigsawGame() {
  usePageMeta(META);

  // `upNextScene` is what the difficulty picker offers for the puzzle that's
  // about to start; `activeScene` is whatever scene the puzzle currently on
  // screen (or just completed) was actually built from.
  const [upNextScene, setUpNextScene] = useState<JigsawScene>(() => getNextScene());
  const [activeScene, setActiveScene] = useState<JigsawScene>(upNextScene);
  const { state, dispatch, start } = useJigsaw();
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [muted, setMutedState] = useState(() => isMuted());
  const [isNewBest, setIsNewBest] = useState(false);
  const [hintActive, setHintActive] = useState(false);
  // On medium/hard, the picture flashes briefly when the puzzle starts.
  const [introActive, setIntroActive] = useState(false);

  const recordedRef = useRef(false);

  // A hint flashes the ghost picture briefly on medium/hard.
  useEffect(() => {
    if (!hintActive) return;
    const timeout = setTimeout(() => setHintActive(false), HINT_DURATION_MS);
    return () => clearTimeout(timeout);
  }, [hintActive]);

  useEffect(() => {
    if (!introActive) return;
    const timeout = setTimeout(() => setIntroActive(false), INTRO_FLASH_MS);
    return () => clearTimeout(timeout);
  }, [introActive]);

  useEffect(() => {
    if (state.phase === 'won' && state.difficulty && !recordedRef.current) {
      recordedRef.current = true;
      const { isNewBest: newBest } = recordResult(
        activeScene.id,
        state.difficulty.id,
        state.elapsedMs,
      );
      setIsNewBest(newBest);
    }
    if (state.phase !== 'won') {
      recordedRef.current = false;
    }
  }, [state.phase, state.difficulty, state.elapsedMs, activeScene]);

  const startWithRotation = useCallback(
    (difficulty: DifficultyConfig) => {
      const sceneToPlay = upNextScene;
      const following = advanceScene();
      setActiveScene(sceneToPlay);
      setUpNextScene(following);
      setHintActive(false);
      setIntroActive(difficulty.id !== 'easy');
      start(difficulty, sceneToPlay);
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

  const handlePickUp = useCallback(
    (row: number, col: number) => {
      dispatch({ type: 'PICK_UP', row, col });
    },
    [dispatch],
  );

  const handleMove = useCallback(
    (row: number, col: number, xFrac: number, yFrac: number) => {
      dispatch({ type: 'MOVE', row, col, xFrac, yFrac });
    },
    [dispatch],
  );

  const handleDrop = useCallback(
    (row: number, col: number, xFrac: number, yFrac: number, snapped: boolean) => {
      dispatch({ type: 'DROP', row, col, xFrac, yFrac, snapped });
    },
    [dispatch],
  );

  if (state.phase === 'picking' || !state.difficulty || !state.layout || !state.positions) {
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

  const total = pieceCount(state.difficulty!);
  const backgroundUri = sceneToDataUri(activeScene);
  const isEasy = state.difficulty!.id === 'easy';

  return (
    <div className={styles.page}>
      <Hud
        sceneTitle={activeScene.title}
        sceneEmoji={activeScene.emoji}
        lockedCount={state.lockedCount}
        totalCount={total}
        elapsedMs={state.elapsedMs}
        timerEnabled={timerEnabled}
        muted={muted}
        onHint={isEasy ? undefined : () => setHintActive(true)}
        hintActive={hintActive}
        onToggleMute={handleToggleMute}
        onBackToMenu={handleBackToMenu}
      />
      {!isEasy && (
        <p className={styles.hintNote}>
          Tap the 💡 bulb if you want to see the picture again!
        </p>
      )}
      <PlayArea
        layout={state.layout!}
        difficulty={state.difficulty!}
        positions={state.positions!}
        dragging={state.dragging}
        backgroundUri={backgroundUri}
        showGhost={isEasy || hintActive || introActive}
        onPickUp={handlePickUp}
        onMove={handleMove}
        onDrop={handleDrop}
      />
      {state.phase === 'won' && (
        <CelebrationOverlay
          elapsedMs={state.elapsedMs}
          isNewBest={isNewBest}
          showTime={timerEnabled}
          onPlayAgain={handlePlayAgain}
          onHome={handleBackToMenu}
        />
      )}
    </div>
  );
}
