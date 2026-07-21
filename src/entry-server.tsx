/* oxlint-disable react/only-export-components -- this is a Node-only SSR
 * entry point, never loaded by the Vite dev server, so React Fast Refresh
 * does not apply here. */
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import App from './App';
import { getMetaForPath, type PageMeta } from './seo/meta';

export interface RenderResult {
  html: string;
  meta: PageMeta;
}

// Re-exported so scripts/prerender.mjs (a plain Node script) can pull the
// route list and structured-data helpers from this one compiled SSR bundle
// instead of importing TypeScript source directly.
export { getAllRoutes, getStaticRoutes, getThemeRoutes } from './seo/routes';
export { gameSchema } from './seo/schema';
export { SITE_URL } from './seo/constants';
export { getMetaForPath };

/**
 * Server-side render for a single route, used by scripts/prerender.mjs.
 * Returns both the rendered markup and the meta for that route so the
 * prerender script can stitch both into the static HTML template.
 */
export function render(url: string): RenderResult {
  const html = renderToString(
    <StrictMode>
      <StaticRouter location={url}>
        <App />
      </StaticRouter>
    </StrictMode>,
  );
  const meta = getMetaForPath(url);
  return { html, meta };
}
