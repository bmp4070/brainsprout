export type DifficultyId = 'easy' | 'medium' | 'hard';

export interface DifficultyConfig {
  id: DifficultyId;
  label: string;
  emoji: string;
  /** How long the study grid stays up, in seconds (easy longest). */
  studySeconds: number;
  /** How many items are shown all at once during study. */
  studyCount: number;
  /** How many studied items reappear on the belt and must be caught. */
  targetCount: number;
  /** How many never-seen items ride the belt as decoys. */
  distractorCount: number;
}

export const DIFFICULTIES: Record<DifficultyId, DifficultyConfig> = {
  easy: {
    id: 'easy',
    label: 'Easy',
    emoji: '🐣',
    studySeconds: 30,
    studyCount: 20,
    targetCount: 6,
    distractorCount: 12,
  },
  medium: {
    id: 'medium',
    label: 'Medium',
    emoji: '🦊',
    studySeconds: 20,
    studyCount: 20,
    targetCount: 12,
    distractorCount: 16,
  },
  hard: {
    id: 'hard',
    label: 'Hard',
    emoji: '🦉',
    studySeconds: 12,
    studyCount: 20,
    targetCount: 18,
    distractorCount: 20,
  },
};

/** One tile riding the conveyor belt during the recall phase. */
export interface BeltItem {
  /** Unique per belt slot (so React keys stay stable across the doubled strip). */
  key: string;
  /** Which catalogue item this tile shows. */
  itemId: string;
  /** True when this item was in the studied set (a correct tap). */
  isTarget: boolean;
}

export interface Round {
  difficulty: DifficultyConfig;
  seed: number;
  /** The `studyCount` item ids shown during study. */
  studied: string[];
  /** The `targetCount` studied ids that reappear on the belt (subset of `studied`). */
  targetIds: string[];
  /** Targets + distractors, shuffled, as they ride the belt. */
  belt: BeltItem[];
}
