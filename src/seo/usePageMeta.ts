import { useEffect } from 'react';
import type { PageMeta } from './meta';
import { canonicalUrl } from './meta';

function setMetaTag(attr: 'name' | 'property', key: string, content: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonicalLink(href: string): void {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/**
 * Client-side head manager: sets document.title, the meta description, the
 * canonical link, and matching Open Graph/Twitter tags whenever the route's
 * meta changes. No external dependency (react-helmet not needed) — this is
 * the whole feature we need. On prerendered routes the same values are
 * already baked into the static HTML by scripts/prerender.mjs; this hook
 * just keeps things correct for in-app client-side navigation.
 */
export function usePageMeta(meta: PageMeta): void {
  useEffect(() => {
    document.title = meta.title;
    setMetaTag('name', 'description', meta.description);
    setMetaTag('property', 'og:title', meta.title);
    setMetaTag('property', 'og:description', meta.description);
    setMetaTag('property', 'og:url', canonicalUrl(meta.canonicalPath));
    setMetaTag('name', 'twitter:title', meta.title);
    setMetaTag('name', 'twitter:description', meta.description);
    setCanonicalLink(canonicalUrl(meta.canonicalPath));
  }, [meta]);
}
