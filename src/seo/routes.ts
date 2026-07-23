import { themes } from '../games/word-search/themes';

/**
 * Every path in the app that should get its own prerendered HTML file and a
 * sitemap entry. Shared between `scripts/prerender.mjs` (Node, runs against
 * the built SSR bundle) and anything client-side that wants the same list,
 * so the theme routes only ever need to be derived once, from the themes
 * registry.
 */
export function getStaticRoutes(): string[] {
  return [
    '/',
    '/parents',
    '/games/word-search',
    '/games/jigsaw',
    '/games/cat-nap',
    '/games/bus-route',
  ];
}

export function getThemeRoutes(): string[] {
  return themes.map((theme) => `/word-search/${theme.id}`);
}

export function getAllRoutes(): string[] {
  return [...getStaticRoutes(), ...getThemeRoutes()];
}
