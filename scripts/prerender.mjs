// Prerenders every route in the app to static HTML under dist/, for
// crawlers (and for a snappy first paint) once hosted on Cloudflare Pages.
//
// Approach for game routes (/games/word-search, /games/jigsaw, /games/row-row): these pages
// derive their first-paint state (which theme/scene is "up next", whether
// sound is muted) from localStorage, which differs between the server (no
// localStorage -> always the same default) and a real visitor's browser.
// Full SSR + hydrateRoot would produce a hydration mismatch as soon as a
// returning visitor's localStorage disagrees with the server-rendered
// defaults. Rather than fight that, we deliberately do NOT render the game
// component into #root for these two routes. Instead we inject a static
// `#seo-content` block (real heading + paragraph + JSON-LD) before the
// (empty) #root, so crawlers still see unique, indexable text and structured
// data. main.tsx removes #seo-content and does a normal client-only
// createRoot mount there, so there's nothing to hydrate and nothing to
// mismatch. Every other route (home, /parents, /word-search/:themeId) is
// fully server-rendered and hydrated normally, since their output is
// deterministic (no localStorage-derived state affects their render).
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const rootDir = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const distDir = path.join(rootDir, 'dist');
const ssrDir = path.join(rootDir, 'dist-ssr');

const GAME_ROUTES = new Set([
  '/games/word-search',
  '/games/jigsaw',
  '/games/row-row',
  '/games/cat-nap',
  '/games/bus-route',
]);

async function loadSsrEntry() {
  const candidates = ['entry-server.js', 'entry-server.mjs'];
  for (const name of candidates) {
    const file = path.join(ssrDir, name);
    if (existsSync(file)) {
      return import(pathToFileURL(file).href);
    }
  }
  throw new Error(
    `Could not find SSR entry bundle in ${ssrDir} (looked for ${candidates.join(', ')})`,
  );
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Matches a tag whose opening contains `attr="value"` somewhere in its
// attribute list, tolerant of the attributes being split across lines (as
// they are in the hand-formatted index.html template) and of attribute
// order. Captures up through the value we want to replace, leaving the rest
// of the tag (e.g. a trailing `/>`) untouched.
function attrReplacer(tagStart, attr) {
  return new RegExp(`(${tagStart}[^>]*?${attr}=")[^"]*(")`, 's');
}

function replaceHead(template, meta, canonicalUrl) {
  let html = template;
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(meta.title)}</title>`);
  html = html.replace(
    attrReplacer('<meta\\s+name="description"', 'content'),
    `$1${escapeHtml(meta.description)}$2`,
  );
  html = html.replace(
    attrReplacer('<link\\s+rel="canonical"', 'href'),
    `$1${escapeHtml(canonicalUrl)}$2`,
  );
  html = html.replace(
    attrReplacer('<meta\\s+property="og:title"', 'content'),
    `$1${escapeHtml(meta.title)}$2`,
  );
  html = html.replace(
    attrReplacer('<meta\\s+property="og:description"', 'content'),
    `$1${escapeHtml(meta.description)}$2`,
  );
  html = html.replace(
    attrReplacer('<meta\\s+property="og:url"', 'content'),
    `$1${escapeHtml(canonicalUrl)}$2`,
  );
  html = html.replace(
    attrReplacer('<meta\\s+name="twitter:title"', 'content'),
    `$1${escapeHtml(meta.title)}$2`,
  );
  html = html.replace(
    attrReplacer('<meta\\s+name="twitter:description"', 'content'),
    `$1${escapeHtml(meta.description)}$2`,
  );
  return html;
}

function injectRoot(html, innerHtml) {
  return html.replace('<div id="root"></div>', `<div id="root">${innerHtml}</div>`);
}

function injectBeforeRoot(html, snippet) {
  return html.replace('<div id="root">', `${snippet}\n    <div id="root">`);
}

async function writeRouteFile(route, html) {
  const outDir = route === '/' ? distDir : path.join(distDir, route.replace(/^\//, ''));
  await mkdir(outDir, { recursive: true });
  await writeFile(path.join(outDir, 'index.html'), html, 'utf8');
}

function buildSitemap(routes, siteUrl) {
  const urls = routes
    .map((route) => {
      const loc = route === '/' ? `${siteUrl}/` : `${siteUrl}${route}`;
      return `  <url><loc>${escapeHtml(loc)}</loc></url>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

async function main() {
  const ssr = await loadSsrEntry();
  const { render, getAllRoutes, gameSchema, SITE_URL, getMetaForPath } = ssr;

  const template = await readFile(path.join(distDir, 'index.html'), 'utf8');
  const routes = getAllRoutes();

  for (const route of routes) {
    const canonicalUrl = route === '/' ? `${SITE_URL}/` : `${SITE_URL}${route}`;

    if (GAME_ROUTES.has(route)) {
      // Lightweight path: no full React SSR (see module docstring above).
      const meta = getMetaForPath(route);
      const gameNames = {
        '/games/word-search': 'BrainSprout Word Search',
        '/games/jigsaw': 'BrainSprout Jigsaw Puzzle',
        '/games/row-row': 'BrainSprout Row Row',
        '/games/cat-nap': 'BrainSprout Cat Nap',
        '/games/bus-route': 'BrainSprout School Bus Route',
      };
      const schema = gameSchema({
        name: gameNames[route] ?? 'BrainSprout Game',
        description: meta.description,
        path: route,
      });
      let html = replaceHead(template, meta, canonicalUrl);
      const seoSnippet = [
        '    <div id="seo-content">',
        `      <h1>${escapeHtml(meta.title)}</h1>`,
        `      <p>${escapeHtml(meta.description)}</p>`,
        `      <script type="application/ld+json">${JSON.stringify(schema)}</script>`,
        '    </div>',
      ].join('\n');
      html = injectBeforeRoot(html, seoSnippet);
      await writeRouteFile(route, html);
      continue;
    }

    const { html: appHtml, meta } = render(route);
    let html = replaceHead(template, meta, canonicalUrl);
    html = injectRoot(html, appHtml);
    await writeRouteFile(route, html);
  }

  await writeFile(path.join(distDir, 'sitemap.xml'), buildSitemap(routes, SITE_URL), 'utf8');

  // robots.txt is copied verbatim from public/ by Vite; rewrite it here too
  // so its Sitemap: line always agrees with SITE_URL, even if the constant
  // changes without anyone remembering to hand-edit the static robots.txt.
  const robots = `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`;
  await writeFile(path.join(distDir, 'robots.txt'), robots, 'utf8');

  // dist-ssr is a build-time-only artifact; clean it up so it doesn't ship.
  await rm(ssrDir, { recursive: true, force: true });

  console.log(`Prerendered ${routes.length} routes:\n  ${routes.join('\n  ')}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
