import { Link } from 'react-router-dom';
import { getMetaForPath } from '../seo/meta';
import { usePageMeta } from '../seo/usePageMeta';

export default function ParentsPage() {
  usePageMeta(getMetaForPath('/parents'));

  return (
    <section style={{ padding: 'var(--space-xl)', maxWidth: '720px', margin: '0 auto' }}>
      <h1 style={{ fontSize: 'var(--font-size-2xl)', textAlign: 'center' }}>
        For Grown-Ups 👋
      </h1>
      <p>
        BrainSprout is a free collection of browser games made for kids roughly
        ages 5 to 11 — word searches and jigsaw puzzles that turn a few minutes
        of screen time into some reading, spelling, and pattern-matching
        practice.
      </p>
      <h2 style={{ fontSize: 'var(--font-size-lg)' }}>What kids play</h2>
      <p>
        Word search puzzles are themed around beloved children&apos;s book
        series — dragons, wizards, and other favorite characters kids will
        recognize — with three difficulty levels so the game grows with your
        child. Jigsaw puzzles let kids drag and drop pieces to complete
        colorful scenes at their own pace.
      </p>
      <h2 style={{ fontSize: 'var(--font-size-lg)' }}>No ads, no accounts, no data</h2>
      <p>
        There are no ads, no sign-ups, and no accounts to create. BrainSprout
        doesn&apos;t collect any personal information about your child —
        scores and best times are saved only in your browser&apos;s local
        storage, on your own device, and are never sent anywhere.
      </p>
      <h2 style={{ fontSize: 'var(--font-size-lg)' }}>Where it works</h2>
      <p>
        BrainSprout runs right in the browser on tablets, phones, and
        desktop or laptop computers — no app store download required.
      </p>
      <p>
        <Link to="/">← Back to the games</Link>
      </p>
    </section>
  );
}
