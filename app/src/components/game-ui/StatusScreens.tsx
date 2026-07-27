'use client';

import { ui, type Locale } from '@/content/i18n';

const wrap: React.CSSProperties = {
  minHeight: '100dvh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
  textAlign: 'center',
};

export function LoadingScreen({ locale, cityId }: { locale: Locale; cityId: string }) {
  return (
    <main style={wrap} aria-live="polite" aria-busy="true">
      <div className="panel" style={{ padding: 28, width: 'min(420px, 100%)' }}>
        <h1 style={{ fontSize: '1.4rem', marginBottom: 8 }}>{ui('loading', locale)}…</h1>
        <p style={{ margin: 0, opacity: 0.7 }}>{cityId}</p>
      </div>
    </main>
  );
}

export function ErrorScreen({
  locale,
  message,
  issues,
  onRetry,
  onLeave,
}: {
  locale: Locale;
  message: string;
  issues: readonly string[];
  onRetry: () => void;
  onLeave: () => void;
}) {
  return (
    <main style={wrap} role="alert">
      <div className="panel" style={{ padding: 28, width: 'min(520px, 100%)', textAlign: 'left' }}>
        <h1 style={{ fontSize: '1.4rem', marginBottom: 8 }}>{ui('loadError', locale)}</h1>
        <p style={{ margin: '0 0 12px', opacity: 0.8 }}>{message}</p>
        {issues.length > 0 ? (
          <ul style={{ margin: '0 0 16px', paddingLeft: 18, fontSize: 13, opacity: 0.75 }}>
            {issues.slice(0, 6).map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        ) : null}
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" className="btn" onClick={onRetry}>
            {ui('retry', locale)}
          </button>
          <button type="button" className="btn btn--ghost" onClick={onLeave}>
            {ui('backToMap', locale)}
          </button>
        </div>
      </div>
    </main>
  );
}

export function NoWebglScreen({
  locale,
  cityName,
  onLeave,
}: {
  locale: Locale;
  cityName: string;
  onLeave: () => void;
}) {
  return (
    <main style={wrap}>
      <div className="panel" style={{ padding: 28, width: 'min(520px, 100%)' }}>
        <h1 style={{ fontSize: '1.4rem', marginBottom: 8 }}>{cityName}</h1>
        <p style={{ margin: '0 0 18px' }}>{ui('noWebgl', locale)}</p>
        <button type="button" className="btn" onClick={onLeave}>
          {ui('backToMap', locale)}
        </button>
      </div>
    </main>
  );
}
