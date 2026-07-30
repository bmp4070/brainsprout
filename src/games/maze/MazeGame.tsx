import { useCallback, useEffect, useRef, useState } from 'react';
import { getMetaForPath } from '../../seo/meta';
import { usePageMeta } from '../../seo/usePageMeta';
import JsonLd from '../../seo/JsonLd';
import { gameSchema } from '../../seo/schema';
import { useMaze } from './hooks/useMaze';
import { canMove } from './lib/maze';
import { recordResult } from './lib/storage';
import { getNextTheme, advanceTheme } from './lib/rotation';
import type { MazeTheme } from './lib/themes';
import type { DifficultyConfig, Direction } from './lib/types';
import DifficultyPicker from './components/DifficultyPicker';
import Hud from './components/Hud';
import MazeBoard from './components/MazeBoard';
import ArrowPad from './components/ArrowPad';
import CelebrationOverlay from './components/CelebrationOverlay';
import { ensureAudioReady, isMuted, playTick, playWrong, setMuted } from '../../shared/audio/sounds';
import styles from './MazeGame.module.css';

const META = getMetaForPath('/games/maze');
const SCHEMA = gameSchema({
  name: 'BrainSprout Maze',
  description: META.description,
  path: '/games/maze',
});

/** Keyboard mapping: arrow keys and WASD both drive movement. */
const KEY_DIR: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  W: 'up',
  a: 'left',
  A: 'left',
  s: 'down',
  S: 'down',
  d: 'right',
  D: 'right',
};

export default function MazeGame() {
  usePageMeta(META);

  // `upNextTheme` is what the difficulty picker offers for the maze that's
  // about to start; `activeTheme` is whichever character/goal pair the maze
  // currently on screen (or just completed) was actually started with.
  // Mirrors jigsaw's up-next/active scene split.
  const [upNextTheme, setUpNextTheme] = useState<MazeTheme>(() => getNextTheme());
  const [activeTheme, setActiveTheme] = useState<MazeTheme>(upNextTheme);
  const { state, dispatch, start } = useMaze();
  const [muted, setMutedState] = useState(() => isMuted());
  const [isNewBest, setIsNewBest] = useState(false);

  const recordedRef = useRef(false);

  // Record the result exactly once per completed maze.
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

  /** Starts a maze with the theme currently shown as "up next", then rotates. */
  const startWithRotation = useCallback(
    (difficulty: DifficultyConfig, seed?: number) => {
      const themeToPlay = upNextTheme;
      const following = advanceTheme();
      setActiveTheme(themeToPlay);
      setUpNextTheme(following);
      start(difficulty, seed);
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

  const handleNewMaze = useCallback(() => {
    if (state.difficulty) {
      startWithRotation(state.difficulty);
    }
  }, [startWithRotation, state.difficulty]);

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

  // Sound cues need to know whether a move will actually succeed, so check
  // canMove BEFORE dispatching (the reducer itself just silently no-ops a
  // blocked move, giving no signal back to play a "wrong" cue from).
  const handleMove = useCallback(
    (dir: Direction) => {
      if (state.phase !== 'playing' || !state.maze) return;
      if (canMove(state.maze, state.pos, dir)) {
        playTick(state.moves);
      } else {
        playWrong();
      }
      dispatch({ type: 'MOVE', dir });
    },
    [state.phase, state.maze, state.pos, state.moves, dispatch],
  );

  // Keyboard controls, active only while a maze is being played.
  useEffect(() => {
    if (state.phase !== 'playing') return;
    function handleKeyDown(e: KeyboardEvent) {
      const dir = KEY_DIR[e.key];
      if (!dir) return;
      e.preventDefault();
      handleMove(dir);
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.phase, handleMove]);

  if (state.phase === 'picking' || !state.difficulty || !state.maze) {
    return (
      <>
        <JsonLd data={SCHEMA} />
        <DifficultyPicker upNextTheme={upNextTheme} onPick={handlePick} />
      </>
    );
  }

  return (
    <div className={styles.page}>
      <Hud
        moves={state.moves}
        elapsedMs={state.elapsedMs}
        hintDisabled={state.phase !== 'playing'}
        muted={muted}
        onHint={handleHint}
        onToggleMute={handleToggleMute}
        onBackToMenu={handleBackToMenu}
      />
      <MazeBoard
        maze={state.maze}
        pos={state.pos}
        visited={state.visited}
        hint={state.hint}
        character={activeTheme.character}
        goal={activeTheme.goal}
        onMove={handleMove}
      />
      <ArrowPad onMove={handleMove} disabled={state.phase !== 'playing'} />
      <p className={styles.rulesReminder}>
        🧭 Reach the {activeTheme.goal} · 💡 Hint shows the way!
      </p>
      {state.phase === 'won' && state.result && (
        <CelebrationOverlay
          result={state.result}
          isNewBest={isNewBest}
          moves={state.moves}
          onNewMaze={handleNewMaze}
          onHome={handleBackToMenu}
        />
      )}
    </div>
  );
}
