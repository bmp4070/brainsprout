import { useCallback, useEffect, useRef, useState } from 'react';
import { getMetaForPath } from '../../seo/meta';
import { usePageMeta } from '../../seo/usePageMeta';
import JsonLd from '../../seo/JsonLd';
import { gameSchema } from '../../seo/schema';
import { useSpotDifference } from './hooks/useSpotDifference';
import { recordResult } from './lib/storage';
import { differenceAt } from './lib/hittest';
import { getTheme } from './lib/themes';
import type { Theme } from './lib/themes';
import { advanceTheme, getNextTheme } from './lib/rotation';
import type { DifficultyConfig } from './lib/types';
import DifficultyPicker from './components/DifficultyPicker';
import Hud from './components/Hud';
import SpotBoard from './components/SpotBoard';
import CelebrationOverlay from './components/CelebrationOverlay';
import {
  ensureAudioReady,
  isMuted,
  playFanfare,
  playFound,
  playWrong,
  setMuted,
} from '../../shared/audio/sounds';
import styles from './SpotDifferenceGame.module.css';

const META = getMetaForPath('/games/spot-difference');
const SCHEMA = gameSchema({
  name: 'BrainSprout Spot the Difference',
  description: META.description,
  path: '/games/spot-difference',
});

export default function SpotDifferenceGame() {
  usePageMeta(META);

  // `upNextTheme` is what the difficulty picker offers for the puzzle that's
  // about to start (mirrors jigsaw's scene rotation split). Once a puzzle
  // exists, its own `themeId` is the source of truth for which theme is on
  // screen, so there's no separate "active theme" state to keep in sync.
  const [upNextTheme, setUpNextTheme] = useState<Theme>(() => getNextTheme());
  const { state, dispatch, start } = useSpotDifference();
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [muted, setMutedState] = useState(() => isMuted());
  const [isNewBest, setIsNewBest] = useState(false);

  const recordedRef = useRef(false);

  // useSpotDifference ticks elapsedMs internally (its own 250ms setInterval,
  // same as useCatNap/useJigsaw), so there's nothing to drive from here.

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

  const startWithRotation = useCallback(
    (difficulty: DifficultyConfig) => {
      const themeToPlay = upNextTheme;
      const following = advanceTheme();
      setUpNextTheme(following);
      start(difficulty, undefined, themeToPlay.id);
    },
    [start, upNextTheme],
  );

  const handlePick = useCallback(
    (difficulty: DifficultyConfig) => {
      ensureAudioReady();
      startWithRotation(difficulty);
    },
    [startWithRotation],
  );

  const handleTapScene = useCallback(
    (x: number, y: number) => {
      ensureAudioReady();
      if (state.phase === 'playing' && state.puzzle) {
        const foundSet = new Set(state.found);
        const hit = differenceAt(state.puzzle.differences, foundSet, x, y);
        if (hit) {
          const isLastOne = state.found.length + 1 === state.puzzle.differences.length;
          // A little extra flourish on the very last find, ahead of whatever
          // the celebration overlay plays a beat later.
          if (isLastOne) {
            playFanfare();
          } else {
            playFound();
          }
        } else {
          playWrong();
        }
      }
      dispatch({ type: 'TAP', x, y });
    },
    [state.phase, state.puzzle, state.found, dispatch],
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

  const handleNewPicture = useCallback(() => {
    if (state.difficulty) {
      startWithRotation(state.difficulty);
    }
  }, [startWithRotation, state.difficulty]);

  if (state.phase === 'picking' || !state.difficulty || !state.puzzle) {
    return (
      <>
        <JsonLd data={SCHEMA} />
        <DifficultyPicker
          upNextTheme={upNextTheme}
          timerEnabled={timerEnabled}
          onToggleTimer={() => setTimerEnabled((v) => !v)}
          onPick={handlePick}
        />
      </>
    );
  }

  const theme = getTheme(state.puzzle.themeId);
  const total = state.puzzle.differences.length;

  return (
    <div className={styles.page}>
      <Hud
        found={state.found.length}
        total={total}
        elapsedMs={state.elapsedMs}
        timerEnabled={timerEnabled}
        hintDisabled={state.phase !== 'playing'}
        muted={muted}
        onHint={handleHint}
        onToggleMute={handleToggleMute}
        onBackToMenu={handleBackToMenu}
      />
      <SpotBoard
        puzzle={state.puzzle}
        palette={theme.palette}
        skyColor={theme.skyColor}
        groundColor={theme.groundColor}
        found={state.found}
        hint={state.hint}
        lastMiss={state.lastMiss}
        missSeq={state.wrongTaps}
        onTapScene={handleTapScene}
      />
      <p className={styles.rulesReminder}>
        👀 Find what&rsquo;s different between the two pictures · ✨ Find them all!
      </p>
      {state.phase === 'won' && state.result && (
        <CelebrationOverlay
          result={state.result}
          isNewBest={isNewBest}
          onNewPicture={handleNewPicture}
          onHome={handleBackToMenu}
        />
      )}
    </div>
  );
}
