import styles from './FuelGauge.module.css';

const SLOT_COUNT = 10;

export interface FuelGaugeProps {
  /**
   * Remaining fuel as a fraction of the trip budget, already computed by the
   * caller as `1 - used / budget` and clamped to [0, 1] (a route that blows
   * the (generous) budget just shows an empty gauge rather than going
   * negative).
   */
  remainingFraction: number;
}

function levelClass(fraction: number): string {
  if (fraction > 0.5) return styles.good;
  if (fraction > 0.2) return styles.warn;
  return styles.low;
}

export default function FuelGauge({ remainingFraction }: FuelGaugeProps) {
  const clamped = Math.max(0, Math.min(1, remainingFraction));
  const filledSlots = Math.round(clamped * SLOT_COUNT);
  const bar = '█'.repeat(filledSlots) + '░'.repeat(SLOT_COUNT - filledSlots);

  return (
    <div className={styles.gauge}>
      <span aria-hidden="true">⛽</span>
      <span className={`${styles.bar} ${levelClass(clamped)}`}>Fuel: {bar}</span>
    </div>
  );
}
