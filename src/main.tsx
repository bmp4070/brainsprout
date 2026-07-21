import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.tsx';

// A leftover static SEO paragraph (see scripts/prerender.mjs) is injected
// before #root on prerendered game routes, where we deliberately skip full
// SSR of the interactive game to avoid hydration mismatches (see comment in
// the prerender script). Once the real app mounts, that placeholder isn't
// needed anymore.
document.getElementById('seo-content')?.remove();

const rootEl = document.getElementById('root')!;
const app = (
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);

// Prerendered routes ship with real markup already inside #root, so we
// hydrate instead of re-rendering from scratch. The dev server (and any
// route the prerender script intentionally left empty) falls back to a
// normal client render.
if (rootEl.hasChildNodes()) {
  hydrateRoot(rootEl, app);
} else {
  createRoot(rootEl).render(app);
}
