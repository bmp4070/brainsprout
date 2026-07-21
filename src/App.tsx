import { Suspense } from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { games } from './games/registry';
import HomePage from './pages/HomePage';
import ParentsPage from './pages/ParentsPage';
import ThemeLandingPage from './pages/ThemeLandingPage';

function LoadingFallback() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
        fontSize: 'var(--font-size-xl)',
        fontWeight: 700,
      }}
    >
      Loading&hellip; 🐉
    </div>
  );
}

export default function App() {
  return (
    <>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-md)',
          padding: 'var(--space-md) var(--space-lg)',
          background: 'var(--color-primary)',
          color: '#fff',
        }}
      >
        <Link
          to="/"
          aria-label="Home"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 'var(--touch-target-min)',
            minHeight: 'var(--touch-target-min)',
            fontSize: 'var(--font-size-xl)',
            textDecoration: 'none',
            color: '#fff',
          }}
        >
          🏠
        </Link>
        <span style={{ fontSize: 'var(--font-size-lg)', fontWeight: 800, color: '#fff' }}>
          🌱 BrainSprout
        </span>
      </header>
      <main style={{ flex: 1 }}>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/parents" element={<ParentsPage />} />
            <Route path="/word-search/:themeId" element={<ThemeLandingPage />} />
            {games.map((game) => (
              <Route key={game.id} path={game.path} element={<game.Component />} />
            ))}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
      <footer
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-xs)',
          padding: 'var(--space-lg)',
          textAlign: 'center',
          color: 'var(--color-text-muted)',
          fontSize: '0.9rem',
        }}
      >
        <Link to="/parents">For Grown-Ups</Link>
        <span>Made with ❤️ for young readers</span>
      </footer>
    </>
  );
}
