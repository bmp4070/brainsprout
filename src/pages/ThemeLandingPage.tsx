import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { getTheme } from '../games/word-search/themes';
import { DIFFICULTIES } from '../games/word-search/lib/types';
import BigButton from '../shared/components/BigButton';
import JsonLd from '../seo/JsonLd';
import { gameSchema } from '../seo/schema';
import { getMetaForPath } from '../seo/meta';
import { usePageMeta } from '../seo/usePageMeta';

export default function ThemeLandingPage() {
  const { themeId } = useParams<{ themeId: string }>();
  const theme = themeId ? getTheme(themeId) : undefined;
  const navigate = useNavigate();

  const path = `/word-search/${themeId ?? ''}`;
  const meta = getMetaForPath(path);
  usePageMeta(meta);

  if (!theme) {
    return <Navigate to="/" replace />;
  }

  // theme.words.hard is a superset of easy + medium, so it's the full cast.
  const allNames = theme.words.hard;

  return (
    <section style={{ padding: 'var(--space-xl)', maxWidth: '720px', margin: '0 auto' }}>
      <JsonLd
        data={gameSchema({
          name: `${theme.title} Word Search`,
          description: meta.description,
          path,
        })}
      />
      <h1 style={{ fontSize: 'var(--font-size-2xl)', textAlign: 'center' }}>
        <span aria-hidden="true">{theme.emoji}</span> {theme.title} Word Search
        <br />
        Free Online Game for Kids
      </h1>
      <p>
        Search a grid of letters to find every hidden name from{' '}
        <strong>{theme.title}</strong>! This free word search game is made for
        kids ages 5 to 11, and every puzzle is generated fresh — so there&apos;s
        always a new grid to solve.
      </p>

      <h2 style={{ fontSize: 'var(--font-size-lg)' }}>Names to find</h2>
      <p>
        Depending on the difficulty you pick, you&apos;ll be hunting for these{' '}
        {theme.title} names hidden across, down, and diagonally in the grid:
      </p>
      <ul style={{ listStyle: 'disc', paddingLeft: '1.5em', display: 'flex', flexWrap: 'wrap', gap: '0 1.5em' }}>
        {allNames.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>

      <h2 style={{ fontSize: 'var(--font-size-lg)' }}>Pick your difficulty</h2>
      <ul>
        {Object.values(DIFFICULTIES).map((difficulty) => (
          <li key={difficulty.id} style={{ marginBottom: 'var(--space-sm)' }}>
            <strong>
              {difficulty.emoji} {difficulty.label}
            </strong>{' '}
            — an {difficulty.gridSize}&times;{difficulty.gridSize} grid with{' '}
            {difficulty.wordCount} hidden names, great for{' '}
            {difficulty.id === 'easy'
              ? 'newer readers just getting started'
              : difficulty.id === 'medium'
                ? 'kids who want a bit more of a challenge'
                : 'word search pros looking for a real test'}
            .
          </li>
        ))}
      </ul>

      <div style={{ textAlign: 'center', margin: 'var(--space-xl) 0' }}>
        <BigButton onClick={() => navigate('/games/word-search')}>
          Play Now ▶
        </BigButton>
      </div>

      <p style={{ textAlign: 'center' }}>
        <Link to="/">← Back to all games</Link>
      </p>
    </section>
  );
}
