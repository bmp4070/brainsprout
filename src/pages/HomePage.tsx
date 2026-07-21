import { Link } from 'react-router-dom';
import { games } from '../games/registry';
import { themes } from '../games/word-search/themes';
import GameCard from '../shared/components/GameCard';
import JsonLd from '../seo/JsonLd';
import { websiteSchema } from '../seo/schema';
import { getMetaForPath } from '../seo/meta';
import { usePageMeta } from '../seo/usePageMeta';

export default function HomePage() {
  usePageMeta(getMetaForPath('/'));

  return (
    <section style={{ padding: 'var(--space-xl)' }}>
      <JsonLd data={websiteSchema()} />
      <h1 style={{ fontSize: 'var(--font-size-2xl)', textAlign: 'center' }}>
        Pick a game! 🎉
      </h1>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-lg)',
          maxWidth: '960px',
          margin: '0 auto',
        }}
      >
        {games.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>

      <div style={{ maxWidth: '720px', margin: 'var(--space-xl) auto 0', textAlign: 'center' }}>
        <p>
          BrainSprout is a free collection of online games for kids ages 5 to
          11 — word searches themed around favorite book series, plus
          colorful jigsaw puzzles. There&apos;s nothing to install and no
          login needed, so it plays right in the browser on a tablet or
          computer.
        </p>
      </div>

      <div
        style={{
          maxWidth: '720px',
          margin: 'var(--space-lg) auto 0',
          textAlign: 'center',
        }}
      >
        <p style={{ marginBottom: 'var(--space-sm)', fontWeight: 700 }}>
          Word search themes:
        </p>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--space-sm)',
            justifyContent: 'center',
          }}
        >
          {themes.map((theme) => (
            <Link
              key={theme.id}
              to={`/word-search/${theme.id}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-xs)',
                padding: 'var(--space-xs) var(--space-md)',
                borderRadius: 'var(--radius-pill)',
                background: 'var(--color-bg-alt)',
                border: '2px solid var(--color-border)',
                textDecoration: 'none',
                color: 'var(--color-text)',
                fontSize: '0.95rem',
              }}
            >
              <span aria-hidden="true">{theme.emoji}</span> {theme.title}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
