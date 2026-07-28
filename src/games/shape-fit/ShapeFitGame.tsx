import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getMetaForPath } from '../../seo/meta';
import { usePageMeta } from '../../seo/usePageMeta';
import JsonLd from '../../seo/JsonLd';
import { gameSchema } from '../../seo/schema';
import { useShapeFit, orientedCells } from './hooks/useShapeFit';
import { recordResult } from './lib/storage';
import { canPlace, placeAt } from './lib/shapes';
import type { DifficultyConfig } from './lib/types';
import DifficultyPicker from './components/DifficultyPicker';
import Hud from './components/Hud';
import Board from './components/Board';
import type { BoardPreview } from './components/Board';
import PieceTray from './components/PieceTray';
import PieceControls from './components/PieceControls';
import DeadEndBanner from './components/DeadEndBanner';
import CelebrationOverlay from './components/CelebrationOverlay';
import {
  ensureAudioReady,
  isMuted,
  playFound,
  playTick,
  playWrong,
  setMuted,
} from '../../shared/audio/sounds';
import styles from './ShapeFitGame.module.css';

const META = getMetaForPath('/games/shape-fit');
const SCHEMA = gameSchema({
  name: 'BrainSprout Shape Fit',
  description: META.description,
  path: '/games/shape-fit',
});

const TICK_INTERVAL_MS = 250;

interface DragState {
  pieceId: number;
  clientX: number;
  clientY: number;
}

