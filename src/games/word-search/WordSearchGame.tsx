import { useCallback, useEffect, useRef, useState } from 'react';
import { getMetaForPath } from '../../seo/meta';
import { usePageMeta } from '../../seo/usePageMeta';
import JsonLd from '../../seo/JsonLd';
import { gameSchema } from '../../seo/schema';
import { useWordSearch } from './hooks/useWordSearch';
import { matchSelection, snapLine } from './lib/selection';
import { recordResult } from './lib/storage';
import type { CellPos, DifficultyConfig } from './lib/types';
import type { WordTheme } from './lib/types';
import { getNextTheme, advanceTheme } from './themes/rotation';
import DifficultyPicker from './components/DifficultyPicker';
import Hud from './components/Hud';
import Grid from './components/Grid';
import WordList from './components/WordList';
import TriviaCard from './components/TriviaCard';
import CelebrationOverlay from './components/CelebrationOverlay';
import {
  ensureAudioReady,
  isMuted,
  playFound,
  playTick,
  playWrong,
  setMuted,
} from '../../shared/audio/sounds';
import styles from './WordSearchGame.module.css';

const HINT_DURATION_MS = 1500;

const META = getMetaForPath('/games/word-search');
const SCHEMA = gameSchema({
  name: 'BrainSprout Word Search',
  description: META.description,
  path: '/games/word-search',
});

export default function WordSearchGame() {
  usePageMeta(META);

  // `upNextTheme` is what the difficulty picker offers for the game that's
  // about to start; `activeTheme` is whatever theme the puzzle currently on
  // screen (or just completed) was actually generated from. They diverge as
  // soon as a game starts, since starting advances the rotation for next time.
  const [upNextTheme, setUpNextTheme] = useState<WordTheme>(() => getNextTheme());
  const [activeTheme, setActiveTheme] = useState<WordTheme>(upNextTheme);
  const { state, dispatch, start } = useWordSearch(activeTheme);
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [muted, setMutedState] = useState(() => isMuted());
  const [isNewBest, setIsNewBest] = useState(false);

  const tickStepRef = useRef(0);
  const recordedRef = useRef(false);

  // Hint auto-clears a couple seconds after being requested.
  useEffect(() => {
    if (!state.hintCell) return;
    const timeout = setTimeout(() => {
      dispatch({ type: 'CLEAR_HINT' });
    }, HINT_DURATION_MS);
    return () => clearTimeout(timeout);
  }, [state.hintCell, dispatch]);

  // Record the result exactly once per completed puzzle.
  useEffect(() => {
    if (state.phase === 'won' && state.difficulty && !recordedRef.current) {
      recordedRef.current = true;
      const { isNewBest: newBest } = recordResult(
        activeTheme.id,
        state.difficulty.id,
        state.elapsedMs,
      );
      setIsNewBest(newBest);
    }
    if (state.phase !== 'won') {
      recordedRef.current = false;
    }
  }, [state.phase, state.difficulty, state.elapsedMs, activeTheme]);

  /** Starts a game with the theme currently shown as "up next", then rotates. */
  const startWithRotation = useCallback(
    (difficulty: DifficultyConfig) => {
      const themeToPlay = upNextTheme;
      const following = advanceTheme();
      setActiveTheme(themeToPlay);
      setUpNextTheme(following);
      start(difficulty, undefined, themeToPlay);
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

  const handleSkipTheme = useCallback(() => {
    setUpNextTheme(advanceTheme());
  }, []);

  const handleSelectStart = useCallback(
    (cell: CellPos) => {
      ensureAudioReady();
      tickStepRef.current = 1;
      dispatch({ type: 'SELECT_START', cell });
    },
    [dispatch],
  );

  const handleSelectMove = useCallback(
    (cell: CellPos) => {
      if (state.selection && state.puzzle) {
        const cells = snapLine(state.selection.anchor, cell, state.puzzle.size);
        if (cells.length !== tickStepRef.current) {
          tickStepRef.current = cells.length;
          playTick(cells.length);
        }
      }
      dispatch({ type: 'SELECT_MOVE', cell });
    },
    [state.selection, state.puzzle, dispatch],
  );

  const handleSelectEnd = useCallback(() => {
    if (state.selection && state.puzzle) {
      const cells = snapLine(state.selection.anchor, state.selection.current, state.puzzle.size);
      const foundWordsSet = new Set(state.found.map((f) => f.word));
      const match = matchSelection(cells, state.puzzle.placements, foundWordsSet);
      if (match) {
        playFound();
      } else if (cells.length > 1) {
        playWrong();
      }
    }
    dispatch({ type: 'SELECT_END' });
  }, [state.selection, state.puzzle, state.found, dispatch]);

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
      startWithRotation(state.difficulty);
    }
  }, [startWithRotation, state.difficulty]);

  if (state.phase === 'picking' || !state.puzzle || !state.difficulty) {
    return (
      <>
        <JsonLd data={SCHEMA} />
        <DifficultyPicker
          themeTitle={upNextTheme.title}
          themeEmoji={upNextTheme.emoji}
          timerEnabled={timerEnabled}
          onToggleTimer={() => setTimerEnabled((v) => !v)}
          onPick={handlePick}
          onSkipTheme={handleSkipTheme}
        />
      </>
    );
  }

  return (
    <div className={styles.page}>
      <Hud
        themeTitle={activeTheme.title}
        themeEmoji={activeTheme.emoji}
        foundCount={state.found.length}
        totalCount={state.puzzle.placements.length}
        elapsedMs={state.elapsedMs}
        timerEnabled={timerEnabled}
        muted={muted}
        onHint={handleHint}
        onToggleMute={handleToggleMute}
        onBackToMenu={handleBackToMenu}
      />
      <div className={styles.playArea}>
        <div className={styles.gridColumn}>
          <Grid
            puzzle={state.puzzle}
            selection={state.selection}
            found={state.found}
            hintCell={state.hintCell}
            enabled={state.phase === 'playing'}
            onSelectStart={handleSelectStart}
            onSelectMove={handleSelectMove}
            onSelectEnd={handleSelectEnd}
          />
        </div>
        <div className={styles.triviaColumn}>
          <TriviaCard
            key={state.found.at(-1)?.word ?? 'none'}
            theme={activeTheme}
            latestFound={state.found.at(-1) ?? null}
          />
        </div>
        <div className={styles.wordListColumn}>
          <WordList placements={state.puzzle.placements} found={state.found} />
        </div>
      </div>
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
