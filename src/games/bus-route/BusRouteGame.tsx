import { useCallback, useEffect, useRef, useState } from 'react';
import { getMetaForPath } from '../../seo/meta';
import { usePageMeta } from '../../seo/usePageMeta';
import JsonLd from '../../seo/JsonLd';
import { gameSchema } from '../../seo/schema';
import { useBusRoute } from './hooks/useBusRoute';
import { routeLength } from './lib/geometry';
import { recordResult } from './lib/storage';
import type { DifficultyConfig } from './lib/types';
import DifficultyPicker from './components/DifficultyPicker';
import Hud from './components/Hud';
import FuelGauge from './components/FuelGauge';
import TownMap from './components/TownMap';
import CelebrationOverlay from './components/CelebrationOverlay';
import BigButton from '../../shared/components/BigButton';
import { ensureAudioReady, isMuted, playFound, playTick, playWrong, setMuted } from '../../shared/audio/sounds';
import styles from './BusRouteGame.module.css';

const META = getMetaForPath('/games/bus-route');
const SCHEMA = gameSchema({
  name: 'BrainSprout School Bus Route',
  description: META.description,
  path: '/games/bus-route',
});

// The fuel budget is deliberately generous -- a comfortably sloppy route
// still finishes with fuel to spare -- so the gauge reads as encouragement
// rather than a hard fail condition. 1.6x the true optimal length leaves
// plenty of room even for a fairly roundabout plan.
const FUEL_BUDGET_FACTOR = 1.6;

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export default function BusRouteGame() {
  usePageMeta(META);

  const { state, dispatch, start } = useBusRoute();
  const [muted, setMutedState] = useState(() => isMuted());
  const [isNewBest, setIsNewBest] = useState(false);
  const [showOptimal, setShowOptimal] = useState(false);

  const recordedRef = useRef(false);

  // Record the result exactly once per completed route.
  useEffect(() => {
    if (state.phase === 'done' && state.difficulty && state.result && !recordedRef.current) {
      recordedRef.current = true;
      const { isNewBest: newBest } = recordResult(state.difficulty.id, state.result.score);
      setIsNewBest(newBest);
    }
    if (state.phase !== 'done') {
      recordedRef.current = false;
    }
  }, [state.phase, state.difficulty, state.result]);

  // The "show shortest route" toggle only makes sense on the results screen;
  // reset it whenever a new attempt starts.
  useEffect(() => {
    if (state.phase !== 'done') setShowOptimal(false);
  }, [state.phase]);

  const handlePick = useCallback(
    (difficulty: DifficultyConfig) => {
      ensureAudioReady();
      start(difficulty);
    },
    [start],
  );

  // Sound cueing: the reducer's TAP_STOP has three deterministic outcomes
  // given the *current* order -- tapping the last-tapped stop undoes it,
  // tapping a stop already earlier in the route is a no-op, and tapping any
  // other stop appends it. Since the outcome only depends on state we already
  // have in this render, we can pick the sound synchronously here rather than
  // diffing state before/after an effect fires (which wouldn't even run for
  // the no-op case, since the reducer returns the same state reference).
  const handleTapStop = useCallback(
    (id: number) => {
      ensureAudioReady();
      const { order } = state;
      const isLast = order.length > 0 && order[order.length - 1] === id;
      const isMiddle = !isLast && order.includes(id);
      if (isMiddle) {
        playWrong();
      } else {
        playTick(order.length);
      }
      dispatch({ type: 'TAP_STOP', id });
    },
    [state, dispatch],
  );

  const handleClear = useCallback(() => {
    dispatch({ type: 'CLEAR' });
  }, [dispatch]);

  const handleGo = useCallback(() => {
    ensureAudioReady();
    playFound();
    dispatch({ type: 'GO' });
  }, [dispatch]);

  const handleArrived = useCallback(() => {
    dispatch({ type: 'ARRIVED' });
  }, [dispatch]);

  const handleToggleMute = useCallback(() => {
    setMuted(!muted);
    setMutedState(!muted);
  }, [muted]);

  const handleBackToMenu = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, [dispatch]);

  const handleNewRoute = useCallback(() => {
    if (state.difficulty) {
      start(state.difficulty);
    }
  }, [start, state.difficulty]);

  if (state.phase === 'picking' || !state.difficulty || !state.layout || !state.optimal) {
    return (
      <>
        <JsonLd data={SCHEMA} />
        <DifficultyPicker onPick={handlePick} />
      </>
    );
  }

  const budget = state.optimal.length * FUEL_BUDGET_FACTOR;
  // Always include the return-to-school leg in the preview so the gauge
  // moves smoothly as stops are tapped instead of jumping when the final
  // stop suddenly adds the closing leg.
  const used = routeLength(state.layout.school, state.layout.stops, state.order, state.order.length > 0);
  const remainingFraction = budget > 0 ? clamp01(1 - used / budget) : 1;

  const goEnabled = state.phase === 'planning' && state.order.length === state.difficulty.stopCount;
  const mapPhase = state.phase === 'planning' ? 'planning' : state.phase === 'driving' ? 'driving' : 'done';

  return (
    <div className={styles.page}>
      <Hud
        picked={state.order.length}
        stopCount={state.difficulty.stopCount}
        clearDisabled={state.order.length === 0 || state.phase !== 'planning'}
        muted={muted}
        onClear={handleClear}
        onToggleMute={handleToggleMute}
        onBackToMenu={handleBackToMenu}
      />
      <FuelGauge remainingFraction={remainingFraction} />
      <TownMap
        layout={state.layout}
        order={state.order}
        phase={mapPhase}
        showOptimal={showOptimal}
        optimalOrder={state.optimal.order}
        onTapStop={handleTapStop}
        onArrived={handleArrived}
      />
      <BigButton onClick={handleGo} disabled={!goEnabled}>
        🚌 GO!
      </BigButton>
      {state.phase === 'done' && state.result && (
        <CelebrationOverlay
          result={state.result}
          isNewBest={isNewBest}
          showOptimal={showOptimal}
          onToggleOptimal={() => setShowOptimal((v) => !v)}
          onNewRoute={handleNewRoute}
          onHome={handleBackToMenu}
        />
      )}
    </div>
  );
}