export default function ShapeFitGame() {
  usePageMeta(META);

  const { state, dispatch, start } = useShapeFit();
  const [muted, setMutedState] = useState(() => isMuted());
  const [isNewBest, setIsNewBest] = useState(false);
  const [drag, setDrag] = useState<DragState | null>(null);

  const boardRef = useRef<HTMLDivElement>(null);
  const recordedRef = useRef(false);

  // Elapsed-time ticking, word-search/cat-nap style: a 250ms interval that
  // dispatches TICK while the puzzle is actively being played.
  useEffect(() => {
    if (state.phase !== 'playing') return;
    const interval = setInterval(() => {
      dispatch({ type: 'TICK', now: Date.now() });
    }, TICK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [state.phase, dispatch]);

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

  const handlePick = useCallback(
    (difficulty: DifficultyConfig) => {
      ensureAudioReady();
      start(difficulty);
    },
    [start],
  );

  const handleBackToMenu = useCallback(() => {
    setDrag(null);
    dispatch({ type: 'RESET' });
  }, [dispatch]);

  const handleRestart = useCallback(() => {
    playTick(0);
    setDrag(null);
    dispatch({ type: 'RESTART' });
  }, [dispatch]);

  const handleNewShape = useCallback(() => {
    if (state.difficulty) {
      start(state.difficulty);
    }
  }, [start, state.difficulty]);

  const handleHint = useCallback(() => {
    playTick(0);
    dispatch({ type: 'HINT' });
  }, [dispatch]);

  const handleToggleMute = useCallback(() => {
    setMuted(!muted);
    setMutedState(!muted);
  }, [muted]);

  const handleSelect = useCallback(
    (pieceId: number) => {
      dispatch({ type: 'SELECT', id: pieceId });
    },
    [dispatch],
  );

  const handleRotate = useCallback(() => {
    playTick(0);
    dispatch({ type: 'ROTATE' });
  }, [dispatch]);

  const handleFlip = useCallback(() => {
    playTick(0);
    dispatch({ type: 'FLIP' });
  }, [dispatch]);

  const handlePickup = useCallback(
    (pieceId: number) => {
      playTick(0);
      dispatch({ type: 'PICKUP', id: pieceId });
    },
    [dispatch],
  );

  // Converts a drag's live pointer position into a snapped board cell
  // (the piece's bounding-box top-left), clamped to stay in-grid.
  const cellForDrag = useCallback(
    (clientX: number, clientY: number): { r: number; c: number } | null => {
      const rect = boardRef.current?.getBoundingClientRect();
      if (!rect || !state.puzzle) return null;
      const { rows, cols } = state.puzzle;
      const cellW = rect.width / cols;
      const cellH = rect.height / rows;
      const r = Math.min(Math.max(Math.floor((clientY - rect.top) / cellH), 0), rows - 1);
      const c = Math.min(Math.max(Math.floor((clientX - rect.left) / cellW), 0), cols - 1);
      return { r, c };
    },
    [state.puzzle],
  );

  const preview: BoardPreview | null = useMemo(() => {
    if (!drag || !state.puzzle) return null;
    const trayPiece = state.tray.find((tp) => tp.piece.id === drag.pieceId);
    if (!trayPiece) return null;
    const cell = cellForDrag(drag.clientX, drag.clientY);
    if (!cell) return null;
    const oriented = orientedCells(trayPiece);
    const absCells = placeAt(oriented, cell.r, cell.c);
    const occupiedSet = new Set(Object.keys(state.occupied));
    const valid = canPlace(state.puzzle.region, occupiedSet, absCells);
    return { cells: absCells, valid };
  }, [drag, state.puzzle, state.tray, state.occupied, cellForDrag]);

  const handleDragStart = useCallback((pieceId: number, clientX: number, clientY: number) => {
    setDrag({ pieceId, clientX, clientY });
  }, []);

  const handleDragMove = useCallback((pieceId: number, clientX: number, clientY: number) => {
    setDrag({ pieceId, clientX, clientY });
  }, []);

  const handleDragEnd = useCallback(
    (pieceId: number, clientX: number, clientY: number) => {
      const trayPiece = state.tray.find((tp) => tp.piece.id === pieceId);
      const cell = cellForDrag(clientX, clientY);
      if (trayPiece && cell && state.puzzle) {
        const oriented = orientedCells(trayPiece);
        const absCells = placeAt(oriented, cell.r, cell.c);
        const occupiedSet = new Set(Object.keys(state.occupied));
        const wouldFit = canPlace(state.puzzle.region, occupiedSet, absCells);
        if (wouldFit) {
          playFound();
        } else {
          playWrong();
        }
        dispatch({ type: 'PLACE', id: pieceId, at: cell });
      }
      setDrag(null);
    },
    [state.tray, state.puzzle, state.occupied, cellForDrag, dispatch],
  );

  if (state.phase === 'picking' || !state.difficulty || !state.puzzle) {
    return (
      <>
        <JsonLd data={SCHEMA} />
        <DifficultyPicker onPick={handlePick} />
      </>
    );
  }

  const placed = state.tray.filter((tp) => tp.placedAt !== null).length;
  const total = state.puzzle.pieces.length;

  return (
    <div className={styles.page}>
      <Hud
        placed={placed}
        total={total}
        hintDisabled={state.phase !== 'playing'}
        muted={muted}
        onHint={handleHint}
        onRestart={handleRestart}
        onToggleMute={handleToggleMute}
        onBackToMenu={handleBackToMenu}
      />
      <div className={styles.playArea}>
        {state.deadEnd && <DeadEndBanner onRestart={handleRestart} />}
        <Board
          ref={boardRef}
          puzzle={state.puzzle}
          occupied={state.occupied}
          hint={state.hint}
          preview={preview}
          disabled={state.phase !== 'playing'}
          onPickup={handlePickup}
        />
        <PieceControls
          disabled={state.selectedId === null || state.phase !== 'playing'}
          onRotate={handleRotate}
          onFlip={handleFlip}
        />
        <PieceTray
          tray={state.tray}
          orientedCells={orientedCells}
          selectedId={state.selectedId}
          draggingId={drag?.pieceId ?? null}
          disabled={state.phase !== 'playing'}
          onSelect={handleSelect}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
        />
      </div>
      {state.phase === 'won' && state.result && (
        <CelebrationOverlay
          result={state.result}
          isNewBest={isNewBest}
          onNewShape={handleNewShape}
          onHome={handleBackToMenu}
        />
      )}
    </div>
  );
}
