import { themes } from '../games/word-search/themes';
import { SITE_URL } from './constants';

export interface PageMeta {
  /** ≤60 chars, used for <title> and og:title */
  title: string;
  /** ~140-155 chars, used for the meta description and og:description */
  description: string;
  /** Path (starting with "/") this meta belongs to; used to build the canonical link. */
  canonicalPath: string;
}

const STATIC_META: Record<string, PageMeta> = {
  '/': {
    title: 'BrainSprout — Free Word Search & Jigsaw Games for Kids',
    description:
      'Free online word search and jigsaw games for kids ages 5 to 11, themed around favorite book series. No login, no ads — just play on tablet or computer.',
    canonicalPath: '/',
  },
  '/parents': {
    title: 'For Grown-Ups — BrainSprout',
    description:
      "A parent's guide to BrainSprout: free browser games for kids 5-11, no ads, no accounts, no personal data collected. Scores stay on your child's device.",
    canonicalPath: '/parents',
  },
  '/games/word-search': {
    title: 'Word Search Game for Kids — BrainSprout',
    description:
      'Play a free online word search for kids ages 5 to 11, with puzzles themed around Wings of Fire, Harry Potter, Percy Jackson, Dog Man, and Roald Dahl books.',
    canonicalPath: '/games/word-search',
  },
  '/games/jigsaw': {
    title: 'Jigsaw Puzzles for Kids — BrainSprout',
    description:
      'Free online jigsaw puzzles for kids ages 5 to 11. Drag and drop pieces to complete colorful scenes of dragons, jungles, outer space, and under the sea.',
    canonicalPath: '/games/jigsaw',
  },
};

/** Hand-written, unique per-theme descriptions (kid-facing, character names help search). */
const THEME_DESCRIPTIONS: Record<string, string> = {
  'wings-of-fire':
    'Play a free Wings of Fire word search for kids! Find Clay, Tsunami, Glory, and more dragon names in three difficulty levels, from an 8x8 grid up to 12x12.',
  'harry-potter':
    'Play a free Harry Potter word search for kids! Find Harry, Hermione, Dumbledore, and more Hogwarts names in three difficulty levels, from 8x8 up to 12x12.',
  'percy-jackson':
    'Play a free Percy Jackson word search for kids! Find Percy, Annabeth, Poseidon, and more mythic names in three difficulty levels, from 8x8 up to 12x12.',
  'dog-man':
    'Play a free Dog Man word search for kids! Find Dog Man, Petey, Molly, and more silly hero names in three difficulty levels, from an 8x8 grid up to 12x12.',
  'roald-dahl':
    'Play a free Roald Dahl word search for kids! Find Matilda, Wonka, Sophie, and more storybook names in three difficulty levels, 8x8 up to 12x12 grids.',
};

function themeMeta(themeId: string): PageMeta | undefined {
  const theme = themes.find((t) => t.id === themeId);
  if (!theme) return undefined;
  const description =
    THEME_DESCRIPTIONS[themeId] ??
    `Play a free ${theme.title} word search for kids ages 5 to 11, with three difficulty levels from an 8x8 grid up to 12x12.`;
  return {
    title: `${theme.title} Word Search — Free Kids Game`,
    description,
    canonicalPath: `/word-search/${theme.id}`,
  };
}

const DEFAULT_META: PageMeta = {
  title: 'BrainSprout — Free Games for Kids',
  description:
    'Free online games for kids ages 5 to 11, including word searches and jigsaw puzzles. No login required.',
  canonicalPath: '/',
};

const THEME_PATH_RE = /^\/word-search\/([\w-]+)\/?$/;

/** Looks up the meta for a given pathname, falling back to a sane default. */
export function getMetaForPath(pathname: string): PageMeta {
  const normalized = pathname === '' ? '/' : pathname;
  const staticMeta = STATIC_META[normalized];
  if (staticMeta) return staticMeta;

  const themeMatch = normalized.match(THEME_PATH_RE);
  if (themeMatch) {
    const meta = themeMeta(themeMatch[1]);
    if (meta) return meta;
  }

  return DEFAULT_META;
}

/** Builds an absolute canonical URL for a path, using the single SITE_URL constant. */
export function canonicalUrl(path: string): string {
  const suffix = path === '/' ? '' : path;
  return `${SITE_URL}${suffix}`;
}
